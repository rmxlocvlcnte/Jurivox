import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Bot, Radio, Search, Bell, Zap, AlertCircle, ExternalLink, Scale, CheckCircle2, XCircle } from 'lucide-react'
import { MonitoramentoSyncButton } from '@/components/monitoramento/MonitoramentoSyncButton'

export default async function MonitoramentoPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const datajudConfigurado = !!process.env.DATAJUD_API_URL

  const [
    { data: processos },
    { data: logs },
  ] = await Promise.all([
    supabase
      .from('processos')
      .select('id, numero_cnj, tribunal, status')
      .eq('escritorio_id', escritorioId)
      .eq('status', 'ativo')
      .order('numero_cnj'),

    supabase
      .from('monitoramento_logs')
      .select('id, numero_cnj, tribunal, movimentacoes_novas, status, erro_mensagem, executado_em')
      .eq('escritorio_id', escritorioId)
      .order('executado_em', { ascending: false })
      .limit(20),
  ])

  const tribunaisSuportados = [
    { nome: 'TJSP', status: 'ativo' }, { nome: 'TJRJ', status: 'ativo' },
    { nome: 'TJMG', status: 'ativo' }, { nome: 'TJRS', status: 'ativo' },
    { nome: 'TRT-2', status: 'ativo' }, { nome: 'TRF-3', status: 'ativo' },
    { nome: 'STJ', status: 'ativo' }, { nome: 'DataJud / CNJ', status: 'ativo' },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Monitoramento Automático</h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhamento automático de publicações e andamentos processuais</p>
        </div>
      </div>

      {/* Status do módulo */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-purple-900 mb-1">
              {datajudConfigurado ? 'Monitoramento ativo' : 'Configuração necessária'}
            </h2>
            <p className="text-sm text-purple-700">
              {datajudConfigurado
                ? 'Integração DataJud configurada. Use o botão para sincronizar novas movimentações.'
                : 'Defina DATAJUD_API_URL e DATAJUD_API_KEY no .env.local para habilitar a integração com DataJud/DJe.'}
            </p>
            {datajudConfigurado && (
              <div className="mt-3">
                <MonitoramentoSyncButton escritorioId={escritorioId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* O que será implementado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Search,
            title: 'Leitura automática do DJe',
            desc: 'Varredura diária das publicações do Diário de Justiça com seu CNPJ/OAB',
            cls: 'bg-blue-50 text-blue-600',
          },
          {
            icon: Bell,
            title: 'Alertas inteligentes',
            desc: 'Notificações por e-mail e WhatsApp quando houver nova publicação relevante',
            cls: 'bg-green-50 text-green-600',
          },
          {
            icon: Zap,
            title: 'Criação automática de prazos',
            desc: 'Detecta prazos nas publicações e já os cadastra na sua agenda',
            cls: 'bg-amber-50 text-amber-600',
          },
          {
            icon: Bot,
            title: 'IA para classificação',
            desc: 'A IA lê e classifica cada publicação: andamento, sentença, decisão, etc.',
            cls: 'bg-purple-50 text-purple-600',
          },
          {
            icon: Radio,
            title: 'Monitoramento DataJud',
            desc: 'Integração com a API do CNJ (DataJud) para consulta automatizada',
            cls: 'bg-slate-50 text-slate-600',
          },
          {
            icon: ExternalLink,
            title: 'Portais dos tribunais',
            desc: 'Conexão direta com TJSP, TJRJ, TRT, TRF e outros tribunais',
            cls: 'bg-red-50 text-red-600',
          },
        ].map(({ icon: Icon, title, desc, cls }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cls}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Tribunais */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Tribunais integrados via DataJud</h2>
          <p className="text-xs text-slate-400 mt-0.5">Todos os tribunais disponíveis na API pública do CNJ</p>
        </div>
        <div className="divide-y divide-slate-100">
          {tribunaisSuportados.map(t => (
            <div key={t.nome} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{t.nome}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                datajudConfigurado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {datajudConfigurado ? 'Integrado' : 'Requer configuração'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico de sincronizações */}
      {(logs?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Histórico de Sincronizações</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {logs!.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                {log.status === 'sucesso' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-slate-700 truncate">{log.numero_cnj}</p>
                  {log.erro_mensagem && (
                    <p className="text-xs text-red-500">{log.erro_mensagem}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {log.movimentacoes_novas > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">+{log.movimentacoes_novas}</span>
                  )}
                  <p className="text-xs text-slate-400">
                    {new Date(log.executado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processos monitoráveis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Seus processos ({processos?.length ?? 0} ativos)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Estes processos serão monitorados automaticamente quando o módulo estiver ativo</p>
        </div>
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {!processos?.length ? (
            <p className="px-5 py-6 text-center text-slate-400 text-sm">Nenhum processo ativo cadastrado.</p>
          ) : (
            processos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-mono text-slate-700">{p.numero_cnj}</p>
                <span className="text-xs text-slate-400">{p.tribunal}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
