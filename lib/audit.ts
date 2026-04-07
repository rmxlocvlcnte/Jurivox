import { createAdminClient } from '@/lib/supabase/admin'

type AuditPayload = {
  escritorioId: string
  membroId?: string | null
  userId?: string | null
  evento: string
  categoria?: string
  alvoTipo?: string | null
  alvoId?: string | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, any>
}

export async function registrarAuditLog(payload: AuditPayload) {
  const supabase = createAdminClient()
  const {
    escritorioId,
    membroId = null,
    userId = null,
    evento,
    categoria = 'seguranca',
    alvoTipo = null,
    alvoId = null,
    ip = null,
    userAgent = null,
    metadata = {},
  } = payload

  await supabase.from('audit_logs').insert({
    escritorio_id: escritorioId,
    membro_id: membroId,
    clerk_user_id: userId,
    evento,
    categoria,
    alvo_tipo: alvoTipo,
    alvo_id: alvoId,
    ip,
    user_agent: userAgent,
    metadata,
  })
}
