import { NextRequest, NextResponse } from 'next/server'
import { verificarApiKey } from '@/lib/api-keys'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const rl = rateLimit(`api:v1:processos:${ip}`, { windowMs: 60_000, maxRequests: 60 })
  if (!rl.allowed) {
    return NextResponse.json(
      { erro: 'Rate limit excedido. Tente novamente em 1 minuto.', retry_after: 60 },
      { status: 429 }
    )
  }

  const ctx = await verificarApiKey(request.headers.get('authorization'))
  if (!ctx) {
    return NextResponse.json({ erro: 'Chave de API inválida, revogada ou ausente.' }, { status: 401 })
  }
  if (!ctx.escopos.includes('processos:read')) {
    return NextResponse.json({ erro: 'Escopo "processos:read" necessário para este endpoint.' }, { status: 403 })
  }

  const url = new URL(request.url)
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50')))
  const offset = (page - 1) * limit
  const status = url.searchParams.get('status') // ativo | arquivado | encerrado

  const supabase = createAdminClient()
  let query = supabase
    .from('processos')
    .select('id, numero_cnj, tribunal, area_juridica, status, criado_em, atualizado_em', { count: 'exact' })
    .eq('escritorio_id', ctx.escritorioId)
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('API v1 /processos error:', error)
    return NextResponse.json({ erro: 'Erro interno ao buscar processos.' }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    },
  })
}
