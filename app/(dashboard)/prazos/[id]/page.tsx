// -----------------------------------------------
// DETALHE DO PRAZO
// -----------------------------------------------

import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { concluirPrazo, reabrirPrazo, excluirPrazo } from '@/lib/actions/prazos'
import { ChevronLeft, Clock, CheckCircle, AlertTriangle, Calendar, FileText, Trash2 } from 'lucide-react'

function formatarData(data: string) {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function diasRestantes(dataVencimento: string): number {
  const hoje = new Date()
  const venc = new Date(dataVencimento + 'T12:00:00')
  return Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function PrazoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: prazo } = await supabase
    .from('prazos')
    .select(`
      id, descricao, data_inicio, data_vencimento, quantidade_dias,
      dias_uteis, concluido, concluido_em, criado_em,
      processos(id, numero_cnj, tribunal, vara, area_juridica, clientes(nome, telefone, email))
    `)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!prazo) notFound()

  const processo = prazo.processos as any
  const cliente = processo?.clientes as any
  const dias = diasRestantes(prazo.data_vencimento)

  const statusColor = prazo.concluido
    ? 'bg-green-100 text-green-700 border-green-200'
    : dias < 0 ? 'bg-red-100 text-red-700 border-red-200'
    : dias === 0 ? 'bg-red-100 text-red-700 border-red-200'
    : dias <= 3 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'

  const statusTexto = prazo.concluido
    ? 'Concluído'
    : dias < 0 ? `Vencido há ${Math.abs(dias)} dia(s)`
    : dias === 0 ? 'Vence HOJE'
    : dias === 1 ? '1 dia restante'
    : `${dias} dias restantes`

  async function concluirEstePrazo() {
    'use server'
    await concluirPrazo(id)
  }

  async function reabrirEstePrazo() {
    'use server'
    await reabrirPrazo(id)
  }

  async function excluirEstePrazo() {
    'use server'
    await excluirPrazo(id)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/prazos"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Prazos
        </Link>
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {/* Status badge */}
        <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border mb-4 ${statusColor}`}>
          {prazo.concluido
            ? <CheckCircle className="w-4 h-4" />
            : dias <= 0
            ? <AlertTriangle className="w-4 h-4" />
            : <Clock className="w-4 h-4" />
          }
          {statusTexto}
        </div>

        <h1 className={`text-xl font-bold mb-1 ${prazo.concluido ? 'line-through text-slate-400' : 'text-slate-900'}`}>
          {prazo.descricao}
        </h1>

        {/* Processo vinculado */}
        {processo && (
          <Link
            href={`/processos/${processo.id}`}
            className="text-sm text-amber-600 hover:text-amber-700 font-mono"
          >
            {processo.numero_cnj}
          </Link>
        )}

        {/* Detalhes */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data de início</p>
            <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {formatarData(prazo.data_inicio)}
            </p>
          </div>

          <div className={`rounded-lg p-4 ${prazo.concluido ? 'bg-green-50' : dias <= 3 ? 'bg-red-50' : 'bg-slate-50'}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vencimento</p>
            <p className={`text-sm font-medium flex items-center gap-2 ${prazo.concluido ? 'text-green-700' : dias <= 3 ? 'text-red-700' : 'text-slate-900'}`}>
              <Calendar className="w-4 h-4" />
              {formatarData(prazo.data_vencimento)}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contagem</p>
            <p className="text-sm font-medium text-slate-900">
              {prazo.quantidade_dias} {prazo.dias_uteis ? 'dias úteis' : 'dias corridos'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cadastrado em</p>
            <p className="text-sm font-medium text-slate-900">
              {new Date(prazo.criado_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Conclusão */}
        {prazo.concluido && prazo.concluido_em && (
          <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-green-700">
              ✅ Concluído em {new Date(prazo.concluido_em).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Processo e cliente */}
      {processo && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Processo Vinculado
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Número CNJ</span>
              <Link href={`/processos/${processo.id}`} className="text-sm font-mono font-medium text-amber-600 hover:text-amber-700">
                {processo.numero_cnj}
              </Link>
            </div>
            {processo.tribunal && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Tribunal</span>
                <span className="text-sm text-slate-700">{processo.tribunal}</span>
              </div>
            )}
            {processo.vara && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Vara</span>
                <span className="text-sm text-slate-700">{processo.vara}</span>
              </div>
            )}
            {cliente?.nome && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Cliente</span>
                <span className="text-sm text-slate-700">{cliente.nome}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        {!prazo.concluido ? (
          <form action={concluirEstePrazo}>
            <button
              type="submit"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <CheckCircle className="w-4 h-4" /> Marcar como Concluído
            </button>
          </form>
        ) : (
          <form action={reabrirEstePrazo}>
            <button
              type="submit"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Reabrir Prazo
            </button>
          </form>
        )}

        <form action={excluirEstePrazo}>
          <button
            type="submit"
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
        </form>
      </div>
    </div>
  )
}
