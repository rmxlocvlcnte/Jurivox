'use client'

import { useState, useTransition } from 'react'
import { gerarTokenPortalCliente } from '@/lib/actions/portal-cliente'
import { Globe, Copy, Check, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  clienteId: string
  clienteNome: string
}

export function PortalClienteButton({ clienteId, clienteNome }: Props) {
  const [isPending, startTransition] = useTransition()
  const [link, setLink] = useState<string | null>(null)
  const [expira, setExpira] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  function handleGerar() {
    startTransition(async () => {
      const res = await gerarTokenPortalCliente(clienteId)
      if ('erro' in res) {
        toast.error(res.erro)
        return
      }
      setLink(res.url)
      setExpira(res.expiraEm ?? null)
      toast.success('Link do portal gerado com sucesso!')
    })
  }

  async function handleCopiar() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopiado(false), 2000)
  }

  const expiraFormatado = expira
    ? new Date(expira).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Globe className="w-4 h-4 text-amber-500" />
        <h2 className="font-semibold text-slate-900">Portal do Cliente</h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="text-xs text-slate-500">
          Gere um link seguro para {clienteNome} acompanhar seus processos e prazos sem precisar de login.
          O link é válido por 30 dias.
        </p>

        {!link ? (
          <button
            onClick={handleGerar}
            disabled={isPending}
            className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors text-sm disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {isPending ? 'Gerando...' : 'Gerar Link do Portal'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={link}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 truncate outline-none"
              />
              <button
                onClick={handleCopiar}
                title="Copiar link"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
              >
                {copiado ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir portal"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </a>
            </div>
            {expiraFormatado && (
              <p className="text-xs text-slate-400">Válido até {expiraFormatado}</p>
            )}
            <button
              onClick={handleGerar}
              disabled={isPending}
              className="text-xs text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Gerando novo link...' : 'Gerar novo link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
