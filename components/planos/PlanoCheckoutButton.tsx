'use client'

import { useState, useTransition } from 'react'
import { formatarPreco } from '@/lib/stripe'
import { toast } from 'sonner'

interface Props {
  planoId: string
  nomePlano: string
  precoMensal: number
  precoAnual: number
  stripeAtivo: boolean
  destaque: boolean
}

export function PlanoCheckoutButton({ planoId, nomePlano, precoMensal, precoAnual, stripeAtivo, destaque }: Props) {
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')
  const [isPending, startTransition] = useTransition()

  function handleCheckout() {
    if (!stripeAtivo) {
      toast.error('Configure STRIPE_SECRET_KEY para ativar pagamentos.')
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano_id: planoId, periodo }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.erro ?? 'Erro ao iniciar checkout.')
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
        <button
          onClick={() => setPeriodo('mensal')}
          className={`flex-1 py-1.5 transition-colors ${periodo === 'mensal' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Mensal
        </button>
        <button
          onClick={() => setPeriodo('anual')}
          className={`flex-1 py-1.5 transition-colors ${periodo === 'anual' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Anual (-17%)
        </button>
      </div>
      <button
        onClick={handleCheckout}
        disabled={isPending}
        className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
          destaque
            ? 'bg-amber-400 hover:bg-amber-500 text-slate-900'
            : 'bg-slate-900 hover:bg-slate-800 text-white'
        }`}
      >
        {isPending ? 'Redirecionando...' : `Assinar ${nomePlano} — ${formatarPreco(periodo === 'anual' ? precoAnual : precoMensal)}/${periodo === 'anual' ? 'ano' : 'mês'}`}
      </button>
    </div>
  )
}
