import { auth, clerkClient } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

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

type AuthContextOptions = {
  exigir2FA?: boolean
  redirecionar2FA?: boolean
}

export async function getAuthContext(options: AuthContextOptions = {}) {
  const { userId, sessionId } = await auth()

  // Se não há usuário logado, retorna tudo nulo
  if (!userId) {
    return { userId: null, sessionId: null, escritorioId: null, membroId: null, cargo: null, supabase: null, mfaObrigatorio: false }
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

  const escritorioId = membro?.escritorio_id ?? null
  const membroId = membro?.id ?? null
  const cargo = membro?.cargo ?? null

  const exigir2FA = options.exigir2FA ?? true
  const redirecionar2FA = options.redirecionar2FA ?? true

  if (exigir2FA && escritorioId) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const mfaAtivo = !!user.twoFactorEnabled || !!user.totpEnabled || !!user.backupCodeEnabled

    if (!mfaAtivo) {
      if (redirecionar2FA) {
        redirect('/seguranca?mfa=obrigatorio')
      }
      return {
        userId,
        sessionId,
        escritorioId,
        membroId,
        cargo,
        supabase,
        mfaObrigatorio: true,
      }
    }
  }

  return {
    userId,
    sessionId,
    escritorioId,
    membroId,
    cargo,
    supabase,
    mfaObrigatorio: false,
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
