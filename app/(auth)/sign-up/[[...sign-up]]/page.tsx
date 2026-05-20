import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

// O Clerk renderiza o formulário de cadastro completo automaticamente
// Inclui: e-mail/senha, confirmação de e-mail, OAuth (Google)
export default function PaginaCadastro() {
  return (
    <div className="flex flex-col items-center gap-4">
    <SignUp
      appearance={{
        elements: {
          formButtonPrimary: 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold',
          card: 'shadow-lg border border-slate-200',
          headerTitle: 'text-slate-900',
          headerSubtitle: 'text-slate-500',
          socialButtonsBlockButton: 'border-slate-200 hover:bg-slate-50',
          formFieldInput: 'border-slate-200 focus:ring-amber-400',
          footerActionLink: 'text-amber-600 hover:text-amber-700',
        },
      }}
    />
    <p className="max-w-sm text-center text-xs text-slate-500">
      Ao criar sua conta, você concorda com os{' '}
      <Link href="/termos-de-uso" className="text-amber-600 hover:underline">Termos de Uso</Link>
      , a{' '}
      <Link href="/privacidade" className="text-amber-600 hover:underline">Política de Privacidade</Link>
      {' '}e o{' '}
      <Link href="/dpa" className="text-amber-600 hover:underline">DPA</Link>.
    </p>
    </div>
  )
}
