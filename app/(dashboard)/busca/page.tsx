// -----------------------------------------------
// BUSCA GLOBAL — Full-text search em todas entidades
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, FolderOpen, Users, ChevronRight, Clock, FileText, Calendar } from 'lucide-react'

function formatarData(data: string) {
  const d = data.includes('T') ? new Date(data) : new Date(data + 'T12:00:00')
  return d.toLocaleDateString('pt-BR')
}

// Detecta se é busca por número CNJ ou CPF (sem espaços, só dígitos e pontos/hífen)
function _pareceCNJouCPF(termo: string) {
  return /^\d[\d.\-/]*\d$/.test(termo.replace(/\s/g, ''))
}

async function buscarEntidade(
  supabase: any,
  tabela: string,
  select: string,
  escritorioId: string,
  termo: string,
  camposIlike: string[],
) {
  // Tenta FTS primeiro
  try {
    const { data, error } = await supabase
      .from(tabela)
      .select(select)
      .eq('escritorio_id', escritorioId)
      .textSearch('fts', termo, { type: 'websearch', config: 'portuguese' })
      .limit(15)

    if (!error && data) return data
  } catch {}

  // Fallback para ilike em múltiplos campos
  const filtros = camposIlike.map(c => `${c}.ilike.%${termo}%`).join(',')
  const { data } = await supabase
    .from(tabela)
    .select(select)
    .eq('escritorio_id', escritorioId)
    .or(filtros)
    .limit(15)

  return data ?? []
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>
}) {
  const { q: query, tipo } = await searchParams
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const termo = query?.trim() ?? ''

  let processos: any[] = []
  let clientes: any[] = []
  let prazos: any[] = []
  let contratos: any[] = []
  let eventos: any[] = []

  if (termo.length >= 2) {
    const filtroTipo = tipo ?? 'todos'
    const buscaTodos = filtroTipo === 'todos'

    const [p, c, pr, ct, ag] = await Promise.all([
      (buscaTodos || filtroTipo === 'processos')
        ? buscarEntidade(
            supabase,
            'processos',
            'id, numero_cnj, tribunal, vara, area_juridica, status, clientes(nome)',
            escritorioId,
            termo,
            ['numero_cnj', 'tribunal', 'classe', 'assunto'],
          )
        : Promise.resolve([]),

      (buscaTodos || filtroTipo === 'clientes')
        ? buscarEntidade(
            supabase,
            'clientes',
            'id, nome, cpf, telefone, email',
            escritorioId,
            termo,
            ['nome', 'cpf', 'email', 'telefone'],
          )
        : Promise.resolve([]),

      (buscaTodos || filtroTipo === 'prazos')
        ? buscarEntidade(
            supabase,
            'prazos',
            'id, descricao, data_vencimento, concluido, processos(id, numero_cnj, clientes(nome))',
            escritorioId,
            termo,
            ['descricao'],
          )
        : Promise.resolve([]),

      (buscaTodos || filtroTipo === 'contratos')
        ? buscarEntidade(
            supabase,
            'contratos',
            'id, nome, tipo, status, clientes(nome), processos(numero_cnj)',
            escritorioId,
            termo,
            ['nome', 'observacoes'],
          )
        : Promise.resolve([]),

      (buscaTodos || filtroTipo === 'agenda')
        ? buscarEntidade(
            supabase,
            'agenda_eventos',
            'id, titulo, tipo, data_inicio, dia_todo, processos(numero_cnj)',
            escritorioId,
            termo,
            ['titulo', 'descricao'],
          )
        : Promise.resolve([]),
    ])

    processos = p
    clientes = c
    prazos = pr
    contratos = ct
    eventos = ag
  }

  const totalResultados = processos.length + clientes.length + prazos.length + contratos.length + eventos.length
  const LABEL_AREA: Record<string, string> = {
    civil: 'Cível', criminal: 'Criminal', trabalhista: 'Trabalhista',
    previdenciario: 'Previdenciário', tributario: 'Tributário', outro: 'Outro',
  }

  const FILTROS = [
    { value: 'todos', label: 'Todos' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'processos', label: 'Processos' },
    { value: 'prazos', label: 'Prazos' },
    { value: 'contratos', label: 'Contratos' },
    { value: 'agenda', label: 'Agenda' },
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Busca Global</h1>
        <p className="text-slate-500 text-sm mt-1">Pesquise processos, clientes, prazos, contratos e eventos</p>
      </div>

      {/* Formulário de busca */}
      <form method="GET" action="/busca" className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="q"
              type="search"
              defaultValue={termo}
              placeholder="Nome, CPF, número CNJ, descrição..."
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
        </div>

        {/* Filtros por tipo */}
        {termo.length >= 2 && (
          <div className="flex items-center gap-2 flex-wrap">
            {FILTROS.map(f => (
              <Link
                key={f.value}
                href={`/busca?q=${encodeURIComponent(termo)}&tipo=${f.value}`}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  (tipo ?? 'todos') === f.value
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        )}
      </form>

      {/* Estado vazio */}
      {!termo && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Digite pelo menos 2 caracteres para buscar</p>
          <p className="text-slate-300 text-xs mt-1">Busca inteligente em processos, clientes, prazos, contratos e agenda</p>
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
          <p className="text-slate-400 text-sm mt-1">Tente buscar por outro termo ou mude o filtro</p>
        </div>
      )}

      {termo.length >= 2 && totalResultados > 0 && (
        <p className="text-xs text-slate-400">
          {totalResultados} resultado{totalResultados !== 1 ? 's' : ''} para <span className="font-medium text-slate-600">&quot;{termo}&quot;</span>
        </p>
      )}

      {/* ── Clientes ── */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700">Clientes ({clientes.length})</h2>
            </div>
            <Link href="/clientes" className="text-xs text-amber-600 hover:text-amber-700">Ver todos →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {clientes.map((c) => (
              <Link key={c.id} href={`/clientes/${c.id}`}
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

      {/* ── Processos ── */}
      {processos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700">Processos ({processos.length})</h2>
            </div>
            <Link href="/processos" className="text-xs text-amber-600 hover:text-amber-700">Ver todos →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {processos.map((p) => {
              const cliente = p.clientes as any
              return (
                <Link key={p.id} href={`/processos/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium text-slate-900">{p.numero_cnj}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cliente?.nome ?? 'Sem cliente'} · {p.tribunal} · {LABEL_AREA[p.area_juridica] ?? p.area_juridica}
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

      {/* ── Prazos ── */}
      {prazos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Prazos ({prazos.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {prazos.map((p) => {
              const processo = p.processos as any
              const cliente = processo?.clientes as any
              return (
                <Link key={p.id} href={`/prazos/${p.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{p.descricao}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {processo?.numero_cnj ?? 'Sem processo'}
                      {cliente?.nome && ` · ${cliente.nome}`}
                      {` · Vence em ${formatarData(p.data_vencimento)}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Contratos ── */}
      {contratos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Contratos ({contratos.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {contratos.map((c) => (
              <Link key={c.id} href={`/contratos/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{c.nome}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(c.clientes as any)?.nome ?? 'Sem cliente'}
                    {(c.processos as any)?.numero_cnj && ` · ${(c.processos as any)?.numero_cnj}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Agenda ── */}
      {eventos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Agenda ({eventos.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {eventos.map((e) => (
              <Link key={e.id} href={`/agenda/${e.id}/editar`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{e.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(e.processos as any)?.numero_cnj ?? 'Sem processo'}
                    {` · ${formatarData(e.data_inicio)}`}
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
