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
    // signInForceRedirectUrl/signUpForceRedirectUrl fazem um HARD REDIRECT
    // (não client-side push) depois do login, garantindo que o servidor
    // receba a nova sessão corretamente — sem tela branca.
    <ClerkProvider
      localization={ptBR}
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/onboarding"
    >
      <html lang="pt-BR">
        <head>
          {/* Preconnect ao CDN do Clerk para carregar o JS mais rápido */}
          <link rel="preconnect" href="https://clerk.browser.js" />
          <link rel="preconnect" href="https://accounts.clerk.dev" />
          <link rel="dns-prefetch" href="https://clerk.com" />
          <link rel="dns-prefetch" href="https://accounts.clerk.dev" />
        </head>
        <body className={`${geist.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
