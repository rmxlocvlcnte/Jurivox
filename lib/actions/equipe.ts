'use server'

import crypto from 'crypto'
import { currentUser } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { exigirCargo, CARGOS_FINANCEIRO } from '@/lib/permissoes'
import { verificarLimitePlano } from '@/lib/planos-limites'

const CARGOS_VALIDOS = ['socio', 'admin', 'advogado', 'estagiario']

export async function enviarConvite(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissao para convidar membros.')
  if (perm) return perm

  const nomeConvidado = (formData.get('nome') as string)?.trim()
  const emailConvidado = (formData.get('email') as string)?.trim().toLowerCase()
  const cargoNovo = ((formData.get('cargo') as string) || 'advogado').toLowerCase()

  if (!nomeConvidado || !emailConvidado) {
    return { erro: 'Nome e e-mail sao obrigatorios.' }
  }
  if (!CARGOS_VALIDOS.includes(cargoNovo)) {
    return { erro: 'Cargo invalido.' }
  }

  const { count: pendentes } = await supabase
    .from('convites_equipe')
    .select('id', { count: 'exact', head: true })
    .eq('escritorio_id', escritorioId)
    .eq('status', 'pendente')
    .gt('expira_em', new Date().toISOString())

  const limitePlano = await verificarLimitePlano({
    escritorioId,
    recurso: 'membros',
    supabase,
    adicionalUsado: pendentes ?? 0,
  })
  if (limitePlano) return limitePlano

  const { data: membroMesmoEmail } = await supabase
    .from('membros_escritorio')
    .select('id')
    .eq('escritorio_id', escritorioId)
    .eq('email', emailConvidado)
    .maybeSingle()

  if (membroMesmoEmail) {
    return { erro: 'Este e-mail ja faz parte da equipe.' }
  }

  const token = crypto.randomBytes(24).toString('hex')
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: erroConvite } = await supabase
    .from('convites_equipe')
    .insert({
      escritorio_id: escritorioId,
      nome_convidado: nomeConvidado,
      email_convidado: emailConvidado,
      cargo_convidado: cargoNovo,
      token,
      status: 'pendente',
      expira_em: expiraEm,
      convidado_por_membro_id: membroId,
    })

  if (erroConvite) {
    console.error('Erro ao registrar convite:', erroConvite)
    return { erro: 'Nao foi possivel registrar o convite.' }
  }

  const { data: escritorio } = await supabase
    .from('escritorios')
    .select('nome')
    .eq('id', escritorioId)
    .single()

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@jurivox.com.br'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jurivox.vercel.app'
  const linkConvite = `${appUrl}/convite/${token}`

  if (resendKey) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)

      await resend.emails.send({
        from: fromEmail,
        to: emailConvidado,
        subject: `Convite para ${escritorio?.nome ?? 'Jurivox'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #0f172a;">Convite para equipe no Jurivox</h2>
            <p>Ola, <strong>${nomeConvidado}</strong>!</p>
            <p>Voce foi convidado para entrar no escritorio <strong>${escritorio?.nome ?? ''}</strong> como <strong>${cargoNovo}</strong>.</p>
            <p>Clique para aceitar:</p>
            <a href="${linkConvite}" style="display:inline-block; background:#f59e0b; color:#111827; font-weight:700; padding:12px 18px; border-radius:8px; text-decoration:none; margin:8px 0;">
              Aceitar convite
            </a>
            <p style="font-size:12px; color:#64748b; margin-top:16px;">Este link expira em 7 dias.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error('Erro ao enviar e-mail de convite:', err)
    }
  }

  revalidatePath('/equipe')
  return { sucesso: true, email: emailConvidado, linkConvite, resendConfigurado: !!resendKey }
}

export async function aceitarConvitePorToken(token: string) {
  const { userId, supabase } = await getAuthContext()
  if (!userId || !supabase) redirect('/sign-in')

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  const nomeUsuario = user?.fullName?.trim() || user?.firstName?.trim() || 'Membro'
  if (!email) return { erro: 'Nao foi possivel identificar seu e-mail na conta.' }

  const { data: convite } = await supabase
    .from('convites_equipe')
    .select('id, escritorio_id, email_convidado, nome_convidado, cargo_convidado, status, expira_em')
    .eq('token', token)
    .maybeSingle()

  if (!convite) return { erro: 'Convite nao encontrado.' }
  if (convite.status !== 'pendente') return { erro: 'Este convite nao esta mais disponivel.' }
  if (new Date(convite.expira_em) < new Date()) {
    await supabase.from('convites_equipe').update({ status: 'expirado' }).eq('id', convite.id)
    return { erro: 'Convite expirado.' }
  }
  if (convite.email_convidado.toLowerCase() !== email) {
    return { erro: 'Este convite pertence a outro e-mail.' }
  }

  const { data: membroExistente } = await supabase
    .from('membros_escritorio')
    .select('id, escritorio_id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (membroExistente?.escritorio_id && membroExistente.escritorio_id !== convite.escritorio_id) {
    return { erro: 'Sua conta ja esta vinculada a outro escritorio.' }
  }

  if (!membroExistente) {
    const limite = await verificarLimitePlano({
      escritorioId: convite.escritorio_id,
      recurso: 'membros',
      supabase,
    })
    if (limite) return limite

    const { error: erroInsert } = await supabase
      .from('membros_escritorio')
      .insert({
        escritorio_id: convite.escritorio_id,
        clerk_user_id: userId,
        nome: convite.nome_convidado || nomeUsuario,
        email,
        cargo: convite.cargo_convidado || 'advogado',
        ativo: true,
      })

    if (erroInsert) {
      console.error('Erro ao vincular membro do convite:', erroInsert)
      return { erro: 'Nao foi possivel concluir o aceite do convite.' }
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

  revalidatePath('/equipe')
  return { sucesso: true }
}

export async function cancelarConvite(conviteId: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_FINANCEIRO, 'Sem permissao para cancelar convites.')
  if (perm) return perm

  const { error } = await supabase
    .from('convites_equipe')
    .update({ status: 'cancelado' })
    .eq('id', conviteId)
    .eq('escritorio_id', escritorioId)
    .eq('status', 'pendente')

  if (error) {
    console.error('Erro ao cancelar convite:', error)
    return { erro: 'Nao foi possivel cancelar o convite.' }
  }

  revalidatePath('/equipe')
  return { sucesso: true }
}

export async function removerMembro(membroId: string) {
  const { escritorioId, membroId: meuId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  if (cargo !== 'socio' && cargo !== 'admin') {
    return { erro: 'Sem permissao para remover membros.' }
  }
  if (membroId === meuId) {
    return { erro: 'Voce nao pode remover a si mesmo.' }
  }

  const { error } = await supabase
    .from('membros_escritorio')
    .delete()
    .eq('id', membroId)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao remover membro:', error)
    return { erro: 'Nao foi possivel remover o membro.' }
  }

  revalidatePath('/equipe')
  return { sucesso: true }
}

export async function editarCargo(membroId: string, novoCargo: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  if (cargo !== 'socio' && cargo !== 'admin') {
    return { erro: 'Sem permissao para editar cargos.' }
  }
  if (!CARGOS_VALIDOS.includes(novoCargo)) {
    return { erro: 'Cargo invalido.' }
  }

  const { error } = await supabase
    .from('membros_escritorio')
    .update({ cargo: novoCargo })
    .eq('id', membroId)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao editar cargo:', error)
    return { erro: 'Nao foi possivel atualizar o cargo.' }
  }

  revalidatePath('/equipe')
  return { sucesso: true }
}
