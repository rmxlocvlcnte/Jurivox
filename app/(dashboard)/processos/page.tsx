// -----------------------------------------------
// PROCESSOS — Lista todos os processos do escritório
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Plus, ChevronRight } from 'lucide-react'

const COR_STATUS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  arquivado: 'bg-slate-100 text-slate-600',
  encerrado: 'bg-red-100 text-red-700',
}

const LABEL_AREA: Record<string, string> = {
  civil: 'Cível',
  criminal: 'Criminal',
  trabalhista: 'Trabalhista',
  previdenciario: 'Previdenciário',
  tributario: 'Tributário',
  outro: 'Outro',
}

export default async function ProcessosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const { data: processos } = await supabase
    .from('processos')
    .select(`
      id, numero_cnj, tribunal, vara, classe, area_juridica, status, criado_em,
      clientes(nome)
    `)
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Processos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {processos?.length ?? 0} processo{(processos?.length ?? 0) !== 1 ? 's' : ''} cadastrado{(processos?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/processos/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Processo
        </Link>
      </div>

      {/* Lista de processos */}
      {!processos?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-600 font-medium">Nenhum processo cadastrado</h3>
          <p className="text-slate-400 text-sm mt-1">Comece cadastrando o primeiro processo do escritório.</p>
          <Link
            href="/processos/novo"
            className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Cadastrar Processo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {processos.map((p) => {
              const cliente = p.clientes as any
              return (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Ícone */}
                  <div className="bg-slate-100 p-2 rounded-lg shrink-0">
                    <FolderOpen className="w-5 h-5 text-slate-500" />
                  </div>

                  {/* Dados principais */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-mono font-medium text-slate-900">{p.numero_cnj}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {p.status}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {LABEL_AREA[p.area_juridica] ?? p.area_juridica}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {cliente?.nome ?? 'Sem cliente'} · {p.tribunal}{p.vara ? ` — ${p.vara}` : ''}
                    </p>
                  </div>

                  {/* Seta */}
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
