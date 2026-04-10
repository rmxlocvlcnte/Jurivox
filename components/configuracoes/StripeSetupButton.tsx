'use client'

import { useState } from 'react'
import { Loader2, CreditCard, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface SetupResult {
  sucesso: boolean
  variaveis?: string[]
  instrucao?: string
  erro?: string
  erros?: string[]
}

export function StripeSetupButton() {
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<SetupResult | null>(null)

  async function executarSetup() {
    setCarregando(true)
    try {
      const res = await fetch('/api/stripe/setup', { method: 'POST' })
      const data = await res.json()
      setResultado(data)
      if (data.sucesso) {
        toast.success('Stripe configurado! Copie os Price IDs abaixo.')
      } else {
        toast.error(data.erro ?? 'Erro ao configurar Stripe.')
      }
    } catch {
      toast.error('Erro de rede.')
    } finally {
      setCarregando(false)
    }
  }

  function copiarTudo() {
    if (!resultado?.variaveis) return
    navigator.clipboard.writeText(resultado.variaveis.join('\n'))
    toast.success('Copiado!')
  }

  if (resultado?.sucesso && resultado.variaveis) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <Check className="w-3.5 h-3.5" />
          <span className="font-medium">{resultado.instrucao}</span>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-emerald-400 space-y-0.5">
          {resultado.variaveis.map((v, i) => (
            <div key={i}>{v}</div>
          ))}
        </div>
        <button
          onClick={copiarTudo}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Copy className="w-3 h-3" />
          Copiar todas as variáveis
        </button>
        <p className="text-xs text-slate-500">
          Adicione essas variáveis em{' '}
          <a href="https://vercel.com" target="_blank" className="text-amber-600 hover:underline">
            Vercel → Settings → Environment Variables
          </a>{' '}
          e faça um novo deploy.
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={executarSetup}
      disabled={carregando}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-xs rounded-lg transition-colors disabled:opacity-60"
    >
      {carregando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
      Criar Produtos e Preços no Stripe
    </button>
  )
}
