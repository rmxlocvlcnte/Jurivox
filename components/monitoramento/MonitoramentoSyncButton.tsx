'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

interface SyncResult {
  totalNovas: number
  totalPrazosAutomaticos?: number
  sucesso: number
  erros: number
  total: number
}

export function MonitoramentoSyncButton({ escritorioId }: { escritorioId?: string }) {
  const [pendente, startTransition] = useTransition()
  const [resultado, setResultado] = useState<SyncResult | null>(null)

  function handleSync() {
    startTransition(async () => {
      const res = await fetch('/api/monitoramento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escritorioId ? { escritorio_id: escritorioId } : {}),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.erro ?? 'Erro ao sincronizar monitoramento.')
        return
      }

      setResultado(data)
      if ((data.totalNovas ?? 0) > 0) {
        const prazos = data.totalPrazosAutomaticos ?? 0
        if (prazos > 0) {
          toast.success(`${data.totalNovas} movimentacoes e ${prazos} prazos automaticos criados.`)
        } else {
          toast.success(`${data.totalNovas} novas movimentacoes encontradas.`)
        }
      } else {
        toast.success('Sincronizacao concluida. Sem novas movimentacoes.')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={pendente}
        className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${pendente ? 'animate-spin' : ''}`} />
        {pendente ? 'Sincronizando...' : 'Sincronizar com DataJud'}
      </button>

      {resultado && (
        <span className="text-sm text-purple-700">
          {resultado.totalNovas} nova(s)
          {typeof resultado.totalPrazosAutomaticos === 'number' ? ` · ${resultado.totalPrazosAutomaticos} prazo(s) auto` : ''}
          {' · '}
          {resultado.sucesso}/{resultado.total} processos ok
        </span>
      )}
    </div>
  )
}
