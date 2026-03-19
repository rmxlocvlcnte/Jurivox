import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { getEscritorioId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// -----------------------------------------------
// Layout do Dashboard — envolve TODAS as páginas protegidas
// -----------------------------------------------
// O que este layout faz:
// 1. Lê o pathname atual (injetado pelo middleware.ts)
// 2. Se o usuário ainda não tem escritório E não está em /onboarding,
//    redireciona para /onboarding (configuração inicial)
// 3. Se tem escritório, exibe sidebar + header + conteúdo
// -----------------------------------------------

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Pega o pathname injetado pelo middleware (evita o loop de redirect)
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // A página de onboarding fica dentro deste grupo de rotas,
  // mas não deve disparar o redirect dela mesma
  const naOnboarding = pathname.startsWith('/onboarding')

  if (!naOnboarding) {
    const escritorioId = await getEscritorioId()
    if (!escritorioId) {
      redirect('/onboarding')
    }
  }

  // Na tela de onboarding, exibe sem sidebar/header (tela cheia)
  if (naOnboarding) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-dvh bg-slate-50">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      {/* Área principal: header + conteúdo */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* min-w-0 evita que o conteúdo empurre a sidebar em telas pequenas */}
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
