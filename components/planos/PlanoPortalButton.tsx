'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'

interface Props {
  customerId?: string
}

export function PlanoPortalButton({ customerId }: Props) {
  const [isPending, startTransition] = useTransition()

  function abrirPortal() {
    startTransition(async () => {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data?.erro ?? 'Nao foi possivel abrir o portal de faturamento.')
        return
      }

      if (!data?.url) {
        toast.error('Resposta invalida do portal Stripe.')
        return
      }

      window.location.href = data.url
    })
  }

  return (
    <button
      onClick={abrirPortal}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {isPending ? 'Abrindo...' : 'Gerenciar assinatura'}
    </button>
  )
}
