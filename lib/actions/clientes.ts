'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'
import { verificarLimitePlano } from '@/lib/planos-limites'

function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(digits[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r >= 10 ? 0 : r
  }
  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10])
}

const CpfSchema = z.string().max(20).optional().nullable().refine(
  (v) => !v || validarCPF(v),
  { message: 'CPF inválido.' },
)

const ClienteSchema = z.object({
  nome: z.string().min(2, 'O nome e obrigatorio.').max(200),
  cpf: CpfSchema,
  rg: z.string().max(20).optional().nullable(),
  email: z.string().email('E-mail invalido.').optional().nullable(),
  telefone: z.string().max(30).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  endereco: z.string().max(300).optional().nullable(),
  cidade: z.string().max(120).optional().nullable(),
  estado: z.string().max(2).optional().nullable(),
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
    cidade: (formData.get('cidade') as string)?.trim() || null,
    estado: (formData.get('estado') as string)?.trim()?.toUpperCase().slice(0, 2) || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
  }
}

export async function criarCliente(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para criar clientes.')
  if (perm) return perm

  const parse = ClienteSchema.safeParse(parseCliente(formData))
  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados invalidos.' }
  }

  const limitePlano = await verificarLimitePlano({
    escritorioId,
    recurso: 'clientes',
    supabase,
  })
  if (limitePlano) return limitePlano

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
    return { erro: 'Nao foi possivel cadastrar o cliente.' }
  }

  revalidatePath('/clientes')
  redirect(`/clientes/${cliente.id}`)
}

export async function atualizarCliente(id: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para atualizar clientes.')
  if (perm) return perm

  const parse = ClienteSchema.safeParse(parseCliente(formData))
  if (!parse.success) {
    return { erro: parse.error.issues[0]?.message ?? 'Dados invalidos.' }
  }

  const { error } = await supabase
    .from('clientes')
    .update({ ...parse.data, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Nao foi possivel atualizar o cliente.' }

  revalidatePath(`/clientes/${id}`)
  revalidatePath('/clientes')
  redirect(`/clientes/${id}`)
}

export async function excluirCliente(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para excluir clientes.')
  if (perm) return perm

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Nao foi possivel excluir o cliente.' }

  revalidatePath('/clientes')
  redirect('/clientes')
}

export async function adicionarObservacao(id: string, formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para registrar observacoes.')
  if (perm) return perm

  const schema = z.string().min(2, 'Observacao nao pode estar vazia.').max(1000)
  const parse = schema.safeParse((formData.get('observacao') as string)?.trim())
  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Observacao invalida.' }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('observacoes')
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!cliente) return { erro: 'Cliente nao encontrado.' }

  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const observacoesAtualizadas = `[${dataFormatada}] ${parse.data}\n\n${cliente.observacoes ?? ''}`

  const { error } = await supabase
    .from('clientes')
    .update({ observacoes: observacoesAtualizadas.trim(), atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Nao foi possivel salvar a observacao.' }

  revalidatePath(`/clientes/${id}`)
  redirect(`/clientes/${id}`)
}
