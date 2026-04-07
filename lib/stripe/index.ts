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
    preco_mensal: 5000,   // R$ 50,00 em centavos
    preco_anual: 50000,   // R$ 500,00 (2 meses grátis)
    limites: { processos: 50, clientes: 150, membros: 2, templates: 5 },
    features: [
      '50 processos ativos',
      '150 clientes',
      '2 membros',
      '5 templates de documentos',
      'Prazos e Agenda',
      'Financeiro básico',
      'Exportação CSV/Excel/PDF',
      'Backup dos dados',
    ],
    cor: 'border-slate-200',
    destaque: false,
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    descricao: 'Para escritórios em crescimento',
    preco_mensal: 15000,  // R$ 150,00 em centavos
    preco_anual: 150000,  // R$ 1.500,00 (2 meses grátis)
    limites: { processos: 500, clientes: 1000, membros: 15, templates: 50 },
    features: [
      '500 processos ativos',
      '1.000 clientes',
      '15 membros',
      '50 templates de documentos',
      'Assistente IA jurídico',
      'Monitoramento DataJud automático',
      'Assinatura Digital de documentos',
      'Analytics avançado',
    ],
    cor: 'border-amber-400',
    destaque: true,
  },
  enterprise: {
    id: 'enterprise',
    nome: 'Enterprise',
    descricao: 'Para grandes escritórios',
    preco_mensal: 30000,  // R$ 300,00 em centavos
    preco_anual: 300000,  // R$ 3.000,00 (2 meses grátis)
    limites: { processos: -1, clientes: -1, membros: -1, templates: -1 },
    features: [
      'Processos, clientes e membros ilimitados',
      'Templates ilimitados',
      'Tudo do plano Pro',
      'Suporte prioritário (resposta em 4h)',
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
