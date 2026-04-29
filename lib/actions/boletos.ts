'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { exigirCargo, CARGOS_FINANCEIRO } from '@/lib/permissoes'
import {
  criarCobranca,
  cancelarCobranca,
  buscarCobranca,
  buscarQrCodePix,
  MP_STATUS_PAGO,
} from '@/lib/mercadopago'
import { z } from 'zod'

const BoletoSchema = z.object({
  cliente_id: z.uuid({ error: 'Cliente obrigatorio.' }),
  conta_receber_id: z.uuid().optional().nullable(),
  descricao: z.string().min(3, 'Descricao obrigatoria.').max(300),
  valor: z.coerce.number().min(1, 'Valor minimo R$ 1,00.'),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida.'),
  tipo: z.enum(['BOLETO', 'PIX']).default('BOLETO'),
})

// ── CRIAR BOLETO / PIX ─────────────────────────────────────────────────────

export async function criarBoleto(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissao para emitir cobranças.')
  if (perm) return perm

  const parse = BoletoSchema.safeParse({
    cliente_id: formData.get('cliente_id'),
    conta_receber_id: (formData.get('conta_receber_id') as string) || null,
    descricao: (formData.get('descricao') as string)?.trim(),
    valor: formData.get('valor'),
    data_vencimento: formData.get('data_vencimento'),
    tipo: formData.get('tipo') || 'BOLETO',
  })

  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados invalidos.' }
  }

  // Busca dados do cliente
  const { data: clienteDB } = await supabase
    .from('clientes')
    .select('nome, cpf, email, telefone')
    .eq('id', parse.data.cliente_id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!clienteDB) return { erro: 'Cliente nao encontrado.' }
  if (!clienteDB.cpf) return { erro: 'O cliente precisa ter CPF/CNPJ cadastrado para emitir cobrança.' }
  if (!clienteDB.email) return { erro: 'O cliente precisa ter e-mail cadastrado para emitir cobrança via Mercado Pago.' }

  try {
    const cobranca = await criarCobranca({
      nomePagador: clienteDB.nome,
      cpfCnpj: clienteDB.cpf,
      emailPagador: clienteDB.email,
      valor: parse.data.valor,
      vencimento: parse.data.data_vencimento,
      descricao: parse.data.descricao,
      tipo: parse.data.tipo,
      referencia: `escritorio:${escritorioId}`,
    })

    // URL do boleto ou ticket Pix
    const urlBoleto = cobranca.transaction_details?.external_resource_url ?? null
    const urlPix = cobranca.point_of_interaction?.transaction_data?.ticket_url ?? null

    const { data: boleto, error } = await supabase
      .from('boletos')
      .insert({
        escritorio_id: escritorioId,
        cliente_id: parse.data.cliente_id,
        conta_receber_id: parse.data.conta_receber_id,
        asaas_payment_id: String(cobranca.id),  // reutilizando coluna para MP payment ID
        descricao: parse.data.descricao,
        valor: parse.data.valor,
        data_vencimento: parse.data.data_vencimento,
        tipo: parse.data.tipo,
        status: cobranca.status === 'approved' ? 'RECEIVED' : 'PENDING',
        url_boleto: urlBoleto,
        url_invoice: urlPix ?? urlBoleto,
        criado_por: membroId,
      })
      .select('id')
      .single()

    if (error || !boleto) {
      console.error('Erro ao salvar cobrança:', error)
      return { erro: 'Cobrança criada no Mercado Pago mas falhou ao salvar. Verifique o painel MP.' }
    }

    revalidatePath('/financeiro/boletos')
    return { sucesso: true, boletoId: boleto.id, invoiceUrl: urlBoleto ?? urlPix }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao comunicar com Mercado Pago.'
    return { erro: msg }
  }
}

// ── CANCELAR COBRANÇA ──────────────────────────────────────────────────────

export async function cancelarBoleto(boletoId: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissao para cancelar cobranças.')
  if (perm) return perm

  const { data: boleto } = await supabase
    .from('boletos')
    .select('asaas_payment_id, status')
    .eq('id', boletoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!boleto) return { erro: 'Cobrança nao encontrada.' }
  if (['RECEIVED', 'CONFIRMED'].includes(boleto.status)) {
    return { erro: 'Nao e possivel cancelar uma cobrança ja paga.' }
  }

  try {
    await cancelarCobranca(boleto.asaas_payment_id)

    const { error: errUpdate } = await supabase
      .from('boletos')
      .update({ status: 'CANCELED', atualizado_em: new Date().toISOString() })
      .eq('id', boletoId)

    if (errUpdate) {
      console.error('Erro ao atualizar status do boleto:', errUpdate)
      return { erro: 'Cobrança cancelada no Mercado Pago mas falhou ao atualizar no banco.' }
    }

    revalidatePath('/financeiro/boletos')
    return { sucesso: true }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro ao cancelar.' }
  }
}

// ── SINCRONIZAR STATUS ─────────────────────────────────────────────────────

export async function sincronizarStatusBoleto(boletoId: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { data: boleto } = await supabase
    .from('boletos')
    .select('asaas_payment_id')
    .eq('id', boletoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!boleto) return { erro: 'Cobrança nao encontrada.' }

  try {
    const cobranca = await buscarCobranca(boleto.asaas_payment_id)

    // Mapeia status MP → status interno
    const pago = MP_STATUS_PAGO.includes(cobranca.status)
    const statusInterno = pago
      ? 'RECEIVED'
      : cobranca.status === 'cancelled'
      ? 'CANCELED'
      : cobranca.status === 'refunded'
      ? 'REFUNDED'
      : 'PENDING'

    const urlBoleto = cobranca.transaction_details?.external_resource_url ?? null
    const urlPix = cobranca.point_of_interaction?.transaction_data?.ticket_url ?? null

    const { error: errSync } = await supabase
      .from('boletos')
      .update({
        status: statusInterno,
        url_boleto: urlBoleto,
        url_invoice: urlPix ?? urlBoleto,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', boletoId)

    if (errSync) {
      console.error('Erro ao sincronizar status do boleto:', errSync)
      return { erro: 'Status obtido do MP mas falhou ao salvar no banco.' }
    }

    revalidatePath('/financeiro/boletos')
    return { sucesso: true, status: statusInterno }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro ao sincronizar.' }
  }
}

// ── BUSCAR QR CODE PIX ─────────────────────────────────────────────────────

export async function buscarPixQrCode(boletoId: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) return { erro: 'Nao autenticado.' }

  const { data: boleto } = await supabase
    .from('boletos')
    .select('asaas_payment_id, tipo')
    .eq('id', boletoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!boleto) return { erro: 'Cobrança nao encontrada.' }
  if (boleto.tipo !== 'PIX') return { erro: 'Esta cobrança nao e Pix.' }

  try {
    const qr = await buscarQrCodePix(boleto.asaas_payment_id)
    return { sucesso: true, qr }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro ao buscar QR Code.' }
  }
}
