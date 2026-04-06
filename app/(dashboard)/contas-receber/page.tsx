import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { criarConta, registrarRecebimento, cancelarConta } from '@/lib/actions/contas_receber'
import { Plus } from 'lucide-react'
import { ListaContasReceberFiltrada } from '@/components/lista-contas-receber-filtrada'

function formatarMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default async function ContasReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const hoje = new Date().toISOString().split('T')[0]
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const pageSize = 50
  const limit = pageNum * pageSize

  const [{ data: contas, count }, { data: clientes }] = await Promise.all([
    supabase
      .from('contas_receber')
      .select(`
        id, descricao, valor, data_emissao, data_vencimento, data_recebimento,
        status, forma_recebimento, observacoes, criado_em,
        clientes(nome)
      `, { count: 'exact' })
      .eq('escritorio_id', escritorioId)
      .order('data_vencimento', { ascending: true })
      .range(0, limit - 1),

    supabase.from('clientes').select('id, nome').eq('escritorio_id', escritorioId).order('nome'),
  ])

  // Atualiza status de vencidos automaticamente (para exibição)
  const contasComStatus = contas?.map(c => ({
    ...c,
    status: c.status === 'aberto' && c.data_vencimento < hoje ? 'vencido' : c.status,
  })) ?? []

  const totalAberto = contasComStatus.filter(c => c.status === 'aberto').reduce((acc, c) => acc + c.valor, 0)
  const totalVencido = contasComStatus.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0)
  const totalRecebido = contasComStatus.filter(c => c.status === 'recebido').reduce((acc, c) => acc + c.valor, 0)

  async function handleNovaConta(formData: FormData) {
    'use server'
    await criarConta(formData)
  }
  async function handleReceber(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await registrarRecebimento(id, formData)
  }
  async function handleCancelar(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await cancelarConta(id)
  }

  const total = count ?? contasComStatus.length
  const carregados = contasComStatus.length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Contas a Receber</h1>
          <p className="text-slate-500 text-sm mt-1">Faturas e cobranças pendentes</p>
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <p className="text-sm text-slate-500">Em Aberto</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatarMoeda(totalAberto)}</p>
          <p className="text-xs text-slate-400 mt-1">{contasComStatus.filter(c => c.status === 'aberto').length} cobranças</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-5">
          <p className="text-sm text-slate-500">Vencidas</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{formatarMoeda(totalVencido)}</p>
          <p className="text-xs text-slate-400 mt-1">{contasComStatus.filter(c => c.status === 'vencido').length} cobranças</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-5">
          <p className="text-sm text-slate-500">Recebido (total)</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatarMoeda(totalRecebido)}</p>
          <p className="text-xs text-slate-400 mt-1">{contasComStatus.filter(c => c.status === 'recebido').length} pagamentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Nova cobrança */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Cobrança
          </h2>
          <form action={handleNovaConta} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descrição *</label>
              <input
                name="descricao"
                type="text"
                required
                placeholder="Ex: Honorários — Processo X"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
                <input
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vencimento *</label>
                <input
                  name="data_vencimento"
                  type="date"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cliente</label>
              <select
                name="cliente_id"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Selecionar cliente...</option>
                {clientes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
              <textarea
                name="observacoes"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Criar cobrança
            </button>
          </form>
        </div>

        {/* Lista de contas com filtros */}
        <div className="xl:col-span-3">
          <ListaContasReceberFiltrada
            contas={contasComStatus as any}
            hoje={hoje}
            onReceber={handleReceber}
            onCancelar={handleCancelar}
          />
        </div>
      </div>

      {carregados < total && (
        <div className="flex items-center justify-center">
          <Link
            href={`/contas-receber?page=${pageNum + 1}`}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Carregar mais
          </Link>
        </div>
      )}

      {total > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Mostrando {carregados} de {total} cobranças
        </p>
      )}
    </div>
  )
}
