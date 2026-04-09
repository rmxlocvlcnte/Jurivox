import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sincronizarProcesso } from '@/lib/datajud'

type BodyType = { escritorio_id?: string; processo_id?: string }

async function resolverEscopo(req: NextRequest, body: BodyType) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret && authHeader === `Bearer ${secret}`) {
    return {
      ok: true as const,
      status: 200,
      isCron: true,
      escritorioId: body.escritorio_id ?? null,
    }
  }

  const { userId } = await auth()
  if (!userId) {
    return { ok: false as const, status: 401, erro: 'Nao autorizado.' }
  }

  const supabase = createAdminClient()
  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('escritorio_id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (!membro?.escritorio_id) {
    return { ok: false as const, status: 403, erro: 'Usuario sem escritorio vinculado.' }
  }

  return {
    ok: true as const,
    status: 200,
    isCron: false,
    escritorioId: membro.escritorio_id,
  }
}

export async function POST(req: NextRequest) {
  const body: BodyType = await req.json().catch(() => ({}))
  const escopo = await resolverEscopo(req, body)

  if (!escopo.ok) {
    return NextResponse.json({ erro: escopo.erro }, { status: escopo.status })
  }

  const supabase = createAdminClient()
  let query = supabase
    .from('processos')
    .select('id, numero_cnj, escritorio_id')
    .eq('status', 'ativo')
    .not('numero_cnj', 'is', null)
    .limit(50)

  if (escopo.escritorioId) query = query.eq('escritorio_id', escopo.escritorioId)
  if (body.processo_id) query = query.eq('id', body.processo_id)

  const { data: processos, error } = await query
  if (error) {
    return NextResponse.json({ erro: 'Erro ao buscar processos.' }, { status: 500 })
  }
  if (!processos?.length) {
    return NextResponse.json({ mensagem: 'Nenhum processo para sincronizar.', total: 0 })
  }

  const resultados: Array<{
    processo_id: string
    numero_cnj: string
    novas: number
    prazos_automaticos: number
    erro?: string
  }> = []

  for (const proc of processos) {
    try {
      const result = await sincronizarProcesso(
        proc.id,
        proc.numero_cnj,
        proc.escritorio_id,
        supabase,
      )
      resultados.push({
        processo_id: proc.id,
        numero_cnj: proc.numero_cnj,
        novas: result.novas,
        prazos_automaticos: result.prazosAutomaticos,
        erro: result.erro,
      })
    } catch (e) {
      resultados.push({
        processo_id: proc.id,
        numero_cnj: proc.numero_cnj,
        novas: 0,
        prazos_automaticos: 0,
        erro: e instanceof Error ? e.message : 'Erro desconhecido',
      })
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  const totalNovas = resultados.reduce((s, r) => s + r.novas, 0)
  const totalPrazosAutomaticos = resultados.reduce((s, r) => s + r.prazos_automaticos, 0)
  const sucesso = resultados.filter((r) => !r.erro).length
  const erros = resultados.filter((r) => !!r.erro).length

  return NextResponse.json({
    mensagem: `Sincronizacao concluida. ${totalNovas} novas movimentacoes.`,
    total: processos.length,
    sucesso,
    erros,
    totalNovas,
    totalPrazosAutomaticos,
    resultados,
  })
}

export async function GET(req: NextRequest) {
  const escopo = await resolverEscopo(req, {})
  if (!escopo.ok) {
    return NextResponse.json({ erro: escopo.erro }, { status: escopo.status })
  }

  const supabase = createAdminClient()
  let query = supabase
    .from('monitoramento_logs')
    .select('*')
    .order('executado_em', { ascending: false })
    .limit(20)

  if (escopo.escritorioId) query = query.eq('escritorio_id', escopo.escritorioId)

  const { data: logs } = await query
  return NextResponse.json({ logs: logs ?? [] })
}
