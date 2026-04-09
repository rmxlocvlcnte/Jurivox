'use server'

import crypto from 'crypto'
import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirCargo, CARGOS_OPERACIONAIS } from '@/lib/permissoes'

const AssinaturaSchema = z.object({
  titulo: z.string().min(2, 'Titulo obrigatorio.').max(200),
  conteudo_documento: z.string().min(10, 'Conteudo obrigatorio.'),
  email_destinatario: z.string().email('E-mail invalido.'),
  nome_destinatario: z.string().min(2, 'Nome obrigatorio.'),
  mensagem: z.string().max(500).optional().nullable(),
  processo_id: z.string().uuid().optional().nullable(),
  cliente_id: z.string().uuid().optional().nullable(),
})

export async function criarSolicitacaoAssinatura(formData: FormData) {
  const { escritorioId, membroId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao para criar solicitacoes de assinatura.')
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

  if (!parse.success) return { erro: parse.error.issues[0]?.message ?? 'Dados invalidos.' }

  const hashToken = crypto.randomBytes(32).toString('hex')
  const expiraEm = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: assinatura, error } = await supabase
    .from('assinaturas_digitais')
    .insert({
      ...parse.data,
      hash_token: hashToken,
      expira_em: expiraEm,
      escritorio_id: escritorioId,
      criado_por: membroId,
      status: 'pendente',
    })
    .select('id')
    .single()

  if (error || !assinatura) {
    console.error('Erro ao criar assinatura:', error)
    return { erro: 'Nao foi possivel criar a solicitacao.' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const linkAssinatura = `${baseUrl}/assinar/${hashToken}`

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'Jurivox <no-reply@jurivox.com.br>',
        to: parse.data.email_destinatario,
        subject: `Documento aguardando assinatura: ${parse.data.titulo}`,
        html: `
          <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto;">
            <h2 style="color: #0f172a;">Solicitacao de Assinatura Digital</h2>
            <p>Ola, <strong>${parse.data.nome_destinatario}</strong>!</p>
            <p>Voce recebeu um documento para assinatura eletronica:</p>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin:16px 0;">
              <strong>${parse.data.titulo}</strong>
              ${parse.data.mensagem ? `<p style="color:#64748b; margin-top:8px;">${parse.data.mensagem}</p>` : ''}
            </div>
            <a href="${linkAssinatura}" style="display:inline-block; background:#f59e0b; color:#0f172a; font-weight:700; padding:12px 22px; border-radius:8px; text-decoration:none;">
              Ler e assinar documento
            </a>
            <p style="color:#94a3b8; font-size:12px; margin-top:16px;">
              Este link expira em 30 dias. O sistema registra data/hora, IP e user-agent como trilha probatoria.
            </p>
          </div>
        `,
      })
    } catch (e) {
      console.error('Erro ao enviar e-mail de assinatura:', e)
    }
  }

  revalidatePath('/assinaturas')
  redirect('/assinaturas')
}

export async function cancelarAssinatura(id: string) {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/sign-in')

  const perm = exigirCargo(cargo, CARGOS_OPERACIONAIS, 'Sem permissao.')
  if (perm) return perm

  const { error } = await supabase
    .from('assinaturas_digitais')
    .update({ status: 'expirado' })
    .eq('id', id)
    .eq('escritorio_id', escritorioId)

  if (error) return { erro: 'Nao foi possivel cancelar.' }

  revalidatePath('/assinaturas')
  return { sucesso: true }
}
