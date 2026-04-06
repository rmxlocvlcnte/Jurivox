'use client'

import { useRef, useTransition, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { criarHonorario } from '@/lib/actions/financeiro'

export function HonorarioForm({ processos }: { processos: { id: string; numero_cnj: string }[] }) {
  const [pendente, startTransition] = useTransition()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await criarHonorario(formData)
      if (res && 'erro' in res) {
        toast.error(res.erro)
        return
      }
      toast.success('Honorário cadastrado com sucesso.')
      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Processo *</label>
        <select
          name="processo_id"
          required
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="">Selecionar...</option>
          {processos?.map(p => <option key={p.id} value={p.id}>{p.numero_cnj}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tipo *</label>
        <select
          name="tipo"
          required
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          <option value="pro_labore">Pró-labore</option>
          <option value="exito">Êxito</option>
          <option value="parcelado">Parcelado</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Valor total (R$) *</label>
        <input
          name="valor_total"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0,00"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Parcelas</label>
        <div className="flex gap-2">
          <input
            name="numero_parcelas"
            type="number"
            min="1"
            defaultValue="1"
            className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={pendente}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-60"
          >
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </form>
  )
}
