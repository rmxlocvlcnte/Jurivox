'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { exigirCargo, CARGOS_FINANCEIRO } from '@/lib/permissoes'
import {
  obterOuCriarCliente,
  criarCobranca,
  cancelarCobranca,
  buscarCobranca,
  buscarQrCodePix,
} from '@/lib/asaas'
import { z } from 'zod'

const BoletoSchema = z.object({
  cliente_id: z.string().uuid('Cliente obrigatorio.'),
  conta_receber_id: z.string().uuid().optional().nullable(),
  descricao: z.string().min(3, 'Descricao obrigatoria.').max(300),
  valor: z.coerce.number().min(1, 'Valor minimo R$ 1,00.'),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida.'),
  tipo: z.enum(['BOLETO', 'PIX']).default('BOLETO'),
})

// ── CRIAR BOLETO / PIX ─────────────────────────────────────────────────────

export async function criarBoleto(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissao para emitir boletos.')
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
  if (!clienteDB.cpf) return { erro: 'O cliente precisa ter CPF/CNPJ cadastrado para emitir boleto.' }

  try {
    // 1. Cria ou busca cliente no Asaas
    const asaasCliente = await obterOuCriarCliente({
      nome: clienteDB.nome,
      cpfCnpj: clienteDB.cpf,
      email: clienteDB.email,
      telefone: clienteDB.telefone,
    })

    // 2. Cria a cobrança no Asaas
    const cobranca = await criarCobranca({
      asaasCustomerId: asaasCliente.id,
      valor: parse.data.valor,
      vencimento: parse.data.data_vencimento,
      descricao: parse.data.descricao,
      tipo: parse.data.tipo,
      externalReference: `escritorio:${escritorioId}`,
    })

    // 3. Salva no banco
    const { data: boleto, error } = await supabase
      .from('boletos')
      .insert({
        escritorio_id: escritorioId,
        cliente_id: parse.data.cliente_id,
        conta_receber_id: parse.data.conta_receber_id,
        asaas_payment_id: cobranca.id,
        asaas_customer_id: asaasCliente.id,
        descricao: parse.data.descricao,
        valor: parse.data.valor,
        data_vencimento: parse.data.data_vencimento,
        tipo: parse.data.tipo,
        status: cobranca.status,
        url_boleto: cobranca.bankSlipUrl,
        url_invoice: cobranca.invoiceUrl,
        nosso_numero: cobranca.nossoNumero,
        criado_por: membroId,
      })
      .select('id')
      .single()

    if (error || !boleto) {
      console.error('Erro ao salvar boleto:', error)
      return { erro: 'Cobranca criada no Asaas mas falhou ao salvar. Verifique o painel Asaas.' }
    }

    revalidatePath('/financeiro/boletos')
    return { sucesso: true, boletoId: boleto.id, invoiceUrl: cobranca.invoiceUrl }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao comunicar com Asaas.'
    return { erro: msg }
  }
}

// ── CANCELAR BOLETO ────────────────────────────────────────────────────────

export async function cancelarBoleto(boletoId: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissao para cancelar boletos.')
  if (perm) return perm

  const { data: boleto } = await supabase
    .from('boletos')
    .select('asaas_payment_id, status')
    .eq('id', boletoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!boleto) return { erro: 'Boleto nao encontrado.' }
  if (['RECEIVED', 'CONFIRMED'].includes(boleto.status)) {
    return { erro: 'Nao e possivel cancelar um boleto ja pago.' }
  }

  try {
    await cancelarCobranca(boleto.asaas_payment_id)

    await supabase
      .from('boletos')
      .update({ status: 'CANCELED', atualizado_em: new Date().toISOString() })
      .eq('id', boletoId)

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

  if (!boleto) return { erro: 'Boleto nao encontrado.' }

  try {
    const cobranca = await buscarCobranca(boleto.asaas_payment_id)

    await supabase
      .from('boletos')
      .update({
        status: cobranca.status,
        url_boleto: cobranca.bankSlipUrl ?? null,
        url_invoice: cobranca.invoiceUrl ?? null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', boletoId)

    revalidatePath('/financeiro/boletos')
    return { sucesso: true, status: cobranca.status }
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

  if (!boleto) return { erro: 'Boleto nao encontrado.' }
  if (boleto.tipo !== 'PIX') return { erro: 'Esta cobranca nao e Pix.' }

  try {
    const qr = await buscarQrCodePix(boleto.asaas_payment_id)
    return { sucesso: true, qr }
  } catch (err) {
    return { erro: err instanceof Error ? err.message : 'Erro ao buscar QR Code.' }
  }
}
