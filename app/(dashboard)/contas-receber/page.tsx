import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { criarConta, registrarRecebimento, cancelarConta } from '@/lib/actions/contas_receber'
import { DollarSign, Plus, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react'

function formatarMoeda(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatarData(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  aberto: { label: 'Em Aberto', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  recebido: { label: 'Recebido', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  vencido: { label: 'Vencido', cls: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500', icon: XCircle },
}

export default async function ContasReceberPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const hoje = new Date().toISOString().split('T')[0]

  const [{ data: contas }, { data: clientes }] = await Promise.all([
    supabase
      .from('contas_receber')
      .select(`
        id, descricao, valor, data_emissao, data_vencimento, data_recebimento,
        status, forma_recebimento, observacoes, criado_em,
        clientes(nome)
      `)
      .eq('escritorio_id', escritorioId)
      .order('data_vencimento', { ascending: true }),

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

        {/* Lista de contas */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Cobranças
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {!contasComStatus.length ? (
              <div className="px-5 py-10 text-center">
                <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhuma cobrança cadastrada.</p>
              </div>
            ) : (
              contasComStatus.map((c) => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.aberto
                const Icon = cfg.icon
                return (
                  <div key={c.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.descricao}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${cfg.cls}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {(c.clientes as any)?.nome && `${(c.clientes as any).nome} · `}
                          Vence: {formatarData(c.data_vencimento)}
                          {c.data_recebimento && ` · Recebido: ${formatarData(c.data_recebimento)}`}
                        </p>
                        {c.observacoes && <p className="text-xs text-slate-400 mt-0.5">{c.observacoes}</p>}
                      </div>
                      <p className="text-base font-bold text-slate-900 shrink-0">{formatarMoeda(c.valor)}</p>
                    </div>

                    {(c.status === 'aberto' || c.status === 'vencido') && (
                      <div className="flex gap-2 mt-3">
                        <form action={handleReceber} className="flex-1">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="data_recebimento" value={hoje} />
                          <input type="hidden" name="forma_recebimento" value="pix" />
                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar recebido
                          </button>
                        </form>
                        <form action={handleCancelar}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
