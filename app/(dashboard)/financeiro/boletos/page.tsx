import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, ExternalLink, RefreshCw,
  QrCode, X, Banknote, TrendingUp,
} from 'lucide-react'
import { criarBoleto, cancelarBoleto, sincronizarStatusBoleto } from '@/lib/actions/boletos'
import { MP_STATUS_LABEL, MP_STATUS_COR } from '@/lib/mercadopago'

// Status internos do banco mapeados para MP
const STATUS_LABEL: Record<string, string> = {
  PENDING:  MP_STATUS_LABEL.pending,
  RECEIVED: MP_STATUS_LABEL.approved,
  CONFIRMED: MP_STATUS_LABEL.approved,
  RECEIVED_IN_CASH: 'Recebido em dinheiro',
  CANCELED: MP_STATUS_LABEL.cancelled,
  REFUNDED: MP_STATUS_LABEL.refunded,
  OVERDUE:  'Vencido',
}

const STATUS_COR: Record<string, string> = {
  PENDING:  MP_STATUS_COR.pending,
  RECEIVED: MP_STATUS_COR.approved,
  CONFIRMED: MP_STATUS_COR.approved,
  RECEIVED_IN_CASH: MP_STATUS_COR.approved,
  CANCELED: MP_STATUS_COR.cancelled,
  REFUNDED: MP_STATUS_COR.refunded,
  OVERDUE:  'bg-red-100 text-red-700',
}

export default async function BoletosPage() {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const podeEmitir = ['socio', 'admin', 'advogado'].includes(cargo ?? '')

  const { data: boletos } = await supabase
    .from('boletos')
    .select(`
      id, descricao, valor, data_vencimento, tipo, status,
      url_boleto, url_invoice, criado_em,
      clientes(nome, cpf)
    `)
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })
    .limit(50)

  // Clientes com CPF e e-mail (MP exige os dois)
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome, cpf, email')
    .eq('escritorio_id', escritorioId)
    .not('cpf', 'is', null)
    .not('email', 'is', null)
    .order('nome')

  const totalPendente = boletos?.filter(b => b.status === 'PENDING').reduce((s, b) => s + Number(b.valor), 0) ?? 0
  const totalRecebido = boletos?.filter(b => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(b.status)).reduce((s, b) => s + Number(b.valor), 0) ?? 0
  const mpConfigurado = !!(process.env.MP_ACCESS_TOKEN && process.env.MP_ACCESS_TOKEN !== 'SEU_MP_ACCESS_TOKEN')
  const isSandbox = process.env.MP_ACCESS_TOKEN?.startsWith('TEST-')

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtData = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

  const criarBoletoAction = async (formData: FormData) => {
    'use server'
    await criarBoleto(formData)
  }
  const sincronizarStatusAction = async (boletoId: string) => {
    'use server'
    await sincronizarStatusBoleto(boletoId)
  }
  const cancelarBoletoAction = async (boletoId: string) => {
    'use server'
    await cancelarBoleto(boletoId)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/financeiro" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Boletos & Pix</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cobranças via Mercado Pago
              {isSandbox && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Sandbox</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Aviso se MP não configurado */}
      {!mpConfigurado && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Banknote className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Configure o Mercado Pago para emitir cobranças</p>
            <p className="text-amber-700 text-xs mt-1">
              Adicione <code className="bg-amber-100 px-1 rounded">MP_ACCESS_TOKEN</code> no <code>.env.local</code>.{' '}
              Para testes, use um token <code className="bg-amber-100 px-1 rounded">TEST-xxx</code>.{' '}
              <a href="https://www.mercadopago.com.br/developers/pt/docs/getting-started" target="_blank" rel="noreferrer" className="underline">
                Ver documentação →
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Totais */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total pendente',  valor: fmt(totalPendente),              cor: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
          { label: 'Total recebido',  valor: fmt(totalRecebido),              cor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Total emitido',   valor: fmt(totalPendente + totalRecebido), cor: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.cor}`}>{c.valor}</p>
          </div>
        ))}
      </div>

      {/* Formulário nova cobrança */}
      {podeEmitir && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-amber-500" />
            Nova Cobrança
          </h2>
          <form action={criarBoletoAction} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Cliente *</label>
              <select
                name="cliente_id"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="">Selecione o cliente (deve ter CPF e e-mail)</option>
                {clientes?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.cpf}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Apenas clientes com CPF/CNPJ e e-mail cadastrados aparecem aqui.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Descrição *</label>
              <input
                name="descricao"
                required
                placeholder="Ex: Honorários advocatícios — Janeiro 2025"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Vencimento *</label>
              <input
                name="data_vencimento"
                type="date"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select
                name="tipo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="BOLETO">Boleto Bancário</option>
                <option value="PIX">Pix</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Emitir Cobrança
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Lista */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Cobranças emitidas</h2>
          <span className="text-xs text-slate-400">{boletos?.length ?? 0} cobranças</span>
        </div>

        {!boletos?.length ? (
          <div className="py-16 text-center">
            <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nenhuma cobrança emitida ainda.</p>
            <p className="text-slate-400 text-xs mt-1">Use o formulário acima para criar a primeira.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {boletos.map((b) => {
              const cliente = b.clientes as unknown as { nome: string; cpf: string | null } | null
              const vencido = b.status === 'PENDING' && new Date(b.data_vencimento) < new Date()
              const statusKey = vencido ? 'OVERDUE' : b.status
              const statusLabel = STATUS_LABEL[statusKey] ?? b.status
              const statusCor = STATUS_COR[statusKey] ?? 'bg-slate-100 text-slate-600'

              return (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800 text-sm truncate">{b.descricao}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCor}`}>
                        {statusLabel}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {b.tipo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cliente?.nome ?? '—'} · Vence {fmtData(b.data_vencimento)}
                    </p>
                  </div>

                  <p className="font-bold text-slate-800 shrink-0">
                    {Number(b.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>

                  <div className="flex items-center gap-1 shrink-0">
                    {b.url_invoice && (
                      <a
                        href={b.url_invoice}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver fatura"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}

                    {b.tipo === 'PIX' && b.status === 'PENDING' && (
                      <a
                        href={`/financeiro/boletos/${b.id}/pix`}
                        title="Ver QR Code Pix"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                      </a>
                    )}

                    <form action={sincronizarStatusAction.bind(null, b.id)}>
                      <button
                        type="submit"
                        title="Sincronizar status com Mercado Pago"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </form>

                    {['PENDING'].includes(b.status) && podeEmitir && (
                      <form action={cancelarBoletoAction.bind(null, b.id)}>
                        <button
                          type="submit"
                          title="Cancelar cobrança"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
