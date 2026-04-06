'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

interface SyncResult {
  totalNovas: number
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
      if (data.totalNovas > 0) {
        toast.success(`${data.totalNovas} novas movimentações encontradas!`)
      } else {
        toast.success('Sincronização concluída. Sem novas movimentações.')
      }
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={handleSync}
        disabled={pendente}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${pendente ? 'animate-spin' : ''}`} />
        {pendente ? 'Sincronizando...' : 'Sincronizar com DataJud'}
      </button>
      {resultado && (
        <span className="text-sm text-purple-700">
          {resultado.totalNovas} nova(s) · {resultado.sucesso}/{resultado.total} processos ok
        </span>
      )}
    </div>
  )
}
