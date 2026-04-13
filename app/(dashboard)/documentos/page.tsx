import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, ArrowRight } from 'lucide-react'
import { DocumentoActions } from '@/components/documentos/DocumentoActions'

const TIPO_CLS: Record<string, string> = {
  contrato: 'bg-blue-100 text-blue-700',
  peticao: 'bg-purple-100 text-purple-700',
  procuracao: 'bg-amber-100 text-amber-700',
  notificacao: 'bg-orange-100 text-orange-700',
  acordo: 'bg-emerald-100 text-emerald-700',
  outro: 'bg-slate-100 text-slate-600',
}
const TIPO_LABELS: Record<string, string> = {
  contrato: 'Contrato', peticao: 'Petição', procuracao: 'Procuração',
  notificacao: 'Notificação', acordo: 'Acordo', outro: 'Outro',
}

export default async function DocumentosGeradosPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: documentos } = await supabase
    .from('documentos_gerados')
    .select(`
      id, nome, conteudo, criado_em,
      templates_documento(nome, tipo),
      processos(numero_cnj),
      clientes(nome)
    `)
    .eq('escritorio_id', escritorioId)
    .order('criado_em', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Documentos Gerados</h1>
            <p className="text-slate-500 text-sm mt-1">Documentos criados a partir de templates</p>
          </div>
        </div>
        <Link
          href="/templates"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Gerar Documento</span>
          <span className="sm:hidden">Gerar</span>
        </Link>
      </div>

      {!documentos?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum documento gerado ainda.</p>
          <p className="text-slate-400 text-sm mt-1">Acesse um template e clique em &quot;Gerar Documento&quot;.</p>
          <Link href="/templates" className="inline-block mt-4 text-amber-600 font-medium text-sm hover:text-amber-700">
            Ver templates →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => {
            const template = doc.templates_documento as any
            const processo = doc.processos as any
            const cliente = doc.clientes as any
            const tipo = template?.tipo ?? 'outro'

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 px-5 py-4"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">{doc.nome}</p>
                    {template?.tipo && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TIPO_CLS[tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                        {TIPO_LABELS[tipo] ?? tipo}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    {processo?.numero_cnj && (
                      <span className="truncate">Processo: {processo.numero_cnj}</span>
                    )}
                    {!processo?.numero_cnj && cliente?.nome && (
                      <span className="truncate">Cliente: {cliente.nome}</span>
                    )}
                    <span>{new Date(doc.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/documentos/${doc.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Ver <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <DocumentoActions id={doc.id} nome={doc.nome} conteudo={doc.conteudo} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
