// Health check endpoint — verifica conectividade e retorna métricas de confiabilidade (SQA 16.6)
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcularConfiabilidade } from '@/lib/sqa'

export const dynamic = 'force-dynamic'

export async function GET() {
  const inicio = Date.now()
  const checks: Record<string, string> = {}

  // ── Verifica Supabase ─────────────────────────────────────────────────────
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('escritorios').select('id').limit(1)
    checks.supabase = error ? 'degraded' : 'ok'
  } catch {
    checks.supabase = 'down'
  }

  // ── Verifica variáveis de ambiente críticas ───────────────────────────────
  checks.stripe   = process.env.STRIPE_SECRET_KEY ? 'ok' : 'missing'
  checks.clerk    = process.env.CLERK_SECRET_KEY  ? 'ok' : 'missing'
  checks.resend   = process.env.RESEND_API_KEY    ? 'ok' : 'missing'
  checks.deepseek = (
    process.env.DEEPSEEK_API_KEY &&
    process.env.DEEPSEEK_API_KEY !== 'sk-COLOQUE_AQUI'
  ) ? 'ok' : 'missing'

  // ── Métricas de confiabilidade (Pressman 16.6 — MTBF/MTTF/MTTR) ─────────
  const confiabilidade = await calcularConfiabilidade(30)

  const latencia = Date.now() - inicio
  const tudo_ok = Object.values(checks).every(v => v === 'ok')
  const status = tudo_ok ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      checks,
      latencia_ms: latencia,
      versao: '1.0',
      timestamp: new Date().toISOString(),
      confiabilidade: {
        mtbf_horas:                 confiabilidade.mtbf_horas,
        mttf_horas:                 confiabilidade.mttf_horas,
        mttr_horas:                 confiabilidade.mttr_horas,
        disponibilidade_percentual: confiabilidade.disponibilidade_percentual,
        total_incidentes_30d:       confiabilidade.total_incidentes,
      },
    },
    { status: tudo_ok ? 200 : 207 },
  )
}
