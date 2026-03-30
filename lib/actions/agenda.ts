'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function criarEvento(formData: FormData) {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const titulo = (formData.get('titulo') as string)?.trim()
  const dataInicio = formData.get('data_inicio') as string

  if (!titulo || !dataInicio) return { erro: 'Título e data são obrigatórios.' }

  const diaInteiro = formData.get('dia_todo') === 'on'
  const hora = (formData.get('hora') as string) || '00:00'
  const dataInicioFull = diaInteiro ? `${dataInicio}T00:00:00` : `${dataInicio}T${hora}:00`

  const dados = {
    escritorio_id: escritorioId,
    titulo,
    tipo: (formData.get('tipo') as string) || 'outro',
    descricao: (formData.get('descricao') as string)?.trim() || null,
    data_inicio: dataInicioFull,
    dia_todo: diaInteiro,
    responsavel_id: (formData.get('responsavel_id') as string) || membroId || null,
    processo_id: (formData.get('processo_id') as string) || null,
  }

  const { error } = await supabase.from('agenda_eventos').insert(dados)
  if (error) {
    console.error('Erro ao criar evento:', error)
    return { erro: 'Não foi possível criar o evento.' }
  }

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function concluirEvento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('agenda_eventos')
    .update({ concluido: true, concluido_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function reabrirEvento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('agenda_eventos')
    .update({ concluido: false, concluido_em: null })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function excluirEvento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase.from('agenda_eventos').delete().eq('id', id).eq('escritorio_id', escritorioId)

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function realocarEvento(id: string, novoResponsavelId: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('agenda_eventos')
    .update({ responsavel_id: novoResponsavelId })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/agenda')
  redirect('/agenda')
}
