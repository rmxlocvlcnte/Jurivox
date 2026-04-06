'use client'

import { useMemo, useState } from 'react'
import { DollarSign, CheckCircle2, XCircle, AlertCircle, Clock, Search, Download, X } from 'lucide-react'

type Conta = {
  id: string
  descricao: string
  valor: number
  data_emissao: string
  data_vencimento: string
  data_recebimento: string | null
  status: string
  forma_recebimento: string | null
  observacoes: string | null
  criado_em: string
  clientes: { nome: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  aberto: { label: 'Em Aberto', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  recebido: { label: 'Recebido', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  vencido: { label: 'Vencido', cls: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500', icon: XCircle },
}

function formatarMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatarData(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

function exportarCSV(contas: Conta[]) {
  const cabecalho = ['Descrição', 'Cliente', 'Valor', 'Vencimento', 'Recebimento', 'Status', 'Observações']
  const linhas = contas.map(c => [
    c.descricao,
    (c.clientes as any)?.nome ?? '',
    formatarMoeda(c.valor),
    formatarData(c.data_vencimento),
    c.data_recebimento ? formatarData(c.data_recebimento) : '',
    c.status,
    c.observacoes ?? '',
  ])
  const csv = [cabecalho, ...linhas]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contas_receber_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ListaContasReceberFiltrada({
  contas,
  hoje,
  onReceber,
  onCancelar,
}: {
  contas: Conta[]
  hoje: string
  onReceber: (formData: FormData) => void | Promise<void>
  onCancelar: (formData: FormData) => void | Promise<void>
}) {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')

  const resultado = useMemo(() => {
    const lower = busca.toLowerCase()
    return contas.filter(c => {
      const cliente = (c.clientes as any)?.nome ?? ''
      const matchBusca = !busca ||
        c.descricao.toLowerCase().includes(lower) ||
        cliente.toLowerCase().includes(lower) ||
        (c.observacoes ?? '').toLowerCase().includes(lower)
      const matchStatus = !status || c.status === status
      return matchBusca && matchStatus
    })
  }, [contas, busca, status])

  const temFiltro = busca || status

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por descrição, cliente ou observações..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Todos os status</option>
            <option value="aberto">Em aberto</option>
            <option value="vencido">Vencido</option>
            <option value="recebido">Recebido</option>
            <option value="cancelado">Cancelado</option>
          </select>
          {temFiltro && (
            <button
              onClick={() => { setBusca(''); setStatus('') }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" /> Limpar
            </button>
          )}
          <button
            onClick={() => exportarCSV(resultado)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {resultado.length} de {contas.length} cobrança{contas.length !== 1 ? 's' : ''}
          {temFiltro && ' (filtrado)'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            Cobranças
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {!resultado.length ? (
            <div className="px-5 py-10 text-center">
              <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhuma cobrança encontrada.</p>
            </div>
          ) : (
            resultado.map((c) => {
              const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.aberto
              const Icon = cfg.icon
              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{c.descricao}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${cfg.cls}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(c.clientes as any)?.nome && `${(c.clientes as any).nome} · `}
                        Vence: {formatarData(c.data_vencimento)}
                        {c.data_recebimento && ` · Recebido: ${formatarData(c.data_recebimento)}`}
                      </p>
                      {c.observacoes && <p className="text-xs text-slate-400 mt-0.5">{c.observacoes}</p>}
                    </div>
                    <p className="text-base font-bold text-slate-900 shrink-0">{formatarMoeda(c.valor)}</p>
                  </div>

                  {(c.status === 'aberto' || c.status === 'vencido') && (
                    <div className="flex gap-2 mt-3">
                      <form action={onReceber} className="flex-1">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="data_recebimento" value={hoje} />
                        <input type="hidden" name="forma_recebimento" value="pix" />
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Marcar recebido
                        </button>
                      </form>
                      <form action={onCancelar}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
