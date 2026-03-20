import { createClient } from '@supabase/supabase-js'

// Cliente admin — usa a service role key que bypassa o RLS
// NUNCA exponha essa chave no frontend
// Use APENAS em server actions e API routes
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
