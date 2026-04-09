'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Upload, Loader2, CheckCircle2 } from 'lucide-react'

export function RestaurarBackupForm() {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [resultado, setResultado] = useState<Record<string, number> | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arquivo) return

    startTransition(async () => {
      try {
        const texto = await arquivo.text()
        const backup = JSON.parse(texto)

        const res = await fetch('/api/backup/importar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backup),
        })

        const data = await res.json()
        if (!res.ok) {
          toast.error(data.erro ?? 'Erro ao restaurar backup')
          return
        }

        setResultado(data.resumo)
        toast.success('Backup restaurado com sucesso!')
      } catch {
        toast.error('Arquivo inválido ou corrompido.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Arquivo de backup (.json)</label>
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
        />
        {arquivo && (
          <p className="text-xs text-slate-500 mt-1">{arquivo.name} — {(arquivo.size / 1024).toFixed(1)} KB</p>
        )}
      </div>

      {resultado && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">Restauração concluída</span>
          </div>
          <ul className="text-xs text-emerald-800 space-y-0.5">
            {Object.entries(resultado).map(([k, v]) => (
              <li key={k}>{k}: {v} registros restaurados</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={!arquivo || pending}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {pending ? 'Restaurando...' : 'Restaurar backup'}
      </button>
    </form>
  )
}
