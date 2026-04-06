import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { criarSolicitacaoAssinatura } from '@/lib/actions/assinaturas'

export default async function NovaAssinaturaPage() {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const [{ data: processos }, { data: clientes }] = await Promise.all([
    supabase.from('processos').select('id, numero_cnj, clientes(nome)')
      .eq('escritorio_id', escritorioId).eq('status', 'ativo').order('numero_cnj').limit(100),
    supabase.from('clientes').select('id, nome, email')
      .eq('escritorio_id', escritorioId).order('nome').limit(200),
  ])

  async function handleCriar(formData: FormData) {
    'use server'
    await criarSolicitacaoAssinatura(formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/assinaturas" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nova Solicitação de Assinatura</h1>
          <p className="text-slate-500 text-sm">O destinatário receberá um e-mail com link seguro</p>
        </div>
      </div>

      <form action={handleCriar} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Título do documento *</label>
          <input
            name="titulo"
            required
            placeholder="Ex: Contrato de Honorários Advocatícios"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do destinatário *</label>
            <input
              name="nome_destinatario"
              required
              placeholder="Nome completo"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail do destinatário *</label>
            <input
              name="email_destinatario"
              type="email"
              required
              placeholder="email@exemplo.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {processos?.length ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Processo (opcional)</label>
              <select
                name="processo_id"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 bg-white"
              >
                <option value="">Nenhum</option>
                {processos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.numero_cnj} — {(p.clientes as any)?.nome ?? ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {clientes?.length ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente (opcional)</label>
              <select
                name="cliente_id"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 bg-white"
              >
                <option value="">Nenhum</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Conteúdo do documento *</label>
          <textarea
            name="conteudo_documento"
            required
            rows={12}
            placeholder="Cole ou escreva aqui o conteúdo completo do documento que será assinado..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensagem ao destinatário (opcional)</label>
          <textarea
            name="mensagem"
            rows={2}
            placeholder="Ex: Prezado cliente, segue o contrato de prestação de serviços para sua assinatura..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          Um link seguro será gerado e enviado por e-mail. O destinatário poderá ler e assinar o documento sem precisar criar uma conta. O link expira em 30 dias.
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/assinaturas"
            className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 py-2.5 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors"
          >
            Enviar para Assinatura
          </button>
        </div>
      </form>
    </div>
  )
}
