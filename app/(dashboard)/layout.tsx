import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { headers } from 'next/headers'

// -----------------------------------------------
// Layout do Dashboard — renderiza o shell IMEDIATAMENTE
// -----------------------------------------------
// Este layout é intencionalmente simples e rápido.
// Ele só lê o pathname do header (sem queries ao banco).
//
// Por que não fazemos o redirect aqui?
// Em Next.js App Router, o loading.tsx só cobre o PAGE,
// não o layout. Se o layout fizer queries lentas ao Supabase,
// o usuário vê uma tela branca durante todo esse tempo.
//
// Solução: cada página faz seu próprio getAuthContext() que
// está coberto pelo Suspense/loading.tsx — assim o spinner
// aparece imediatamente enquanto a página carrega.
// -----------------------------------------------

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Lê o pathname injetado pelo middleware — operação instantânea
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // A página de onboarding não deve exibir sidebar/header
  if (pathname.startsWith('/onboarding')) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
