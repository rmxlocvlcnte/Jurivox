// Webhook do Stripe — processa eventos de assinatura
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailPagamentoFalhou, emailTrialExpirando } from '@/lib/notificacoes/email'

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

      if (escritorioId && planoId && session.subscription) {
        // Fetch real subscription status from Stripe (handles trialing correctly).
        // Cast to any because the dahlia API version changed field names in TS types
        // but the runtime values are unchanged.
        const sub: any = await stripe.subscriptions.retrieve(session.subscription as string)

        await supabase.from('assinaturas_escritorio').upsert({
          escritorio_id: escritorioId,
          plano_id: planoId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: sub.status,
          periodo,
          trial_termina_em: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
          periodo_inicio: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString()
            : null,
          periodo_fim: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'escritorio_id' })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const stripeCustomerId = sub.customer

      const statusMap: Record<string, string> = {
        active: 'active', trialing: 'trialing',
        past_due: 'past_due', canceled: 'canceled', incomplete: 'incomplete',
      }

      await supabase.from('assinaturas_escritorio').update({
        status: statusMap[sub.status] ?? sub.status,
        periodo_inicio: new Date(sub.current_period_start * 1000).toISOString(),
        periodo_fim: new Date(sub.current_period_end * 1000).toISOString(),
        trial_termina_em: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
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

    // ── Trial expirando em 3 dias ────────────────────────────────────────────
    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object
      const stripeCustomerId = sub.customer as string

      const diasRestantes = sub.trial_end
        ? Math.ceil((sub.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
        : 3

      const { data: assinatura } = await supabase
        .from('assinaturas_escritorio')
        .select('escritorio_id, plano_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (assinatura?.escritorio_id) {
        const { data: membros } = await supabase
          .from('membros_escritorio')
          .select('nome, email')
          .eq('escritorio_id', assinatura.escritorio_id)
          .in('cargo', ['socio', 'admin'])
          .eq('ativo', true)

        const { data: escritorio } = await supabase
          .from('escritorios')
          .select('nome')
          .eq('id', assinatura.escritorio_id)
          .single()

        for (const membro of membros ?? []) {
          if (membro.email) {
            await emailTrialExpirando({
              emailAdvogado: membro.email,
              nomeAdvogado: membro.nome,
              nomeEscritorio: escritorio?.nome ?? 'seu escritório',
              diasRestantes,
              planoAtual: assinatura.plano_id ?? 'Starter',
            })
          }
        }
      }
      break
    }

    // ── Pagamento falhou (dunning) ────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const stripeCustomerId = invoice.customer as string
      const tentativa = invoice.attempt_count ?? 1
      const valorCentavos = invoice.amount_due ?? 0

      const { data: assinatura } = await supabase
        .from('assinaturas_escritorio')
        .select('escritorio_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (assinatura?.escritorio_id) {
        await supabase.from('assinaturas_escritorio').update({
          status: 'past_due',
          atualizado_em: new Date().toISOString(),
        }).eq('stripe_customer_id', stripeCustomerId)

        const { data: membros } = await supabase
          .from('membros_escritorio')
          .select('nome, email')
          .eq('escritorio_id', assinatura.escritorio_id)
          .in('cargo', ['socio', 'admin'])
          .eq('ativo', true)

        const { data: escritorio } = await supabase
          .from('escritorios')
          .select('nome')
          .eq('id', assinatura.escritorio_id)
          .single()

        for (const membro of membros ?? []) {
          if (membro.email) {
            await emailPagamentoFalhou({
              emailAdvogado: membro.email,
              nomeAdvogado: membro.nome,
              nomeEscritorio: escritorio?.nome ?? 'seu escritório',
              valorCentavos,
              tentativa,
            })
          }
        }
      }
      break
    }

    // ── Pagamento confirmado ─────────────────────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      // Se estava em past_due, volta pra active
      if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_update') {
        await supabase.from('assinaturas_escritorio').update({
          status: 'active',
          atualizado_em: new Date().toISOString(),
        }).eq('stripe_customer_id', invoice.customer as string)
      }
      break
    }
  }

  return NextResponse.json({ recebido: true })
}
