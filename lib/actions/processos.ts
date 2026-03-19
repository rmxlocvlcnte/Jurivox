'use server'

// -----------------------------------------------
// PROCESSOS — Criar, editar, excluir processos jurídicos
// e adicionar movimentações na timeline
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ---- CRIAR PROCESSO ----
export async function criarProcesso(formData: FormData) {
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    escritorio_id: escritorioId,
    cliente_id: formData.get('cliente_id') || null,
    numero_cnj: (formData.get('numero_cnj') as string)?.trim(),
    tribunal: (formData.get('tribunal') as string)?.trim(),
    vara: (formData.get('vara') as string)?.trim() || null,
    classe: (formData.get('classe') as string)?.trim() || null,
    area_juridica: formData.get('area_juridica') as string,
    delegacia: (formData.get('delegacia') as string)?.trim() || null,
    numero_inquerito: (formData.get('numero_inquerito') as string)?.trim() || null,
    reclamado: (formData.get('reclamado') as string)?.trim() || null,
    numero_beneficio: (formData.get('numero_beneficio') as string)?.trim() || null,
    status: (formData.get('status') as string) || 'ativo',
    descricao: (formData.get('descricao') as string)?.trim() || null,
    responsavel_id: membroId,
  }

  if (!dados.numero_cnj || !dados.tribunal || !dados.area_juridica) {
    return { erro: 'Número CNJ, tribunal e área jurídica são obrigatórios.' }
  }

  const { data: processo, error } = await supabase
    .from('processos')
    .insert(dados)
    .select('id')
    .single()

  if (error || !processo) {
    console.error('Erro ao criar processo:', error)
    return { erro: 'Não foi possível criar o processo.' }
  }

  revalidatePath('/processos')
  redirect(`/processos/${processo.id}`)
}

// ---- ATUALIZAR PROCESSO ----
export async function atualizarProcesso(id: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    cliente_id: formData.get('cliente_id') || null,
    numero_cnj: (formData.get('numero_cnj') as string)?.trim(),
    tribunal: (formData.get('tribunal') as string)?.trim(),
    vara: (formData.get('vara') as string)?.trim() || null,
    classe: (formData.get('classe') as string)?.trim() || null,
    area_juridica: formData.get('area_juridica') as string,
    delegacia: (formData.get('delegacia') as string)?.trim() || null,
    numero_inquerito: (formData.get('numero_inquerito') as string)?.trim() || null,
    reclamado: (formData.get('reclamado') as string)?.trim() || null,
    numero_beneficio: (formData.get('numero_beneficio') as string)?.trim() || null,
    status: formData.get('status') as string,
    descricao: (formData.get('descricao') as string)?.trim() || null,
    atualizado_em: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('processos')
    .update(dados)
    .eq('id', id)
    .eq('escritorio_id', escritorioId) // segurança: só atualiza se pertence ao escritório

  if (error) {
    console.error('Erro ao atualizar processo:', error)
    return { erro: 'Não foi possível atualizar o processo.' }
  }

  revalidatePath(`/processos/${id}`)
  revalidatePath('/processos')
  redirect(`/processos/${id}`)
}

// ---- EXCLUIR PROCESSO ----
export async function excluirProcesso(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('processos')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao excluir processo:', error)
    return { erro: 'Não foi possível excluir o processo.' }
  }

  revalidatePath('/processos')
  redirect('/processos')
}

// ---- ADICIONAR MOVIMENTAÇÃO ----
export async function adicionarMovimentacao(processoId: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  // Verifica que o processo pertence ao escritório antes de inserir
  const { data: processo } = await supabase
    .from('processos')
    .select('id')
    .eq('id', processoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return { erro: 'Processo não encontrado.' }

  const descricao = (formData.get('descricao') as string)?.trim()
  const tipo = (formData.get('tipo') as string) || 'andamento'
  const dataStr = formData.get('data_movimentacao') as string

  if (!descricao) return { erro: 'A descrição é obrigatória.' }

  const { error } = await supabase
    .from('movimentacoes')
    .insert({
      processo_id: processoId,
      descricao,
      tipo,
      data_movimentacao: dataStr ? new Date(dataStr).toISOString() : new Date().toISOString(),
      fonte: 'manual',
    })

  if (error) {
    console.error('Erro ao adicionar movimentação:', error)
    return { erro: 'Não foi possível adicionar a movimentação.' }
  }

  revalidatePath(`/processos/${processoId}`)
  redirect(`/processos/${processoId}`)
}
