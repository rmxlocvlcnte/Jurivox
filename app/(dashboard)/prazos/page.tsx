// -----------------------------------------------
// PRAZOS — Lista de todos os prazos do escritório
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { concluirPrazo, reabrirPrazo } from '@/lib/actions/prazos'
import { Clock, Plus, CheckCircle, AlertTriangle, Circle } from 'lucide-react'
import { ListaPrazosFiltrada } from '@/components/lista-prazos-filtrada'

function diasRestantes(dataVencimento: string): number {
  const hoje = new Date()
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function PrazosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: prazos } = await supabase
    .from('prazos')
    .select(`
      id, descricao, data_inicio, data_vencimento, quantidade_dias,
      dias_uteis, concluido, concluido_em,
      processos(id, numero_cnj, tribunal, clientes(nome))
    `)
    .eq('escritorio_id', escritorioId)
    .order('concluido', { ascending: true })
    .order('data_vencimento', { ascending: true })
    .limit(500)

  const lista = prazos ?? []
  const vencidos = lista.filter(p => !p.concluido && diasRestantes(p.data_vencimento) < 0)
  const hoje = lista.filter(p => !p.concluido && diasRestantes(p.data_vencimento) === 0)
  const proximos = lista.filter(p => !p.concluido && diasRestantes(p.data_vencimento) > 0 && diasRestantes(p.data_vencimento) <= 7)

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
      {lista.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-600 font-medium">Nenhum prazo cadastrado</h3>
          <p className="text-slate-400 text-sm mt-1">Cadastre prazos para não perder datas importantes.</p>
          <Link href="/prazos/novo" className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> Cadastrar Prazo
          </Link>
        </div>
      ) : (
        <ListaPrazosFiltrada prazos={lista as any} acoesConcluir={null} acoesReabrir={null} />
      )}
    </div>
  )
}
