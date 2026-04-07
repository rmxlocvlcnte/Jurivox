import { getAuthContext } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { criarMovimentacaoFinanceira, registrarPagamento } from '@/lib/actions/financeiro'
import { HonorarioForm } from '@/components/financeiro/HonorarioForm'
import { ExportButton } from '@/components/export-button'
import {
  DollarSign, TrendingUp, TrendingDown, Plus,
  ArrowUpCircle, ArrowDownCircle, FileText, CreditCard,
} from 'lucide-react'

const EXPORT_MOVS = [
  { key: 'tipo', label: 'Tipo', format: (row: any) => row.tipo === 'entrada' ? 'Entrada' : 'Saída' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'valor', label: 'Valor (R$)', format: (row: any) => Number(row.valor ?? 0).toFixed(2) },
  { key: 'data', label: 'Data', format: (row: any) => row.data ? new Date(row.data + 'T12:00:00').toLocaleDateString('pt-BR') : '' },
]

const EXPORT_HONORARIOS = [
  { key: 'cliente', label: 'Cliente', format: (row: any) => (row.processos as any)?.clientes?.nome ?? '' },
  { key: 'processo', label: 'Processo', format: (row: any) => (row.processos as any)?.numero_cnj ?? '' },
  { key: 'tipo', label: 'Tipo', format: (row: any) => row.tipo === 'exito' ? 'Êxito' : row.tipo === 'pro_labore' ? 'Pró-labore' : 'Parcelado' },
  { key: 'valor_total', label: 'Valor Total (R$)', format: (row: any) => Number(row.valor_total ?? 0).toFixed(2) },
  { key: 'status', label: 'Status' },
  { key: 'criado_em', label: 'Criado em', format: (row: any) => row.criado_em ? new Date(row.criado_em).toLocaleDateString('pt-BR') : '' },
]

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default async function FinanceiroPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const [
    { data: movimentacoes },
    { data: honorarios },
    { data: processos },
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
        processos(id, numero_cnj, clientes(nome)),
        pagamentos_honorarios(valor, data_pagamento)
      `)
      .eq('escritorio_id', escritorioId)
      .order('criado_em', { ascending: false }),

    supabase
      .from('processos')
      .select('id, numero_cnj')
      .eq('escritorio_id', escritorioId)
      .eq('status', 'ativo')
      .order('numero_cnj'),
  ])

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const entradas = movimentacoes
    ?.filter(m => m.tipo === 'entrada' && new Date(m.data) >= inicioMes)
    .reduce((acc, m) => acc + (m.valor ?? 0), 0) ?? 0

  const saidas = movimentacoes
    ?.filter(m => m.tipo === 'saida' && new Date(m.data) >= inicioMes)
    .reduce((acc, m) => acc + (m.valor ?? 0), 0) ?? 0

  const totalHonorariosRecebidos = honorarios?.reduce((acc, h) => {
    const pago = (h.pagamentos_honorarios as any[])?.reduce((s: number, p: any) => s + (p.valor ?? 0), 0) ?? 0
    return acc + pago
  }, 0) ?? 0

  const totalHonorariosPendentes = honorarios
    ?.filter(h => h.status !== 'quitado' && h.status !== 'cancelado')
    .reduce((acc, h) => {
      const pago = (h.pagamentos_honorarios as any[])?.reduce((s: number, p: any) => s + (p.valor ?? 0), 0) ?? 0
      return acc + (h.valor_total - pago)
    }, 0) ?? 0

  async function novaMovimentacao(formData: FormData) {
    'use server'
    await criarMovimentacaoFinanceira(formData)
  }
  async function novoPagamento(formData: FormData) {
    'use server'
    await registrarPagamento(formData)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">Honorários, pagamentos e fluxo de caixa</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(movimentacoes?.length ?? 0) > 0 && (
            <ExportButton data={movimentacoes ?? []} columns={EXPORT_MOVS} filename="Movimentações - JurisFlow" />
          )}
          {(honorarios?.length ?? 0) > 0 && (
            <ExportButton data={honorarios ?? []} columns={EXPORT_HONORARIOS} filename="Honorários - JurisFlow" label="Hon.:" />
          )}
          <Link
            href="/financeiro/relatorio"
            className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Relatório
          </Link>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Entradas este mês</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatarMoeda(entradas)}</p>
          <TrendingUp className="w-4 h-4 text-green-500 mt-1" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500">Saídas este mês</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatarMoeda(saidas)}</p>
          <TrendingDown className="w-4 h-4 text-red-500 mt-1" />
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <p className="text-xs text-slate-500">Honorários recebidos</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatarMoeda(totalHonorariosRecebidos)}</p>
          <CreditCard className="w-4 h-4 text-green-500 mt-1" />
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-xs text-slate-500">Honorários a receber</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatarMoeda(totalHonorariosPendentes)}</p>
          <DollarSign className="w-4 h-4 text-amber-500 mt-1" />
        </div>
      </div>

      {/* HONORÁRIOS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Honorários por Processo
          </h2>
          <p className="text-sm text-green-700 font-semibold">{formatarMoeda(totalHonorariosRecebidos)} recebido</p>
        </div>

        {/* Formulário novo honorário */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Novo Honorário</p>
          <HonorarioForm processos={(processos ?? []) as any} />
        </div>

        {/* Lista de honorários */}
        <div className="divide-y divide-slate-100">
          {!honorarios?.length ? (
            <div className="px-5 py-6 text-center text-slate-400 text-sm">
              Nenhum honorário cadastrado. Use o formulário acima.
            </div>
          ) : (
            honorarios.map((h) => {
              const processo = h.processos as any
              const pagamentos = (h.pagamentos_honorarios as any[]) ?? []
              const totalPago = pagamentos.reduce((acc, p) => acc + (p.valor ?? 0), 0)
              const percPago = h.valor_total > 0 ? (totalPago / h.valor_total) * 100 : 0
              const pendente = h.valor_total - totalPago

              const STATUS_CLS: Record<string, string> = {
                pendente: 'bg-amber-100 text-amber-700',
                parcial: 'bg-blue-100 text-blue-700',
                quitado: 'bg-green-100 text-green-700',
                cancelado: 'bg-slate-100 text-slate-500',
              }

              return (
                <div key={h.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">
                          {processo?.clientes?.nome ?? 'Sem cliente'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[h.status] ?? STATUS_CLS.pendente}`}>
                          {h.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{processo?.numero_cnj}</p>
                      <p className="text-xs text-slate-400">
                        {h.tipo === 'exito' ? 'Êxito' : h.tipo === 'pro_labore' ? 'Pró-labore' : `Parcelado (${h.numero_parcelas}x)`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatarMoeda(h.valor_total)}</p>
                      <p className="text-xs text-green-600">{formatarMoeda(totalPago)} pago</p>
                      {pendente > 0 && <p className="text-xs text-amber-600">{formatarMoeda(pendente)} pendente</p>}
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(percPago, 100)}%` }} />
                  </div>

                  {/* Formulário de pagamento inline */}
                  {h.status !== 'quitado' && h.status !== 'cancelado' && (
                    <form action={novoPagamento} className="flex flex-wrap gap-2 mt-2">
                      <input type="hidden" name="honorario_id" value={h.id} />
                      <input
                        name="valor"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="Valor (R$)"
                        className="w-32 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <input
                        name="data_pagamento"
                        type="date"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <select
                        name="forma_pagamento"
                        className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      >
                        <option value="pix">PIX</option>
                        <option value="ted">TED</option>
                        <option value="boleto">Boleto</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao">Cartão</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        + Registrar pagamento
                      </button>
                    </form>
                  )}

                  {/* Histórico de pagamentos */}
                  {pagamentos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {pagamentos.map((p: any, i: number) => (
                        <p key={i} className="text-xs text-slate-400">
                          ✓ {formatarMoeda(p.valor)} em {formatarData(p.data_pagamento)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Registrar movimentação */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Movimentação
          </h2>
          <form action={novaMovimentacao} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                <select name="tipo" required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$)</label>
                <input name="valor" type="number" step="0.01" min="0.01" required placeholder="0,00"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
              <input name="categoria" type="text" placeholder="Ex: Honorários, Custas judiciais..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
              <input name="descricao" type="text" required placeholder="Descrição da movimentação"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
              <input name="data" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors text-sm">
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
              <div className="px-5 py-6 text-center text-slate-400 text-sm">Nenhuma movimentação registrada.</div>
            ) : (
              movimentacoes.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  {m.tipo === 'entrada'
                    ? <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0" />
                    : <ArrowDownCircle className="w-5 h-5 text-red-500 shrink-0" />}
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
    </div>
  )
}
