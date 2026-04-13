'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyPixButton({ payload }: { payload: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(payload)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // fallback para navegadores antigos
      const el = document.createElement('textarea')
      el.value = payload
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  return (
    <button
      onClick={copiar}
      title={copiado ? 'Copiado!' : 'Copiar código Pix'}
      className={`shrink-0 p-2 rounded-lg border transition-colors ${
        copiado
          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
          : 'border-slate-200 bg-white text-slate-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
      }`}
    >
      {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}
