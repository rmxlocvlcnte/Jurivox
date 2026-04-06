import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileSignature, Plus, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react'

const STATUS_CFG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pendente:    { label: 'Aguardando', cls: 'bg-amber-100 text-amber-700',   icon: Clock },
  visualizado: { label: 'Visualizado', cls: 'bg-blue-100 text-blue-700',    icon: Eye },
  assinado:    { label: 'Assinado',   cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  recusado:    { label: 'Recusado',   cls: 'bg-red-100 text-red-700',       icon: XCircle },
  expirado:    { label: 'Expirado',   cls: 'bg-slate-100 text-slate-500',   icon: XCircle },
}

export default async function AssinaturasPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: assinaturas } = await supabase
    .from('assinaturas_digitais')
    .select('id, titulo, nome_destinatario, email_destinatario, status, criado_em, expira_em, assinado_em')
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })

  const stats = {
    total: assinaturas?.length ?? 0,
    pendente: assinaturas?.filter(a => a.status === 'pendente' || a.status === 'visualizado').length ?? 0,
    assinado: assinaturas?.filter(a => a.status === 'assinado').length ?? 0,
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Assinatura Digital</h1>
            <p className="text-slate-500 text-sm mt-1">Envie documentos para assinatura eletrônica por e-mail</p>
          </div>
        </div>
        <Link
          href="/assinaturas/nova"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Solicitação</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', valor: stats.total, cls: 'text-slate-700 bg-slate-50 border-slate-200' },
          { label: 'Pendentes', valor: stats.pendente, cls: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Assinados', valor: stats.assinado, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
            <p className="text-2xl font-bold">{s.valor}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {!assinaturas?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileSignature className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma solicitação criada.</p>
          <p className="text-slate-400 text-sm mt-1">Envie documentos para clientes assinarem digitalmente.</p>
          <Link href="/assinaturas/nova" className="inline-block mt-4 text-amber-600 font-medium text-sm hover:text-amber-700">
            Criar primeira solicitação →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="divide-y divide-slate-100">
            {assinaturas.map(a => {
              const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.pendente
              const StatusIcon = cfg.icon
              const venceu = new Date(a.expira_em) < new Date()
              return (
                <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <FileSignature className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{a.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Para: {a.nome_destinatario} ({a.email_destinatario})
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Enviado em {new Date(a.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      {a.status === 'assinado' && a.assinado_em && (
                        <span className="text-xs text-emerald-600">
                          · Assinado em {new Date(a.assinado_em).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {(a.status === 'pendente' || a.status === 'visualizado') && venceu && (
                        <span className="text-xs text-red-500">· Expirado</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
