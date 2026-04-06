'use server'

import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const AssinaturaSchema = z.object({
  titulo: z.string().min(2, 'Título obrigatório.').max(200),
  conteudo_documento: z.string().min(10, 'Conteúdo obrigatório.'),
  email_destinatario: z.string().email('E-mail inválido.'),
  nome_destinatario: z.string().min(2, 'Nome obrigatório.'),
  mensagem: z.string().max(500).optional().nullable(),
  processo_id: z.string().uuid().optional().nullable(),
  cliente_id: z.string().uuid().optional().nullable(),
})

export async function criarSolicitacaoAssinatura(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão para criar solicitações de assinatura.')
  if (perm) return perm

  const parse = AssinaturaSchema.safeParse({
    titulo: (formData.get('titulo') as string)?.trim(),
    conteudo_documento: formData.get('conteudo_documento') as string,
    email_destinatario: (formData.get('email_destinatario') as string)?.trim(),
    nome_destinatario: (formData.get('nome_destinatario') as string)?.trim(),
    mensagem: (formData.get('mensagem') as string)?.trim() || null,
    processo_id: (formData.get('processo_id') as string) || null,
    cliente_id: (formData.get('cliente_id') as string) || null,
  })

  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados inválidos.' }

  // Gera token seguro único
  const hash_token = crypto.randomBytes(32).toString('hex')

  const expira_em = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: assinatura, error } = await supabase
    .from('assinaturas_digitais')
    .insert({
      ...parse.data,
      hash_token,
      expira_em,
      escritorio_id: escritorioId,
      criado_por: membroId,
    })
    .select('id')
    .single()

  if (error || !assinatura) {
    console.error('Erro ao criar assinatura:', error)
    return { erro: 'Não foi possível criar a solicitação.' }
  }

  // Envia e-mail com link de assinatura
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const linkAssinatura = `${baseUrl}/assinar/${hash_token}`

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'JurisFlow <no-reply@jurisflow.com.br>',
        to: parse.data.email_destinatario,
        subject: `Documento aguardando sua assinatura: ${parse.data.titulo}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Solicitação de Assinatura Digital</h2>
            <p>Olá, <strong>${parse.data.nome_destinatario}</strong>!</p>
            <p>Você recebeu um documento para assinar digitalmente:</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <strong>${parse.data.titulo}</strong>
              ${parse.data.mensagem ? `<p style="color: #64748b; margin-top: 8px;">${parse.data.mensagem}</p>` : ''}
            </div>
            <a href="${linkAssinatura}"
               style="display: inline-block; background: #f59e0b; color: #1e293b; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 8px 0;">
              Assinar Documento
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
              Este link expira em 30 dias. Ao assinar, você confirma a leitura e concordância com o conteúdo do documento.
            </p>
          </div>
        `,
      })
    } catch (e) {
      console.error('Erro ao enviar e-mail de assinatura:', e)
    }
  }

  revalidatePath('/assinaturas')
  redirect(`/assinaturas`)
}

export async function cancelarAssinatura(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissão.')
  if (perm) return perm

  const { error } = await supabase
    .from('assinaturas_digitais')
    .update({ status: 'expirado' })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Não foi possível cancelar.' }

  revalidatePath('/assinaturas')
  return { sucesso: true }
}

// Chamado pela página pública /assinar/[hash]
export async function registrarAssinatura(hash: string, ip: string, userAgent: string) {
  const supabase = createAdminClient()

  const { data: assinatura } = await supabase
    .from('assinaturas_digitais')
    .select('id, status, expira_em')
    .eq('hash_token', hash)
    .single()

  if (!assinatura) return { erro: 'Documento não encontrado.' }
  if (assinatura.status !== 'pendente' && assinatura.status !== 'visualizado') {
    return { erro: 'Este documento já foi processado.' }
  }
  if (new Date(assinatura.expira_em) < new Date()) {
    await supabase.from('assinaturas_digitais').update({ status: 'expirado' }).eq('id', assinatura.id)
    return { erro: 'Este link de assinatura expirou.' }
  }

  const { error } = await supabase
    .from('assinaturas_digitais')
    .update({
      status: 'assinado',
      assinado_em: new Date().toISOString(),
      ip_assinatura: ip,
      user_agent: userAgent,
    })
    .eq('id', assinatura.id)

  if (error) return { erro: 'Não foi possível registrar a assinatura.' }
  return { sucesso: true }
}

export async function marcarVisualizado(hash: string) {
  const supabase = createAdminClient()
  await supabase
    .from('assinaturas_digitais')
    .update({ status: 'visualizado' })
    .eq('hash_token', hash)
    .eq('status', 'pendente')
}
