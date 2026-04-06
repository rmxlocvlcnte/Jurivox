'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Trash2 } from 'lucide-react'
import { excluirTemplate } from '@/lib/actions/templates'
import { toast } from 'sonner'

export function TemplateActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const [confirmar, setConfirmar] = useState(false)
  const router = useRouter()

  function handleExcluir() {
    startTransition(async () => {
      const res = await excluirTemplate(id)
      if (res && 'erro' in res) {
        toast.error(res.erro)
        setConfirmar(false)
      } else {
        toast.success('Template excluído.')
        router.push('/templates')
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Link
        href={`/templates/${id}/editar`}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <Edit2 className="w-4 h-4" />
        Editar
      </Link>
      {!confirmar ? (
        <button
          onClick={() => setConfirmar(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex gap-1">
          <button
            onClick={() => setConfirmar(false)}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Não
          </button>
          <button
            onClick={handleExcluir}
            disabled={isPending}
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : 'Excluir'}
          </button>
        </div>
      )}
    </div>
  )
}
