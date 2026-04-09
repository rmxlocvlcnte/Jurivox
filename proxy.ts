import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Rotas publicas (sem autenticacao obrigatoria).
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/privacidade(.*)',
  '/termos-de-uso(.*)',
  '/dpa(.*)',
  '/convite(.*)',
  '/assinar(.*)',
  '/cliente(.*)',           // portal do cliente (token próprio)
  '/api/health',            // health check
  '/api/stripe/webhook(.*)',
  '/api/assinaturas/public(.*)',
  '/api/convites/public(.*)',
  '/api/notificacoes(.*)',
  '/api/observabilidade(.*)',
  '/api/cron/monitoramento(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Disponibiliza o pathname para layouts server-side.
  const headers = new Headers(request.headers)
  headers.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({ request: { headers } })
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
