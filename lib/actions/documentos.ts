'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type SalvarDocumentoInput = {
  clienteId: string
  tipo: string
  nomeArquivo: string
  urlArquivo: string
  caminho: string
}

export async function salvarMetadadoDocumento(input: SalvarDocumentoInput) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { data: documento, error } = await supabase
    .from('documentos_cliente')
    .insert({
      cliente_id: input.clienteId,
      tipo: input.tipo,
      nome_arquivo: input.nomeArquivo,
      url_arquivo: input.urlArquivo,
      caminho_storage: input.caminho,
    })
    .select('id, tipo, nome_arquivo, url_arquivo, criado_em')
    .single()

  if (error) {
    console.error('Erro ao salvar documento:', error)
    return { erro: 'Não foi possível salvar o documento no banco.', documento: null }
  }

  revalidatePath(`/clientes/${input.clienteId}`)
  return { erro: null, documento }
}

export async function excluirDocumento(documentoId: string, clienteId: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('documentos_cliente')
    .delete()
    .eq('id', documentoId)

  revalidatePath(`/clientes/${clienteId}`)
}
