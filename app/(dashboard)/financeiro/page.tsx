// -----------------------------------------------
// FINANCEIRO — Honorários, pagamentos e fluxo de caixa
// -----------------------------------------------
// Mostra:
// - Resumo financeiro (entradas, saídas, saldo)
// - Lista de honorários por processo
// - Histórico de movimentações financeiras
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { criarMovimentacaoFinanceira } from '@/lib/actions/financeiro'
import {
  DollarSign, TrendingUp, TrendingDown, Plus,
  ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react'

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

const CATEGORIAS_ENTRADA = ['Honorários', 'Êxito', 'Consultoria', 'Outro']
const CATEGORIAS_SAIDA = ['Custas judiciais', 'Cópias', 'Diligências', 'Salários', 'Aluguel', 'Outro']

export default async function FinanceiroPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  // Busca movimentações financeiras e honorários em paralelo
  const [
    { data: movimentacoes },
    { data: honorarios },
  ] = await Promise.all([
    supabase
      .from('movimentacoes_financeiras')
      .select('*')
      .eq('escritorio_id', escritorioId)
      .order('data', { ascending: false })
      .limit(50),

    supabase
      .from('honorarios')
      .select(`
        id, tipo, valor_total, numero_parcelas, status, descricao, criado_em,
        processos(numero_cnj, clientes(nome)),
        pagamentos_honorarios(valor, data_pagamento)
      `)
      .eq('escritorio_id', escritorioId)
      .order('criado_em', { ascending: false }),
  ])

  // Calcula totais do mês atual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const entradas = movimentacoes
    ?.filter(m => m.tipo === 'entrada' && new Date(m.data) >= inicioMes)
    .reduce((acc, m) => acc + (m.valor ?? 0), 0) ?? 0

  const saidas = movimentacoes
    ?.filter(m => m.tipo === 'saida' && new Date(m.data) >= inicioMes)
    .reduce((acc, m) => acc + (m.valor ?? 0), 0) ?? 0

  // Total recebido de honorários
  const totalHonorarios = honorarios?.reduce((acc, h) => {
    const pagamentos = (h.pagamentos_honorarios as any[])?.reduce((s: number, p: any) => s + (p.valor ?? 0), 0) ?? 0
    return acc + pagamentos
  }, 0) ?? 0

  // Server action para nova movimentação
  async function novaMovimentacao(formData: FormData) {
    'use server'
    await criarMovimentacaoFinanceira(formData)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">Controle de honorários e fluxo de caixa</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Entradas este mês</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{formatarMoeda(entradas)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Saídas este mês</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{formatarMoeda(saidas)}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className={`rounded-xl border shadow-sm p-5 ${entradas - saidas >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Saldo do Mês</p>
              <p className={`text-2xl font-bold mt-1 ${entradas - saidas >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {formatarMoeda(entradas - saidas)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${entradas - saidas >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${entradas - saidas >= 0 ? 'text-green-700' : 'text-red-700'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Registrar nova movimentação */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Movimentação
          </h2>
          <form action={novaMovimentacao} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select
                  name="tipo"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$)</label>
                <input
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
              <input
                name="categoria"
                type="text"
                placeholder="Ex: Honorários, Custas judiciais..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                list="categorias"
              />
              <datalist id="categorias">
                {[...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA].map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
              <input
                name="descricao"
                type="text"
                required
                placeholder="Descrição da movimentação"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
              <input
                name="data"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Registrar
            </button>
          </form>
        </div>

        {/* Histórico de movimentações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Movimentações Recentes</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {!movimentacoes?.length ? (
              <div className="px-5 py-6 text-center text-slate-400 text-sm">
                Nenhuma movimentação registrada.
              </div>
            ) : (
              movimentacoes.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  {m.tipo === 'entrada'
                    ? <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0" />
                    : <ArrowDownCircle className="w-5 h-5 text-red-500 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.descricao}</p>
                    <p className="text-xs text-slate-400">{m.categoria} · {formatarData(m.data)}</p>
                  </div>
                  <span className={`text-sm font-bold ${m.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                    {m.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(m.valor)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Honorários por processo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Honorários por Processo</h2>
          <p className="text-sm text-green-700 font-semibold">{formatarMoeda(totalHonorarios)} recebido no total</p>
        </div>
        <div className="divide-y divide-slate-100">
          {!honorarios?.length ? (
            <div className="px-5 py-6 text-center text-slate-400 text-sm">
              Nenhum contrato de honorários cadastrado.
              <p className="mt-1 text-xs">Cadastre honorários na tela de cada processo.</p>
            </div>
          ) : (
            honorarios.map((h) => {
              const processo = h.processos as any
              const pagamentos = (h.pagamentos_honorarios as any[]) ?? []
              const totalPago = pagamentos.reduce((acc, p) => acc + (p.valor ?? 0), 0)
              const percPago = h.valor_total > 0 ? (totalPago / h.valor_total) * 100 : 0

              return (
                <div key={h.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {processo?.clientes?.nome ?? 'Sem cliente'}
                      </p>
                      <p className="text-xs font-mono text-slate-400">{processo?.numero_cnj}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {h.tipo === 'exito' ? 'Êxito' : h.tipo === 'pro_labore' ? 'Pró-labore' : `Parcelado (${h.numero_parcelas}x)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatarMoeda(h.valor_total)}</p>
                      <p className="text-xs text-green-600">{formatarMoeda(totalPago)} recebido</p>
                    </div>
                  </div>
                  {/* Barra de progresso de pagamento */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(percPago, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
