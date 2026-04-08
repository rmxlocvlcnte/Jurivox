import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const inicio = Date.now()
  const checks: Record<string, string> = {}

  // Verifica Supabase
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('escritorios').select('id').limit(1)
    checks.supabase = error ? 'degraded' : 'ok'
  } catch {
    checks.supabase = 'down'
  }

  const latencia = Date.now() - inicio
  const status = Object.values(checks).every(v => v === 'ok') ? 'ok' : 'degraded'

  return NextResponse.json(
    { status, checks, latencia_ms: latencia, versao: '1.0', timestamp: new Date().toISOString() },
    { status: status === 'ok' ? 200 : 207 }
  )
}
