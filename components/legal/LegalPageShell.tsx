import Link from 'next/link'
import type { ReactNode } from 'react'

type LegalPageShellProps = {
  titulo: string
  atualizadoEm: string
  children: ReactNode
}

export function LegalPageShell({ titulo, atualizadoEm, children }: LegalPageShellProps) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/"
        className="text-xs text-slate-500 hover:text-slate-800"
      >
        ← Voltar ao início
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">{titulo}</h1>
      <p className="mt-2 text-sm text-slate-500">Última atualização: {atualizadoEm}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
      <nav className="mt-10 flex flex-wrap gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500">
        <Link href="/termos-de-uso" className="hover:text-slate-900">Termos de Uso</Link>
        <Link href="/privacidade" className="hover:text-slate-900">Política de Privacidade</Link>
        <Link href="/dpa" className="hover:text-slate-900">DPA</Link>
      </nav>
    </main>
  )
}
