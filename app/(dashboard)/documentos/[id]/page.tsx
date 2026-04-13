import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, FolderOpen, User } from 'lucide-react'
import { DocumentoActions } from '@/components/documentos/DocumentoActions'

export default async function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: doc } = await supabase
    .from('documentos_gerados')
    .select(`
      id, nome, conteudo, criado_em,
      templates_documento(id, nome, tipo),
      processos(id, numero_cnj),
      clientes(id, nome)
    `)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!doc) notFound()

  const template = doc.templates_documento as any
  const processo = doc.processos as any
  const cliente = doc.clientes as any

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/documentos" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{doc.nome}</h1>
            <p className="text-slate-500 text-sm">
              Gerado em {new Date(doc.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <DocumentoActions id={doc.id} nome={doc.nome} conteudo={doc.conteudo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Conteúdo do Documento</h2>
          </div>
          <div className="p-5">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed break-words">
              {doc.conteudo}
            </pre>
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          {/* Template de origem */}
          {template && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Template</h3>
              <Link
                href={`/templates/${template.id}`}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {template.nome}
              </Link>
            </div>
          )}

          {/* Processo vinculado */}
          {processo && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Processo</h3>
              <Link
                href={`/processos/${processo.id}`}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                <FolderOpen className="w-4 h-4 shrink-0 text-slate-400" />
                {processo.numero_cnj}
              </Link>
            </div>
          )}

          {/* Cliente vinculado */}
          {!processo && cliente && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cliente</h3>
              <Link
                href={`/clientes/${cliente.id}`}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                <User className="w-4 h-4 shrink-0 text-slate-400" />
                {cliente.nome}
              </Link>
            </div>
          )}

          {/* Meta */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
            <p>ID: <span className="font-mono">{doc.id.slice(0, 8)}...</span></p>
            <p>Criado em {new Date(doc.criado_em).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
