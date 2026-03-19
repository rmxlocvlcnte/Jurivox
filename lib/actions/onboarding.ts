'use server'

// -----------------------------------------------
// ONBOARDING — Criar escritório e associar usuário
// -----------------------------------------------
// Quando um advogado se cadastra pela primeira vez,
// ele ainda não está ligado a nenhum escritório.
// Este arquivo cuida de criar o escritório e
// registrar o advogado como membro dele.
// -----------------------------------------------

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type OnboardingState = { erro: string | null }

export async function criarEscritorio(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const nome = formData.get('nome') as string
  const cnpj = formData.get('cnpj') as string
  const email = formData.get('email') as string
  const telefone = formData.get('telefone') as string
  const nomeUsuario = formData.get('nome_usuario') as string

  if (!nome?.trim() || !nomeUsuario?.trim()) {
    return { erro: 'Nome do escritório e seu nome são obrigatórios.' }
  }

  // Valida se o Supabase está configurado
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('SEU_PROJETO')) {
    return { erro: 'Banco de dados não configurado. Preencha as variáveis do Supabase no arquivo .env.local.' }
  }

  const supabase = await createClient()

  // Passo 1: Cria o escritório (o "tenant" do sistema)
  const { data: escritorio, error: erroEscritorio } = await supabase
    .from('escritorios')
    .insert({ nome: nome.trim(), cnpj, email, telefone })
    .select('id')
    .single()

  if (erroEscritorio || !escritorio) {
    console.error('Erro ao criar escritório:', erroEscritorio)
    const msg = erroEscritorio?.message ?? ''
    if (msg.includes('relation') || msg.includes('does not exist')) {
      return { erro: 'Tabelas do banco não encontradas. Execute o schema.sql no Supabase primeiro.' }
    }
    return { erro: 'Não foi possível criar o escritório. Verifique a conexão com o banco.' }
  }

  // Passo 2: Associa o usuário Clerk ao escritório como "socio" (dono)
  const { error: erroMembro } = await supabase
    .from('membros_escritorio')
    .insert({
      escritorio_id: escritorio.id,
      clerk_user_id: userId,
      nome: nomeUsuario.trim(),
      email: email ?? '',
      cargo: 'socio', // O primeiro usuário é sempre o sócio/dono
    })

  if (erroMembro) {
    await supabase.from('escritorios').delete().eq('id', escritorio.id)
    console.error('Erro ao criar membro:', erroMembro)
    return { erro: 'Não foi possível configurar seu perfil. Tente novamente.' }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
