import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { excluirContrato } from '@/lib/actions/contratos'
import Link from 'next/link'
import { ArrowLeft, FileText, User, Calendar, DollarSign, Trash2, Edit2 } from 'lucide-react'

function formatarMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatarData(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

const TIPO_LABEL: Record<string, string> = {
  fixo: 'Fixo',
  hora: 'Por Hora',
  exito: 'Êxito',
  misto: 'Misto',
}

const STATUS_CLS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  suspenso: 'bg-amber-100 text-amber-700',
  encerrado: 'bg-slate-100 text-slate-600',
}

export default async function ContratoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: contrato } = await supabase
    .from('contratos')
    .select(`
      *,
      clientes(id, nome),
      processos(id, numero_cnj, tribunal),
      membros_escritorio(nome)
    `)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!contrato) redirect('/contratos')

  async function handleExcluir() {
    'use server'
    await excluirContrato(id)
  }

  const valor = contrato.tipo === 'fixo' ? (contrato.valor_fixo ? formatarMoeda(contrato.valor_fixo) : '—')
    : contrato.tipo === 'hora' ? (contrato.valor_hora ? `${formatarMoeda(contrato.valor_hora)}/h` : '—')
    : contrato.tipo === 'exito' ? (contrato.percentual_exito ? `${contrato.percentual_exito}%` : '—')
    : '—'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/contratos" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{contrato.nome}</h1>
            <p className="text-slate-500 text-sm">{TIPO_LABEL[contrato.tipo]} · {(contrato.clientes as any)?.nome ?? 'Sem cliente'}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLS[contrato.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {contrato.status.charAt(0).toUpperCase() + contrato.status.slice(1)}
        </span>
      </div>

      {/* Detalhes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Detalhes do contrato</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
          <div className="flex items-start gap-3">
            <DollarSign className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Valor</p>
              <p className="text-sm font-semibold text-slate-900">{valor}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Tipo</p>
              <p className="text-sm font-semibold text-slate-900">{TIPO_LABEL[contrato.tipo]}</p>
            </div>
          </div>
          {(contrato.clientes as any)?.nome && (
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Cliente</p>
                <Link
                  href={`/clientes/${(contrato.clientes as any).id}`}
                  className="text-sm font-semibold text-amber-600 hover:text-amber-700"
                >
                  {(contrato.clientes as any).nome}
                </Link>
              </div>
            </div>
          )}
          {(contrato.membros_escritorio as any)?.nome && (
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Responsável</p>
                <p className="text-sm font-semibold text-slate-900">{(contrato.membros_escritorio as any).nome}</p>
              </div>
            </div>
          )}
          {contrato.data_inicio && (
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Período</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatarData(contrato.data_inicio)}
                  {contrato.data_fim && ` → ${formatarData(contrato.data_fim)}`}
                </p>
              </div>
            </div>
          )}
          {(contrato.processos as any)?.numero_cnj && (
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Processo</p>
                <Link
                  href={`/processos/${(contrato.processos as any).id}`}
                  className="text-sm font-mono font-semibold text-amber-600 hover:text-amber-700"
                >
                  {(contrato.processos as any).numero_cnj}
                </Link>
              </div>
            </div>
          )}
        </div>
        {contrato.observacoes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Observações</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{contrato.observacoes}</p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <form action={handleExcluir} className="flex-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            onClick={(e) => { if (!confirm('Excluir este contrato?')) e.preventDefault() }}
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </form>
      </div>
    </div>
  )
}
