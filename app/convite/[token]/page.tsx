import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aceitarConvitePorToken } from '@/lib/actions/equipe'
import { CheckCircle2, Mail, Users, XCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ erro?: string }>
}

export default async function ConvitePage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { erro } = await searchParams
  const { userId } = await auth()
  const supabase = createAdminClient()

  const { data: convite } = await supabase
    .from('convites_equipe')
    .select(`
      id,
      nome_convidado,
      email_convidado,
      cargo_convidado,
      status,
      expira_em,
      escritorios:escritorio_id (nome)
    `)
    .eq('token', token)
    .maybeSingle()

  const expirado = convite ? new Date(convite.expira_em) < new Date() : false
  const indisponivel = !convite || convite.status !== 'pendente' || expirado

  async function handleAceitar() {
    'use server'
    const resultado = await aceitarConvitePorToken(token)
    if (resultado?.erro) {
      redirect(`/convite/${token}?erro=${encodeURIComponent(resultado.erro)}`)
    }
    redirect('/dashboard')
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Convite de Equipe</h1>

        {!convite ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Convite nao encontrado.
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Escritorio: <strong>{(convite.escritorios as any)?.nome ?? 'JurisFlow'}</strong>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Cargo: <strong>{convite.cargo_convidado}</strong>
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              {convite.email_convidado}
            </p>

            {erro && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {indisponivel && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2 text-sm text-red-700">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Este convite nao esta mais disponivel.
                </div>
              </div>
            )}

            {!indisponivel && !userId && (
              <div className="mt-6 space-y-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  Entre na sua conta (ou crie uma) para aceitar o convite automaticamente.
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/sign-up?redirect_url=${encodeURIComponent(`/convite/${token}`)}`}
                    className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
                  >
                    Criar conta e aceitar
                  </Link>
                  <Link
                    href={`/sign-in?redirect_url=${encodeURIComponent(`/convite/${token}`)}`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ja tenho conta
                  </Link>
                </div>
              </div>
            )}

            {!indisponivel && userId && (
              <form action={handleAceitar} className="mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aceitar convite e entrar no escritorio
                </button>
              </form>
            )}
          </>
        )}

        <p className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <Users className="h-3.5 w-3.5" />
          O vinculo com o escritorio e realizado automaticamente apos o aceite.
        </p>
      </div>
    </main>
  )
}
