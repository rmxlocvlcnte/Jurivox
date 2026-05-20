import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'
import { Toaster } from '@/components/ui/sonner'
import { ClientErrorReporter } from '@/components/observabilidade/ClientErrorReporter'
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner'
import { PwaRegister } from '@/components/PwaRegister'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata: Metadata = {
  title: 'Jurivox - Gestao Juridica',
  description: 'Sistema de gestao para escritorios de advocacia',
}

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
    <ClerkProvider
      localization={ptBR}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignOutUrl="/"
    >
      <html lang="pt-BR">
        <head>
          <link rel="preconnect" href="https://clerk.browser.js" />
          <link rel="preconnect" href="https://accounts.clerk.dev" />
          <link rel="dns-prefetch" href="https://clerk.com" />
          <link rel="dns-prefetch" href="https://accounts.clerk.dev" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#f59e0b" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
        </head>
        <body className={`${geist.variable} font-sans antialiased`}>
          {children}
          <CookieConsentBanner />
          <PwaRegister />
          <ClientErrorReporter />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
