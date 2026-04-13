'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo } from '@/lib/permissoes'
import { gerarApiKey } from '@/lib/api-keys'

const ESCOPOS_VALIDOS = [
  'processos:read', 'processos:write',
  'clientes:read', 'clientes:write',
  'prazos:read', 'prazos:write',
] as const

const Schema = z.object({
  nome: z.string().min(2, 'Nome mínimo 2 caracteres.').max(100),
  escopos: z.array(z.enum(ESCOPOS_VALIDOS)).min(1, 'Selecione ao menos um escopo.'),
})

export async function criarApiKey(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, ['socio', 'admin'], 'Apenas sócios e admins podem criar chaves de API.')
  if (perm) return perm

  const escoposRaw = formData.getAll('escopos') as string[]
  const parse = Schema.safeParse({
    nome: (formData.get('nome') as string)?.trim(),
    escopos: escoposRaw,
  })
  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  const { chave, hash, preview } = gerarApiKey()

  const { error } = await supabase
    .from('api_keys')
    .insert({
      escritorio_id: escritorioId,
      nome: parse.data.nome,
      key_hash: hash,
      key_preview: preview,
      escopos: parse.data.escopos,
      criado_por: membroId,
    })

  if (error) {
    console.error('Erro ao criar API key:', error)
    return { erro: 'Não foi possível criar a chave de API.' }
  }

  revalidatePath('/configuracoes/api')
  // Retorna a chave bruta UMA ÚNICA VEZ — nunca será mostrada novamente
  return { sucesso: true, chave }
}

export async function revogarApiKey(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, ['socio', 'admin'], 'Sem permissão.')
  if (perm) return perm

  const { error } = await supabase
    .from('api_keys')
    .update({ ativo: false })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível revogar a chave.' }

  revalidatePath('/configuracoes/api')
  return { sucesso: true }
}

export async function excluirApiKey(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, ['socio', 'admin'], 'Sem permissão.')
  if (perm) return perm

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível excluir a chave.' }

  revalidatePath('/configuracoes/api')
  return { sucesso: true }
}
