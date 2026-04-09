import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { criarCheckoutSession, PLANOS } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { escritorioId, mfaObrigatorio } = await getAuthContext({ redirecionar2FA: false })
  if (mfaObrigatorio) return NextResponse.json({ erro: '2FA obrigatorio.' }, { status: 403 })
  if (!escritorioId) return NextResponse.json({ erro: 'Nao autenticado.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const planoId = typeof body?.plano_id === 'string' ? body.plano_id : ''
  const periodo = body?.periodo

  if (!planoId || !periodo) {
    return NextResponse.json({ erro: 'Dados invalidos.' }, { status: 400 })
  }
  if (!(planoId in PLANOS)) {
    return NextResponse.json({ erro: 'Plano invalido.' }, { status: 400 })
  }
  if (periodo !== 'mensal' && periodo !== 'anual') {
    return NextResponse.json({ erro: 'Periodo invalido.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: assinatura } = await supabase
    .from('assinaturas_escritorio')
    .select('stripe_customer_id')
    .eq('escritorio_id', escritorioId)
    .maybeSingle()

  const url = await criarCheckoutSession(
    planoId,
    periodo,
    escritorioId,
    assinatura?.stripe_customer_id ?? undefined,
  )

  if (!url) {
    return NextResponse.json(
      { erro: 'Stripe nao configurado. Defina STRIPE_SECRET_KEY no ambiente.' },
      { status: 503 },
    )
  }

  return NextResponse.json({ url })
}
