'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { verificarLimite } from '@/lib/limites'

type OnboardingState = { erro: string | null }

export async function criarEscritorio(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createAdminClient()
  const user = await currentUser()
  const emailUsuario = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? ''
  const nomeUsuarioConta = user?.fullName?.trim() || user?.firstName?.trim() || ''

  // 1) Se existe convite pendente para este e-mail, vincula automaticamente.
  if (emailUsuario) {
    const { data: convite } = await supabase
      .from('convites_equipe')
      .select('id, escritorio_id, nome_convidado, cargo_convidado, status, expira_em')
      .eq('email_convidado', emailUsuario)
      .eq('status', 'pendente')
      .gt('expira_em', new Date().toISOString())
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (convite) {
      const { data: membroExistente } = await supabase
        .from('membros_escritorio')
        .select('id, escritorio_id')
        .eq('clerk_user_id', userId)
        .maybeSingle()

      if (membroExistente?.escritorio_id && membroExistente.escritorio_id !== convite.escritorio_id) {
        return { erro: 'Sua conta ja esta vinculada a outro escritorio.' }
      }

      if (!membroExistente) {
        const limite = await verificarLimite(convite.escritorio_id, 'membros', supabase)
        if (limite.atingido) return { erro: limite.mensagem! }

        const nomeFallback = (formData.get('nome_usuario') as string)?.trim()
          || convite.nome_convidado
          || nomeUsuarioConta
          || 'Membro'

        const { error: erroMembroConvite } = await supabase
          .from('membros_escritorio')
          .insert({
            escritorio_id: convite.escritorio_id,
            clerk_user_id: userId,
            nome: nomeFallback,
            email: emailUsuario,
            cargo: convite.cargo_convidado || 'advogado',
            ativo: true,
          })

        if (erroMembroConvite) {
          console.error('Erro ao aceitar convite no onboarding:', erroMembroConvite)
          return { erro: 'Nao foi possivel concluir seu convite de equipe.' }
        }
      }

      await supabase
        .from('convites_equipe')
        .update({
          status: 'aceito',
          aceito_em: new Date().toISOString(),
          aceito_por_clerk_user_id: userId,
        })
        .eq('id', convite.id)

      revalidatePath('/dashboard')
      redirect('/dashboard')
    }
  }

  // 2) Fluxo normal: criar escritorio novo.
  const nome = (formData.get('nome') as string)?.trim()
  const cnpj = (formData.get('cnpj') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const telefone = (formData.get('telefone') as string)?.trim() || null
  const nomeUsuario = (formData.get('nome_usuario') as string)?.trim() || nomeUsuarioConta

  if (!nome || !nomeUsuario) {
    return { erro: 'Nome do escritorio e seu nome sao obrigatorios.' }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('SEU_PROJETO')) {
    return { erro: 'Banco de dados nao configurado. Preencha as variaveis do Supabase no .env.local.' }
  }

  const { data: escritorio, error: erroEscritorio } = await supabase
    .from('escritorios')
    .insert({ nome, cnpj, email, telefone })
    .select('id')
    .single()

  if (erroEscritorio || !escritorio) {
    console.error('Erro ao criar escritorio:', erroEscritorio)
    const msg = erroEscritorio?.message ?? ''
    if (msg.includes('relation') || msg.includes('does not exist')) {
      return { erro: 'Tabelas do banco nao encontradas. Execute o schema.sql e migracoes no Supabase.' }
    }
    return { erro: 'Nao foi possivel criar o escritorio. Verifique a conexao com o banco.' }
  }

  const { error: erroMembro } = await supabase
    .from('membros_escritorio')
    .insert({
      escritorio_id: escritorio.id,
      clerk_user_id: userId,
      nome: nomeUsuario,
      email: email ?? emailUsuario,
      cargo: 'socio',
      ativo: true,
    })

  if (erroMembro) {
    await supabase.from('escritorios').delete().eq('id', escritorio.id)
    console.error('Erro ao criar membro:', erroMembro)
    return { erro: 'Nao foi possivel configurar seu perfil. Tente novamente.' }
  }

  revalidatePath('/bem-vindo')
  redirect('/bem-vindo')
}
