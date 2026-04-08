import { createAdminClient } from '@/lib/supabase/admin'

type TipoEventoAssinatura = 'visualizado' | 'assinado' | 'recusado' | 'tentativa_invalida'

function extrairIp(req: Request): string {
  const headers = req.headers
  const forwarded = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const cfIp = headers.get('cf-connecting-ip')
  const ip = (forwarded?.split(',')[0] ?? realIp ?? cfIp ?? '').trim()
  return ip || 'nao_informado'
}

function extrairUserAgent(req: Request): string {
  return req.headers.get('user-agent') ?? 'nao_informado'
}

async function registrarEvento(params: {
  assinaturaId: string
  tipo: TipoEventoAssinatura
  req: Request
  detalhes?: string | null
}) {
  const supabase = createAdminClient()
  await supabase.from('assinaturas_digitais_eventos').insert({
    assinatura_id: params.assinaturaId,
    tipo_evento: params.tipo,
    ip: extrairIp(params.req),
    user_agent: extrairUserAgent(params.req),
    detalhes: params.detalhes ?? null,
  })
}

export async function registrarVisualizacaoAssinatura(hash: string, req: Request) {
  const supabase = createAdminClient()
  const { data: assinatura } = await supabase
    .from('assinaturas_digitais')
    .select('id, status')
    .eq('hash_token', hash)
    .maybeSingle()

  if (!assinatura) {
    return { ok: false, status: 404, body: { erro: 'Documento nao encontrado.' } }
  }

  if (assinatura.status === 'pendente') {
    await supabase.from('assinaturas_digitais').update({ status: 'visualizado' }).eq('id', assinatura.id)
  }

  await registrarEvento({
    assinaturaId: assinatura.id,
    tipo: 'visualizado',
    req,
  })

  return { ok: true, status: 200, body: { sucesso: true } }
}

export async function registrarAssinaturaPublica(hash: string, req: Request) {
  const supabase = createAdminClient()
  const { data: assinatura } = await supabase
    .from('assinaturas_digitais')
    .select('id, status, expira_em')
    .eq('hash_token', hash)
    .maybeSingle()

  if (!assinatura) {
    return { ok: false, status: 404, body: { erro: 'Documento nao encontrado.' } }
  }

  if (new Date(assinatura.expira_em) < new Date()) {
    await supabase.from('assinaturas_digitais').update({ status: 'expirado' }).eq('id', assinatura.id)
    await registrarEvento({
      assinaturaId: assinatura.id,
      tipo: 'tentativa_invalida',
      req,
      detalhes: 'tentativa_assinatura_link_expirado',
    })
    return { ok: false, status: 410, body: { erro: 'Este link de assinatura expirou.' } }
  }

  if (assinatura.status !== 'pendente' && assinatura.status !== 'visualizado') {
    await registrarEvento({
      assinaturaId: assinatura.id,
      tipo: 'tentativa_invalida',
      req,
      detalhes: `tentativa_assinatura_status_${assinatura.status}`,
    })
    return { ok: false, status: 409, body: { erro: 'Este documento ja foi processado.' } }
  }

  const { error } = await supabase
    .from('assinaturas_digitais')
    .update({
      status: 'assinado',
      assinado_em: new Date().toISOString(),
      ip_assinatura: extrairIp(req),
      user_agent: extrairUserAgent(req),
    })
    .eq('id', assinatura.id)

  if (error) {
    return { ok: false, status: 500, body: { erro: 'Nao foi possivel registrar a assinatura.' } }
  }

  await registrarEvento({
    assinaturaId: assinatura.id,
    tipo: 'assinado',
    req,
  })

  return { ok: true, status: 200, body: { sucesso: true } }
}

export async function registrarRecusaAssinaturaPublica(hash: string, motivo: string | null, req: Request) {
  const supabase = createAdminClient()
  const { data: assinatura } = await supabase
    .from('assinaturas_digitais')
    .select('id, status, expira_em')
    .eq('hash_token', hash)
    .maybeSingle()

  if (!assinatura) {
    return { ok: false, status: 404, body: { erro: 'Documento nao encontrado.' } }
  }

  if (new Date(assinatura.expira_em) < new Date()) {
    await supabase.from('assinaturas_digitais').update({ status: 'expirado' }).eq('id', assinatura.id)
    await registrarEvento({
      assinaturaId: assinatura.id,
      tipo: 'tentativa_invalida',
      req,
      detalhes: 'tentativa_recusa_link_expirado',
    })
    return { ok: false, status: 410, body: { erro: 'Este link de assinatura expirou.' } }
  }

  if (assinatura.status !== 'pendente' && assinatura.status !== 'visualizado') {
    await registrarEvento({
      assinaturaId: assinatura.id,
      tipo: 'tentativa_invalida',
      req,
      detalhes: `tentativa_recusa_status_${assinatura.status}`,
    })
    return { ok: false, status: 409, body: { erro: 'Este documento ja foi processado.' } }
  }

  const { error } = await supabase
    .from('assinaturas_digitais')
    .update({
      status: 'recusado',
      recusado_em: new Date().toISOString(),
      motivo_recusa: motivo || null,
      ip_assinatura: extrairIp(req),
      user_agent: extrairUserAgent(req),
    })
    .eq('id', assinatura.id)

  if (error) {
    return { ok: false, status: 500, body: { erro: 'Nao foi possivel registrar a recusa.' } }
  }

  await registrarEvento({
    assinaturaId: assinatura.id,
    tipo: 'recusado',
    req,
    detalhes: motivo || null,
  })

  return { ok: true, status: 200, body: { sucesso: true } }
}
