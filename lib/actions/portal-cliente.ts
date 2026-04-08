'use server'

import { getAuthContext } from '@/lib/auth'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function gerarTokenPortalCliente(clienteId: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) return { erro: 'Não autenticado.' }
  if (!['socio', 'admin', 'advogado'].includes(cargo ?? '')) return { erro: 'Sem permissão.' }

  // Verifica se o cliente pertence ao escritório
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('id', clienteId)
    .eq('escritorio_id', escritorioId)
    .maybeSingle()

  if (!cliente) return { erro: 'Cliente não encontrado.' }

  // Gera token seguro
  const token = crypto.randomBytes(32).toString('hex')
  const expiraEm = new Date()
  expiraEm.setDate(expiraEm.getDate() + 30) // 30 dias

  const admin = createAdminClient()
  const { error } = await admin.from('portal_cliente_tokens').insert({
    cliente_id: clienteId,
    escritorio_id: escritorioId,
    token,
    expira_em: expiraEm.toISOString(),
  })

  if (error) return { erro: 'Erro ao gerar token: ' + error.message }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/cliente/${token}`
  return { sucesso: true, token, url, expiraEm: expiraEm.toISOString() }
}
