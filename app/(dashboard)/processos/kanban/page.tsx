import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { mudarStatusProcesso } from '@/lib/actions/processos'
import { LayoutGrid, ArrowLeft, Plus } from 'lucide-react'

const AREAS: Record<string, string> = {
  civil: 'Cível', criminal: 'Criminal', trabalhista: 'Trabalhista',
  previdenciario: 'Previdenciário', tributario: 'Tributário', outro: 'Outro',
}

const COLUNAS = [
  {
    status: 'ativo' as const,
    label: 'Ativos',
    headerCor: 'bg-green-500',
    moldura: 'border-green-200',
    fundo: 'bg-green-50',
    proxStatus: 'arquivado' as const,
    proxLabel: 'Arquivar →',
  },
  {
    status: 'arquivado' as const,
    label: 'Arquivados',
    headerCor: 'bg-slate-500',
    moldura: 'border-slate-200',
    fundo: 'bg-slate-50',
    proxStatus: 'encerrado' as const,
    proxLabel: 'Encerrar →',
  },
  {
    status: 'encerrado' as const,
    label: 'Encerrados',
    headerCor: 'bg-red-500',
    moldura: 'border-red-200',
    fundo: 'bg-red-50',
    proxStatus: 'ativo' as const,
    proxLabel: '↺ Reativar',
  },
]

export default async function ProcessosKanbanPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: processos } = await supabase
    .from('processos')
    .select('id, numero_cnj, tribunal, area_juridica, status, clientes(nome)')
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })

  const lista = processos ?? []

  const porStatus = {
    ativo: lista.filter(p => p.status === 'ativo'),
    arquivado: lista.filter(p => p.status === 'arquivado'),
    encerrado: lista.filter(p => p.status === 'encerrado'),
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/processos"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Lista
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
            <h1 className="text-xl font-bold text-slate-900">Kanban de Processos</h1>
          </div>
        </div>
        <Link
          href="/processos/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Processo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {COLUNAS.map(({ status, label, headerCor, moldura, fundo, proxStatus, proxLabel }) => {
          const items = porStatus[status]
          return (
            <div key={status} className={`rounded-xl border ${moldura} ${fundo} overflow-hidden`}>
              <div className={`${headerCor} px-4 py-3 flex items-center justify-between`}>
                <h2 className="font-bold text-white text-sm">{label}</h2>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              <div className="p-3 space-y-2 min-h-[160px]">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">Nenhum processo</p>
                ) : (
                  items.map(p => {
                    const clienteNome = (p.clientes as any)?.nome ?? null
                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-2"
                      >
                        <Link
                          href={`/processos/${p.id}`}
                          className="block hover:text-amber-600 transition-colors"
                        >
                          <p className="text-sm font-mono font-semibold text-slate-900 truncate leading-tight">
                            {p.numero_cnj}
                          </p>
                          {clienteNome && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{clienteNome}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">{p.tribunal}</p>
                        </Link>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                            {AREAS[p.area_juridica] ?? p.area_juridica}
                          </span>
                          <form action={mudarStatusProcesso}>
                            <input type="hidden" name="processo_id" value={p.id} />
                            <input type="hidden" name="status" value={proxStatus} />
                            <button
                              type="submit"
                              className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 px-2 py-0.5 rounded transition-colors"
                            >
                              {proxLabel}
                            </button>
                          </form>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">
        {lista.length} processo{lista.length !== 1 ? 's' : ''} no total · use os botões para mover entre colunas
      </p>
    </div>
  )
}
