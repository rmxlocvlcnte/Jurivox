'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { atualizarEscritorio } from '@/lib/actions/escritorio'
import { Save, Loader2 } from 'lucide-react'

type Escritorio = {
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
}

export function EscritorioForm({ escritorio }: { escritorio: Escritorio }) {
  const [pending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await atualizarEscritorio(fd)
      if (res?.erro) {
        toast.error(res.erro)
      } else {
        toast.success('Configurações salvas com sucesso!')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Escritório *</label>
        <input
          name="nome"
          defaultValue={escritorio.nome}
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          placeholder="Ex: Advocacia Silva & Associados"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
        <input
          name="cnpj"
          defaultValue={escritorio.cnpj ?? ''}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          placeholder="00.000.000/0001-00"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
        <input
          name="email"
          type="email"
          defaultValue={escritorio.email ?? ''}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          placeholder="contato@escritorio.com.br"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
        <input
          name="telefone"
          defaultValue={escritorio.telefone ?? ''}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          placeholder="(11) 99999-9999"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {pending ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  )
}
