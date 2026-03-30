'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function criarConta(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const descricao = (formData.get('descricao') as string)?.trim()
  const valor = Number(formData.get('valor'))
  const dataVencimento = formData.get('data_vencimento') as string

  if (!descricao || !valor || !dataVencimento) return { erro: 'Preencha todos os campos obrigatórios.' }

  const dados = {
    escritorio_id: escritorioId,
    descricao,
    valor,
    data_emissao: (formData.get('data_emissao') as string) || new Date().toISOString().split('T')[0],
    data_vencimento: dataVencimento,
    cliente_id: (formData.get('cliente_id') as string) || null,
    contrato_id: (formData.get('contrato_id') as string) || null,
    processo_id: (formData.get('processo_id') as string) || null,
    observacoes: (formData.get('observacoes') as string)?.trim() || null,
    status: 'aberto',
  }

  const { error } = await supabase.from('contas_receber').insert(dados)
  if (error) {
    console.error('Erro ao criar conta:', error)
    return { erro: 'Não foi possível criar a conta.' }
  }

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}

export async function registrarRecebimento(id: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const dados = {
    status: 'recebido',
    data_recebimento: (formData.get('data_recebimento') as string) || new Date().toISOString().split('T')[0],
    forma_recebimento: (formData.get('forma_recebimento') as string) || null,
  }

  await supabase.from('contas_receber').update(dados).eq('id', id).eq('escritorio_id', escritorioId)

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}

export async function cancelarConta(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase
    .from('contas_receber')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}

export async function excluirConta(id: string) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  await supabase.from('contas_receber').delete().eq('id', id).eq('escritorio_id', escritorioId)

  revalidatePath('/contas-receber')
  redirect('/contas-receber')
}
