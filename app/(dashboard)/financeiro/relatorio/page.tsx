import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { RelatorioPrintButton } from '@/components/financeiro/RelatorioPrintButton'

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>
}) {
  const { de, ate } = await searchParams
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  const dataDe = de ?? inicioMes
  const dataAte = ate ?? fimMes

  const [{ data: movs }, { data: pagamentos }] = await Promise.all([
    supabase
      .from('movimentacoes_financeiras')
      .select('id, tipo, categoria, descricao, valor, data')
      .eq('escritorio_id', escritorioId)
      .gte('data', dataDe)
      .lte('data', dataAte)
      .order('data', { ascending: false }),

    supabase
      .from('pagamentos_honorarios')
      .select('id, valor, data_pagamento, forma_pagamento, honorarios(id, processos(numero_cnj), clientes(nome))')
      .eq('escritorio_id', escritorioId)
      .gte('data_pagamento', dataDe)
      .lte('data_pagamento', dataAte)
      .order('data_pagamento', { ascending: false }),
  ])

  const entradas = movs?.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + (m.valor ?? 0), 0) ?? 0
  const saidas = movs?.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (m.valor ?? 0), 0) ?? 0
  const totalPagamentos = pagamentos?.reduce((acc, p) => acc + (p.valor ?? 0), 0) ?? 0
  const saldo = entradas - saidas

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/financeiro" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Relatório Financeiro</h1>
            <p className="text-slate-500 text-sm">Período: {formatarData(dataDe)} → {formatarData(dataAte)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/financeiro/relatorio?de=${dataDe}&ate=${dataAte}`}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Baixar CSV
          </a>
          <RelatorioPrintButton />
        </div>
      </div>

      {/* Filtro de datas */}
      <form method="GET" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">De</label>
          <input
            name="de"
            type="date"
            defaultValue={dataDe}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Até</label>
          <input
            name="ate"
            type="date"
            defaultValue={dataAte}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
          >
            Atualizar
          </button>
        </div>
      </form>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Entradas</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatarMoeda(entradas)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Saídas</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatarMoeda(saidas)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Saldo</p>
          <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatarMoeda(saldo)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Pagamentos de Honorários</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatarMoeda(totalPagamentos)}</p>
        </div>
      </div>

      {/* Movimentações */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Movimentações</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {!movs?.length ? (
            <div className="px-5 py-6 text-center text-slate-400 text-sm">Nenhuma movimentação no período.</div>
          ) : (
            movs.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.descricao}</p>
                  <p className="text-xs text-slate-400">{m.categoria ?? 'Sem categoria'} · {formatarData(m.data)}</p>
                </div>
                <span className={`text-sm font-bold ${m.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                  {m.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(m.valor)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagamentos de honorários */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Pagamentos de Honorários</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {!pagamentos?.length ? (
            <div className="px-5 py-6 text-center text-slate-400 text-sm">Nenhum pagamento no período.</div>
          ) : (
            pagamentos.map(p => {
              const honorario = p.honorarios as any
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {(honorario?.clientes as any)?.nome ?? 'Cliente'} · {(honorario?.processos as any)?.numero_cnj ?? 'Sem processo'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatarData(p.data_pagamento)} · {p.forma_pagamento ?? '—'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-green-700">+{formatarMoeda(p.valor)}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
