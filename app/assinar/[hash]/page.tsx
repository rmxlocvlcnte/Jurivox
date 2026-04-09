// Página pública — sem autenticação — para o cliente assinar o documento
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { AssinaturaForm } from '@/components/assinaturas/AssinaturaForm'
import { Scale, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function AssinarPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params
  const supabase = createAdminClient()

  const { data: assinatura } = await supabase
    .from('assinaturas_digitais')
    .select(`
      id, titulo, nome_destinatario, email_destinatario,
      conteudo_documento, mensagem, status, expira_em,
      assinado_em, criado_em,
      escritorios:escritorio_id (nome)
    `)
    .eq('hash_token', hash)
    .single()

  if (!assinatura) notFound()

  const escritorio = assinatura.escritorios as unknown as { nome: string } | null
  const expirado = new Date(assinatura.expira_em) < new Date()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Jurivox</p>
            {escritorio?.nome && (
              <p className="text-xs text-slate-500">{escritorio.nome}</p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Status banner */}
        {assinatura.status === 'assinado' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900">Documento já assinado</p>
              <p className="text-sm text-emerald-700">
                Assinado em {assinatura.assinado_em
                  ? new Date(assinatura.assinado_em).toLocaleString('pt-BR')
                  : '—'}
              </p>
            </div>
          </div>
        )}
        {(assinatura.status === 'expirado' || (expirado && assinatura.status !== 'assinado')) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Link expirado</p>
              <p className="text-sm text-red-700">Este link de assinatura não é mais válido. Entre em contato com o escritório.</p>
            </div>
          </div>
        )}
        {assinatura.status === 'recusado' && (
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-slate-500 shrink-0" />
            <p className="text-sm text-slate-700">Este documento foi recusado.</p>
          </div>
        )}

        {/* Informações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h1 className="text-lg font-bold text-slate-900">{assinatura.titulo}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Destinado a: <strong>{assinatura.nome_destinatario}</strong> ({assinatura.email_destinatario})
          </p>
          {assinatura.mensagem && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic border-l-4 border-amber-400">
              {assinatura.mensagem}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Expira em {new Date(assinatura.expira_em).toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Conteúdo do documento */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Documento para Assinatura</h2>
            <p className="text-xs text-slate-400 mt-0.5">Leia atentamente antes de assinar</p>
          </div>
          <div className="p-5 sm:p-8">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
              {assinatura.conteudo_documento}
            </pre>
          </div>
        </div>

        {/* Formulário de assinatura */}
        {assinatura.status === 'pendente' || assinatura.status === 'visualizado' ? (
          !expirado ? (
            <AssinaturaForm hash={hash} nomeDestinatario={assinatura.nome_destinatario} />
          ) : null
        ) : null}
      </main>

      <footer className="text-center py-6 text-xs text-slate-400">
        Assinatura eletrônica segura por Jurivox · Documento válido conforme Lei nº 14.063/2020
      </footer>
    </div>
  )
}
