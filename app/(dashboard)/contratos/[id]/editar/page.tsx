import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { atualizarContrato } from '@/lib/actions/contratos'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditarContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const [{ data: contrato }, { data: clientes }, { data: processos }, { data: membros }] = await Promise.all([
    supabase
      .from('contratos')
      .select('*')
      .eq('id', id)
      .eq('escritorio_id', escritorioId)
      .single(),
    supabase.from('clientes').select('id, nome').eq('escritorio_id', escritorioId).order('nome'),
    supabase.from('processos').select('id, numero_cnj').eq('escritorio_id', escritorioId).eq('status', 'ativo').order('numero_cnj'),
    supabase.from('membros_escritorio').select('id, nome').eq('escritorio_id', escritorioId).order('nome'),
  ])

  if (!contrato) notFound()

  const tipoDefault = contrato.tipo === 'por_hora' ? 'hora' : (contrato.tipo ?? 'fixo')

  async function atualizarEsteContrato(formData: FormData) {
    'use server'
    await atualizarContrato(id, formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/contratos/${id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Editar Contrato</h1>
          <p className="text-slate-500 text-sm">{contrato.nome}</p>
        </div>
      </div>

      <form action={atualizarEsteContrato} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do contrato *</label>
          <input
            name="nome"
            type="text"
            required
            defaultValue={contrato.nome ?? ''}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de contrato *</label>
            <select
              name="tipo"
              required
              defaultValue={tipoDefault}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              <option value="fixo">Fixo (mensal/único)</option>
              <option value="hora">Por hora</option>
              <option value="exito">Êxito (%)</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              name="status"
              defaultValue={contrato.status ?? 'ativo'}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor fixo (R$)</label>
            <input
              name="valor_fixo"
              type="number"
              step="0.01"
              min="0"
              defaultValue={contrato.valor_fixo ?? ''}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor por hora (R$)</label>
            <input
              name="valor_hora"
              type="number"
              step="0.01"
              min="0"
              defaultValue={contrato.valor_hora ?? ''}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">% de Êxito</label>
          <input
            name="percentual_exito"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={contrato.percentual_exito ?? ''}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
          <select
            name="cliente_id"
            defaultValue={contrato.cliente_id ?? ''}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Selecionar cliente...</option>
            {clientes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Processo vinculado</label>
          <select
            name="processo_id"
            defaultValue={contrato.processo_id ?? ''}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Nenhum processo específico</option>
            {processos?.map(p => <option key={p.id} value={p.id}>{p.numero_cnj}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsável</label>
          <select
            name="responsavel_id"
            defaultValue={contrato.responsavel_id ?? ''}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Selecionar responsável...</option>
            {membros?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de início</label>
            <input
              name="data_inicio"
              type="date"
              defaultValue={contrato.data_inicio ?? ''}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de término</label>
            <input
              name="data_fim"
              type="date"
              defaultValue={contrato.data_fim ?? ''}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações</label>
          <textarea
            name="observacoes"
            rows={3}
            defaultValue={contrato.observacoes ?? ''}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/contratos/${id}`}
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
