import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PLANOS, formatarPreco } from '@/lib/stripe'
import { Check, Zap, Crown, Star } from 'lucide-react'
import { PlanoCheckoutButton } from '@/components/planos/PlanoCheckoutButton'
import { PlanoPortalButton } from '@/components/planos/PlanoPortalButton'

const ICONES = { starter: Star, pro: Zap, enterprise: Crown }

export default async function PlanosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: assinatura } = await supabase
    .from('assinaturas_escritorio')
    .select('plano_id, status, periodo, trial_termina_em, stripe_customer_id, periodo_fim')
    .eq('escritorio_id', escritorioId)
    .single()

  const planoAtual = assinatura?.plano_id ?? 'starter'
  const stripeAtivo = !!process.env.STRIPE_SECRET_KEY

  const diasTrial = assinatura?.status === 'trialing' && assinatura.trial_termina_em
    ? Math.max(0, Math.ceil((new Date(assinatura.trial_termina_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const STATUS_LABELS: Record<string, string> = {
    active: 'Ativo', trialing: 'Período trial', past_due: 'Pagamento pendente',
    canceled: 'Cancelado', incomplete: 'Incompleto',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Planos e Preços</h1>
        <p className="text-slate-500 mt-2">Escolha o plano ideal para o seu escritório</p>
      </div>

      {/* Status atual */}
      {assinatura && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Plano atual: <strong className="text-slate-900">{PLANOS[planoAtual as keyof typeof PLANOS]?.nome ?? planoAtual}</strong>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                assinatura.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                assinatura.status === 'trialing' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {STATUS_LABELS[assinatura.status] ?? assinatura.status}
              </span>
            </p>
            {diasTrial !== null && (
              <p className="text-xs text-blue-600 mt-0.5">Trial expira em {diasTrial} dias</p>
            )}
            {assinatura.periodo_fim && assinatura.status === 'active' && (
              <p className="text-xs text-slate-400 mt-0.5">
                Próxima cobrança: {new Date(assinatura.periodo_fim).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          {assinatura.stripe_customer_id && (
            <PlanoPortalButton customerId={assinatura.stripe_customer_id} />
          )}
        </div>
      )}

      {!stripeAtivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <strong>Pagamentos não configurados.</strong> Defina <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> no <code className="bg-amber-100 px-1 rounded">.env.local</code> para ativar assinaturas.
        </div>
      )}

      {/* Cards de planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.values(PLANOS).map(plano => {
          const Icon = ICONES[plano.id as keyof typeof ICONES]
          const isAtual = planoAtual === plano.id
          return (
            <div
              key={plano.id}
              className={`relative bg-white rounded-2xl border-2 shadow-sm flex flex-col ${plano.cor} ${plano.destaque ? 'shadow-amber-100' : ''}`}
            >
              {plano.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                  Mais popular
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plano.destaque ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${plano.destaque ? 'text-amber-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{plano.nome}</h3>
                    <p className="text-xs text-slate-500">{plano.descricao}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold text-slate-900">{formatarPreco(plano.preco_mensal)}</span>
                  <span className="text-sm text-slate-400">/mês</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ou {formatarPreco(plano.preco_anual)}/ano (2 meses grátis)
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {plano.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 border-t border-slate-100">
                {isAtual ? (
                  <div className="w-full py-2.5 text-center text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                    ✓ Plano atual
                  </div>
                ) : (
                  <PlanoCheckoutButton
                    planoId={plano.id}
                    nomePlano={plano.nome}
                    precoMensal={plano.preco_mensal}
                    precoAnual={plano.preco_anual}
                    stripeAtivo={stripeAtivo}
                    destaque={plano.destaque}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-400">
        Todos os planos incluem 14 dias de trial gratuito · Cancele quando quiser · Suporte por e-mail
      </p>
    </div>
  )
}
