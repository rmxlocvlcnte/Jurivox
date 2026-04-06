'use server'

// -----------------------------------------------
// FINANCEIRO — Honorários, pagamentos, fluxo de caixa
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_FINANCEIRO } from '@/lib/permissoes'

// ---- SCHEMAS ZOD ----

const HonorarioSchema = z.object({
  processo_id: z.string().uuid('Processo inválido.'),
  tipo: z.enum(['exito', 'pro_labore', 'parcelado'] as const, {
    error: 'Tipo de honorário inválido.',
  }),
  valor_total: z.number('Valor deve ser um número.')
    .positive('Valor deve ser maior que zero.')
    .max(10_000_000, 'Valor muito alto.'),
  numero_parcelas: z.number().int().min(1).max(360).default(1),
  descricao: z.string().max(500).optional().nullable(),
})

const PagamentoSchema = z.object({
  honorario_id: z.string().uuid('Honorário inválido.'),
  valor: z.number('Valor deve ser um número.')
    .positive('Valor deve ser maior que zero.'),
  data_pagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  forma_pagamento: z.enum(['pix', 'ted', 'boleto', 'dinheiro', 'cheque', 'cartao', 'transferencia'] as const)
    .default('pix'),
  observacao: z.string().max(500).optional().nullable(),
})

const MovimentacaoSchema = z.object({
  tipo: z.enum(['entrada', 'saida'] as const, {
    error: 'Tipo deve ser entrada ou saída.',
  }),
  categoria: z.string().max(100).optional().nullable(),
  descricao: z.string().min(1, 'Descrição obrigatória.').max(500),
  valor: z.number('Valor deve ser um número.')
    .positive('Valor deve ser maior que zero.'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
})

// ---- CRIAR HONORÁRIO ----
export async function criarHonorario(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissão para criar honorários.')
  if (perm) return perm

  const parse = HonorarioSchema.safeParse({
    processo_id: formData.get('processo_id'),
    tipo: formData.get('tipo'),
    valor_total: parseFloat(formData.get('valor_total') as string),
    numero_parcelas: parseInt(formData.get('numero_parcelas') as string) || 1,
    descricao: (formData.get('descricao') as string)?.trim() || null,
  })

  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const dados = parse.data

  const { data: processo } = await supabase
    .from('processos')
    .select('id, cliente_id')
    .eq('id', dados.processo_id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return { erro: 'Processo não encontrado.' }

  const { error } = await supabase.from('honorarios').insert({
    ...dados,
    cliente_id: processo.cliente_id,
    escritorio_id: escritorioId,
    status: 'pendente',
  })

  if (error) {
    console.error('Erro ao criar honorário:', error)
    return { erro: 'Não foi possível criar o honorário.' }
  }

  revalidatePath('/financeiro')
  return { sucesso: true }
}

// ---- REGISTRAR PAGAMENTO ----
export async function registrarPagamento(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissão para registrar pagamentos.')
  if (perm) return perm

  const parse = PagamentoSchema.safeParse({
    honorario_id: formData.get('honorario_id'),
    valor: parseFloat(formData.get('valor') as string),
    data_pagamento: formData.get('data_pagamento'),
    forma_pagamento: formData.get('forma_pagamento') || 'pix',
    observacao: (formData.get('observacao') as string)?.trim() || null,
  })

  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const dados = {
    ...parse.data,
    forma_pagamento: parse.data.forma_pagamento === 'transferencia' ? 'ted' : parse.data.forma_pagamento,
  }

  const { data: honorario } = await supabase
    .from('honorarios')
    .select('id')
    .eq('id', dados.honorario_id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!honorario) return { erro: 'Honorário não encontrado.' }

  const { error } = await supabase.from('pagamentos_honorarios').insert({
    ...dados,
    escritorio_id: escritorioId,
  })

  if (error) return { erro: 'Não foi possível registrar o pagamento.' }

  revalidatePath('/financeiro')
  return { sucesso: true }
}

// ---- REGISTRAR MOVIMENTAÇÃO ----
export async function criarMovimentacaoFinanceira(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissão para registrar movimentações.')
  if (perm) return perm

  const parse = MovimentacaoSchema.safeParse({
    tipo: formData.get('tipo'),
    categoria: (formData.get('categoria') as string)?.trim() || null,
    descricao: (formData.get('descricao') as string)?.trim(),
    valor: parseFloat(formData.get('valor') as string),
    data: formData.get('data'),
  })

  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { error } = await supabase.from('movimentacoes_financeiras').insert({
    ...parse.data,
    escritorio_id: escritorioId,
  })

  if (error) {
    console.error('Erro ao criar movimentação:', error)
    return { erro: 'Não foi possível registrar a movimentação.' }
  }

  revalidatePath('/financeiro')
  return { sucesso: true }
}