import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { atualizarEvento } from '@/lib/actions/agenda'

function toDateParts(dataInicio: string) {
  const d = new Date(dataInicio)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return { data: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${min}` }
}

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const [{ data: evento }, { data: membros }, { data: processos }] = await Promise.all([
    supabase
      .from('agenda_eventos')
      .select('id, titulo, tipo, descricao, data_inicio, dia_todo, responsavel_id, processo_id')
      .eq('id', id)
      .eq('escritorio_id', escritorioId)
      .single(),
    supabase.from('membros_escritorio').select('id, nome').eq('escritorio_id', escritorioId).order('nome'),
    supabase.from('processos').select('id, numero_cnj').eq('escritorio_id', escritorioId).order('numero_cnj'),
  ])

  if (!evento) notFound()

  const parts = toDateParts(evento.data_inicio)

  async function atualizarEsteEvento(formData: FormData) {
    'use server'
    await atualizarEvento(id, formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agenda" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Editar Evento</h1>
          <p className="text-slate-500 text-sm">{evento.titulo}</p>
        </div>
      </div>

      <form action={atualizarEsteEvento} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
          <input
            name="titulo"
            type="text"
            required
            defaultValue={evento.titulo ?? ''}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
          <select
            name="tipo"
            defaultValue={evento.tipo ?? 'outro'}
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
              defaultValue={parts.data}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hora</label>
            <input
              name="hora"
              type="time"
              defaultValue={parts.hora}
              disabled={evento.dia_todo}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" name="dia_todo" defaultChecked={!!evento.dia_todo} />
          Dia todo
        </label>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
          <select
            name="responsavel_id"
            defaultValue={evento.responsavel_id ?? ''}
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
            defaultValue={evento.processo_id ?? ''}
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
            rows={3}
            defaultValue={evento.descricao ?? ''}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/agenda"
            className="flex-1 text-center py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 py-2.5 text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  )
}
