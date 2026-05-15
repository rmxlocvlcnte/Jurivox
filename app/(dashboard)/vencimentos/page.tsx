import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Clock, DollarSign, ChevronRight, CheckCircle } from 'lucide-react'
import { concluirPrazo } from '@/lib/actions/prazos'

function diasRestantes(data: string): number {
  const venc = new Date(data + 'T12:00:00')
  return Math.floor((venc.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatarMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function corDias(dias: number) {
  if (dias < 0) return 'bg-red-100 text-red-700'
  if (dias === 0) return 'bg-red-100 text-red-700'
  if (dias <= 3) return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}

function textoDias(dias: number) {
  if (dias < 0) return `Vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence HOJE'
  if (dias === 1) return '1 dia'
  return `${dias} dias`
}

export default async function VencimentosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const hoje = new Date().toISOString().split('T')[0]
  const em7Dias = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const em30Dias = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ data: prazos }, { data: contas }] = await Promise.all([
    supabase
      .from('prazos')
      .select(`
        id, descricao, data_vencimento, concluido,
        processos(id, numero_cnj, clientes(nome))
      `)
      .eq('escritorio_id', escritorioId)
      .eq('concluido', false)
      .lte('data_vencimento', em30Dias)
      .order('data_vencimento', { ascending: true }),

    supabase
      .from('contas_receber')
      .select('id, descricao, valor, data_vencimento, status, clientes(nome)')
      .eq('escritorio_id', escritorioId)
      .in('status', ['aberto', 'vencido'])
      .lte('data_vencimento', em30Dias)
      .order('data_vencimento', { ascending: true }),
  ])

  const prazosList = prazos ?? []
  const contasList = (contas ?? []).map(c => ({
    ...c,
    status: c.status === 'aberto' && c.data_vencimento < hoje ? 'vencido' : c.status,
  }))

  const prazosVencidos = prazosList.filter(p => p.data_vencimento < hoje)
  const prazosHoje = prazosList.filter(p => p.data_vencimento === hoje)
  const prazosProximos = prazosList.filter(p => p.data_vencimento > hoje && p.data_vencimento <= em7Dias)
  const prazosFuturos = prazosList.filter(p => p.data_vencimento > em7Dias)

  const contasVencidas = contasList.filter(c => c.status === 'vencido')
  const contasHoje = contasList.filter(c => c.data_vencimento === hoje && c.status !== 'vencido')
  const contasProximas = contasList.filter(c => c.data_vencimento > hoje && c.data_vencimento <= em7Dias && c.status !== 'vencido')
  const contasFuturas = contasList.filter(c => c.data_vencimento > em7Dias && c.status !== 'vencido')

  const totalVencidos = prazosVencidos.length + contasVencidas.length
  const totalHoje = prazosHoje.length + contasHoje.length
  const totalProximos = prazosProximos.length + contasProximas.length

  const valorVencido = contasVencidas.reduce((acc, c) => acc + c.valor, 0)
  const valorProximo = [...contasHoje, ...contasProximas].reduce((acc, c) => acc + c.valor, 0)

  async function handleConcluirPrazo(formData: FormData) {
    'use server'
    const id = formData.get('prazo_id') as string
    await concluirPrazo(id)
  }

  function renderPrazo(p: any) {
    const dias = diasRestantes(p.data_vencimento)
    const processo = p.processos as any
    const cliente = processo?.clientes as any
    return (
      <div key={p.id} className="flex items-center gap-4 px-5 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{p.descricao}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {processo?.numero_cnj && (
              <Link href={`/processos/${processo.id}`} className="text-xs font-mono text-amber-600 hover:text-amber-700">
                {processo.numero_cnj}
              </Link>
            )}
            {cliente?.nome && <span className="text-xs text-slate-400">{cliente.nome}</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{formatarData(p.data_vencimento)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${corDias(dias)}`}>
            {textoDias(dias)}
          </span>
          <form action={handleConcluirPrazo}>
            <input type="hidden" name="prazo_id" value={p.id} />
            <button
              type="submit"
              title="Marcar como concluído"
              className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </form>
          <Link href={`/prazos/${p.id}`} className="text-slate-300 hover:text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  function renderConta(c: any) {
    const dias = diasRestantes(c.data_vencimento)
    const cliente = c.clientes as any
    return (
      <Link key={c.id} href="/contas-receber" className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{c.descricao}</p>
          {cliente?.nome && <p className="text-xs text-slate-400 mt-0.5">{cliente.nome}</p>}
          <p className="text-xs text-slate-400 mt-0.5">{formatarData(c.data_vencimento)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-slate-900">{formatarMoeda(c.valor)}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${corDias(dias)}`}>
            {textoDias(dias)}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </Link>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Central de Vencimentos</h1>
        <p className="text-slate-500 text-sm mt-1">Prazos e cobranças dos próximos 30 dias</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <p className="text-xs text-slate-500">Vencidos</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{totalVencidos}</p>
          {valorVencido > 0 && <p className="text-xs text-red-500 mt-0.5">{formatarMoeda(valorVencido)} em cobranças</p>}
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <p className="text-xs text-slate-500">Vence hoje</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{totalHoje}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-xs text-slate-500">Próximos 7 dias</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{totalProximos}</p>
          {valorProximo > 0 && <p className="text-xs text-blue-500 mt-0.5">{formatarMoeda(valorProximo)} em cobranças</p>}
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">8–30 dias</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{prazosFuturos.length + contasFuturas.length}</p>
        </div>
      </div>

      {totalVencidos === 0 && totalHoje === 0 && totalProximos === 0 && prazosFuturos.length === 0 && contasFuturas.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Tudo em dia!</p>
          <p className="text-slate-400 text-sm mt-1">Nenhum prazo ou cobrança vencendo nos próximos 30 dias.</p>
        </div>
      )}

      {/* ── Vencidos ────────────────────────────────────────────── */}
      {(prazosVencidos.length > 0 || contasVencidas.length > 0) && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-red-700">Vencidos ({prazosVencidos.length + contasVencidas.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {prazosVencidos.map(renderPrazo)}
            {contasVencidas.map(renderConta)}
          </div>
        </div>
      )}

      {/* ── Hoje ────────────────────────────────────────────────── */}
      {(prazosHoje.length > 0 || contasHoje.length > 0) && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-100 bg-amber-50">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-amber-700">Vence Hoje ({prazosHoje.length + contasHoje.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {prazosHoje.map(renderPrazo)}
            {contasHoje.map(renderConta)}
          </div>
        </div>
      )}

      {/* ── Próximos 7 dias ──────────────────────────────────────── */}
      {(prazosProximos.length > 0 || contasProximas.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Próximos 7 Dias ({prazosProximos.length + contasProximas.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {prazosProximos.map(renderPrazo)}
            {contasProximas.map(renderConta)}
          </div>
        </div>
      )}

      {/* ── 8 a 30 dias ──────────────────────────────────────────── */}
      {(prazosFuturos.length > 0 || contasFuturas.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">8 a 30 Dias ({prazosFuturos.length + contasFuturas.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {prazosFuturos.map(renderPrazo)}
            {contasFuturas.map(renderConta)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400">
        <p>Prazos concluídos e cobranças recebidas não aparecem aqui.</p>
        <div className="flex gap-3">
          <Link href="/prazos" className="text-amber-600 hover:text-amber-700">Ver todos os prazos →</Link>
          <Link href="/contas-receber" className="text-amber-600 hover:text-amber-700">Ver cobranças →</Link>
        </div>
      </div>
    </div>
  )
}
