'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { importarOFX } from '@/lib/actions/ofx'
import { Upload, Loader2, CheckCircle2 } from 'lucide-react'

export function ImportarOFXForm() {
  const [pending, startTransition] = useTransition()
  const [resultado, setResultado] = useState<{ importados: number } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await importarOFX(fd)
      if (res?.erro) {
        toast.error(res.erro)
      } else if (res?.sucesso) {
        setResultado({ importados: res.importados ?? 0 })
        toast.success(`${res.importados} transações importadas!`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Arquivo OFX</label>
        <input
          type="file"
          name="arquivo"
          accept=".ofx,.OFX"
          required
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
        />
      </div>

      {resultado && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">{resultado.importados} transações importadas com sucesso.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {pending ? 'Importando...' : 'Importar extrato'}
      </button>
    </form>
  )
}
