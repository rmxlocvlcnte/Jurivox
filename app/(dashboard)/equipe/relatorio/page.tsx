import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, FolderOpen, CheckCircle, Users } from 'lucide-react'

const CARGO_LABEL: Record<string, string> = {
  socio: 'Sócio', admin: 'Admin', advogado: 'Advogado', estagiario: 'Estagiário',
}

function nomeMes(data: Date) {
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default async function RelatorioEquipePage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const [
    { data: membros },
    { data: horasMes },
    { data: processos },
    { data: prazos },
  ] = await Promise.all([
    supabase
      .from('membros_escritorio')
      .select('id, nome, email, cargo')
      .eq('escritorio_id', escritorioId)
      .eq('ativo', true)
      .order('nome'),

    supabase
      .from('timesheet_lancamentos')
      .select('membro_id, horas, tipo')
      .eq('escritorio_id', escritorioId)
      .gte('data', inicioMes.split('T')[0])
      .lte('data', fimMes.split('T')[0]),

    supabase
      .from('processos')
      .select('responsavel_id, status')
      .eq('escritorio_id', escritorioId),

    supabase
      .from('prazos')
      .select('concluido, concluido_em')
      .eq('escritorio_id', escritorioId)
      .gte('concluido_em', inicioMes)
      .lte('concluido_em', fimMes),
  ])

  const horasPorMembro = (horasMes ?? []).reduce<Record<string, { produtivo: number; total: number }>>(
    (acc, h) => {
      if (!acc[h.membro_id]) acc[h.membro_id] = { produtivo: 0, total: 0 }
      acc[h.membro_id].total += h.horas
      if (h.tipo === 'produtivo') acc[h.membro_id].produtivo += h.horas
      return acc
    },
    {},
  )

  const processosPorMembro = (processos ?? []).reduce<Record<string, { ativos: number; total: number }>>(
    (acc, p) => {
      const id = p.responsavel_id
      if (!id) return acc
      if (!acc[id]) acc[id] = { ativos: 0, total: 0 }
      acc[id].total++
      if (p.status === 'ativo') acc[id].ativos++
      return acc
    },
    {},
  )

  const prazosConcluidosMes = (prazos ?? []).filter(p => p.concluido).length

  const totalHoras = (horasMes ?? []).reduce((s, h) => s + h.horas, 0)
  const totalAtivos = (processos ?? []).filter(p => p.status === 'ativo').length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/equipe"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Equipe
          </Link>
          <span className="text-slate-300">/</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Relatório de Produtividade</h1>
            <p className="text-sm text-slate-500 mt-0.5">{nomeMes(agora)}</p>
          </div>
        </div>
      </div>

      {/* KPIs do escritório */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Membros ativos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{membros?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Horas no mês</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalHoras.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Processos ativos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalAtivos}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Prazos concluídos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{prazosConcluidosMes}</p>
        </div>
      </div>

      {/* Tabela por membro */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Desempenho por Membro</h2>
          <p className="text-xs text-slate-400 mt-0.5">Horas registradas no timesheet e processos sob responsabilidade</p>
        </div>

        {!membros?.length ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Nenhum membro encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Membro</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Horas (mês)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Horas produtivas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Processos ativos</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total processos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {membros.map(m => {
                  const horas = horasPorMembro[m.id] ?? { produtivo: 0, total: 0 }
                  const procs = processosPorMembro[m.id] ?? { ativos: 0, total: 0 }
                  const pctProdutivo = horas.total > 0 ? Math.round((horas.produtivo / horas.total) * 100) : 0

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="text-amber-700 font-bold text-xs">
                              {m.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{m.nome}</p>
                            <p className="text-xs text-slate-400">{CARGO_LABEL[m.cargo] ?? m.cargo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-slate-900">{horas.total.toFixed(1)}h</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium text-slate-700">{horas.produtivo.toFixed(1)}h</span>
                          {horas.total > 0 && (
                            <div className="flex items-center gap-1.5 w-24">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${pctProdutivo}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{pctProdutivo}%</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-semibold ${procs.ativos > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                          {procs.ativos}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-slate-600">{procs.total}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Dados de horas referentes ao mês atual · prazos concluídos com data de conclusão no mês
      </p>
    </div>
  )
}
