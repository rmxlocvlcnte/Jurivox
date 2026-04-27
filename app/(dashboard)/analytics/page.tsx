// ───────────────────────────────────────────────────────────────
// ANALYTICS — Relatórios avançados: faturamento, produtividade,
//             taxa de êxito, horas por advogado
// ───────────────────────────────────────────────────────────────

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  TrendingUp, Users, Clock, DollarSign,
  BarChart2, Target, Award, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  GraficoFaturamento,
  GraficoAdvogados,
  GraficoAreasPizza,
  GraficoHorasMensais,
} from '@/components/analytics/GraficosAnalytics'
import { ExportButton } from '@/components/export-button'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const { ano: anoParam } = await searchParams
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const ano = anoParam ? parseInt(anoParam) : anoAtual

  // Intervalo: 12 meses do ano selecionado
  const inicioPeriodo = new Date(ano, 0, 1).toISOString()          // 1 jan
  const fimPeriodo = new Date(ano + 1, 0, 1).toISOString()         // 1 jan seguinte
  const inicioPeriodoData = `${ano}-01-01`
  const fimPeriodoData = `${ano}-12-31`

  const [
    { data: processos },
    { data: honorarios },
    { data: pagamentos },
    { data: timesheet },
    { data: membros },
    { data: prazos },
  ] = await Promise.all([
    supabase.from('processos').select('id, area_juridica, status, responsavel_id, criado_em')
      .eq('escritorio_id', escritorioId),

    supabase.from('honorarios').select('id, valor_total, status, criado_em, processo_id')
      .eq('escritorio_id', escritorioId)
      .gte('criado_em', inicioPeriodo)
      .lt('criado_em', fimPeriodo),

    supabase.from('pagamentos_honorarios').select('valor, data_pagamento, escritorio_id')
      .eq('escritorio_id', escritorioId)
      .gte('data_pagamento', inicioPeriodoData)
      .lte('data_pagamento', fimPeriodoData),

    supabase.from('timesheet_lancamentos').select('horas, data, membro_id')
      .eq('escritorio_id', escritorioId)
      .gte('data', inicioPeriodoData)
      .lte('data', fimPeriodoData),

    supabase.from('membros_escritorio').select('id, nome, cargo')
      .eq('escritorio_id', escritorioId)
      .eq('ativo', true),

    supabase.from('prazos').select('id, concluido, responsavel_id')
      .eq('escritorio_id', escritorioId),
  ])

  // ── KPIs principais ──────────────────────────────────────────
  const totalProcessos = processos?.length ?? 0
  const processosAtivos = processos?.filter(p => p.status === 'ativo').length ?? 0
  const processosEncerrados = processos?.filter(p => p.status === 'encerrado').length ?? 0

  const totalHonorarios = honorarios?.reduce((s, h) => s + h.valor_total, 0) ?? 0
  const totalRecebido = pagamentos?.reduce((s, p) => s + p.valor, 0) ?? 0
  const taxaCobranca = totalHonorarios > 0 ? (totalRecebido / totalHonorarios) * 100 : 0

  const totalHoras = timesheet?.reduce((s, t) => s + Number(t.horas), 0) ?? 0
  const prazosConcluidos = prazos?.filter(p => p.concluido).length ?? 0
  const taxaPrazos = (prazos?.length ?? 0) > 0
    ? (prazosConcluidos / prazos!.length) * 100 : 0

  // ── Faturamento mensal (12 meses do ano) ────────────────────
  const mesesMap: Record<string, { honorarios: number; recebido: number }> = {}
  for (let m = 0; m < 12; m++) {
    const d = new Date(ano, m, 1)
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    mesesMap[key] = { honorarios: 0, recebido: 0 }
  }

  honorarios?.forEach(h => {
    const d = new Date(h.criado_em)
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (mesesMap[key]) mesesMap[key].honorarios += h.valor_total
  })
  pagamentos?.forEach(p => {
    const d = new Date(p.data_pagamento + 'T12:00:00')
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (mesesMap[key]) mesesMap[key].recebido += p.valor
  })
  const dadosFaturamento = Object.entries(mesesMap).map(([mes, v]) => ({ mes, ...v }))

  // ── Processos e prazos por advogado ──────────────────────────
  const dadosAdvogados = (membros ?? []).map(m => ({
    nome: m.nome?.split(' ')[0] ?? m.cargo,
    processos: processos?.filter(p => p.responsavel_id === m.id).length ?? 0,
    prazos: prazos?.filter(p => p.responsavel_id === m.id && !p.concluido).length ?? 0,
  })).filter(a => a.processos > 0 || a.prazos > 0)

  // ── Processos por área jurídica ───────────────────────────────
  const areasMap: Record<string, number> = {}
  processos?.forEach(p => {
    const area = p.area_juridica ?? 'outro'
    areasMap[area] = (areasMap[area] ?? 0) + 1
  })
  const AREA_LABELS: Record<string, string> = {
    civil: 'Civil', criminal: 'Criminal', trabalhista: 'Trabalhista',
    tributario: 'Tributário', previdenciario: 'Previdenciário', outro: 'Outro',
  }
  const dadosAreas = Object.entries(areasMap)
    .map(([area, total]) => ({ area: AREA_LABELS[area] ?? area, total }))
    .sort((a, b) => b.total - a.total)

  // ── Horas trabalhadas por mês (6 últimos meses do período) ───
  const horasMap: Record<string, number> = {}
  for (let m = 5; m >= 0; m--) {
    const d = new Date(ano, 11 - m, 1) // últimos 6 meses do ano
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    horasMap[key] = 0
  }
  timesheet?.forEach(t => {
    const d = new Date(t.data + 'T12:00:00')
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (key in horasMap) horasMap[key] += Number(t.horas)
  })
  const dadosHoras = Object.entries(horasMap).map(([mes, horas]) => ({ mes, horas }))

  // ── Top advogado por processos ────────────────────────────────
  const topAdvogado = [...dadosAdvogados].sort((a, b) => b.processos - a.processos)[0]

  const kpis = [
    {
      label: 'Processos Ativos', valor: processosAtivos,
      sub: `${totalProcessos} total · ${processosEncerrados} encerrados`,
      icon: Activity, cor: 'text-blue-600', fundo: 'bg-blue-50',
    },
    {
      label: `Honorários (${ano})`, valor: fmt(totalHonorarios),
      sub: `${fmt(totalRecebido)} recebido (${taxaCobranca.toFixed(0)}%)`,
      icon: DollarSign, cor: 'text-emerald-600', fundo: 'bg-emerald-50',
    },
    {
      label: `Horas Trabalhadas (${ano})`, valor: `${totalHoras.toFixed(1)}h`,
      sub: `Ano selecionado`,
      icon: Clock, cor: 'text-purple-600', fundo: 'bg-purple-50',
    },
    {
      label: 'Prazos Cumpridos', valor: `${taxaPrazos.toFixed(0)}%`,
      sub: `${prazosConcluidos} de ${prazos?.length ?? 0} concluídos`,
      icon: Target, cor: 'text-amber-600', fundo: 'bg-amber-50',
    },
  ]

  // ── Dados para exportação ────────────────────────────────────
  const exportKpis = [
    { indicador: 'Processos Ativos', valor: String(processosAtivos), detalhe: `${totalProcessos} total` },
    { indicador: `Honorários (${ano})`, valor: fmt(totalHonorarios), detalhe: `${fmt(totalRecebido)} recebido` },
    { indicador: `Horas Trabalhadas (${ano})`, valor: `${totalHoras.toFixed(1)}h`, detalhe: '' },
    { indicador: 'Taxa de Prazos', valor: `${taxaPrazos.toFixed(1)}%`, detalhe: `${prazosConcluidos}/${prazos?.length ?? 0}` },
    ...dadosFaturamento.map(d => ({
      indicador: `Honorários - ${d.mes}`, valor: fmt(d.honorarios), detalhe: `Recebido: ${fmt(d.recebido)}`,
    })),
  ]
  const exportCols = [
    { key: 'indicador', label: 'Indicador' },
    { key: 'valor', label: 'Valor' },
    { key: 'detalhe', label: 'Detalhe' },
  ]

  const anoPrev = ano - 1
  const anoNext = ano + 1

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Analytics & Relatórios</h1>
            <p className="text-slate-500 text-sm mt-1">Indicadores de desempenho do seu escritório</p>
          </div>
        </div>

        {/* Navegação de ano + Exportar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <Link
              href={`/analytics?ano=${anoPrev}`}
              className="p-2 hover:bg-slate-50 transition-colors text-slate-500"
              title={`Ver ${anoPrev}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="px-3 text-sm font-semibold text-slate-800 min-w-[3rem] text-center">{ano}</span>
            <Link
              href={anoNext <= anoAtual ? `/analytics?ano=${anoNext}` : '#'}
              className={`p-2 transition-colors ${anoNext <= anoAtual ? 'hover:bg-slate-50 text-slate-500' : 'text-slate-200 cursor-not-allowed'}`}
              title={anoNext <= anoAtual ? `Ver ${anoNext}` : 'Ano atual'}
              aria-disabled={anoNext > anoAtual}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ExportButton data={exportKpis} columns={exportCols} filename={`Analytics Jurivox ${ano}`} label="Exportar" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {kpis.map(({ label, valor, sub, icon: Icon, cor, fundo }) => (
          <div key={label} className="bg-white rounded-xl p-4 md:p-5 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{label}</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1 leading-tight">{valor}</p>
                <p className="text-xs text-slate-400 mt-1 leading-tight">{sub}</p>
              </div>
              <div className={`${fundo} p-2 rounded-lg shrink-0 ml-2`}>
                <Icon className={`w-4 h-4 ${cor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Faturamento mensal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Faturamento × Recebimento ({ano})</h2>
        </div>
        <GraficoFaturamento dados={dadosFaturamento} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Processos por área */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Processos por Área Jurídica</h2>
          </div>
          {dadosAreas.length > 0 ? (
            <GraficoAreasPizza dados={dadosAreas} />
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Nenhum processo cadastrado.</p>
          )}
        </div>

        {/* Processos por advogado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Carga por Advogado</h2>
          </div>
          {dadosAdvogados.length > 0 ? (
            <GraficoAdvogados dados={dadosAdvogados} />
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Nenhum dado disponível.</p>
          )}
        </div>
      </div>

      {/* Horas mensais */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Horas Trabalhadas (2º semestre de {ano})</h2>
        </div>
        <GraficoHorasMensais dados={dadosHoras} />
      </div>

      {/* Destaques */}
      {(topAdvogado || totalRecebido > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topAdvogado && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Mais Ativo</p>
              <p className="text-lg font-bold text-amber-900 mt-1">{topAdvogado.nome}</p>
              <p className="text-sm text-amber-700">{topAdvogado.processos} processos</p>
            </div>
          )}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Taxa de Cobrança</p>
            <p className="text-lg font-bold text-emerald-900 mt-1">{taxaCobranca.toFixed(1)}%</p>
            <p className="text-sm text-emerald-700">{fmt(totalRecebido)} recebidos</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Área Principal</p>
            <p className="text-lg font-bold text-blue-900 mt-1">{dadosAreas[0]?.area ?? '—'}</p>
            <p className="text-sm text-blue-700">{dadosAreas[0]?.total ?? 0} processos</p>
          </div>
        </div>
      )}
    </div>
  )
}
