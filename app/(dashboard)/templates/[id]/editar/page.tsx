import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { atualizarTemplate } from '@/lib/actions/templates'

export default async function EditarTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const { data: template } = await supabase
    .from('templates_documento')
    .select('*')
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .single()

  if (!template) notFound()

  async function handleAtualizar(formData: FormData) {
    'use server'
    await atualizarTemplate(id, formData)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/templates/${id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Editar Template</h1>
          <p className="text-slate-500 text-sm">{template.nome}</p>
        </div>
      </div>

      <form action={handleAtualizar} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome *</label>
            <input
              name="nome"
              required
              defaultValue={template.nome}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo *</label>
            <select
              name="tipo"
              required
              defaultValue={template.tipo}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 bg-white"
            >
              <option value="contrato">Contrato</option>
              <option value="peticao">Petição</option>
              <option value="procuracao">Procuração</option>
              <option value="notificacao">Notificação</option>
              <option value="acordo">Acordo</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Conteúdo *</label>
          <p className="text-xs text-slate-400 mb-2">
            Use <code className="bg-slate-100 px-1 rounded font-mono">{'{{variavel}}'}</code> para campos dinâmicos.
          </p>
          <textarea
            name="conteudo"
            required
            rows={18}
            defaultValue={template.conteudo}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono resize-y"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/templates/${id}`}
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 py-2.5 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors"
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  )
}
