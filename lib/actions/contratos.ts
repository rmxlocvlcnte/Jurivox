'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function criarContrato(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { erro: 'O nome é obrigatório.' }

  const dados = {
    escritorio_id: escritorioId,
    nome,
    tipo: (formData.get('tipo') as string) || 'fixo',
    cliente_id: (formData.get('cliente_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    valor_fixo: formData.get('valor_fixo') ? Number(formData.get('valor_fixo')) : null,
    valor_hora: formData.get('valor_hora') ? Number(formData.get('valor_hora')) : null,
    percentual_exito: formData.get('percentual_exito') ? Number(formData.get('percentual_exito')) : null,
    data_inicio: (formData.get('data_inicio') as string) || null,
    data_fim: (formData.get('data_fim') as string) || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
    status: 'ativo',
  }

  const { data: contrato, error } = await supabase
    .from('contratos')
    .insert(dados)
    .select('id')
    .single()

  if (error || !contrato) {
    console.error('Erro ao criar contrato:', error)
    return { erro: 'Não foi possível cadastrar o contrato.' }
  }

  revalidatePath('/contratos')
  redirect(`/contratos/${contrato.id}`)
}

export async function atualizarContrato(id: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    nome: (formData.get('nome') as string)?.trim(),
    tipo: formData.get('tipo') as string,
    cliente_id: (formData.get('cliente_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
    responsavel_id: (formData.get('responsavel_id') as string) || null,
    valor_fixo: formData.get('valor_fixo') ? Number(formData.get('valor_fixo')) : null,
    valor_hora: formData.get('valor_hora') ? Number(formData.get('valor_hora')) : null,
    percentual_exito: formData.get('percentual_exito') ? Number(formData.get('percentual_exito')) : null,
    data_inicio: (formData.get('data_inicio') as string) || null,
    data_fim: (formData.get('data_fim') as string) || null,
    status: formData.get('status') as string,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('contratos')
    .update(dados)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível atualizar o contrato.' }

  revalidatePath(`/contratos/${id}`)
  revalidatePath('/contratos')
  redirect(`/contratos/${id}`)
}

export async function excluirContrato(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase.from('contratos').delete().eq('id', id).eq('escritorio_id', escritorioId)

  revalidatePath('/contratos')
  redirect('/contratos')
}
