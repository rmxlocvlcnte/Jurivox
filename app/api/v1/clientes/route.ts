import { NextRequest, NextResponse } from 'next/server'
import { verificarApiKey } from '@/lib/api-keys'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

function mascararCpf(cpf: string | null): string | null {
  if (!cpf) return null
  // Mantém apenas os últimos 2 dígitos visíveis: ***.***.***-XX
  return cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/, '***.***.***-$4')
    .replace(/^(\d{11})$/, (_, s) => `***.***.***-${s.slice(9)}`)
    || cpf.replace(/\d(?=\d{2})/g, '*')
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const rl = rateLimit(`api:v1:clientes:${ip}`, { windowMs: 60_000, maxRequests: 60 })
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
  if (!ctx.escopos.includes('clientes:read')) {
    return NextResponse.json({ erro: 'Escopo "clientes:read" necessário para este endpoint.' }, { status: 403 })
  }

  const url = new URL(request.url)
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50')))
  const offset = (page - 1) * limit
  const busca  = url.searchParams.get('q')?.trim()

  const supabase = createAdminClient()
  let query = supabase
    .from('clientes')
    .select('id, nome, cpf, telefone, email, criado_em', { count: 'exact' })
    .eq('escritorio_id', ctx.escritorioId)
    .order('nome', { ascending: true })
    .range(offset, offset + limit - 1)

  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('API v1 /clientes error:', error)
    return NextResponse.json({ erro: 'Erro interno ao buscar clientes.' }, { status: 500 })
  }

  // Mascara CPF antes de retornar
  const clientes = (data ?? []).map(c => ({
    ...c,
    cpf: mascararCpf(c.cpf),
  }))

  return NextResponse.json({
    data: clientes,
    meta: {
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    },
  })
}
