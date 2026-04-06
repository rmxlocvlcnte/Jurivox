import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_SECRET_KEY não configurada. Pagamentos desativados.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2025-03-31.basil',
})

export const PLANOS = {
  starter: {
    id: 'starter',
    nome: 'Starter',
    descricao: 'Para advogados autônomos',
    preco_mensal: 9990,   // centavos
    preco_anual: 99900,
    features: [
      '30 processos ativos',
      '100 clientes',
      '2 membros',
      'Prazos e Agenda',
      'Financeiro básico',
    ],
    cor: 'border-slate-200',
    destaque: false,
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    descricao: 'Para escritórios em crescimento',
    preco_mensal: 24990,
    preco_anual: 249900,
    features: [
      '200 processos ativos',
      '500 clientes',
      '10 membros',
      'Assistente IA jurídico',
      'Monitoramento DataJud',
      'Assinatura Digital',
      'Analytics avançado',
      'Templates de documentos',
    ],
    cor: 'border-amber-400',
    destaque: true,
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Enterprise',
    descricao: 'Para grandes escritórios',
    preco_mensal: 59990,
    preco_anual: 599900,
    features: [
      'Processos ilimitados',
      'Clientes ilimitados',
      'Membros ilimitados',
      'Tudo do plano Pro',
      'Suporte prioritário',
      'Onboarding dedicado',
      'API personalizada',
    ],
    cor: 'border-purple-400',
    destaque: false,
  },
}

export function formatarPreco(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function criarCheckoutSession(
  planId: string,
  periodo: 'mensal' | 'anual',
  escritorioId: string,
  customerId?: string,
): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const priceId = periodo === 'anual'
    ? process.env[`STRIPE_PRICE_${planId.toUpperCase()}_ANUAL`]
    : process.env[`STRIPE_PRICE_${planId.toUpperCase()}_MENSAL`]

  if (!priceId) {
    console.warn(`Price ID não configurado para plano ${planId} ${periodo}`)
    return null
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/planos?sucesso=1`,
    cancel_url: `${appUrl}/planos`,
    metadata: { escritorio_id: escritorioId, plano_id: planId, periodo },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })

  return session.url
}

export async function criarPortalSession(customerId: string): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/planos`,
  })
  return session.url
}
