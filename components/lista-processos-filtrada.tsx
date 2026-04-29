'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FolderOpen, ChevronRight, Search, Download, X } from 'lucide-react'

const COR_STATUS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  arquivado: 'bg-slate-100 text-slate-600',
  encerrado: 'bg-red-100 text-red-700',
}

const LABEL_AREA: Record<string, string> = {
  civil: 'Cível',
  criminal: 'Criminal',
  trabalhista: 'Trabalhista',
  previdenciario: 'Previdenciário',
  tributario: 'Tributário',
  outro: 'Outro',
}

type Processo = {
  id: string
  numero_cnj: string
  tribunal: string
  vara?: string
  area_juridica: string
  status: string
  criado_em: string
  responsavel_id?: string | null
  clientes: { nome: string } | null
  membros_escritorio?: { id: string; nome: string } | null
}

type Membro = { id: string; nome: string }

function exportarCSV(processos: Processo[]) {
  const cabecalho = ['Número CNJ', 'Tribunal', 'Vara', 'Área', 'Status', 'Cliente', 'Cadastrado em']
  const linhas = processos.map(p => [
    p.numero_cnj,
    p.tribunal,
    p.vara ?? '',
    LABEL_AREA[p.area_juridica] ?? p.area_juridica,
    p.status,
    (p.clientes as any)?.nome ?? '',
    new Date(p.criado_em).toLocaleDateString('pt-BR'),
  ])

  const csv = [cabecalho, ...linhas]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `processos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ListaProcessosFiltrada({
  processos,
  membros = [],
}: {
  processos: Processo[]
  membros?: Membro[]
}) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [filtroResponsavel, setFiltroResponsavel] = useState('')

  const resultado = useMemo(() => {
    return processos.filter(p => {
      const cliente = (p.clientes as any)?.nome ?? ''
      const textoLower = busca.toLowerCase()
      const matchBusca = !busca ||
        p.numero_cnj.toLowerCase().includes(textoLower) ||
        p.tribunal.toLowerCase().includes(textoLower) ||
        cliente.toLowerCase().includes(textoLower) ||
        (p.vara ?? '').toLowerCase().includes(textoLower)
      const matchStatus = !filtroStatus || p.status === filtroStatus
      const matchArea = !filtroArea || p.area_juridica === filtroArea
      const matchResponsavel = !filtroResponsavel || p.responsavel_id === filtroResponsavel
      return matchBusca && matchStatus && matchArea && matchResponsavel
    })
  }, [processos, busca, filtroStatus, filtroArea, filtroResponsavel])

  const temFiltro = busca || filtroStatus || filtroArea || filtroResponsavel

  function limparFiltros() {
    setBusca('')
    setFiltroStatus('')
    setFiltroArea('')
    setFiltroResponsavel('')
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por CNJ, tribunal, vara ou cliente..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Filtro status */}
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="arquivado">Arquivado</option>
            <option value="encerrado">Encerrado</option>
          </select>

          {/* Filtro área */}
          <select
            value={filtroArea}
            onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Todas as áreas</option>
            {Object.entries(LABEL_AREA).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Filtro responsável */}
          {membros.length > 0 && (
            <select
              value={filtroResponsavel}
              onChange={e => setFiltroResponsavel(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              <option value="">Todos os responsáveis</option>
              {membros.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          )}

          {/* Limpar filtros */}
          {temFiltro && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <X className="w-4 h-4" /> Limpar
            </button>
          )}

          {/* Exportar CSV */}
          <button
            onClick={() => exportarCSV(resultado)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Exportar para CSV"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>

        {/* Contador */}
        <p className="text-xs text-slate-400 mt-2">
          {resultado.length} de {processos.length} processo{processos.length !== 1 ? 's' : ''}
          {temFiltro && ' (filtrado)'}
        </p>
      </div>

      {/* Lista */}
      {resultado.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum processo encontrado</p>
          {temFiltro && (
            <button onClick={limparFiltros} className="mt-2 text-sm text-amber-600 hover:text-amber-700">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {resultado.map(p => {
              const cliente = (p.clientes as any)?.nome
              return (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="bg-slate-100 p-2 rounded-lg shrink-0">
                    <FolderOpen className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-mono font-medium text-slate-900">{p.numero_cnj}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {LABEL_AREA[p.area_juridica] ?? p.area_juridica}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {cliente ?? 'Sem cliente'} · {p.tribunal}{p.vara ? ` — ${p.vara}` : ''}
                    </p>
                    {(p.membros_escritorio as any)?.nome && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Resp.: {(p.membros_escritorio as any).nome}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
