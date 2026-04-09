'use client'

import { useState } from 'react'
import { HardDrive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function BackupButton() {
  const [loading, setLoading] = useState(false)

  async function handleBackup() {
    setLoading(true)
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.erro ?? 'Erro ao gerar backup.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jurivox-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup baixado com sucesso!')
    } catch {
      toast.error('Erro ao conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBackup}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <HardDrive className="w-4 h-4 text-slate-500" />}
      {loading ? 'Gerando backup...' : 'Baixar Backup'}
    </button>
  )
}
