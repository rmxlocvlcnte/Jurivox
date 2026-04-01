'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { whatsappMensagemPersonalizada } from '@/lib/notificacoes/whatsapp'

export async function enviarWhatsAppCliente(clienteId: string, formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const mensagem = (formData.get('mensagem') as string)?.trim()
  if (!mensagem) return { erro: 'Mensagem não pode estar vazia.' }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('nome, whatsapp, telefone')
    .eq('id', clienteId)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!cliente) return { erro: 'Cliente não encontrado.' }

  const telefone = cliente.whatsapp || cliente.telefone
  if (!telefone) return { erro: 'Cliente não tem número de WhatsApp cadastrado.' }

  const zapiConfigurado = !!(
    process.env.ZAPI_INSTANCE_ID &&
    process.env.ZAPI_TOKEN &&
    process.env.ZAPI_INSTANCE_ID !== 'SEU_INSTANCE_ID'
  )

  if (!zapiConfigurado) {
    return { erro: 'Z-API não configurada. Preencha ZAPI_INSTANCE_ID e ZAPI_TOKEN no .env.local.' }
  }

  await whatsappMensagemPersonalizada({ telefone, mensagem })
  return { sucesso: true, nome: cliente.nome }
}
