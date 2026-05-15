import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { concluirEvento, excluirEvento, criarEvento } from '@/lib/actions/agenda'
import Link from 'next/link'
import { Calendar, Plus, CheckCircle2, Trash2, Clock, Users, Scale, FileText, AlertCircle, Pencil } from 'lucide-react'

const TIPO_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  audiencia: { label: 'Audiência', cls: 'bg-red-100 text-red-700 border-red-200', icon: Scale },
  prazo: { label: 'Prazo', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
  providencia: { label: 'Providência', cls: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
  reuniao: { label: 'Reunião', cls: 'bg-purple-100 text-purple-700 border-purple-200', icon: Users },
  outro: { label: 'Outro', cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: Calendar },
}

function formatarDataHora(d: string, diaInteiro?: boolean) {
  const dt = new Date(d)
  if (diaInteiro) return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function isHoje(d: string) {
  return new Date(d).toDateString() === new Date().toDateString()
}

function isPassado(d: string) {
  return new Date(d) < new Date()
}

export default async function AgendaPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const em30Dias = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const ha30Dias = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: eventos }, { data: membros }, { data: processos }] = await Promise.all([
    supabase
      .from('agenda_eventos')
      .select(`
        id, titulo, tipo, descricao, data_inicio, dia_todo, concluido, criado_em,
        processos(id, numero_cnj),
        membros_escritorio(id, nome)
      `)
      .eq('escritorio_id', escritorioId)
      .gte('data_inicio', ha30Dias)
      .lte('data_inicio', em30Dias)
      .order('data_inicio', { ascending: true }),

    supabase
      .from('membros_escritorio')
      .select('id, nome')
      .eq('escritorio_id', escritorioId)
      .order('nome'),

    supabase
      .from('processos')
      .select('id, numero_cnj')
      .eq('escritorio_id', escritorioId)
      .eq('status', 'ativo')
      .order('numero_cnj'),
  ])

  async function handleCriarEvento(formData: FormData) {
    'use server'
    await criarEvento(formData)
  }

  const pendentes = eventos?.filter(e => !e.concluido && !isPassado(e.data_inicio)) ?? []
  const atrasados = eventos?.filter(e => !e.concluido && isPassado(e.data_inicio)) ?? []
  const concluidos = eventos?.filter(e => e.concluido) ?? []
  const hoje30 = eventos?.filter(e => !e.concluido && isHoje(e.data_inicio)) ?? []

  // Server actions inline
  async function handleConcluir(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await concluirEvento(id)
  }
  async function handleExcluir(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await excluirEvento(id)
  }

  const renderEvento = (e: any) => {
    const cfg = TIPO_CONFIG[e.tipo] ?? TIPO_CONFIG.outro
    const Icon = cfg.icon
    const atrasado = !e.concluido && isPassado(e.data_inicio)
    const hoje_ = isHoje(e.data_inicio)

    return (
      <div
        key={e.id}
        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
          e.concluido ? 'opacity-60 bg-slate-50 border-slate-100' :
          atrasado ? 'bg-red-50 border-red-200' :
          hoje_ ? 'bg-amber-50 border-amber-200' :
          'bg-white border-slate-200'
        }`}
      >
        <div className={`p-2 rounded-lg shrink-0 ${cfg.cls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-semibold ${e.concluido ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                {e.titulo}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatarDataHora(e.data_inicio, e.dia_todo)}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${cfg.cls}`}>{cfg.label}</span>
          </div>
          {e.descricao && <p className="text-xs text-slate-500 mt-1">{e.descricao}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {(e.membros_escritorio as any)?.nome && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {(e.membros_escritorio as any).nome}
              </span>
            )}
            {(e.processos as any)?.numero_cnj && (
              <Link
                href={`/processos/${(e.processos as any).id}`}
                className="text-xs text-amber-600 hover:text-amber-700 font-mono flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                {(e.processos as any).numero_cnj}
              </Link>
            )}
          </div>
        </div>
        {!e.concluido && (
          <div className="flex gap-1 shrink-0">
            <Link
              href={`/agenda/${e.id}/editar`}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <form action={handleConcluir}>
              <input type="hidden" name="id" value={e.id} />
              <button
                type="submit"
                className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                title="Concluir"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
            <form action={handleExcluir}>
              <input type="hidden" name="id" value={e.id} />
              <button
                type="submit"
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500 text-sm mt-1">Audiências, prazos e providências</p>
        </div>
        <a
          href="/api/agenda/exportar"
          download="jurivox-agenda.ics"
          className="flex items-center gap-2 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg text-slate-600 transition-colors shrink-0"
        >
          Exportar .ics
        </a>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Hoje', valor: hoje30.length, cls: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Pendentes', valor: pendentes.length, cls: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Atrasados', valor: atrasados.length, cls: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Concluídos', valor: concluidos.length, cls: 'text-green-700', bg: 'bg-green-50' },
        ].map(({ label, valor, cls, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 border border-slate-100`}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${cls}`}>{valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Novo evento */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Evento
          </h2>
          <form action={handleCriarEvento} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
              <input
                name="titulo"
                type="text"
                required
                placeholder="Ex: Audiência de Conciliação"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select
                name="tipo"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="audiencia">Audiência</option>
                <option value="prazo">Prazo</option>
                <option value="providencia">Providência</option>
                <option value="reuniao">Reunião</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Data *</label>
                <input
                  name="data_inicio"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hora</label>
                <input
                  name="hora"
                  type="time"
                  defaultValue="09:00"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
              <select
                name="responsavel_id"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Selecionar...</option>
                {membros?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Processo</label>
              <select
                name="processo_id"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Nenhum</option>
                {processos?.map(p => <option key={p.id} value={p.id}>{p.numero_cnj}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
              <textarea
                name="descricao"
                rows={2}
                placeholder="Detalhes adicionais..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Criar Evento
            </button>
          </form>
        </div>

        {/* Lista de eventos */}
        <div className="xl:col-span-3 space-y-4">
          {atrasados.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Atrasados ({atrasados.length})
              </h3>
              <div className="space-y-2">{atrasados.map(renderEvento)}</div>
            </div>
          )}

          {pendentes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Próximos ({pendentes.length})
              </h3>
              <div className="space-y-2">{pendentes.map(renderEvento)}</div>
            </div>
          )}

          {concluidos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Concluídos ({concluidos.length})
              </h3>
              <div className="space-y-2">{concluidos.map(renderEvento)}</div>
            </div>
          )}

          {!eventos?.length && (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nenhum evento nos próximos 30 dias.</p>
              <p className="text-xs text-slate-300 mt-1">Use o formulário ao lado para criar seu primeiro evento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
