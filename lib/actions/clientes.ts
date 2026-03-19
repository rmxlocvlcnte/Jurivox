'use server'

// -----------------------------------------------
// CLIENTES — Cadastro e gestão de clientes
// -----------------------------------------------
// Clientes são as pessoas/empresas que o escritório
// representa nos processos jurídicos.
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ---- CRIAR CLIENTE ----
export async function criarCliente(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { erro: 'O nome é obrigatório.' }

  const dados = {
    escritorio_id: escritorioId,
    nome,
    cpf: (formData.get('cpf') as string)?.trim() || null,
    rg: (formData.get('rg') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    telefone: (formData.get('telefone') as string)?.trim() || null,
    whatsapp: (formData.get('whatsapp') as string)?.trim() || null,
    endereco: (formData.get('endereco') as string)?.trim() || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
  }

  const { data: cliente, error } = await supabase
    .from('clientes')
    .insert(dados)
    .select('id')
    .single()

  if (error || !cliente) {
    console.error('Erro ao criar cliente:', error)
    return { erro: 'Não foi possível cadastrar o cliente.' }
  }

  revalidatePath('/clientes')
  redirect(`/clientes/${cliente.id}`)
}

// ---- ATUALIZAR CLIENTE ----
export async function atualizarCliente(id: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    nome: (formData.get('nome') as string)?.trim(),
    cpf: (formData.get('cpf') as string)?.trim() || null,
    rg: (formData.get('rg') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    telefone: (formData.get('telefone') as string)?.trim() || null,
    whatsapp: (formData.get('whatsapp') as string)?.trim() || null,
    endereco: (formData.get('endereco') as string)?.trim() || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
    atualizado_em: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('clientes')
    .update(dados)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível atualizar o cliente.' }

  revalidatePath(`/clientes/${id}`)
  revalidatePath('/clientes')
  redirect(`/clientes/${id}`)
}

// ---- EXCLUIR CLIENTE ----
export async function excluirCliente(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/clientes')
  redirect('/clientes')
}

// ---- ADICIONAR NOTA DE CONTATO ----
// Registra uma observação sobre ligação, reunião, etc.
export async function adicionarObservacao(id: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const novaObs = (formData.get('observacao') as string)?.trim()
  if (!novaObs) return { erro: 'Observação não pode estar vazia.' }

  // Busca observações existentes
  const { data: cliente } = await supabase
    .from('clientes')
    .select('observacoes')
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!cliente) return { erro: 'Cliente não encontrado.' }

  // Adiciona a nova observação no início, com data
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const observacoesAtualizadas = `[${dataFormatada}] ${novaObs}\n\n${cliente.observacoes ?? ''}`

  await supabase
    .from('clientes')
    .update({ observacoes: observacoesAtualizadas.trim(), atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath(`/clientes/${id}`)
  redirect(`/clientes/${id}`)
}
