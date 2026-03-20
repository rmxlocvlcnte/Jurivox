import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { SidebarProvider } from '@/components/sidebar-context'
import { headers } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  if (pathname.startsWith('/onboarding')) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-dvh bg-slate-50">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
