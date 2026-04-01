'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, ChevronRight, Search, Download, Phone, Mail, X } from 'lucide-react'

type Cliente = {
  id: string
  nome: string
  cpf?: string | null
  email?: string | null
  telefone?: string | null
  criado_em: string
}

function exportarCSV(clientes: Cliente[]) {
  const cabecalho = ['Nome', 'CPF', 'E-mail', 'Telefone', 'Cadastrado em']
  const linhas = clientes.map(c => [
    c.nome,
    c.cpf ?? '',
    c.email ?? '',
    c.telefone ?? '',
    new Date(c.criado_em).toLocaleDateString('pt-BR'),
  ])

  const csv = [cabecalho, ...linhas]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ListaClientesFiltrada({ clientes }: { clientes: Cliente[] }) {
  const [busca, setBusca] = useState('')

  const resultado = useMemo(() => {
    if (!busca) return clientes
    const lower = busca.toLowerCase()
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(lower) ||
      (c.email ?? '').toLowerCase().includes(lower) ||
      (c.cpf ?? '').replace(/\D/g, '').includes(busca.replace(/\D/g, '')) ||
      (c.telefone ?? '').replace(/\D/g, '').includes(busca.replace(/\D/g, ''))
    )
  }, [clientes, busca])

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
              placeholder="Buscar por nome, CPF, e-mail ou telefone..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {busca && (
            <button
              onClick={() => setBusca('')}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" /> Limpar
            </button>
          )}

          <button
            onClick={() => exportarCSV(resultado)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            title="Exportar para CSV"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          {resultado.length} de {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          {busca && ' (filtrado)'}
        </p>
      </div>

      {/* Lista */}
      {resultado.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum cliente encontrado</p>
          {busca && (
            <button onClick={() => setBusca('')} className="mt-2 text-sm text-amber-600 hover:text-amber-700">
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {resultado.map(c => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-bold text-sm">
                    {c.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.nome}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                    {c.cpf && <span>CPF: {c.cpf}</span>}
                    {c.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.telefone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
