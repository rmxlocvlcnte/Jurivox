// -----------------------------------------------
// PRAZOS — Lista de todos os prazos do escritório
// -----------------------------------------------
// Mostra alertas visuais:
// Vermelho = vencido ou vence hoje
// Amarelo  = vence em até 3 dias
// Verde    = dentro do prazo
// Riscado  = concluído
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { concluirPrazo, reabrirPrazo } from '@/lib/actions/prazos'
import { Clock, Plus, CheckCircle, AlertTriangle, Circle } from 'lucide-react'

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
}

function diasRestantes(dataVencimento: string): number {
  const hoje = new Date()
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function corBadge(dias: number, concluido: boolean) {
  if (concluido) return 'bg-green-100 text-green-700'
  if (dias < 0) return 'bg-red-100 text-red-700'
  if (dias === 0) return 'bg-red-100 text-red-700'
  if (dias <= 3) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function textoBadge(dias: number, concluido: boolean) {
  if (concluido) return 'Concluído'
  if (dias < 0) return `Vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence HOJE'
  if (dias === 1) return '1 dia restante'
  return `${dias} dias restantes`
}

export default async function PrazosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { data: prazos } = await supabase
    .from('prazos')
    .select(`
      id, descricao, data_inicio, data_vencimento, quantidade_dias,
      dias_uteis, concluido, concluido_em,
      processos(id, numero_cnj, tribunal, clientes(nome))
    `)
    .eq('escritorio_id', escritorioId)
    .order('concluido', { ascending: true })    // Não concluídos primeiro
    .order('data_vencimento', { ascending: true }) // Mais urgentes primeiro

  // Agrupa por: vencidos, hoje, próximos, futuros, concluídos
  const vencidos = prazos?.filter(p => !p.concluido && diasRestantes(p.data_vencimento) < 0) ?? []
  const hoje = prazos?.filter(p => !p.concluido && diasRestantes(p.data_vencimento) === 0) ?? []
  const proximos = prazos?.filter(p => !p.concluido && diasRestantes(p.data_vencimento) > 0 && diasRestantes(p.data_vencimento) <= 7) ?? []
  const futuros = prazos?.filter(p => !p.concluido && diasRestantes(p.data_vencimento) > 7) ?? []
  const concluidos = prazos?.filter(p => p.concluido) ?? []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prazos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {vencidos.length > 0 && <span className="text-red-600 font-medium">{vencidos.length} vencido(s) · </span>}
            {hoje.length > 0 && <span className="text-red-600 font-medium">{hoje.length} vence hoje · </span>}
            {proximos.length} nos próximos 7 dias
          </p>
        </div>
        <Link
          href="/prazos/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Prazo
        </Link>
      </div>

      {/* Sem prazos */}
      {!prazos?.length && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-600 font-medium">Nenhum prazo cadastrado</h3>
          <p className="text-slate-400 text-sm mt-1">Cadastre prazos para não perder datas importantes.</p>
          <Link href="/prazos/novo" className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Cadastrar Prazo
          </Link>
        </div>
      )}

      {/* Seção: Vencidos */}
      {vencidos.length > 0 && (
        <PrazosSecao titulo="⚠️ Vencidos" prazos={vencidos} />
      )}

      {/* Seção: Vence hoje */}
      {hoje.length > 0 && (
        <PrazosSecao titulo="🔴 Vence Hoje" prazos={hoje} />
      )}

      {/* Seção: Próximos 7 dias */}
      {proximos.length > 0 && (
        <PrazosSecao titulo="🟡 Próximos 7 Dias" prazos={proximos} />
      )}

      {/* Seção: Futuros */}
      {futuros.length > 0 && (
        <PrazosSecao titulo="🟢 Dentro do Prazo" prazos={futuros} />
      )}

      {/* Seção: Concluídos */}
      {concluidos.length > 0 && (
        <PrazosSecao titulo="✅ Concluídos" prazos={concluidos} concluidos />
      )}
    </div>
  )
}

// Componente de seção de prazos
function PrazosSecao({
  titulo,
  prazos,
  concluidos = false,
}: {
  titulo: string
  prazos: any[]
  concluidos?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">{titulo}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {prazos.map((p) => {
          const processo = p.processos as any
          const cliente = processo?.clientes as any
          const dias = diasRestantes(p.data_vencimento)

          return (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4">
              {/* Ícone de status */}
              {p.concluido
                ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                : dias < 0 || dias === 0
                ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                : <Circle className="w-5 h-5 text-slate-300 shrink-0" />
              }

              {/* Dados */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${p.concluido ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {p.descricao}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                  {processo && (
                    <Link href={`/processos/${processo.id}`} className="hover:text-amber-600 font-mono">
                      {processo.numero_cnj}
                    </Link>
                  )}
                  {cliente?.nome && <span>· {cliente.nome}</span>}
                  <span>· {p.quantidade_dias} dias {p.dias_uteis ? 'úteis' : 'corridos'}</span>
                </div>
              </div>

              {/* Badge + ação */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${corBadge(dias, p.concluido)}`}>
                    {textoBadge(dias, p.concluido)}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{formatarData(p.data_vencimento)}</p>
                </div>

                {/* Botões de ação */}
                {!p.concluido ? (
                  <form action={async () => {
                    'use server'
                    await concluirPrazo(p.id)
                  }}>
                    <button
                      type="submit"
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg transition-colors"
                    >
                      Concluir
                    </button>
                  </form>
                ) : (
                  <form action={async () => {
                    'use server'
                    await reabrirPrazo(p.id)
                  }}>
                    <button
                      type="submit"
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-500 px-2 py-1 rounded-lg transition-colors"
                    >
                      Reabrir
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
