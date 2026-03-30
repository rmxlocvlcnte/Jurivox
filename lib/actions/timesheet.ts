'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function criarLancamento(formData: FormData) {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase || !membroId) redirect('/sign-in')

  const descricao = (formData.get('descricao') as string)?.trim()
  const horas = Number(formData.get('horas'))
  const data = formData.get('data') as string

  if (!descricao || !horas || !data) return { erro: 'Preencha todos os campos obrigatórios.' }

  const dados = {
    escritorio_id: escritorioId,
    membro_id: membroId,
    data,
    horas,
    descricao,
    tipo: (formData.get('tipo') as string) || 'produtivo',
    contrato_id: (formData.get('contrato_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
  }

  const { error } = await supabase.from('timesheet_lancamentos').insert(dados)
  if (error) {
    console.error('Erro ao criar lançamento:', error)
    return { erro: 'Não foi possível registrar o lançamento.' }
  }

  revalidatePath('/timesheet')
  redirect('/timesheet')
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
  redirect('/timesheet')
}

export async function excluirLancamento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('timesheet_lancamentos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/timesheet')
  redirect('/timesheet')
}
