'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Edit2 } from 'lucide-react'
import { excluirContrato } from '@/lib/actions/contratos'
import { toast } from 'sonner'

export function ContratoActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmar, setConfirmar] = useState(false)
  const router = useRouter()

  function handleExcluir() {
    startTransition(async () => {
      const res = await excluirContrato(id)
      if (res && 'erro' in res) {
        toast.error(res.erro)
        setConfirmar(false)
      } else {
        toast.success('Contrato excluído.')
        router.push('/contratos')
      }
    })
  }

  return (
    <div className="flex gap-3">
      <Link
        href={`/contratos/${id}/editar`}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <Edit2 className="w-4 h-4" />
        Editar
      </Link>

      {!confirmar ? (
        <button
          onClick={() => setConfirmar(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </button>
      ) : (
        <div className="flex-1 flex gap-2">
          <button
            onClick={() => setConfirmar(false)}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExcluir}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Excluindo...' : 'Confirmar'}
          </button>
        </div>
      )}
    </div>
  )
}
