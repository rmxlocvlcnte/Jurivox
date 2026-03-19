import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente Supabase para uso no SERVIDOR (Server Components, API Routes)
// Lê os cookies para saber quem é o usuário logado
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Em Server Components, cookies não podem ser modificados
            // O middleware cuida disso
          }
        },
      },
    }
  )
}
