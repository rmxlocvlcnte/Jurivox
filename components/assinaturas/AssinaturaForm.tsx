'use client'

import { useState, useTransition } from 'react'
import { registrarAssinatura, marcarVisualizado } from '@/lib/actions/assinaturas'
import { CheckCircle2, PenLine } from 'lucide-react'
import { useEffect } from 'react'

interface Props {
  hash: string
  nomeDestinatario: string
}

export function AssinaturaForm({ hash, nomeDestinatario }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmado, setConfirmado] = useState(false)
  const [assinado, setAssinado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    // Marca como visualizado quando carrega
    marcarVisualizado(hash)
  }, [hash])

  function handleAssinar() {
    startTransition(async () => {
      const ip = ''
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const res = await registrarAssinatura(hash, ip, ua)
      if (res && 'erro' in res) {
        setErro(res.erro)
      } else {
        setAssinado(true)
      }
    })
  }

  if (assinado) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-emerald-900 text-lg">Documento assinado com sucesso!</h3>
        <p className="text-emerald-700 text-sm mt-1">
          Sua assinatura foi registrada em {new Date().toLocaleString('pt-BR')}.
        </p>
        <p className="text-xs text-emerald-600 mt-2">
          Uma cópia foi enviada ao escritório. Guarde esta página como comprovante.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <PenLine className="w-5 h-5 text-violet-600" />
        <h3 className="font-semibold text-slate-900">Assinar Documento</h3>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{erro}</div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={e => setConfirmado(e.target.checked)}
          className="mt-1 w-4 h-4 accent-amber-500 shrink-0"
        />
        <span className="text-sm text-slate-700">
          Declaro que sou <strong>{nomeDestinatario}</strong>, li integralmente o documento acima e concordo com todos os seus termos e condições. Reconheço que esta assinatura eletrônica tem validade jurídica conforme a{' '}
          <span className="text-amber-600">Lei nº 14.063/2020</span>.
        </span>
      </label>

      <button
        onClick={handleAssinar}
        disabled={!confirmado || isPending}
        className="w-full py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <PenLine className="w-4 h-4" />
        {isPending ? 'Registrando assinatura...' : 'Assinar Documento Digitalmente'}
      </button>

      <p className="text-xs text-center text-slate-400">
        Ao assinar, seu endereço IP e data/hora serão registrados como evidência legal.
      </p>
    </div>
  )
}
