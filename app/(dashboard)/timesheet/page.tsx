import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { excluirLancamento, duplicarLancamento } from '@/lib/actions/timesheet'
import { Clock, Plus, Copy, Trash2 } from 'lucide-react'
import { TimesheetForm } from '@/components/timesheet/TimesheetForm'

function formatarHoras(h: number) {
  const horas = Math.floor(h)
  const min = Math.round((h - horas) * 60)
  if (min === 0) return `${horas}h`
  return `${horas}h${min.toString().padStart(2, '0')}`
}

function formatarData(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; membro?: string }>
}) {
  const { mes: mesParam, membro: membroParam } = await searchParams
  const { escritorioId, membroId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase || !membroId) redirect('/onboarding')

  // Mês atual ou selecionado
  const hoje = new Date()
  const [anoStr, mesStr] = mesParam ? mesParam.split('-') : [hoje.getFullYear().toString(), (hoje.getMonth() + 1).toString().padStart(2, '0')]
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)
  const inicioMes = `${ano}-${mesStr.padStart(2, '0')}-01`
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]

  const membroFiltrado = membroParam || membroId

  const [{ data: lancamentos }, { data: membros }, { data: contratos }, { data: processos }] = await Promise.all([
    supabase
      .from('timesheet_lancamentos')
      .select(`
        id, data, horas, descricao, tipo, criado_em,
        contratos(nome),
        processos(numero_cnj),
        membros_escritorio(nome)
      `)
      .eq('escritorio_id', escritorioId)
      .eq('membro_id', membroFiltrado)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data', { ascending: false }),

    supabase.from('membros_escritorio').select('id, nome').eq('escritorio_id', escritorioId).order('nome'),
    supabase.from('contratos').select('id, nome').eq('escritorio_id', escritorioId).eq('status', 'ativo').order('nome'),
    supabase.from('processos').select('id, numero_cnj').eq('escritorio_id', escritorioId).eq('status', 'ativo').order('numero_cnj'),
  ])

  const totalHoras = lancamentos?.reduce((acc, l) => acc + (l.horas ?? 0), 0) ?? 0
  const totalProdutivo = lancamentos?.filter(l => l.tipo === 'produtivo').reduce((acc, l) => acc + (l.horas ?? 0), 0) ?? 0

  // Mês anterior / próximo
  const mesAnterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${(mes - 1).toString().padStart(2, '0')}`
  const mesSeguinte = mes === 12 ? `${ano + 1}-01` : `${ano}-${(mes + 1).toString().padStart(2, '0')}`
  const mesAtual = `${ano}-${mesStr.padStart(2, '0')}`
  const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  async function handleExcluir(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await excluirLancamento(id)
  }
  async function handleDuplicar(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await duplicarLancamento(id)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Timesheet</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">{nomeMes}</p>
        </div>
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center gap-3">
        <a
          href={`/timesheet?mes=${mesAnterior}`}
          className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          ← Anterior
        </a>
        <span className="text-sm font-semibold text-slate-800 capitalize">{nomeMes}</span>
        <a
          href={`/timesheet?mes=${mesSeguinte}`}
          className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Próximo →
        </a>
      </div>

      {/* Filtro por membro */}
      {(membros?.length ?? 0) > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {membros?.map(m => (
            <a
              key={m.id}
              href={`/timesheet?mes=${mesAtual}&membro=${m.id}`}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                membroFiltrado === m.id
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m.nome}
            </a>
          ))}
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total de horas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatarHoras(totalHoras)}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <p className="text-xs text-slate-500">Produtivas</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatarHoras(totalProdutivo)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">Lançamentos</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{lancamentos?.length ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Novo lançamento */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Lançamento
          </h2>
          <TimesheetForm contratos={(contratos ?? []) as any} processos={(processos ?? []) as any} />
        </div>

        {/* Lista de lançamentos */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Lançamentos — {nomeMes}
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {!lancamentos?.length ? (
              <div className="px-5 py-10 text-center">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum lançamento neste mês.</p>
              </div>
            ) : (
              lancamentos.map((l) => (
                <div key={l.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="text-center w-12 shrink-0">
                    <p className="text-lg font-bold text-slate-800">{formatarHoras(l.horas)}</p>
                    <p className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${
                      l.tipo === 'produtivo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {l.tipo === 'produtivo' ? 'prod.' : 'n.prod.'}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{l.descricao}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatarData(l.data)}</p>
                    {((l.contratos as any)?.nome || (l.processos as any)?.numero_cnj) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(l.contratos as any)?.nome}
                        {(l.processos as any)?.numero_cnj && (
                          <span className="font-mono"> · {(l.processos as any).numero_cnj}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <form action={handleDuplicar}>
                      <input type="hidden" name="id" value={l.id} />
                      <button type="submit" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Duplicar para hoje">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </form>
                    <form action={handleExcluir}>
                      <input type="hidden" name="id" value={l.id} />
                      <button type="submit" className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
