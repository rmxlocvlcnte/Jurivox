import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  Radio,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Scale,
  Sparkles,
  ExternalLink,
  Clock3,
} from 'lucide-react'
import { MonitoramentoSyncButton } from '@/components/monitoramento/MonitoramentoSyncButton'

export default async function MonitoramentoPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const datajudConfigurado = Boolean(process.env.DATAJUD_API_URL && process.env.DATAJUD_API_KEY)

  const [{ data: processos }, { data: logs }] = await Promise.all([
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

  const cardsStatus = [
    {
      titulo: 'DataJud integrado',
      descricao: 'Consulta automatica de andamentos por numero CNJ.',
      pronto: datajudConfigurado,
    },
    {
      titulo: 'Classificacao automatica',
      descricao: 'Movimentacoes categorizadas em audiencia, sentenca, despacho, prazo e andamento.',
      pronto: true,
    },
    {
      titulo: 'Criacao automatica de prazos',
      descricao: 'Quando o texto traz "prazo de X dias", o sistema cria prazo e evento de agenda.',
      pronto: true,
    },
    {
      titulo: 'Integracao direta com portais',
      descricao: 'TJ/TRF/TRT por conectores dedicados (roadmap).',
      pronto: false,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <Radio className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Monitoramento Automatico</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhamento continuo de andamentos com DataJud</p>
        </div>
      </div>

      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
          <div>
            <h2 className="mb-1 font-semibold text-purple-900">
              {datajudConfigurado ? 'Monitoramento ativo' : 'Configuracao necessaria'}
            </h2>
            <p className="text-sm text-purple-700">
              {datajudConfigurado
                ? 'Use o botao abaixo para sincronizar e detectar novas movimentacoes, com classificacao e criacao automatica de prazos.'
                : 'Configure DATAJUD_API_URL e DATAJUD_API_KEY para habilitar sincronizacao com DataJud.'}
            </p>
            {datajudConfigurado && (
              <div className="mt-3">
                <MonitoramentoSyncButton escritorioId={escritorioId} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cardsStatus.map((card) => (
          <div key={card.titulo} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              {card.pronto ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Clock3 className="h-4 w-4 text-amber-500" />
              )}
              <h3 className="text-sm font-semibold text-slate-900">{card.titulo}</h3>
            </div>
            <p className="text-xs text-slate-500">{card.descricao}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Tribunais via DataJud</h2>
          <p className="mt-0.5 text-xs text-slate-400">Cobertura depende da API publica do CNJ</p>
        </div>
        <div className="divide-y divide-slate-100">
          {['TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TRT-2', 'TRF-3', 'STJ', 'DataJud/CNJ'].map((nome) => (
            <div key={nome} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Scale className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{nome}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${datajudConfigurado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {datajudConfigurado ? 'Integrado' : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {(logs?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Historico de sincronizacoes</h2>
          </div>
          <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {logs!.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                {log.status === 'sucesso' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-slate-700">{log.numero_cnj}</p>
                  {log.erro_mensagem && <p className="text-xs text-red-500">{log.erro_mensagem}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {log.movimentacoes_novas > 0 && (
                    <span className="text-xs font-medium text-emerald-600">+{log.movimentacoes_novas}</span>
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Processos monitorados ({processos?.length ?? 0})</h2>
          <p className="mt-0.5 text-xs text-slate-400">Somente processos ativos entram na sincronizacao</p>
        </div>
        <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
          {!processos?.length ? (
            <p className="px-5 py-6 text-center text-sm text-slate-400">Nenhum processo ativo cadastrado.</p>
          ) : (
            processos.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <p className="font-mono text-sm text-slate-700">{p.numero_cnj}</p>
                <span className="text-xs text-slate-400">{p.tribunal}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Sparkles className="h-3.5 w-3.5" />
        Proximos passos: leitura dedicada de DJe e conectores diretos por tribunal.
        <ExternalLink className="h-3.5 w-3.5" />
      </div>
    </div>
  )
}
