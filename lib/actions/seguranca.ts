'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getAuthContext } from '@/lib/auth'
import { registrarAuditLog } from '@/lib/audit'

async function getRequestInfo() {
  const headerList = await headers()
  const ipRaw = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || ''
  const ip = ipRaw.split(',')[0]?.trim() || null
  const userAgent = headerList.get('user-agent')
  return { ip, userAgent }
}

export async function revogarSessao(sessionId: string) {
  const { userId, sessionId: sessaoAtual, escritorioId, membroId } = await getAuthContext()
  if (!userId || !escritorioId) redirect('/sign-in')

  const client = await clerkClient()
  const sessao = await client.sessions.getSession(sessionId)
  if (sessao.userId !== userId) {
    throw new Error('Sessão inválida.')
  }

  await client.sessions.revokeSession(sessionId)

  const { ip, userAgent } = await getRequestInfo()
  await registrarAuditLog({
    escritorioId,
    membroId,
    userId,
    evento: 'sessao.revogada',
    alvoTipo: 'sessao',
    alvoId: sessionId,
    ip,
    userAgent,
    metadata: {
      dispositivo: sessao.latestActivity?.deviceType ?? null,
      navegador: sessao.latestActivity?.browserName ?? null,
      ip_sessao: sessao.latestActivity?.ipAddress ?? null,
      era_atual: sessaoAtual === sessionId,
    },
  })

  revalidatePath('/seguranca')
}

export async function revogarOutrasSessoes() {
  const { userId, sessionId: sessaoAtual, escritorioId, membroId } = await getAuthContext()
  if (!userId || !escritorioId) redirect('/sign-in')

  const client = await clerkClient()
  let offset = 0
  let revogadas = 0

  while (true) {
    const { data, totalCount } = await client.sessions.getSessionList({
      userId,
      status: 'active',
      limit: 50,
      offset,
    })

    if (!data.length) break

    for (const sessao of data) {
      if (sessao.id === sessaoAtual) continue
      await client.sessions.revokeSession(sessao.id)
      revogadas += 1
    }

    offset += data.length
    if (offset >= totalCount) break
  }

  const { ip, userAgent } = await getRequestInfo()
  await registrarAuditLog({
    escritorioId,
    membroId,
    userId,
    evento: 'sessao.revogar_outros',
    alvoTipo: 'sessao',
    alvoId: sessaoAtual ?? null,
    ip,
    userAgent,
    metadata: { revogadas },
  })

  revalidatePath('/seguranca')
}
