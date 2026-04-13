import { NextRequest, NextResponse } from 'next/server'
import { verificarApiKey } from '@/lib/api-keys'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const rl = rateLimit(`api:v1:prazos:${ip}`, { windowMs: 60_000, maxRequests: 60 })
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
  if (!ctx.escopos.includes('prazos:read')) {
    return NextResponse.json({ erro: 'Escopo "prazos:read" necessário para este endpoint.' }, { status: 403 })
  }

  const url = new URL(request.url)
  const page   = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1'))
  const limit  = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50')))
  const offset = (page - 1) * limit
  const status = url.searchParams.get('status') // pendente | concluido
  const venceHoje = url.searchParams.get('vence_hoje') === 'true'
  const atrasados = url.searchParams.get('atrasados') === 'true'

  const supabase = createAdminClient()
  let query = supabase
    .from('prazos')
    .select(
      'id, descricao, data_inicio, data_vencimento, status, dias_uteis, processo_id, criado_em',
      { count: 'exact' }
    )
    .eq('escritorio_id', ctx.escritorioId)
    .order('data_vencimento', { ascending: true })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (venceHoje) {
    const hoje = new Date().toISOString().split('T')[0]
    query = query.eq('data_vencimento', hoje).eq('status', 'pendente')
  } else if (atrasados) {
    const hoje = new Date().toISOString().split('T')[0]
    query = query.lt('data_vencimento', hoje).eq('status', 'pendente')
  }

  const { data, count, error } = await query

  if (error) {
    console.error('API v1 /prazos error:', error)
    return NextResponse.json({ erro: 'Erro interno ao buscar prazos.' }, { status: 500 })
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
