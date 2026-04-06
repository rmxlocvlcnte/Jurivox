import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { criarCheckoutSession } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { escritorioId } = await getAuthContext()
  if (!escritorioId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const { plano_id, periodo } = await req.json()
  if (!plano_id || !periodo) return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: assinatura } = await supabase
    .from('assinaturas_escritorio')
    .select('stripe_customer_id')
    .eq('escritorio_id', escritorioId)
    .single()

  const url = await criarCheckoutSession(
    plano_id, periodo, escritorioId,
    assinatura?.stripe_customer_id ?? undefined,
  )

  if (!url) {
    return NextResponse.json({ erro: 'Stripe não configurado. Defina STRIPE_SECRET_KEY no .env.' }, { status: 503 })
  }

  return NextResponse.json({ url })
}
