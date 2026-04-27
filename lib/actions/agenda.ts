'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const EventoSchema = z.object({
  titulo: z.string().min(2, 'Título obrigatório.').max(200),
  tipo: z.enum(['audiencia', 'prazo', 'providencia', 'reuniao', 'outro'] as const).default('outro'),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  dia_todo: z.boolean().default(false),
  descricao: z.string().max(1000).optional().nullable(),
  responsavel_id: z.string().uuid().optional().nullable(),
  processo_id: z.string().uuid().optional().nullable(),
})

function montarDataInicio(data: string, hora: string | null | undefined, diaInteiro: boolean) {
  if (diaInteiro) return `${data}T00:00:00`
  return `${data}T${hora ?? '00:00'}:00`
}

export async function criarEvento(formData: FormData) {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const parse = EventoSchema.safeParse({
    titulo: (formData.get('titulo') as string)?.trim(),
    tipo: (formData.get('tipo') as string) || 'outro',
    data_inicio: formData.get('data_inicio'),
    hora: (formData.get('hora') as string) || null,
    dia_todo: formData.get('dia_todo') === 'on',
    descricao: (formData.get('descricao') as string)?.trim() || null,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
  })

  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  const dataInicioFull = montarDataInicio(parse.data.data_inicio, parse.data.hora, parse.data.dia_todo)

  const dados = {
    escritorio_id: escritorioId,
    titulo: parse.data.titulo,
    tipo: parse.data.tipo,
    descricao: parse.data.descricao,
    data_inicio: dataInicioFull,
    dia_todo: parse.data.dia_todo,
    responsavel_id: parse.data.responsavel_id || membroId || null,
    processo_id: parse.data.processo_id || null,
  }

  const { error } = await supabase.from('agenda_eventos').insert(dados)
  if (error) {
    console.error('Erro ao criar evento:', error)
    return { erro: 'Não foi possível criar o evento.' }
  }

  revalidatePath('/agenda')
  redirect('/agenda')
}

// ---- EDITAR EVENTO ----
export async function atualizarEvento(id: string, formData: FormData) {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const parse = EventoSchema.safeParse({
    titulo: (formData.get('titulo') as string)?.trim(),
    tipo: (formData.get('tipo') as string) || 'outro',
    data_inicio: formData.get('data_inicio'),
    hora: (formData.get('hora') as string) || null,
    dia_todo: formData.get('dia_todo') === 'on',
    descricao: (formData.get('descricao') as string)?.trim() || null,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
  })

  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  const dataInicioFull = montarDataInicio(parse.data.data_inicio, parse.data.hora, parse.data.dia_todo)

  const dados = {
    titulo: parse.data.titulo,
    tipo: parse.data.tipo,
    descricao: parse.data.descricao,
    data_inicio: dataInicioFull,
    dia_todo: parse.data.dia_todo,
    responsavel_id: parse.data.responsavel_id || membroId || null,
    processo_id: parse.data.processo_id || null,
  }

  const { error } = await supabase
    .from('agenda_eventos')
    .update(dados)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao atualizar evento:', error)
    return { erro: 'Não foi possível atualizar o evento.' }
  }

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function concluirEvento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('agenda_eventos')
    .update({ concluido: true, concluido_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível concluir o evento.' }

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function reabrirEvento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('agenda_eventos')
    .update({ concluido: false, concluido_em: null })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível reabrir o evento.' }

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function excluirEvento(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('agenda_eventos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível excluir o evento.' }

  revalidatePath('/agenda')
  redirect('/agenda')
}

export async function realocarEvento(id: string, novoResponsavelId: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('agenda_eventos')
    .update({ responsavel_id: novoResponsavelId })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível realocar o evento.' }

  revalidatePath('/agenda')
  redirect('/agenda')
}