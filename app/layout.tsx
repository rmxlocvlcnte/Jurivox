import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata: Metadata = {
  title: 'JurisFlow — Gestão Jurídica',
  description: 'Sistema de gestão para escritórios de advocacia',
}

// Configuração crítica para Safari/iOS:
// viewport-fit=cover ativa suporte ao recorte do iPhone (notch/Dynamic Island)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // lang="pt-BR" para SEO, acessibilidade e corretor do Safari
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body className={`${geist.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
