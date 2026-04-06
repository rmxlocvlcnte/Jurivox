import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, FileText, Copy, Trash2 } from 'lucide-react'
import { TemplateActions } from '@/components/templates/TemplateActions'
import { GerarDocumentoForm } from '@/components/templates/GerarDocumentoForm'

const TIPO_LABELS: Record<string, string> = {
  contrato: 'Contrato', peticao: 'Petição', procuracao: 'Procuração',
  notificacao: 'Notificação', acordo: 'Acordo', outro: 'Outro',
}

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: template } = await supabase
    .from('templates_documento')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) notFound()

  const { data: processos } = await supabase
    .from('processos')
    .select('id, numero_cnj, clientes(nome)')
    .eq('escritorio_id', escritorioId)
    .eq('status', 'ativo')
    .order('numero_cnj')
    .limit(100)

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('escritorio_id', escritorioId)
    .order('nome')
    .limit(200)

  const variaveis = (template.variaveis as string[]) ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/templates" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{template.nome}</h1>
            <p className="text-slate-500 text-sm">{TIPO_LABELS[template.tipo] ?? template.tipo}</p>
          </div>
        </div>
        <TemplateActions id={id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Conteúdo do template */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Conteúdo do Template</h2>
          </div>
          <div className="p-5">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed break-words">
              {template.conteudo}
            </pre>
          </div>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          {/* Variáveis */}
          {variaveis.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Variáveis ({variaveis.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {variaveis.map(v => (
                  <code key={v} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono border border-indigo-100">
                    {'{{'}{v}{'}}'}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Gerar documento */}
          <GerarDocumentoForm
            templateId={id}
            variaveis={variaveis}
            processos={(processos ?? []).map(p => ({
              id: p.id,
              numero_cnj: p.numero_cnj,
              cliente: (p.clientes as any)?.nome ?? '',
            }))}
            clientes={(clientes ?? []).map(c => ({ id: c.id, nome: c.nome }))}
          />

          {/* Meta */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
            <p>Criado em {new Date(template.criado_em).toLocaleDateString('pt-BR')}</p>
            <p>Atualizado em {new Date(template.atualizado_em).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
