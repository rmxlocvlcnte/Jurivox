'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { getAuthContext } from '@/lib/auth'
import { registrarAuditLog } from '@/lib/audit'
import { exigirCargo } from '@/lib/permissoes'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const CONFIRMACAO_CONTA = 'EXCLUIR MINHA CONTA'
const CONFIRMACAO_ESCRITORIO = 'EXCLUIR ESCRITORIO'

async function cancelarAssinaturaStripe(escritorioId: string, supabase: NonNullable<Awaited<ReturnType<typeof getAuthContext>>['supabase']>) {
  const { data: assinatura } = await supabase
    .from('assinaturas_escritorio')
    .select('stripe_subscription_id')
    .eq('escritorio_id', escritorioId)
    .maybeSingle()

  if (assinatura?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    try {
      await stripe.subscriptions.cancel(assinatura.stripe_subscription_id)
    } catch (err) {
      console.error('Erro ao cancelar assinatura Stripe:', err)
    }
  }
}

async function limparStorageEscritorio(
  escritorioId: string,
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthContext>>['supabase']>
) {
  const { data: documentos } = await supabase
    .from('documentos_cliente')
    .select('caminho_storage')
    .eq('escritorio_id', escritorioId)

  const caminhos = (documentos ?? [])
    .map((d) => d.caminho_storage)
    .filter((c): c is string => !!c)

  if (caminhos.length > 0) {
    await supabase.storage.from('documentos').remove(caminhos)
  }

  const { data: arquivos } = await supabase.storage.from('documentos').list(escritorioId, { limit: 1000 })
  if (arquivos?.length) {
    const paths = arquivos.map((f) => `${escritorioId}/${f.name}`)
    await supabase.storage.from('documentos').remove(paths)
  }
}

async function excluirUsuariosClerk(clerkUserIds: string[]) {
  const client = await clerkClient()
  for (const id of clerkUserIds) {
    try {
      await client.users.deleteUser(id)
    } catch (err) {
      console.error(`Erro ao excluir usuário Clerk ${id}:`, err)
    }
  }
}

/** Exclui a conta do usuário no Clerk e remove o vínculo com o escritório. */
export async function excluirMinhaConta(confirmacao: string) {
  const { userId, escritorioId, membroId, cargo, supabase } = await getAuthContext({ exigir2FA: true })
  if (!userId || !supabase) redirect('/sign-in')

  if (confirmacao.trim() !== CONFIRMACAO_CONTA) {
    return { erro: `Digite exatamente "${CONFIRMACAO_CONTA}" para confirmar.` }
  }

  if (!escritorioId || !membroId) {
    try {
      await (await clerkClient()).users.deleteUser(userId)
    } catch (err) {
      console.error('Erro ao excluir conta Clerk:', err)
      return { erro: 'Não foi possível excluir a conta. Tente novamente ou contate dpo@jurivox.com.br.' }
    }
    redirect('/')
  }

  const { count: totalMembros } = await supabase
    .from('membros_escritorio')
    .select('id', { count: 'exact', head: true })
    .eq('escritorio_id', escritorioId)

  const { count: totalSocios } = await supabase
    .from('membros_escritorio')
    .select('id', { count: 'exact', head: true })
    .eq('escritorio_id', escritorioId)
    .eq('cargo', 'socio')

  const unicoMembro = (totalMembros ?? 0) <= 1
  const unicoSocio = cargo === 'socio' && (totalSocios ?? 0) <= 1

  if (unicoMembro || unicoSocio) {
    return {
      erro: 'Você é o único responsável pelo escritório. Use "Excluir escritório e todos os dados" para apagar tudo, ou transfira a titularidade antes.',
    }
  }

  await registrarAuditLog({
    escritorioId,
    membroId,
    userId,
    evento: 'conta_usuario_excluida',
    categoria: 'privacidade',
    metadata: { tipo: 'membro' },
  })

  const { error } = await supabase
    .from('membros_escritorio')
    .delete()
    .eq('id', membroId)
    .eq('escritorio_id', escritorioId)

  if (error) {
    console.error('Erro ao remover membro:', error)
    return { erro: 'Não foi possível remover seu vínculo com o escritório.' }
  }

  try {
    await (await clerkClient()).users.deleteUser(userId)
  } catch (err) {
    console.error('Erro ao excluir conta Clerk:', err)
    return { erro: 'Vínculo removido, mas a conta de login não foi apagada. Contate dpo@jurivox.com.br.' }
  }

  redirect('/')
}

/** Direito ao esquecimento: apaga o escritório, dados em cascata, arquivos e contas vinculadas. */
export async function excluirEscritorioEDados(confirmacao: string) {
  const { userId, escritorioId, membroId, cargo, supabase } = await getAuthContext({ exigir2FA: true })
  if (!userId || !escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, ['socio'], 'Somente sócios podem excluir o escritório e todos os dados.')
  if (perm) return perm

  if (confirmacao.trim() !== CONFIRMACAO_ESCRITORIO) {
    return { erro: `Digite exatamente "${CONFIRMACAO_ESCRITORIO}" para confirmar.` }
  }

  const { data: membros } = await supabase
    .from('membros_escritorio')
    .select('clerk_user_id')
    .eq('escritorio_id', escritorioId)

  const clerkIds = [...new Set((membros ?? []).map((m) => m.clerk_user_id).filter(Boolean))]

  await registrarAuditLog({
    escritorioId,
    membroId,
    userId,
    evento: 'escritorio_exclusao_solicitada',
    categoria: 'privacidade',
    metadata: { membros: clerkIds.length },
  })

  await cancelarAssinaturaStripe(escritorioId, supabase)
  await limparStorageEscritorio(escritorioId, supabase)

  const { error } = await supabase.from('escritorios').delete().eq('id', escritorioId)

  if (error) {
    console.error('Erro ao excluir escritório:', error)
    return { erro: 'Não foi possível excluir os dados do escritório. Contate dpo@jurivox.com.br.' }
  }

  await excluirUsuariosClerk(clerkIds)

  revalidatePath('/configuracoes')
  redirect('/')
}
