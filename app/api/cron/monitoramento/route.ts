import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sincronizarProcesso } from '@/lib/datajud'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const BATCH_SIZE = 50 // processa 50 por vez para caber no timeout

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json({ erro: 'CRON_SECRET nao configurado.' }, { status: 500 })
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  }

  // Suporte a paginação via query param ?offset=N
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0')

  const supabase = createAdminClient()
  const inicio = Date.now()

  // Busca total de processos ativos para informação
  const { count: totalProcessos } = await supabase
    .from('processos')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ativo')
    .not('numero_cnj', 'is', null)

  const { data: processos, error } = await supabase
    .from('processos')
    .select('id, numero_cnj, escritorio_id')
    .eq('status', 'ativo')
    .not('numero_cnj', 'is', null)
    .order('atualizado_em', { ascending: true }) // prioriza os menos atualizados
    .range(offset, offset + BATCH_SIZE - 1)

  if (error) {
    console.error('[CRON] Erro ao buscar processos:', error)
    return NextResponse.json({ erro: 'Erro ao buscar processos.' }, { status: 500 })
  }

  if (!processos?.length) {
    return NextResponse.json({ mensagem: 'Nenhum processo para sincronizar.', total: 0, proximo_offset: null })
  }

  const resultados: Array<{
    processo_id: string
    numero_cnj: string
    novas: number
    prazosAutomaticos: number
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
        prazosAutomaticos: result.prazosAutomaticos,
      })
    } catch (err) {
      resultados.push({
        processo_id: proc.id,
        numero_cnj: proc.numero_cnj,
        novas: 0,
        prazosAutomaticos: 0,
        erro: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }

    await new Promise((r) => setTimeout(r, 300))
  }

  const totalNovas = resultados.reduce((s, r) => s + r.novas, 0)
  const totalPrazosAutomaticos = resultados.reduce((s, r) => s + r.prazosAutomaticos, 0)
  const sucessos = resultados.filter((r) => !r.erro).length
  const erros = resultados.filter((r) => !!r.erro).length
  const duracao = ((Date.now() - inicio) / 1000).toFixed(1)
  const proximoOffset = offset + processos.length < (totalProcessos ?? 0)
    ? offset + processos.length
    : null

  console.log(`[CRON] Offset ${offset}: ${processos.length} processos em ${duracao}s — ${totalNovas} movs, ${erros} erros`)

  return NextResponse.json({
    mensagem: `Cron concluido em ${duracao}s. ${totalNovas} novas movimentacoes.`,
    offset,
    batch_size: processos.length,
    total_processos: totalProcessos ?? 0,
    proximo_offset: proximoOffset,
    sucessos,
    erros,
    totalNovas,
    totalPrazosAutomaticos,
  })
}
