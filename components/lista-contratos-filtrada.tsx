'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, ChevronRight, Search, Download, X, CheckCircle, PauseCircle } from 'lucide-react'

type Contrato = {
  id: string
  nome: string
  tipo: string
  status: string
  valor_fixo: number | null
  valor_hora: number | null
  percentual_exito: number | null
  criado_em: string
  clientes: { nome: string } | null
  processos: { numero_cnj: string } | null
  membros_escritorio: { nome: string } | null
}

const TIPO_LABEL: Record<string, string> = {
  fixo: 'Fixo',
  hora: 'Por Hora',
  por_hora: 'Por Hora',
  exito: 'Êxito',
  misto: 'Misto',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  ativo: { label: 'Ativo', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  suspenso: { label: 'Suspenso', cls: 'bg-amber-100 text-amber-700', icon: PauseCircle },
  encerrado: { label: 'Encerrado', cls: 'bg-slate-100 text-slate-600', icon: CheckCircle },
}

function formatarMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function exportarCSV(contratos: Contrato[]) {
  const cabecalho = ['Nome', 'Tipo', 'Status', 'Valor', 'Cliente', 'Processo', 'Responsável', 'Criado em']
  const linhas = contratos.map(c => {
    const valor = c.tipo === 'fixo' ? (c.valor_fixo ?? '')
      : c.tipo === 'hora' ? (c.valor_hora ?? '')
      : c.tipo === 'exito' ? (c.percentual_exito ? `${c.percentual_exito}%` : '')
      : ''
    return [
      c.nome,
      TIPO_LABEL[c.tipo] ?? c.tipo,
      c.status,
      typeof valor === 'number' ? formatarMoeda(valor) : valor,
      (c.clientes as any)?.nome ?? '',
      (c.processos as any)?.numero_cnj ?? '',
      (c.membros_escritorio as any)?.nome ?? '',
      new Date(c.criado_em).toLocaleDateString('pt-BR'),
    ]
  })

  const csv = [cabecalho, ...linhas]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contratos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ListaContratosFiltrada({ contratos }: { contratos: Contrato[] }) {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')

  const resultado = useMemo(() => {
    const lower = busca.toLowerCase()
    return contratos.filter(c => {
      const cliente = (c.clientes as any)?.nome ?? ''
      const processo = (c.processos as any)?.numero_cnj ?? ''
      const responsavel = (c.membros_escritorio as any)?.nome ?? ''
      const matchBusca = !busca ||
        c.nome.toLowerCase().includes(lower) ||
        cliente.toLowerCase().includes(lower) ||
        processo.toLowerCase().includes(lower) ||
        responsavel.toLowerCase().includes(lower)
      const matchStatus = !status || c.status === status
      const matchTipo = !tipo || c.tipo === tipo
      return matchBusca && matchStatus && matchTipo
    })
  }, [contratos, busca, status, tipo])

  const temFiltro = busca || status || tipo

  function limpar() {
    setBusca('')
    setStatus('')
    setTipo('')
  }

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
              placeholder="Buscar por nome, cliente, processo ou responsável..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="encerrado">Encerrado</option>
          </select>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {temFiltro && (
            <button
              onClick={limpar}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" /> Limpar
            </button>
          )}
          <button
            onClick={() => exportarCSV(resultado)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {resultado.length} de {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
          {temFiltro && ' (filtrado)'}
        </p>
      </div>

      {resultado.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhum contrato encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="divide-y divide-slate-100">
            {resultado.map((c) => {
              const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.ativo
              const StatusIcon = cfg.icon
              const valor = c.tipo === 'fixo' ? (c.valor_fixo ? formatarMoeda(c.valor_fixo) : '—')
                : c.tipo === 'hora' ? (c.valor_hora ? `${formatarMoeda(c.valor_hora)}/h` : '—')
                : c.tipo === 'exito' ? (c.percentual_exito ? `${c.percentual_exito}%` : '—')
                : '—'

              return (
                <Link
                  key={c.id}
                  href={`/contratos/${c.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.nome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(c.clientes as any)?.nome ?? 'Sem cliente'}
                      {(c.processos as any)?.numero_cnj && (
                        <span className="font-mono"> · {(c.processos as any).numero_cnj}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-800">{valor}</p>
                      <p className="text-xs text-slate-400">{TIPO_LABEL[c.tipo] ?? c.tipo}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${cfg.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
