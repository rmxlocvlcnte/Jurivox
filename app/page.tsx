import { redirect } from 'next/navigation'

// A raiz do site redireciona para o dashboard
// O middleware.ts cuida de verificar se o usuário está logado
// Se não estiver, o Clerk redireciona para /sign-in automaticamente
export default function Home() {
  redirect('/dashboard')
}
