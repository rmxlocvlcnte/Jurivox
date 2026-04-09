import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { ArrowRight, CheckCircle2, Scale, ShieldCheck, Sparkles } from 'lucide-react'

const RECURSOS = [
  'Gestao de processos e prazos em um unico painel',
  'Monitoramento DataJud com sincronizacao automatica',
  'Assinatura digital com trilha de auditoria',
  'Financeiro, contratos e controle de equipe',
]

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="absolute inset-x-0 top-0 -z-0 h-96 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.25),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.2),transparent_45%)]" />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 md:pt-12">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/90 text-slate-900 shadow-lg shadow-amber-500/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">JurisFlow</p>
              <p className="text-xs text-slate-400">Plataforma juridica para escritorios</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900"
            >
              Entrar
            </Link>
            <Link
              href={userId ? '/dashboard' : '/sign-up'}
              className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
            >
              {userId ? 'Abrir Dashboard' : 'Comecar Teste'}
            </Link>
          </div>
        </header>

        <section className="mt-14 grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Operacao juridica em producao
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Seu escritorio juridico com controle real de ponta a ponta
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300 md:text-base">
              Centralize clientes, processos, agenda, financeiro e monitoramento em um unico fluxo.
              Sem planilhas paralelas e sem retrabalho operacional.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={userId ? '/dashboard' : '/sign-up'}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300"
              >
                {userId ? 'Ir para o Dashboard' : 'Criar Conta'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900"
              >
                Conhecer plataforma
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Recursos ativos na plataforma
            </div>
            <ul className="space-y-3">
              {RECURSOS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="mt-14 flex flex-wrap items-center gap-4 border-t border-slate-800 pt-6 text-xs text-slate-400">
          <span>JurisFlow</span>
          <Link href="/termos-de-uso" className="hover:text-slate-200">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-slate-200">Privacidade</Link>
          <Link href="/dpa" className="hover:text-slate-200">DPA</Link>
        </footer>
      </main>
    </div>
  )
}
