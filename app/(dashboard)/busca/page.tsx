// -----------------------------------------------
// BUSCA GLOBAL — Pesquisa processos e clientes
// -----------------------------------------------
// O advogado pode buscar por:
// - Nome do cliente
// - Número CNJ do processo
// - CPF do cliente
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, FolderOpen, Users, ChevronRight } from 'lucide-react'

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: query } = await searchParams
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const termo = query?.trim() ?? ''

  let processos: any[] = []
  let clientes: any[] = []

  if (termo.length >= 2) {
    // Busca processos por número CNJ ou tribunal
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase
        .from('processos')
        .select('id, numero_cnj, tribunal, area_juridica, status, clientes(nome)')
        .eq('escritorio_id', escritorioId)
        .or(`numero_cnj.ilike.%${termo}%,tribunal.ilike.%${termo}%,classe.ilike.%${termo}%`)
        .limit(10),

      supabase
        .from('clientes')
        .select('id, nome, cpf, telefone, email')
        .eq('escritorio_id', escritorioId)
        .or(`nome.ilike.%${termo}%,cpf.ilike.%${termo}%,email.ilike.%${termo}%`)
        .limit(10),
    ])

    processos = p ?? []
    clientes = c ?? []
  }

  const totalResultados = processos.length + clientes.length
  const LABEL_AREA: Record<string, string> = {
    civil: 'Cível', criminal: 'Criminal', trabalhista: 'Trabalhista',
    previdenciario: 'Previdenciário', tributario: 'Tributário', outro: 'Outro',
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Busca Global</h1>
        <p className="text-slate-500 text-sm mt-1">Pesquise processos e clientes por nome, CPF ou número CNJ</p>
      </div>

      {/* Formulário de busca */}
      <form method="GET" action="/busca" className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="q"
            type="search"
            defaultValue={termo}
            placeholder="Nome, CPF, número CNJ..."
            autoFocus
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
          />
        </div>
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Buscar
        </button>
      </form>

      {/* Resultados */}
      {!termo && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Digite pelo menos 2 caracteres para buscar</p>
        </div>
      )}

      {termo && termo.length < 2 && (
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm">Digite pelo menos 2 caracteres</p>
        </div>
      )}

      {termo.length >= 2 && totalResultados === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Nenhum resultado para &quot;{termo}&quot;</p>
          <p className="text-slate-400 text-sm mt-1">Tente buscar por outro termo</p>
        </div>
      )}

      {/* Resultados de processos */}
      {processos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Processos ({processos.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {processos.map((p) => {
              const cliente = p.clientes as any
              return (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium text-slate-900">{p.numero_cnj}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cliente?.nome ?? 'Sem cliente'} · {p.tribunal} ·{' '}
                      {LABEL_AREA[p.area_juridica] ?? p.area_juridica}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {p.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Resultados de clientes */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Clientes ({clientes.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {clientes.map((c) => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-amber-700 font-bold text-xs">{c.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{c.nome}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[c.cpf && `CPF: ${c.cpf}`, c.telefone, c.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
