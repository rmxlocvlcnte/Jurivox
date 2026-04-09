'use server'

import { getAuthContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const Schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(120),
  cnpj: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  telefone: z.string().optional().nullable(),
})

export async function atualizarEscritorio(formData: FormData) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) return { erro: 'Não autenticado.' }
  if (!['socio', 'admin'].includes(cargo ?? '')) return { erro: 'Sem permissão.' }

  const parse = Schema.safeParse({
    nome: formData.get('nome'),
    cnpj: formData.get('cnpj') || null,
    email: formData.get('email') || null,
    telefone: formData.get('telefone') || null,
  })

  if (!parse.success) {
    return { erro: parse.error.issues[0].message }
  }

  const { error } = await supabase
    .from('escritorios')
    .update(parse.data)
    .eq('id', escritorioId)

  if (error) return { erro: 'Erro ao salvar: ' + error.message }

  revalidatePath('/configuracoes')
  return { sucesso: true }
}

export async function buscarEscritorio() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) return null

  const { data } = await supabase
    .from('escritorios')
    .select('id, nome, cnpj, email, telefone, criado_em')
    .eq('id', escritorioId)
    .maybeSingle()

  return data
}
