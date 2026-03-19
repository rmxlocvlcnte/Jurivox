import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define quais rotas SÃO PÚBLICAS (não precisam de login)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)', // webhooks externos não usam sessão
])

// O middleware roda em TODA requisição antes de chegar à página
export default clerkMiddleware(async (auth, request) => {
  // Se a rota não é pública, exige que o usuário esteja logado
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // -----------------------------------------------
  // Injeta o pathname atual nos headers da requisição
  // Isso permite que Server Components (como o layout.tsx)
  // saibam em qual rota o usuário está, sem usar hooks de cliente.
  // É necessário para evitar o loop de redirect no onboarding.
  // -----------------------------------------------
  const headers = new Headers(request.headers)
  headers.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({ request: { headers } })
})

export const config = {
  matcher: [
    // Roda em tudo, exceto arquivos estáticos e internos do Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
