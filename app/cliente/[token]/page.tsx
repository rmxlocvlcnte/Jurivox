import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Scale, FileText, Calendar, AlertCircle, ChevronDown, Clock } from 'lucide-react'
import { decriptarCliente } from '@/lib/cripto'

export default async function PortalClientePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  // Valida token
  const { data: tokenData } = await supabase
    .from('portal_cliente_tokens')
    .select('id, cliente_id, escritorio_id, expira_em')
    .eq('token', token)
    .maybeSingle()

  if (!tokenData) return notFound()

  // Verifica expiração
  const agora = new Date()
  const expira = new Date(tokenData.expira_em)
  if (agora > expira) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Link expirado</h1>
          <p className="text-slate-500 text-sm">Este link de acesso expirou. Solicite um novo link ao seu advogado.</p>
        </div>
      </div>
    )
  }

  // Registra último acesso
  await supabase
    .from('portal_cliente_tokens')
    .update({ ultimo_acesso: new Date().toISOString() })
    .eq('id', tokenData.id)

  // Busca dados do cliente
  const [{ data: cliente }, { data: processos }, { data: prazos }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, nome, email, telefone')
      .eq('id', tokenData.cliente_id)
      .maybeSingle(),
    supabase
      .from('processos')
      .select('id, numero_cnj, tribunal, classe, area_juridica, status, criado_em')
      .eq('cliente_id', tokenData.cliente_id)
      .eq('escritorio_id', tokenData.escritorio_id)
      .order('criado_em', { ascending: false }),
    supabase
      .from('prazos')
      .select('id, descricao, data_vencimento, concluido, processo_id')
      .eq('escritorio_id', tokenData.escritorio_id)
      .eq('concluido', false)
      .order('data_vencimento', { ascending: true })
      .limit(10),
  ])

  // Busca movimentações dos processos do cliente (últimas 5 por processo)
  const processoIds = (processos ?? []).map(p => p.id)
  const { data: movimentacoes } = processoIds.length
    ? await supabase
        .from('movimentacoes')
        .select('id, processo_id, tipo, descricao, data_movimentacao')
        .in('processo_id', processoIds)
        .order('data_movimentacao', { ascending: false })
        .limit(50)
    : { data: [] as any[] }

  // Agrupa movimentações por processo (máx 5 por processo)
  const movsPorProcesso: Record<string, typeof movimentacoes> = {}
  for (const mov of movimentacoes ?? []) {
    if (!movsPorProcesso[mov.processo_id]) movsPorProcesso[mov.processo_id] = []
    if (movsPorProcesso[mov.processo_id]!.length < 5) {
      movsPorProcesso[mov.processo_id]!.push(mov)
    }
  }

  if (!cliente) return notFound()
  const clientePortal = decriptarCliente(cliente)

  const { data: escritorio } = await supabase
    .from('escritorios')
    .select('nome')
    .eq('id', tokenData.escritorio_id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Portal do Cliente</p>
            <p className="text-sm font-semibold text-slate-900">{escritorio?.nome ?? 'Jurivox'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Boas-vindas */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {clientePortal.nome}</h1>
          <p className="text-sm text-slate-500 mt-1">Acompanhe seus processos e prazos abaixo.</p>
        </div>

        {/* Processos */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-900">Seus Processos ({processos?.length ?? 0})</h2>
          </div>
          {!processos?.length ? (
            <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-4">Nenhum processo cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {processos.map((proc) => {
                const movs = movsPorProcesso[proc.id] ?? []
                const prazosProceso = (prazos ?? []).filter(p => p.processo_id === proc.id)
                return (
                <div key={proc.id} className="bg-white rounded-xl border border-slate-200">
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-900">{proc.numero_cnj}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{proc.tribunal} — {proc.area_juridica}</p>
                      {proc.classe && <p className="text-xs text-slate-400">{proc.classe}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      proc.status === 'ativo' ? 'bg-emerald-50 text-emerald-700' :
                      proc.status === 'arquivado' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {proc.status}
                    </span>
                  </div>
                  {/* Prazos do processo */}
                  {prazosProceso.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                      {prazosProceso.map(pz => {
                        const venc = new Date(`${pz.data_vencimento}T12:00:00`)
                        const diff = Math.floor((venc.getTime() - Date.now()) / 86400000)
                        return (
                          <span key={pz.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                            diff < 0 ? 'bg-red-50 border-red-200 text-red-700' :
                            diff <= 3 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {pz.descricao.slice(0, 40)} · {diff < 0 ? `vencido há ${Math.abs(diff)}d` : diff === 0 ? 'hoje' : `${diff}d`}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {/* Timeline de movimentações */}
                  {movs.length > 0 && (
                    <div className="border-t border-slate-100 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                        <ChevronDown className="w-3 h-3" />
                        Últimas movimentações
                      </p>
                      <ol className="relative border-l border-slate-200 space-y-3 ml-2">
                        {movs.map((mov) => (
                          <li key={mov.id} className="pl-4">
                            <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
                            <p className="text-xs text-slate-700 leading-snug">{mov.descricao}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Prazos próximos */}
        {(prazos?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-amber-600" />
              <h2 className="text-base font-semibold text-slate-900">Prazos Pendentes</h2>
            </div>
            <div className="space-y-2">
              {prazos!.map((prazo) => {
                const venc = new Date(`${prazo.data_vencimento}T12:00:00`)
                const hoje = new Date()
                const diff = Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={prazo.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-700">{prazo.descricao}</p>
                    <span className={`text-xs font-semibold whitespace-nowrap ${diff < 0 ? 'text-red-600' : diff <= 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {diff < 0 ? `Vencido há ${Math.abs(diff)}d` : diff === 0 ? 'Hoje' : `${diff}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
          <p>Powered by Jurivox • Link válido até {expira.toLocaleDateString('pt-BR')}</p>
          <p className="mt-1">Para dúvidas, entre em contato com seu advogado.</p>
        </footer>
      </main>
    </div>
  )
}
