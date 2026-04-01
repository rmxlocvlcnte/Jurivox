'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ---- ENVIAR CONVITE ----
export async function enviarConvite(formData: FormData) {
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const nomeConvidado = (formData.get('nome') as string)?.trim()
  const emailConvidado = (formData.get('email') as string)?.trim()
  const cargo = (formData.get('cargo') as string) || 'advogado'

  if (!nomeConvidado || !emailConvidado) return { erro: 'Nome e e-mail são obrigatórios.' }

  const { data: escritorio } = await supabase
    .from('escritorios')
    .select('nome')
    .eq('id', escritorioId)
    .single()

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@jurisflow.com.br'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jurisflow.vercel.app'

  if (resendKey) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)

      await resend.emails.send({
        from: fromEmail,
        to: emailConvidado,
        subject: `Convite para ${escritorio?.nome ?? 'JurisFlow'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #0d1b3e;">Você foi convidado para o JurisFlow</h2>
            <p>Olá, <strong>${nomeConvidado}</strong>!</p>
            <p>Você recebeu um convite para acessar o escritório <strong>${escritorio?.nome ?? ''}</strong> no JurisFlow como <strong>${cargo}</strong>.</p>
            <p>Clique no botão abaixo para criar sua conta:</p>
            <a href="${appUrl}/sign-up" style="display:inline-block; background:#f59e0b; color:#000; font-weight:bold; padding:12px 24px; border-radius:8px; text-decoration:none; margin:16px 0;">
              Criar minha conta →
            </a>
            <p style="color:#64748b; font-size:13px;">Após criar a conta, entre em contato com o administrador para ser adicionado ao escritório.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error('Erro ao enviar e-mail de convite:', err)
    }
  }

  revalidatePath('/equipe')
  return { sucesso: true, email: emailConvidado, resendConfigurado: !!resendKey }
}

// ---- REMOVER MEMBRO ----
export async function removerMembro(membroId: string) {
  const { escritorioId, membroId: meuId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  // Apenas sócios e admins podem remover membros
  if (cargo !== 'socio' && cargo !== 'admin') {
    return { erro: 'Sem permissão para remover membros.' }
  }

  // Não pode remover a si mesmo
  if (membroId === meuId) {
    return { erro: 'Você não pode remover a si mesmo.' }
  }

  const { error } = await supabase
    .from('membros_escritorio')
    .delete()
    .eq('id', membroId)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao remover membro:', error)
    return { erro: 'Não foi possível remover o membro.' }
  }

  revalidatePath('/equipe')
  return { sucesso: true }
}

// ---- EDITAR CARGO ----
export async function editarCargo(membroId: string, novoCargo: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  if (cargo !== 'socio' && cargo !== 'admin') {
    return { erro: 'Sem permissão para editar cargos.' }
  }

  const cargosValidos = ['socio', 'admin', 'advogado', 'estagiario']
  if (!cargosValidos.includes(novoCargo)) {
    return { erro: 'Cargo inválido.' }
  }

  const { error } = await supabase
    .from('membros_escritorio')
    .update({ cargo: novoCargo })
    .eq('id', membroId)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao editar cargo:', error)
    return { erro: 'Não foi possível atualizar o cargo.' }
  }

  revalidatePath('/equipe')
  return { sucesso: true }
}
