import { SignIn } from '@clerk/nextjs'

// O Clerk renderiza o formulário de login completo automaticamente
// Inclui: e-mail/senha, OAuth (Google), recuperação de senha
export default function PaginaLogin() {
  return (
    <SignIn
      appearance={{
        elements: {
          // Customizações visuais para combinar com o design do Jurivox
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
  )
}
