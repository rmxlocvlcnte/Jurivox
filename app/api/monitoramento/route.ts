// API Route — Sincronização com DataJud
// Chamada pelo botão na UI ou por cron job externo
// Autenticação: header Authorization: Bearer {CRON_SECRET}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sincronizarProcesso } from '@/lib/datajud'

export async function POST(req: NextRequest) {
  // Valida segredo do cron (evita chamadas não autorizadas)
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Pode receber escritorio_id e/ou processo_id específicos no body
  let body: { escritorio_id?: string; processo_id?: string } = {}
  try { body = await req.json() } catch {}

  // Busca processos ativos
  let query = supabase
    .from('processos')
    .select('id, numero_cnj, escritorio_id')
    .eq('status', 'ativo')
    .not('numero_cnj', 'is', null)
    .limit(50) // Limite por execução para respeitar rate limit da API

  if (body.escritorio_id) query = query.eq('escritorio_id', body.escritorio_id)
  if (body.processo_id)   query = query.eq('id', body.processo_id)

  const { data: processos, error } = await query

  if (error) {
    return NextResponse.json({ erro: 'Erro ao buscar processos.' }, { status: 500 })
  }

  if (!processos?.length) {
    return NextResponse.json({ mensagem: 'Nenhum processo para sincronizar.', total: 0 })
  }

  const resultados: { processo_id: string; numero_cnj: string; novas: number; erro?: string }[] = []

  // Processa sequencialmente para não sobrecarregar a API
  for (const proc of processos) {
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
      erro: result.erro,
    })

    // Pequena pausa entre chamadas para respeitar rate limit
    await new Promise(r => setTimeout(r, 200))
  }

  const totalNovas = resultados.reduce((s, r) => s + r.novas, 0)
  const sucesso = resultados.filter(r => !r.erro).length
  const erros   = resultados.filter(r => !!r.erro).length

  return NextResponse.json({
    mensagem: `Sincronização concluída. ${totalNovas} novas movimentações.`,
    total: processos.length,
    sucesso,
    erros,
    totalNovas,
    resultados,
  })
}

// Endpoint GET para verificar status e últimas sincronizações
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const escritorioId = req.nextUrl.searchParams.get('escritorio_id')
  const supabase = createAdminClient()

  let query = supabase
    .from('monitoramento_logs')
    .select('*')
    .order('executado_em', { ascending: false })
    .limit(20)

  if (escritorioId) query = query.eq('escritorio_id', escritorioId)

  const { data: logs } = await query
  return NextResponse.json({ logs: logs ?? [] })
}
