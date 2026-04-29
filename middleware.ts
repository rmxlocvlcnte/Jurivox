import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rotas públicas — acessíveis sem autenticação
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/convite(.*)',
  '/assinar(.*)',
  '/cliente(.*)',
  '/privacidade',
  '/termos-de-uso',
  '/dpa',
  '/api/stripe/webhook',
  '/api/health',
  '/api/assinaturas/public(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Evita arquivos estáticos e internals do Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Sempre roda para API routes
    '/(api|trpc)(.*)',
  ],
}
