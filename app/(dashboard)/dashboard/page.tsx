// -----------------------------------------------
// DASHBOARD — Tela inicial com dados REAIS do banco
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FolderOpen,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Activity,
  Plus,
  BarChart2,
  AlertCircle,
} from 'lucide-react'
import { GraficoIndicadoresAnuais } from '@/components/dashboard-charts'

function tempoRelativo(data: string) {
  const diffMs = Date.now() - new Date(data).getTime()
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDias = Math.floor(diffHoras / 24)
  if (diffHoras < 1) return 'Agora'
  if (diffHoras < 24) return `${diffHoras}h atrás`
  if (diffDias === 1) return 'Ontem'
  return `${diffDias} dias atrás`
}

function corDiasRestantes(dias: number) {
  if (dias <= 1) return 'bg-red-100 text-red-700'
  if (dias <= 3) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function textoDias(dias: number) {
  if (dias < 0) return `Vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoje!'
  if (dias === 1) return '1 dia restante'
  return `${dias} dias restantes`
}

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

function corDiasSemMovimentacao(dias: number) {
  if (dias > 60) return 'text-red-600 bg-red-50'
  if (dias > 30) return 'text-amber-600 bg-amber-50'
  return 'text-slate-500 bg-slate-50'
}

export default async function DashboardPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const hoje = new Date().toISOString().split('T')[0]
  const em7Dias = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const ha24h = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()
  const ha12Meses = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()

  // Todas as queries em paralelo
  const [
    { count: totalProcessos },
    { count: totalPrazosVencidos },
    { data: movimentacoesRecentes },
    { data: prazosProximos },
    { data: processosSemMovimentacao },
    { data: movimentacoesPorMes },
    { data: eventosPendentes },
  ] = await Promise.all([
    supabase
      .from('processos')
      .select('id', { count: 'exact', head: true })
      .eq('escritorio_id', escritorioId)
      .eq('status', 'ativo'),

    supabase
      .from('prazos')
      .select('id', { count: 'exact', head: true })
      .eq('escritorio_id', escritorioId)
      .eq('concluido', false)
      .lt('data_vencimento', hoje),

    supabase
      .from('movimentacoes')
      .select(`
        id, descricao, tipo, data_movimentacao,
        processos!inner(id, numero_cnj, tribunal, escritorio_id,
          clientes(nome))
      `)
      .eq('processos.escritorio_id', escritorioId)
      .gte('data_movimentacao', ha24h)
      .order('data_movimentacao', { ascending: false })
      .limit(5),

    supabase
      .from('prazos')
      .select(`
        id, descricao, data_vencimento,
        processos(numero_cnj, clientes(nome))
      `)
      .eq('escritorio_id', escritorioId)
      .eq('concluido', false)
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', em7Dias)
      .order('data_vencimento', { ascending: true })
      .limit(5),

    // Processos com dias sem movimentação
    supabase
      .from('processos')
      .select(`
        id, numero_cnj, area_juridica,
        clientes(nome),
        movimentacoes(data_movimentacao)
      `)
      .eq('escritorio_id', escritorioId)
      .eq('status', 'ativo')
      .order('numero_cnj')
      .limit(100),

    // Movimentações por mês para gráfico
    supabase
      .from('movimentacoes')
      .select(`
        data_movimentacao,
        processos!inner(area_juridica, escritorio_id)
      `)
      .eq('processos.escritorio_id', escritorioId)
      .gte('data_movimentacao', ha12Meses)
      .order('data_movimentacao', { ascending: true }),

    // Eventos de agenda pendentes
    supabase
      .from('agenda_eventos')
      .select('id, titulo, tipo, data_inicio')
      .eq('escritorio_id', escritorioId)
      .eq('concluido', false)
      .gte('data_inicio', new Date().toISOString())
      .order('data_inicio', { ascending: true })
      .limit(5),
  ])

  const movimentacoesHoje = movimentacoesRecentes?.filter(m => {
    return new Date(m.data_movimentacao).toDateString() === new Date().toDateString()
  }).length ?? 0

  // Calcula dias sem movimentação para cada processo
  const processosComDias = (processosSemMovimentacao ?? []).map(p => {
    const movs = (p.movimentacoes as any[]) ?? []
    let diasSemMov = 0
    if (movs.length === 0) {
      diasSemMov = 999
    } else {
      const ultimaMov = movs.reduce((a: any, b: any) =>
        new Date(a.data_movimentacao) > new Date(b.data_movimentacao) ? a : b
      )
      diasSemMov = Math.floor((new Date().getTime() - new Date(ultimaMov.data_movimentacao).getTime()) / (1000 * 60 * 60 * 24))
    }
    return { ...p, diasSemMov }
  }).filter(p => p.diasSemMov > 30).sort((a, b) => b.diasSemMov - a.diasSemMov).slice(0, 5)

  // Gera dados para o gráfico de indicadores anuais (últimos 6 meses)
  const meses: Record<string, Record<string, number>> = {}
  const hoje_ = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje_.getFullYear(), hoje_.getMonth() - i, 1)
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    meses[key] = { civil: 0, criminal: 0, trabalhista: 0, tributario: 0, previdenciario: 0, outro: 0 }
  }

  movimentacoesPorMes?.forEach(m => {
    const d = new Date(m.data_movimentacao)
    const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const area = (m.processos as any)?.area_juridica ?? 'outro'
    if (meses[key]) {
      meses[key][area] = (meses[key][area] ?? 0) + 1
    }
  })

  const dadosGrafico = Object.entries(meses).map(([mes, areas]) => ({
    mes,
    civil: areas.civil ?? 0,
    criminal: areas.criminal ?? 0,
    trabalhista: areas.trabalhista ?? 0,
    tributario: areas.tributario ?? 0,
    previdenciario: areas.previdenciario ?? 0,
    outro: areas.outro ?? 0,
  }))

  const cards = [
    { label: 'Processos Ativos', valor: totalProcessos ?? 0, icon: FolderOpen, cor: 'text-blue-600', fundo: 'bg-blue-50' },
    { label: 'Prazos Esta Semana', valor: prazosProximos?.length ?? 0, icon: Clock, cor: 'text-amber-600', fundo: 'bg-amber-50' },
    { label: 'Prazos Vencidos', valor: totalPrazosVencidos ?? 0, icon: AlertTriangle, cor: 'text-red-600', fundo: 'bg-red-50' },
    { label: 'Movimentações Hoje', valor: movimentacoesHoje, icon: TrendingUp, cor: 'text-green-600', fundo: 'bg-green-50' },
  ]

  const TIPO_AGENDA_CLS: Record<string, string> = {
    audiencia: 'bg-red-100 text-red-700',
    prazo: 'bg-amber-100 text-amber-700',
    providencia: 'bg-blue-100 text-blue-700',
    reuniao: 'bg-purple-100 text-purple-700',
    outro: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1 capitalize">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/processos/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-3 md:px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Processo</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {cards.map(({ label, valor, icon: Icon, cor, fundo }) => (
          <div key={label} className="bg-white rounded-xl p-4 md:p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500">{label}</p>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{valor}</p>
              </div>
              <div className={`${fundo} p-2.5 md:p-3 rounded-lg`}>
                <Icon className={`w-5 h-5 md:w-6 md:h-6 ${cor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico Indicadores Anuais */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Indicadores — Movimentações por Área (últimos 6 meses)</h2>
        </div>
        <GraficoIndicadoresAnuais dados={dadosGrafico} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Movimentações recentes */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Movimentações nas Últimas 24h</h2>
            </div>
            <Link href="/processos" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {!movimentacoesRecentes?.length ? (
              <div className="px-5 py-8 text-center">
                <p className="text-slate-400 text-sm">Nenhuma movimentação nas últimas 24h.</p>
                <Link href="/processos/novo" className="block mt-2 text-amber-600 hover:text-amber-700 text-sm font-medium">
                  Cadastrar primeiro processo →
                </Link>
              </div>
            ) : (
              movimentacoesRecentes.map((m) => {
                const processo = m.processos as any
                const cliente = processo?.clientes as any
                return (
                  <Link key={m.id} href={`/processos/${processo?.id}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${['audiencia', 'prazo'].includes(m.tipo) ? 'bg-red-500' : 'bg-green-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{cliente?.nome ?? 'Sem cliente'}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{processo?.numero_cnj}</p>
                      <p className="text-xs text-slate-600 mt-1">{m.descricao}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{processo?.tribunal}</span>
                      <p className="text-xs text-slate-400 mt-1">{tempoRelativo(m.data_movimentacao)}</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Coluna direita: Prazos + Agenda */}
        <div className="space-y-5">
          {/* Prazos próximos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Prazos Próximos</h2>
              </div>
              <Link href="/prazos" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {!prazosProximos?.length ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-slate-400 text-sm">Nenhum prazo nos próximos 7 dias.</p>
                </div>
              ) : (
                prazosProximos.map((p) => {
                  const venc = new Date(p.data_vencimento + 'T12:00:00')
                  const dias = Math.floor((venc.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={p.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-900">{p.descricao}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{(p.processos as any)?.clientes?.nome ?? ''}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-slate-500">{formatarData(p.data_vencimento)}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${corDiasRestantes(dias)}`}>
                          {textoDias(dias)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Próximos eventos da agenda */}
          {(eventosPendentes?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Próximos Eventos</h2>
                <Link href="/agenda" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                  Agenda <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {eventosPendentes?.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TIPO_AGENDA_CLS[e.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                      {e.tipo}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{e.titulo}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(e.data_inicio).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        {' · '}
                        {new Date(e.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processos sem movimentação */}
      {processosComDias.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Processos sem Movimentação</h2>
            </div>
            <Link href="/processos" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Ver processos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {processosComDias.map((p) => (
              <Link key={p.id} href={`/processos/${p.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{(p.clientes as any)?.nome ?? 'Sem cliente'}</p>
                  <p className="text-xs text-slate-500 font-mono">{p.numero_cnj}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${corDiasSemMovimentacao(p.diasSemMov)}`}>
                  {p.diasSemMov === 999 ? 'Sem movimentação' : `${p.diasSemMov}d sem mov.`}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
