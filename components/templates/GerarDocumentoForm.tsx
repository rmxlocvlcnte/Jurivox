'use client'

import { useState, useTransition } from 'react'
import { gerarDocumentoDeTemplate } from '@/lib/actions/templates'
import { toast } from 'sonner'
import { FileText, Download } from 'lucide-react'

interface Props {
  templateId: string
  variaveis: string[]
  processos: { id: string; numero_cnj: string; cliente: string }[]
  clientes: { id: string; nome: string }[]
}

export function GerarDocumentoForm({ templateId, variaveis, processos, clientes }: Props) {
  const [isPending, startTransition] = useTransition()
  const [valores, setValores] = useState<Record<string, string>>({})
  const [processoId, setProcessoId] = useState('')
  const [clienteId, setClienteId] = useState('')

  // Preenche automaticamente algumas variáveis ao selecionar processo
  function handleProcesso(id: string) {
    setProcessoId(id)
    const proc = processos.find(p => p.id === id)
    if (proc) {
      setValores(prev => ({
        ...prev,
        numero_cnj: proc.numero_cnj,
        nome_cliente: proc.cliente,
      }))
    }
  }

  function handleCliente(id: string) {
    setClienteId(id)
    const cli = clientes.find(c => c.id === id)
    if (cli) {
      setValores(prev => ({ ...prev, nome_cliente: cli.nome }))
    }
  }

  function handleGerar() {
    // data_hoje automática
    const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    const todosValores = { data_hoje: hoje, ...valores }

    startTransition(async () => {
      const res = await gerarDocumentoDeTemplate(
        templateId,
        todosValores,
        processoId || undefined,
        clienteId || undefined,
      )
      if (res && 'erro' in res) {
        toast.error(res.erro)
      } else {
        toast.success('Documento gerado com sucesso!')
      }
    })
  }

  if (variaveis.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm text-slate-500">Este template não possui variáveis.</p>
        <button
          onClick={handleGerar}
          disabled={isPending}
          className="mt-3 w-full py-2 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'Gerando...' : 'Gerar Documento'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Gerar Documento</h3>
      </div>

      {processos.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Vincular processo</label>
          <select
            value={processoId}
            onChange={e => handleProcesso(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-amber-400 bg-white"
          >
            <option value="">Sem processo</option>
            {processos.map(p => (
              <option key={p.id} value={p.id}>{p.numero_cnj} — {p.cliente}</option>
            ))}
          </select>
        </div>
      )}

      {!processoId && clientes.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Vincular cliente</label>
          <select
            value={clienteId}
            onChange={e => handleCliente(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-amber-400 bg-white"
          >
            <option value="">Sem cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {variaveis.filter(v => v !== 'data_hoje').map(v => (
          <div key={v}>
            <label className="text-xs font-medium text-slate-600 block mb-1 font-mono">{'{{'}{v}{'}}'}</label>
            <input
              value={valores[v] ?? ''}
              onChange={e => setValores(prev => ({ ...prev, [v]: e.target.value }))}
              placeholder={v.replace(/_/g, ' ')}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-amber-400"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleGerar}
        disabled={isPending}
        className="w-full py-2 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        {isPending ? 'Gerando...' : 'Gerar Documento'}
      </button>
    </div>
  )
}
