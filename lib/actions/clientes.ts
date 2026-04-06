'use server'

// -----------------------------------------------
// CLIENTES — Cadastro e gestão de clientes
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'

const ClienteSchema = z.object({
  nome: z.string().min(2, 'O nome é obrigatório.').max(200),
  cpf: z.string().max(20).optional().nullable(),
  rg: z.string().max(20).optional().nullable(),
  email: z.string().email('E-mail inválido.').optional().nullable(),
  telefone: z.string().max(30).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  endereco: z.string().max(300).optional().nullable(),
  observacoes: z.string().max(5000).optional().nullable(),
})

function parseCliente(formData: FormData) {
  return {
    nome: (formData.get('nome') as string)?.trim(),
    cpf: (formData.get('cpf') as string)?.trim() || null,
    rg: (formData.get('rg') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    telefone: (formData.get('telefone') as string)?.trim() || null,
    whatsapp: (formData.get('whatsapp') as string)?.trim() || null,
    endereco: (formData.get('endereco') as string)?.trim() || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
  }
}

// ---- CRIAR CLIENTE ----
export async function criarCliente(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para criar clientes.')
  if (perm) return perm

  const parse = ClienteSchema.safeParse(parseCliente(formData))
  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { data: cliente, error } = await supabase
    .from('clientes')
    .insert({
      escritorio_id: escritorioId,
      ...parse.data,
    })
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
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para atualizar clientes.')
  if (perm) return perm

  const parse = ClienteSchema.safeParse(parseCliente(formData))
  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { error } = await supabase
    .from('clientes')
    .update({ ...parse.data, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível atualizar o cliente.' }

  revalidatePath(`/clientes/${id}`)
  revalidatePath('/clientes')
  redirect(`/clientes/${id}`)
}

// ---- EXCLUIR CLIENTE ----
export async function excluirCliente(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para excluir clientes.')
  if (perm) return perm

  await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/clientes')
  redirect('/clientes')
}

// ---- ADICIONAR NOTA DE CONTATO ----
export async function adicionarObservacao(id: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para registrar observações.')
  if (perm) return perm

  const schema = z.string().min(2, 'Observação não pode estar vazia.').max(1000)
  const parse = schema.safeParse((formData.get('observacao') as string)?.trim())
  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Observação inválida.' }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('observacoes')
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!cliente) return { erro: 'Cliente não encontrado.' }

  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const observacoesAtualizadas = `[${dataFormatada}] ${parse.data}\n\n${cliente.observacoes ?? ''}`

  await supabase
    .from('clientes')
    .update({ observacoes: observacoesAtualizadas.trim(), atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath(`/clientes/${id}`)
  redirect(`/clientes/${id}`)
}