'use client'

import { useEffect, useState, useTransition } from 'react'
import { CheckCircle2, PenLine, XCircle } from 'lucide-react'

interface Props {
  hash: string
  nomeDestinatario: string
}

type Estado = 'pendente' | 'assinado' | 'recusado'

export function AssinaturaForm({ hash, nomeDestinatario }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmado, setConfirmado] = useState(false)
  const [estado, setEstado] = useState<Estado>('pendente')
  const [mostrarRecusa, setMostrarRecusa] = useState(false)
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/assinaturas/public/${hash}/visualizar`, { method: 'POST' }).catch(() => {})
  }, [hash])

  function handleAssinar() {
    startTransition(async () => {
      setErro(null)
      const res = await fetch(`/api/assinaturas/public/${hash}/assinar`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data?.erro ?? 'Nao foi possivel registrar a assinatura.')
        return
      }
      setEstado('assinado')
    })
  }

  function handleRecusar() {
    startTransition(async () => {
      setErro(null)
      const res = await fetch(`/api/assinaturas/public/${hash}/recusar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoRecusa || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(data?.erro ?? 'Nao foi possivel registrar a recusa.')
        return
      }
      setEstado('recusado')
    })
  }

  if (estado === 'assinado') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
        <h3 className="text-lg font-bold text-emerald-900">Documento assinado com sucesso</h3>
        <p className="mt-1 text-sm text-emerald-700">
          Sua assinatura foi registrada em {new Date().toLocaleString('pt-BR')}.
        </p>
        <p className="mt-2 text-xs text-emerald-700">
          O endereco IP e o agente do navegador foram registrados para trilha probatoria.
        </p>
      </div>
    )
  }

  if (estado === 'recusado') {
    return (
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-6 text-center">
        <XCircle className="mx-auto mb-3 h-12 w-12 text-slate-600" />
        <h3 className="text-lg font-bold text-slate-900">Recusa registrada</h3>
        <p className="mt-1 text-sm text-slate-700">
          A recusa foi registrada em {new Date().toLocaleString('pt-BR')}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <PenLine className="h-5 w-5 text-violet-600" />
        <h3 className="font-semibold text-slate-900">Assinar documento</h3>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</div>
      )}

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-amber-500"
        />
        <span className="text-sm text-slate-700">
          Declaro que sou <strong>{nomeDestinatario}</strong>, li integralmente o documento e concordo com os
          termos. Esta assinatura eletronica possui validade juridica conforme a Lei no 14.063/2020.
        </span>
      </label>

      <button
        onClick={handleAssinar}
        disabled={!confirmado || isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PenLine className="h-4 w-4" />
        {isPending ? 'Registrando assinatura...' : 'Assinar digitalmente'}
      </button>

      {!mostrarRecusa ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => setMostrarRecusa(true)}
          className="w-full rounded-lg border border-slate-300 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Nao concordo com o documento
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="block text-xs font-medium text-slate-600">Motivo da recusa (opcional)</label>
          <textarea
            value={motivoRecusa}
            onChange={(e) => setMotivoRecusa(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Descreva brevemente o motivo"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecusar}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Confirmar recusa
            </button>
            <button
              type="button"
              onClick={() => setMostrarRecusa(false)}
              disabled={isPending}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-white disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Ao assinar ou recusar, IP, data/hora e user-agent sao registrados como evidencia.
      </p>
    </div>
  )
}
