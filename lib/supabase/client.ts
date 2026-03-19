import { createBrowserClient } from '@supabase/ssr'

// Cliente Supabase para uso no NAVEGADOR (componentes com 'use client')
// Cada chamada retorna a mesma instância (singleton)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
