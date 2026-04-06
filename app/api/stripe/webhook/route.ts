// Webhook do Stripe — processa eventos de assinatura
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !sig) {
    return NextResponse.json({ erro: 'Webhook não configurado.' }, { status: 400 })
  }

  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ erro: 'Assinatura inválida.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const escritorioId = session.metadata?.escritorio_id
      const planoId = session.metadata?.plano_id
      const periodo = session.metadata?.periodo ?? 'mensal'

      if (escritorioId && planoId) {
        await supabase.from('assinaturas_escritorio').upsert({
          escritorio_id: escritorioId,
          plano_id: planoId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          periodo,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'escritorio_id' })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const status = sub.status
      const stripeCustomerId = sub.customer

      const statusMap: Record<string, string> = {
        active: 'active', trialing: 'trialing',
        past_due: 'past_due', canceled: 'canceled', incomplete: 'incomplete',
      }

      await supabase.from('assinaturas_escritorio').update({
        status: statusMap[status] ?? status,
        periodo_inicio: new Date(sub.current_period_start * 1000).toISOString(),
        periodo_fim: new Date(sub.current_period_end * 1000).toISOString(),
        cancelar_em_fim: sub.cancel_at_period_end,
        atualizado_em: new Date().toISOString(),
      }).eq('stripe_customer_id', stripeCustomerId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await supabase.from('assinaturas_escritorio').update({
        status: 'canceled',
        plano_id: 'starter',
        atualizado_em: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ recebido: true })
}
