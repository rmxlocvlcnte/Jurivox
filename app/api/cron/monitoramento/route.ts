// ─────────────────────────────────────────────────────────────────────
// CRON — Sincronização automática DataJud
// Chamado pelo Vercel Cron Jobs (GET request com header Authorization)
// Schedule: diariamente às 6h (UTC) em dias úteis → vercel.json
// ─────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sincronizarProcesso } from '@/lib/datajud'

export const maxDuration = 300 // 5 minutos (Vercel Pro)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Vercel Cron envia header Authorization: Bearer {CRON_SECRET}
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return NextResponse.json({ erro: 'CRON_SECRET não configurado.' }, { status: 500 })
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const inicio = Date.now()

  // Busca todos os processos ativos de todos os escritórios com número CNJ
  const { data: processos, error } = await supabase
    .from('processos')
    .select('id, numero_cnj, escritorio_id')
    .eq('status', 'ativo')
    .not('numero_cnj', 'is', null)
    .limit(100) // Limite conservador para respeitar rate limit DataJud

  if (error) {
    console.error('[CRON] Erro ao buscar processos:', error)
    return NextResponse.json({ erro: 'Erro ao buscar processos.' }, { status: 500 })
  }

  if (!processos?.length) {
    return NextResponse.json({ mensagem: 'Nenhum processo para sincronizar.', total: 0 })
  }

  const resultados: Array<{ processo_id: string; numero_cnj: string; novas: number; erro?: string }> = []

  for (const proc of processos) {
    try {
      const result = await sincronizarProcesso(
        proc.id,
        proc.numero_cnj,
        proc.escritorio_id,
        supabase,
      )
      resultados.push({ processo_id: proc.id, numero_cnj: proc.numero_cnj, novas: result.novas })
    } catch (err) {
      resultados.push({
        processo_id: proc.id,
        numero_cnj: proc.numero_cnj,
        novas: 0,
        erro: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }

    // Intervalo entre requisições para respeitar rate limit
    await new Promise(r => setTimeout(r, 300))
  }

  const totalNovas = resultados.reduce((s, r) => s + r.novas, 0)
  const sucessos = resultados.filter(r => !r.erro).length
  const erros = resultados.filter(r => !!r.erro).length
  const duracao = ((Date.now() - inicio) / 1000).toFixed(1)

  console.log(`[CRON] Concluído em ${duracao}s — ${totalNovas} novas movimentações, ${erros} erros`)

  return NextResponse.json({
    mensagem: `Cron concluído em ${duracao}s. ${totalNovas} novas movimentações.`,
    total: processos.length,
    sucessos,
    erros,
    totalNovas,
  })
}
