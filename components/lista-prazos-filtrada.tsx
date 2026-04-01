'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, Circle, Search, X, Download } from 'lucide-react'

type Prazo = {
  id: string
  descricao: string
  data_vencimento: string
  data_inicio: string
  quantidade_dias: number
  dias_uteis: boolean
  concluido: boolean
  concluido_em: string | null
  processos: { id: string; numero_cnj: string; clientes: { nome: string } | null } | null
}

function diasRestantes(dataVencimento: string): number {
  const hoje = new Date()
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

function corBadge(dias: number, concluido: boolean) {
  if (concluido) return 'bg-green-100 text-green-700'
  if (dias < 0 || dias === 0) return 'bg-red-100 text-red-700'
  if (dias <= 3) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function textoBadge(dias: number, concluido: boolean) {
  if (concluido) return 'Concluído'
  if (dias < 0) return `Vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence HOJE'
  if (dias === 1) return '1 dia restante'
  return `${dias} dias`
}

function exportarCSV(prazos: Prazo[]) {
  const cab = ['Descrição', 'Processo', 'Cliente', 'Vencimento', 'Dias', 'Status']
  const linhas = prazos.map(p => {
    const processo = p.processos as any
    const cliente = processo?.clientes as any
    const dias = diasRestantes(p.data_vencimento)
    return [
      p.descricao,
      processo?.numero_cnj ?? '',
      cliente?.nome ?? '',
      formatarData(p.data_vencimento),
      `${p.quantidade_dias} dias ${p.dias_uteis ? 'úteis' : 'corridos'}`,
      textoBadge(dias, p.concluido),
    ]
  })
  const csv = [cab, ...linhas]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `prazos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ListaPrazosFiltrada({
  prazos,
  acoesConcluir,
  acoesReabrir,
}: {
  prazos: Prazo[]
  acoesConcluir: React.ReactNode
  acoesReabrir: React.ReactNode
}) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'concluido' | 'vencido'>('todos')

  const resultado = useMemo(() => {
    return prazos.filter(p => {
      const processo = (p.processos as any)
      const cliente = processo?.clientes as any
      const lower = busca.toLowerCase()
      const matchBusca = !busca ||
        p.descricao.toLowerCase().includes(lower) ||
        (processo?.numero_cnj ?? '').toLowerCase().includes(lower) ||
        (cliente?.nome ?? '').toLowerCase().includes(lower)

      const dias = diasRestantes(p.data_vencimento)
      const matchStatus =
        filtroStatus === 'todos' ? true :
        filtroStatus === 'concluido' ? p.concluido :
        filtroStatus === 'vencido' ? !p.concluido && dias < 0 :
        filtroStatus === 'pendente' ? !p.concluido && dias >= 0 : true

      return matchBusca && matchStatus
    })
  }, [prazos, busca, filtroStatus])

  const temFiltro = busca || filtroStatus !== 'todos'

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por descrição, CNJ ou cliente..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value as any)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="vencido">Vencidos</option>
            <option value="concluido">Concluídos</option>
          </select>

          {temFiltro && (
            <button
              onClick={() => { setBusca(''); setFiltroStatus('todos') }}
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
          {resultado.length} de {prazos.length} prazo{prazos.length !== 1 ? 's' : ''}
          {temFiltro && ' (filtrado)'}
        </p>
      </div>

      {/* Lista */}
      {resultado.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500 font-medium">Nenhum prazo encontrado</p>
          {temFiltro && (
            <button
              onClick={() => { setBusca(''); setFiltroStatus('todos') }}
              className="mt-2 text-sm text-amber-600 hover:text-amber-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {resultado.map(p => {
              const processo = p.processos as any
              const cliente = processo?.clientes as any
              const dias = diasRestantes(p.data_vencimento)

              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                  {p.concluido
                    ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    : dias < 0 || dias === 0
                    ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    : <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  }

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/prazos/${p.id}`}
                      className={`text-sm font-medium hover:text-amber-600 transition-colors ${p.concluido ? 'line-through text-slate-400' : 'text-slate-900'}`}
                    >
                      {p.descricao}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                      {processo && (
                        <Link href={`/processos/${processo.id}`} className="hover:text-amber-600 font-mono">
                          {processo.numero_cnj}
                        </Link>
                      )}
                      {cliente?.nome && <span>· {cliente.nome}</span>}
                      <span>· {p.quantidade_dias}d {p.dias_uteis ? 'úteis' : 'corridos'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${corBadge(dias, p.concluido)}`}>
                        {textoBadge(dias, p.concluido)}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{formatarData(p.data_vencimento)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
