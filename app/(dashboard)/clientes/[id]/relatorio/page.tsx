import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FolderOpen, DollarSign, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { decriptarCliente } from '@/lib/cripto'

function fmtValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const LABEL_AREA: Record<string, string> = {
  civil: 'Cível', criminal: 'Criminal', trabalhista: 'Trabalhista',
  previdenciario: 'Previdenciário', tributario: 'Tributário', outro: 'Outro',
}

const COR_STATUS: Record<string, string> = {
  ativo:     'bg-green-100 text-green-700',
  arquivado: 'bg-slate-100 text-slate-600',
  suspenso:  'bg-amber-100 text-amber-700',
  encerrado: 'bg-red-100 text-red-700',
}

export default async function ClienteRelatorioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const [
    { data: clienteRaw },
    { data: processos },
    { data: contas },
    { data: prazos },
    { data: movimentacoes },
    { data: honorarios },
  ] = await Promise.all([
    supabase.from('clientes').select('*').eq('id', id).eq('escritorio_id', escritorioId).single(),

    supabase
      .from('processos')
      .select('id, numero_cnj, tribunal, area_juridica, status, valor_causa, criado_em, data_distribuicao')
      .eq('cliente_id', id)
      .eq('escritorio_id', escritorioId)
      .order('criado_em', { ascending: false }),

    supabase
      .from('contas_receber')
      .select('id, descricao, valor, status, data_vencimento, data_recebimento')
      .eq('cliente_id', id)
      .eq('escritorio_id', escritorioId)
      .order('data_vencimento', { ascending: false }),

    supabase
      .from('prazos')
      .select('id, descricao, data_vencimento, concluido, processos!inner(cliente_id)')
      .eq('processos.cliente_id', id)
      .eq('escritorio_id', escritorioId)
      .order('data_vencimento', { ascending: false })
      .limit(10),

    supabase
      .from('movimentacoes')
      .select('id, tipo, descricao, data_movimentacao, processos!inner(cliente_id, numero_cnj)')
      .eq('processos.cliente_id', id)
      .order('data_movimentacao', { ascending: false })
      .limit(20),

    supabase
      .from('honorarios')
      .select('valor, data_pagamento, status')
      .eq('cliente_id', id)
      .eq('escritorio_id', escritorioId),
  ])

  if (!clienteRaw) notFound()
  const cliente = decriptarCliente(clienteRaw)

  // KPIs financeiros — contas_receber
  const kpiContas = (contas ?? []).reduce(
    (acc, c) => {
      acc.total += c.valor
      if (c.status === 'recebido') acc.recebido += c.valor
      else acc.emAberto += c.valor
      if (c.status === 'vencido') acc.vencido += c.valor
      return acc
    },
    { total: 0, recebido: 0, emAberto: 0, vencido: 0 },
  )

  // KPIs honorários
  const kpiHon = (honorarios ?? []).reduce(
    (acc, h) => {
      acc.total += h.valor
      if (h.status === 'pago') acc.pago += h.valor
      else acc.pendente += h.valor
      return acc
    },
    { total: 0, pago: 0, pendente: 0 },
  )

  // Processos por status
  const ativos     = (processos ?? []).filter(p => p.status === 'ativo').length
  const encerrados = (processos ?? []).filter(p => p.status !== 'ativo').length

  // Prazos
  const prazosAbertos    = (prazos ?? []).filter(p => !p.concluido).length
  const prazosConcluidos = (prazos ?? []).filter(p => p.concluido).length
  const hoje = new Date().toISOString().split('T')[0]
  const prazosVencidos   = (prazos ?? []).filter(p => !p.concluido && p.data_vencimento < hoje).length

  const recebivelTotal = kpiContas.total + kpiHon.total
  const recebivelRecebido = kpiContas.recebido + kpiHon.pago

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/clientes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-4 h-4" /> Clientes
        </Link>
        <span className="text-slate-300">/</span>
        <Link href={`/clientes/${id}`} className="text-sm text-slate-500 hover:text-slate-900">{cliente.nome}</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Relatório</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{cliente.nome}</h1>
          <p className="text-slate-500 text-sm mt-1">Relatório completo do cliente</p>
        </div>
        <Link
          href={`/clientes/${id}`}
          className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Ver perfil completo
        </Link>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-slate-500">Processos</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{(processos ?? []).length}</p>
          <p className="text-xs text-slate-400 mt-1">{ativos} ativo{ativos !== 1 ? 's' : ''} · {encerrados} encerrado{encerrados !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <p className="text-xs text-slate-500">Receita Total</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmtValor(recebivelTotal)}</p>
          <p className="text-xs text-green-600 mt-1">{fmtValor(recebivelRecebido)} recebido</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-slate-500">Em Aberto</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{fmtValor(kpiContas.emAberto + kpiHon.pendente)}</p>
          {kpiContas.vencido > 0 && (
            <p className="text-xs text-red-600 mt-1">{fmtValor(kpiContas.vencido)} vencido</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-slate-500">Prazos</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{prazosAbertos}</p>
          <p className="text-xs text-slate-400 mt-1">
            {prazosVencidos > 0 ? <span className="text-red-500">{prazosVencidos} vencido{prazosVencidos !== 1 ? 's' : ''} · </span> : null}
            {prazosConcluidos} concluído{prazosConcluidos !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Processos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Processos</h2>
            </div>
            {(processos ?? []).length > 0 && (
              <span className="text-xs text-slate-400">{(processos ?? []).length} total</span>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {(processos ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhum processo cadastrado</p>
            ) : (
              (processos ?? []).map(p => (
                <Link key={p.id} href={`/processos/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 font-mono truncate">{p.numero_cnj}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{p.tribunal}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{LABEL_AREA[p.area_juridica] ?? p.area_juridica}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.valor_causa && (
                      <span className="text-xs text-slate-500">{fmtValor(Number(p.valor_causa))}</span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COR_STATUS[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {p.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Cobranças */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Cobranças</h2>
            </div>
            <Link href="/contas-receber" className="text-xs text-amber-600 hover:text-amber-700">Ver todas →</Link>
          </div>

          {/* Resumo */}
          {(contas ?? []).length > 0 && (
            <div className="grid grid-cols-3 gap-0 border-b border-slate-100">
              {[
                { label: 'Total', valor: kpiContas.total, cls: 'text-slate-900' },
                { label: 'Recebido', valor: kpiContas.recebido, cls: 'text-green-700' },
                { label: 'Em aberto', valor: kpiContas.emAberto, cls: 'text-amber-700' },
              ].map(({ label, valor, cls }) => (
                <div key={label} className="px-4 py-3 text-center border-r border-slate-100 last:border-0">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${cls}`}>{fmtValor(valor)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {(contas ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhuma cobrança registrada</p>
            ) : (
              (contas ?? []).map(c => {
                const corStatus = c.status === 'recebido'
                  ? 'text-green-700 bg-green-50'
                  : c.status === 'vencido'
                  ? 'text-red-700 bg-red-50'
                  : 'text-amber-700 bg-amber-50'
                return (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.descricao}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.status === 'recebido' && c.data_recebimento
                          ? `Recebido em ${fmtData(c.data_recebimento)}`
                          : `Vence ${fmtData(c.data_vencimento)}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">{fmtValor(c.valor)}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${corStatus}`}>{c.status}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Movimentações recentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Movimentações Recentes</h2>
          </div>
          <span className="text-xs text-slate-400">últimas 20</span>
        </div>
        <div className="divide-y divide-slate-100">
          {(movimentacoes ?? []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhuma movimentação registrada</p>
          ) : (
            (movimentacoes ?? []).map(m => {
              const processo = m.processos as any
              return (
                <div key={m.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{m.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="font-mono">{processo?.numero_cnj ?? ''}</span>
                      {processo?.numero_cnj && <span>·</span>}
                      <span>{fmtData(m.data_movimentacao)}</span>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">{m.tipo}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Prazos */}
      {(prazos ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Prazos Vinculados</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(prazos ?? []).map(p => {
              const venc = new Date(p.data_vencimento + 'T12:00:00')
              const dias = Math.floor((venc.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {p.concluido
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${p.concluido ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {p.descricao}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtData(p.data_vencimento)}</p>
                  </div>
                  {!p.concluido && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      dias < 0 ? 'bg-red-100 text-red-700' :
                      dias <= 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {dias < 0 ? `${Math.abs(dias)}d vencido` : dias === 0 ? 'Hoje' : `${dias}d`}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href={`/clientes/${id}`} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
          ← Voltar ao perfil
        </Link>
        <Link href={`/clientes/${id}/editar`} className="text-sm text-slate-500 hover:text-slate-700">
          Editar cliente
        </Link>
      </div>
    </div>
  )
}
