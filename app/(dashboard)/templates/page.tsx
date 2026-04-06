import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react'

const TIPO_LABELS: Record<string, string> = {
  contrato: 'Contrato', peticao: 'Petição', procuracao: 'Procuração',
  notificacao: 'Notificação', acordo: 'Acordo', outro: 'Outro',
}
const TIPO_CLS: Record<string, string> = {
  contrato: 'bg-blue-100 text-blue-700',
  peticao: 'bg-purple-100 text-purple-700',
  procuracao: 'bg-amber-100 text-amber-700',
  notificacao: 'bg-orange-100 text-orange-700',
  acordo: 'bg-emerald-100 text-emerald-700',
  outro: 'bg-slate-100 text-slate-600',
}

export default async function TemplatesPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: templates } = await supabase
    .from('templates_documento')
    .select('id, nome, tipo, variaveis, criado_em, atualizado_em')
    .eq('escritorio_id', escritorioId)
    .order('atualizado_em', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Templates de Documentos</h1>
            <p className="text-slate-500 text-sm mt-1">Crie modelos reutilizáveis com variáveis dinâmicas</p>
          </div>
        </div>
        <Link
          href="/templates/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Template</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      {/* Instrução de variáveis */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-700">
        <strong>Como usar variáveis:</strong> Use a sintaxe <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono text-xs">{'{{nome_cliente}}'}</code> no texto do template. Ao gerar um documento, cada variável será substituída pelo valor real.
      </div>

      {!templates?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum template criado ainda.</p>
          <p className="text-slate-400 text-sm mt-1">Crie modelos de contratos, petições e outros documentos.</p>
          <Link href="/templates/novo" className="inline-block mt-4 text-amber-600 font-medium text-sm hover:text-amber-700">
            Criar primeiro template →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <Link href={`/templates/${t.id}`} className="block p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{t.nome}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_CLS[t.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                        {TIPO_LABELS[t.tipo] ?? t.tipo}
                      </span>
                      {(t.variaveis as string[])?.length > 0 && (
                        <span className="text-xs text-slate-400">
                          {(t.variaveis as string[]).length} variáve{(t.variaveis as string[]).length === 1 ? 'l' : 'is'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Atualizado em {new Date(t.atualizado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex border-t border-slate-100">
                <Link
                  href={`/templates/${t.id}/editar`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors rounded-bl-xl"
                >
                  <Edit2 className="w-3.5 h-3.5" />Editar
                </Link>
                <Link
                  href={`/templates/${t.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors rounded-br-xl border-l border-slate-100"
                >
                  Usar Template →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
