import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rotas públicas — não exigem autenticação
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/termos-de-uso',
  '/privacidade',
  '/dpa',
  '/assinar/(.*)',        // Assinatura pública por link
  '/convite/(.*)',        // Aceitar convite de equipe
  '/cliente/(.*)',        // Portal do cliente
  '/api/stripe/webhook', // Webhook do Stripe (sem auth)
  '/api/assinaturas/public/(.*)', // Endpoints públicos de assinatura
  '/api/health',         // Health check
])

// Rotas que não precisam de escritório (apenas usuário logado)
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // 1. Passa rotas públicas sem verificação
  if (isPublicRoute(req)) {
    // Adiciona header de pathname para o layout detectar rota ativa
    const headers = new Headers(req.headers)
    headers.set('x-pathname', pathname)
    return NextResponse.next({ request: { headers } })
  }

  // 2. Protege todas as demais rotas — redireciona para /sign-in se não autenticado
  await auth.protect()

  // 3. Propaga x-pathname para layouts (usado em app/(dashboard)/layout.tsx)
  const headers = new Headers(req.headers)
  headers.set('x-pathname', pathname)

  // 4. Adiciona headers de segurança em todas as respostas
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
})

export const config = {
  matcher: [
    // Inclui todas as rotas exceto arquivos estáticos do Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)).*)',
    '/(api|trpc)(.*)',
  ],
}
