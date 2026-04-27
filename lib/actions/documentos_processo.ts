'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function adicionarDocumentoProcesso(processoId: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const nome = (formData.get('nome') as string)?.trim()
  const tipo = (formData.get('tipo') as string) || 'outro'
  const url = (formData.get('url') as string)?.trim()

  if (!nome || !url) return { erro: 'Nome e URL do documento são obrigatórios.' }

  // Verifica que o processo pertence ao escritório
  const { data: processo } = await supabase
    .from('processos')
    .select('id, cliente_id')
    .eq('id', processoId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!processo) return { erro: 'Processo não encontrado.' }

  const { error } = await supabase.from('documentos_processo').insert({
    processo_id: processoId,
    escritorio_id: escritorioId,
    nome,
    tipo,
    url_arquivo: url,
  })

  if (error) {
    console.error('Erro ao adicionar documento:', error)
    return { erro: 'Não foi possível salvar o documento.' }
  }

  revalidatePath(`/processos/${processoId}`)
  redirect(`/processos/${processoId}`)
}

export async function excluirDocumentoProcesso(id: string, processoId: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { error } = await supabase
    .from('documentos_processo')
    .delete()
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível excluir o documento.' }

  revalidatePath(`/processos/${processoId}`)
  redirect(`/processos/${processoId}`)
}
