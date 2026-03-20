import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// -----------------------------------------------
// getAuthContext
// -----------------------------------------------
// Função utilitária chamada no início de toda
// Server Action e Server Component protegido.
//
// O que ela faz:
// 1. Pega o ID do usuário logado via Clerk
// 2. Busca no banco qual escritório esse usuário pertence
// 3. Retorna tudo pronto para ser usado nas queries
//
// Por que precisamos disso?
// O Supabase precisa saber "de qual escritório" são os dados.
// Sem isso, cada query poderia vazar dados de outros clientes.
// -----------------------------------------------

export async function getAuthContext() {
  const { userId } = await auth()

  // Se não há usuário logado, retorna tudo nulo
  if (!userId) {
    return { userId: null, escritorioId: null, membroId: null, cargo: null, supabase: null }
  }

  const supabase = createAdminClient()

  // Busca o registro do membro no banco usando o ID do Clerk
  const { data: membro } = await supabase
    .from('membros_escritorio')
    .select('id, escritorio_id, cargo')
    .eq('clerk_user_id', userId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    userId,
    escritorioId: membro?.escritorio_id ?? null,
    membroId: membro?.id ?? null,
    cargo: membro?.cargo ?? null,
    supabase,
  }
}

// Versão simples — só userId e escritorioId, sem instanciar o Supabase
// Útil quando você só precisa checar se o usuário tem escritório
export async function getEscritorioId(): Promise<string | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('membros_escritorio')
      .select('escritorio_id')
      .eq('clerk_user_id', userId)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('getEscritorioId error:', error.message)
      return null
    }

    return data?.escritorio_id ?? null
  } catch (e) {
    console.error('getEscritorioId exception:', e)
    return null
  }
}
