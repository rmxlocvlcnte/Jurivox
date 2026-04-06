import { criarTemplate } from '@/lib/actions/templates'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NovoTemplatePage() {
  async function handleCriar(formData: FormData) {
    'use server'
    await criarTemplate(formData)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/templates" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Novo Template</h1>
          <p className="text-slate-500 text-sm">Use {'{{variavel}}'} para criar campos dinâmicos</p>
        </div>
      </div>

      <form action={handleCriar} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do template *</label>
            <input
              name="nome"
              required
              placeholder="Ex: Contrato de Honorários Advocatícios"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo *</label>
            <select
              name="tipo"
              required
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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Conteúdo do documento *
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Use <code className="bg-slate-100 px-1 rounded font-mono">{'{{nome_cliente}}'}</code>,{' '}
            <code className="bg-slate-100 px-1 rounded font-mono">{'{{numero_cnj}}'}</code>,{' '}
            <code className="bg-slate-100 px-1 rounded font-mono">{'{{data_hoje}}'}</code>, etc.
          </p>
          <textarea
            name="conteudo"
            required
            rows={18}
            placeholder={`CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS\n\nContratante: {{nome_cliente}}, CPF nº {{cpf_cliente}}\nContratado: {{nome_advogado}}, OAB nº {{oab_advogado}}\n\nOs contratantes acima qualificados têm entre si justo e contratado o seguinte:\n\n1. OBJETO\nO contratado obriga-se a prestar serviços advocatícios no processo nº {{numero_cnj}}, em trâmite perante o {{tribunal}}.\n\n2. HONORÁRIOS\nOs honorários advocatícios serão de R$ {{valor_honorarios}}...\n\nData: {{data_hoje}}`}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono resize-y"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/templates"
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 py-2.5 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors"
          >
            Criar Template
          </button>
        </div>
      </form>
    </div>
  )
}
