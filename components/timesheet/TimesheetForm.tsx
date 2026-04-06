'use client'

import { useRef, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { criarLancamento } from '@/lib/actions/timesheet'

export function TimesheetForm({
  contratos,
  processos,
}: {
  contratos: { id: string; nome: string }[]
  processos: { id: string; numero_cnj: string }[]
}) {
  const [pendente, startTransition] = useTransition()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await criarLancamento(formData)
      if (res && 'erro' in res) {
        toast.error(res.erro)
        return
      }
      toast.success('Lançamento registrado.')
      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Data *</label>
          <input
            name="data"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Horas *</label>
          <input
            name="horas"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            required
            placeholder="1.0"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Descrição *</label>
        <textarea
          name="descricao"
          required
          rows={3}
          placeholder="O que foi feito..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
        <select
          name="tipo"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="produtivo">Produtivo</option>
          <option value="nao_produtivo">Não Produtivo</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Contrato</label>
        <select
          name="contrato_id"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="">Nenhum</option>
          {contratos?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Processo</label>
        <select
          name="processo_id"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="">Nenhum</option>
          {processos?.map(p => <option key={p.id} value={p.id}>{p.numero_cnj}</option>)}
        </select>
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60"
      >
        {pendente ? 'Registrando...' : 'Registrar horas'}
      </button>
    </form>
  )
}
