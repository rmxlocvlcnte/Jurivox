import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, ChevronRight, Clock, TrendingUp, CheckCircle, PauseCircle } from 'lucide-react'

function formatarMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const TIPO_LABEL: Record<string, string> = {
  fixo: 'Fixo',
  hora: 'Por Hora',
  exito: 'Êxito',
  misto: 'Misto',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  ativo: { label: 'Ativo', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  suspenso: { label: 'Suspenso', cls: 'bg-amber-100 text-amber-700', icon: PauseCircle },
  encerrado: { label: 'Encerrado', cls: 'bg-slate-100 text-slate-600', icon: CheckCircle },
}

export default async function ContratosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: contratos } = await supabase
    .from('contratos')
    .select(`
      id, nome, tipo, status, valor_fixo, valor_hora, percentual_exito, criado_em,
      clientes(nome),
      processos(numero_cnj),
      membros_escritorio(nome)
    `)
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })

  const ativos = contratos?.filter(c => c.status === 'ativo').length ?? 0
  const suspensos = contratos?.filter(c => c.status === 'suspenso').length ?? 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Contratos</h1>
          <p className="text-slate-500 text-sm mt-1">Relações comerciais com clientes</p>
        </div>
        <Link
          href="/contratos/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-3 md:px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Contrato</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', valor: contratos?.length ?? 0, cls: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Ativos', valor: ativos, cls: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Suspensos', valor: suspensos, cls: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Encerrados', valor: (contratos?.length ?? 0) - ativos - suspensos, cls: 'text-slate-500', bg: 'bg-slate-50' },
        ].map(({ label, valor, cls, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 border border-slate-100`}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${cls}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Todos os contratos
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {!contratos?.length ? (
            <div className="px-5 py-10 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhum contrato cadastrado.</p>
              <Link href="/contratos/novo" className="block mt-2 text-amber-600 hover:text-amber-700 text-sm font-medium">
                Cadastrar primeiro contrato →
              </Link>
            </div>
          ) : (
            contratos.map((c) => {
              const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.ativo
              const StatusIcon = cfg.icon
              const valor = c.tipo === 'fixo' ? (c.valor_fixo ? formatarMoeda(c.valor_fixo) : '—')
                : c.tipo === 'hora' ? (c.valor_hora ? `${formatarMoeda(c.valor_hora)}/h` : '—')
                : c.tipo === 'exito' ? (c.percentual_exito ? `${c.percentual_exito}%` : '—')
                : '—'

              return (
                <Link
                  key={c.id}
                  href={`/contratos/${c.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.nome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(c.clientes as any)?.nome ?? 'Sem cliente'}
                      {(c.processos as any)?.numero_cnj && (
                        <span className="font-mono"> · {(c.processos as any).numero_cnj}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-800">{valor}</p>
                      <p className="text-xs text-slate-400">{TIPO_LABEL[c.tipo] ?? c.tipo}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${cfg.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
