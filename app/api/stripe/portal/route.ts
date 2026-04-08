import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { criarPortalSession } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { escritorioId } = await getAuthContext()
  if (!escritorioId) {
    return NextResponse.json({ erro: 'Nao autenticado.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const customerIdBody = typeof body?.customer_id === 'string' ? body.customer_id : null

  const supabase = createAdminClient()
  const { data: assinatura } = await supabase
    .from('assinaturas_escritorio')
    .select('stripe_customer_id')
    .eq('escritorio_id', escritorioId)
    .maybeSingle()

  const customerId = customerIdBody ?? assinatura?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ erro: 'Nenhum cliente Stripe vinculado a este escritorio.' }, { status: 400 })
  }

  const url = await criarPortalSession(customerId)
  if (!url) {
    return NextResponse.json({ erro: 'Stripe nao configurado. Defina STRIPE_SECRET_KEY no ambiente.' }, { status: 503 })
  }

  return NextResponse.json({ url })
}
