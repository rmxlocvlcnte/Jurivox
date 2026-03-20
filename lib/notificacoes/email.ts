'use server'

import { Resend } from 'resend'

// Só inicializa o Resend se a chave estiver configurada
function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_COLOQUE_AQUI') return null
  return new Resend(key)
}

const REMETENTE = process.env.RESEND_FROM_EMAIL ?? 'JurisFlow <noreply@jurisflow.com.br>'

// -----------------------------------------------
// E-mail: Nova movimentação no processo
// -----------------------------------------------
export async function emailNovaMovimentacao({
  emailCliente,
  nomeCliente,
  nomeEscritorio,
  numeroCnj,
  descricao,
  tipo,
}: {
  emailCliente: string
  nomeCliente: string
  nomeEscritorio: string
  numeroCnj: string
  descricao: string
  tipo: string
}) {
  const resend = getResend()
  if (!resend || !emailCliente) return

  const tipoLabel: Record<string, string> = {
    audiencia: '⚖️ Audiência',
    despacho: '📋 Despacho',
    sentenca: '🔨 Sentença',
    prazo: '⏰ Prazo',
    peticao: '📄 Petição',
    andamento: '📌 Andamento',
  }

  const tipoFormatado = tipoLabel[tipo] ?? '📌 Andamento'

  try {
    await resend.emails.send({
      from: REMETENTE,
      to: emailCliente,
      subject: `Nova movimentação no processo ${numeroCnj}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);padding:32px 40px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="background:linear-gradient(135deg,#f59e0b,#d97706);width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;">⚖️</div>
                <div>
                  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">JurisFlow</h1>
                  <p style="margin:0;color:#94a3b8;font-size:12px;">${nomeEscritorio}</p>
                </div>
              </div>
            </div>

            <!-- Body -->
            <div style="padding:32px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong style="color:#0f172a;">${nomeCliente}</strong></p>
              <h2 style="margin:0 0 24px;color:#0f172a;font-size:20px;font-weight:700;">Nova movimentação no seu processo</h2>

              <!-- Processo -->
              <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #e2e8f0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Processo</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;font-family:monospace;">${numeroCnj}</p>
              </div>

              <!-- Tipo -->
              <div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;padding:6px 12px;border-radius:20px;margin-bottom:16px;">
                ${tipoFormatado}
              </div>

              <!-- Movimentação -->
              <div style="background:#fff;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:0 12px 12px 0;margin-bottom:28px;">
                <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">${descricao}</p>
              </div>

              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                Entre em contato com seu escritório caso tenha dúvidas sobre essa movimentação.
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © 2025 JurisFlow · Este e-mail foi enviado automaticamente. Não responda a este endereço.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    // Notificações nunca devem quebrar o fluxo principal
    console.error('[Resend] Erro ao enviar e-mail de movimentação:', err)
  }
}

// -----------------------------------------------
// E-mail: Prazo cadastrado / vencendo
// -----------------------------------------------
export async function emailNovoPrazo({
  emailAdvogado,
  nomeAdvogado,
  numeroCnj,
  descricao,
  dataVencimento,
  diasRestantes,
}: {
  emailAdvogado: string
  nomeAdvogado: string
  numeroCnj: string
  descricao: string
  dataVencimento: string
  diasRestantes: number
}) {
  const resend = getResend()
  if (!resend || !emailAdvogado) return

  const dataFormatada = new Date(dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const urgenciaColor = diasRestantes <= 1 ? '#ef4444' : diasRestantes <= 3 ? '#f59e0b' : '#22c55e'
  const urgenciaLabel = diasRestantes <= 0 ? '🚨 VENCIDO' : diasRestantes === 1 ? '⚠️ Vence HOJE' : `⏰ ${diasRestantes} dias restantes`

  try {
    await resend.emails.send({
      from: REMETENTE,
      to: emailAdvogado,
      subject: `⏰ Prazo cadastrado: ${descricao} — ${numeroCnj}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">⚖️ JurisFlow</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Alerta de Prazo</p>
            </div>

            <div style="padding:32px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong style="color:#0f172a;">${nomeAdvogado}</strong></p>
              <h2 style="margin:0 0 24px;color:#0f172a;font-size:20px;font-weight:700;">Novo prazo cadastrado</h2>

              <!-- Badge de urgência -->
              <div style="display:inline-block;background:${urgenciaColor}1a;color:${urgenciaColor};font-size:13px;font-weight:700;padding:8px 16px;border-radius:20px;margin-bottom:20px;border:1px solid ${urgenciaColor}33;">
                ${urgenciaLabel}
              </div>

              <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Processo</p>
                <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;font-family:monospace;">${numeroCnj}</p>
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Prazo</p>
                <p style="margin:0 0 12px;font-size:15px;color:#334155;">${descricao}</p>
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Vencimento</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:${urgenciaColor};">${dataFormatada}</p>
              </div>
            </div>

            <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © 2025 JurisFlow · Enviado automaticamente pelo sistema.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('[Resend] Erro ao enviar e-mail de prazo:', err)
  }
}
