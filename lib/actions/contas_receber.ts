'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_FINANCEIRO } from '@/lib/permissoes'

const ContaSchema = z.object({
  descricao: z.string().min(2, 'Descrição obrigatória.').max(300),
  valor: z.number().positive('Valor inválido.'),
  data_emissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  cliente_id: z.string().uuid().optional().nullable(),
  contrato_id: z.string().uuid().optional().nullable(),
  processo_id: z.string().uuid().optional().nullable(),
  observacoes: z.string().max(1000).optional().nullable(),
})

const RecebimentoSchema = z.object({
  id: z.string().uuid('Conta inválida.'),
  data_recebimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  forma_recebimento: z.enum(['pix', 'boleto', 'ted', 'dinheiro', 'cartao', 'cheque'] as const).optional().nullable(),
})

export async function criarConta(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissão para criar cobranças.')
  if (perm) return perm

  const parse = ContaSchema.safeParse({
    descricao: (formData.get('descricao') as string)?.trim(),
    valor: Number(formData.get('valor')),
    data_emissao: (formData.get('data_emissao') as string) || null,
    data_vencimento: formData.get('data_vencimento'),
    cliente_id: (formData.get('cliente_id') as string) || null,
    contrato_id: (formData.get('contrato_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
  })

  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  const dados = {
    escritorio_id: escritorioId,
    descricao: parse.data.descricao,
    valor: parse.data.valor,
    data_emissao: parse.data.data_emissao || new Date().toISOString().split('T')[0],
    data_vencimento: parse.data.data_vencimento,
    cliente_id: parse.data.cliente_id,
    contrato_id: parse.data.contrato_id,
    processo_id: parse.data.processo_id,
    observacoes: parse.data.observacoes,
    status: 'aberto',
  }

  const { error } = await supabase.from('contas_receber').insert(dados)
  if (error) {
    console.error('Erro ao criar conta:', error)
    return { erro: 'Não foi possível criar a conta.' }
  }

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}

export async function registrarRecebimento(id: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissão para registrar recebimentos.')
  if (perm) return perm

  const parse = RecebimentoSchema.safeParse({
    id,
    data_recebimento: (formData.get('data_recebimento') as string) || null,
    forma_recebimento: (formData.get('forma_recebimento') as string) || null,
  })

  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  const dados = {
    status: 'recebido',
    data_recebimento: parse.data.data_recebimento || new Date().toISOString().split('T')[0],
    forma_recebimento: parse.data.forma_recebimento || null,
  }

  await supabase.from('contas_receber').update(dados).eq('id', id).eq('escritorio_id', escritorioId)

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}

export async function cancelarConta(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissão para cancelar cobranças.')
  if (perm) return perm

  await supabase
    .from('contas_receber')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}

export async function excluirConta(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissão para excluir cobranças.')
  if (perm) return perm

  await supabase.from('contas_receber').delete().eq('id', id).eq('escritorio_id', escritorioId)

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}