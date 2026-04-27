'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const LancamentoSchema = z.object({
  descricao: z.string().min(2, 'Descrição obrigatória.').max(1000),
  horas: z.number().positive('Horas inválidas.').max(24),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  tipo: z.enum(['produtivo', 'nao_produtivo'] as const).default('produtivo'),
  contrato_id: z.string().uuid().optional().nullable(),
  processo_id: z.string().uuid().optional().nullable(),
})

export async function criarLancamento(formData: FormData) {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase || !membroId) redirect('/sign-in')

  const parse = LancamentoSchema.safeParse({
    descricao: (formData.get('descricao') as string)?.trim(),
    horas: Number(formData.get('horas')),
    data: formData.get('data'),
    tipo: (formData.get('tipo') as string) || 'produtivo',
    contrato_id: (formData.get('contrato_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
  })

  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  const { error } = await supabase.from('timesheet_lancamentos').insert({
    escritorio_id: escritorioId,
    membro_id: membroId,
    data: parse.data.data,
    horas: parse.data.horas,
    descricao: parse.data.descricao,
    tipo: parse.data.tipo,
    contrato_id: parse.data.contrato_id,
    processo_id: parse.data.processo_id,
  })
  if (error) {
    console.error('Erro ao criar lançamento:', error)
    return { erro: 'Não foi possível registrar o lançamento.' }
  }

  revalidatePath('/timesheet')
  return { sucesso: true }
}

export async function duplicarLancamento(id: string) {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase || !membroId) redirect('/sign-in')

  const { data: original } = await supabase
    .from('timesheet_lancamentos')
    .select('*')
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!original) return { erro: 'Lançamento não encontrado.' }

  const { error } = await supabase.from('timesheet_lancamentos').insert({
    escritorio_id: escritorioId,
    membro_id: membroId,
    data: new Date().toISOString().split('T')[0],
    horas: original.horas,
    descricao: original.descricao,
    tipo: original.tipo,
    contrato_id: original.contrato_id,
    processo_id: original.processo_id,
  })

  if (error) return { erro: 'Não foi possível duplicar o lançamento.' }

  revalidatePath('/timesheet')
  return { sucesso: true }
}

export async function excluirLancamento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('timesheet_lancamentos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível excluir o lançamento.' }

  revalidatePath('/timesheet')
  return { sucesso: true }
}