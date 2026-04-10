import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { exigirCargo } from '@/lib/permissoes'
import { stripe, PLANOS } from '@/lib/stripe'

// Cria automaticamente os Produtos e Preços no Stripe para cada plano
// Só pode ser chamado por sócios/admins
// Após criar, imprime os Price IDs — adicione-os nas variáveis de ambiente da Vercel
export async function POST(req: NextRequest) {
  const { cargo, escritorioId } = await getAuthContext()
  if (!escritorioId) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

  const perm = exigirCargo(cargo, ['socio', 'admin'], 'Apenas sócios e admins podem configurar o Stripe.')
  if (perm) return NextResponse.json(perm, { status: 403 })

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return NextResponse.json({
      erro: 'STRIPE_SECRET_KEY não configurada. Adicione nas variáveis de ambiente da Vercel.',
      instrucao: 'https://dashboard.stripe.com/apikeys',
    }, { status: 503 })
  }

  const resultado: Record<string, { mensal: string; anual: string }> = {}
  const erros: string[] = []

  for (const [planoId, plano] of Object.entries(PLANOS)) {
    try {
      // Verifica se já existe produto com este nome
      const existentes = await stripe.products.list({ limit: 100 })
      let produto = existentes.data.find(p => p.metadata?.plano_id === planoId && p.active)

      if (!produto) {
        produto = await stripe.products.create({
          name: `Jurisflow ${plano.nome}`,
          description: plano.descricao,
          metadata: { plano_id: planoId },
        })
      }

      // Preço mensal
      const envKeyMensal = `STRIPE_PRICE_${planoId.toUpperCase()}_MENSAL`
      let priceMensal: string

      if (process.env[envKeyMensal]) {
        priceMensal = process.env[envKeyMensal]!
      } else {
        const pm = await stripe.prices.create({
          product: produto.id,
          unit_amount: plano.preco_mensal,
          currency: 'brl',
          recurring: { interval: 'month' },
          metadata: { plano_id: planoId, periodo: 'mensal' },
        })
        priceMensal = pm.id
      }

      // Preço anual
      const envKeyAnual = `STRIPE_PRICE_${planoId.toUpperCase()}_ANUAL`
      let priceAnual: string

      if (process.env[envKeyAnual]) {
        priceAnual = process.env[envKeyAnual]!
      } else {
        const pa = await stripe.prices.create({
          product: produto.id,
          unit_amount: plano.preco_anual,
          currency: 'brl',
          recurring: { interval: 'year' },
          metadata: { plano_id: planoId, periodo: 'anual' },
        })
        priceAnual = pa.id
      }

      resultado[planoId] = { mensal: priceMensal, anual: priceAnual }
    } catch (err) {
      erros.push(`${planoId}: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return NextResponse.json({
    sucesso: erros.length === 0,
    priceIds: resultado,
    erros: erros.length > 0 ? erros : undefined,
    instrucao: erros.length === 0
      ? 'Adicione os Price IDs abaixo nas variáveis de ambiente da Vercel (Settings > Environment Variables):'
      : 'Alguns planos falharam. Verifique os erros.',
    variaveis: Object.entries(resultado).flatMap(([plano, ids]) => [
      `STRIPE_PRICE_${plano.toUpperCase()}_MENSAL=${ids.mensal}`,
      `STRIPE_PRICE_${plano.toUpperCase()}_ANUAL=${ids.anual}`,
    ]),
  })
}
