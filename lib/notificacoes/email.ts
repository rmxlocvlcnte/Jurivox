'use server'

import { Resend } from 'resend'

// Só inicializa o Resend se a chave estiver configurada
function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_COLOQUE_AQUI') return null
  return new Resend(key)
}

const REMETENTE = process.env.RESEND_FROM_EMAIL ?? 'Jurivox <noreply@jurivox.com.br>'

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
                  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Jurivox</h1>
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
                © 2025 Jurivox · Este e-mail foi enviado automaticamente. Não responda a este endereço.
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
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">⚖️ Jurivox</h1>
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
                © 2025 Jurivox · Enviado automaticamente pelo sistema.
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

// -----------------------------------------------
// E-mail: Boas-vindas ao novo escritório
// -----------------------------------------------
export async function emailBoasVindas({
  emailAdvogado,
  nomeAdvogado,
  nomeEscritorio,
}: {
  emailAdvogado: string
  nomeAdvogado: string
  nomeEscritorio: string
}) {
  const resend = getResend()
  if (!resend || !emailAdvogado) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jurivox.com.br'

  try {
    await resend.emails.send({
      from: REMETENTE,
      to: emailAdvogado,
      subject: `Bem-vindo ao Jurivox, ${nomeAdvogado}! ⚖️`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);padding:40px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                <div style="background:linear-gradient(135deg,#f59e0b,#d97706);width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;">⚖️</div>
                <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Jurivox</h1>
              </div>
              <h2 style="margin:0;color:#f59e0b;font-size:28px;font-weight:700;">Bem-vindo ao futuro da gestão jurídica!</h2>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:15px;">Seu escritório está pronto para decolar.</p>
            </div>

            <div style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong style="color:#0f172a;">${nomeAdvogado}</strong> 👋</p>
              <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.7;">
                O escritório <strong>${nomeEscritorio}</strong> foi criado com sucesso! Você agora tem acesso a todas as ferramentas que precisa para gerenciar seus processos, prazos e clientes com eficiência.
              </p>

              <div style="background:#fef3c7;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #fde68a;">
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">✨ Comece por aqui</p>
                <ul style="margin:0;padding-left:16px;color:#78350f;font-size:14px;line-height:2;">
                  <li>Cadastre seus <strong>clientes</strong> e processos</li>
                  <li>Defina <strong>prazos</strong> para nunca perder uma data</li>
                  <li>Configure sua <strong>agenda</strong> de audiências</li>
                  <li>Use o <strong>Assistente IA</strong> para análises jurídicas</li>
                </ul>
              </div>

              <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#1c1917;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
                Acessar minha plataforma →
              </a>

              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                Você tem <strong>14 dias de trial gratuito</strong>. Explore à vontade e escolha o plano ideal quando quiser.
              </p>
            </div>

            <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Jurivox · Dúvidas? Responda este e-mail.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('[Resend] Erro ao enviar e-mail de boas-vindas:', err)
  }
}

// -----------------------------------------------
// E-mail: Trial expirando em breve
// -----------------------------------------------
export async function emailTrialExpirando({
  emailAdvogado,
  nomeAdvogado,
  nomeEscritorio,
  diasRestantes,
  planoAtual,
}: {
  emailAdvogado: string
  nomeAdvogado: string
  nomeEscritorio: string
  diasRestantes: number
  planoAtual: string
}) {
  const resend = getResend()
  if (!resend || !emailAdvogado) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jurivox.com.br'
  const urgencia = diasRestantes <= 1 ? '🚨 ÚLTIMO DIA' : `⏳ ${diasRestantes} dias restantes`
  const corUrgencia = diasRestantes <= 1 ? '#ef4444' : '#f59e0b'

  try {
    await resend.emails.send({
      from: REMETENTE,
      to: emailAdvogado,
      subject: `${urgencia} — Seu trial do Jurivox está acabando`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">⚖️ Jurivox</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Aviso de Trial</p>
            </div>

            <div style="padding:32px 40px;">
              <div style="display:inline-block;background:${corUrgencia}1a;color:${corUrgencia};font-size:14px;font-weight:700;padding:8px 16px;border-radius:20px;border:1px solid ${corUrgencia}44;margin-bottom:20px;">
                ${urgencia}
              </div>

              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong style="color:#0f172a;">${nomeAdvogado}</strong></p>
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:700;">Seu período de trial está acabando</h2>

              <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
                O trial do escritório <strong>${nomeEscritorio}</strong> no plano <strong>${planoAtual}</strong> expira em
                <strong style="color:${corUrgencia};">${diasRestantes <= 1 ? 'menos de 24 horas' : `${diasRestantes} dias`}</strong>.
                Para continuar usando o Jurivox sem interrupção, assine agora.
              </p>

              <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #bbf7d0;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#166534;text-transform:uppercase;">✅ O que você mantém com a assinatura</p>
                <ul style="margin:0;padding-left:16px;color:#15803d;font-size:14px;line-height:1.8;">
                  <li>Todos os seus processos e prazos cadastrados</li>
                  <li>Histórico completo de clientes e contratos</li>
                  <li>Alertas automáticos de vencimento</li>
                  <li>Assistente IA jurídico disponível 24h</li>
                </ul>
              </div>

              <a href="${appUrl}/planos" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#1c1917;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:20px;">
                Assinar agora e continuar →
              </a>

              <p style="margin:0;color:#94a3b8;font-size:13px;">
                Após o trial, o acesso será suspenso mas seus dados ficam salvos por 30 dias.
              </p>
            </div>

            <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Jurivox · Cancele quando quiser. Sem fidelidade.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('[Resend] Erro ao enviar e-mail de trial expirando:', err)
  }
}

// -----------------------------------------------
// E-mail: Pagamento falhou (dunning)
// -----------------------------------------------
export async function emailPagamentoFalhou({
  emailAdvogado,
  nomeAdvogado,
  nomeEscritorio,
  valorCentavos,
  tentativa,
}: {
  emailAdvogado: string
  nomeAdvogado: string
  nomeEscritorio: string
  valorCentavos: number
  tentativa: number
}) {
  const resend = getResend()
  if (!resend || !emailAdvogado) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jurivox.com.br'
  const valor = (valorCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  try {
    await resend.emails.send({
      from: REMETENTE,
      to: emailAdvogado,
      subject: `❌ Falha no pagamento da assinatura Jurivox`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">⚖️ Jurivox</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Aviso de Pagamento</p>
            </div>

            <div style="padding:32px 40px;">
              <div style="background:#fef2f2;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #fecaca;">
                <p style="margin:0;font-size:15px;font-weight:700;color:#b91c1c;">❌ Pagamento não processado</p>
                <p style="margin:6px 0 0;font-size:13px;color:#dc2626;">Tentativa ${tentativa} de 4 · Valor: ${valor}</p>
              </div>

              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong style="color:#0f172a;">${nomeAdvogado}</strong></p>
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:700;">Não conseguimos processar seu pagamento</h2>

              <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
                A renovação da assinatura do escritório <strong>${nomeEscritorio}</strong> (${valor}) não foi aprovada.
                Atualize sua forma de pagamento para evitar a suspensão do acesso.
              </p>

              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Possíveis causas:</p>
              <ul style="margin:0 0 24px;padding-left:16px;color:#64748b;font-size:13px;line-height:1.8;">
                <li>Saldo insuficiente ou limite excedido</li>
                <li>Cartão expirado ou bloqueado</li>
                <li>Banco recusou a transação</li>
              </ul>

              <a href="${appUrl}/planos" style="display:inline-block;background:#ef4444;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:20px;">
                Atualizar forma de pagamento →
              </a>

              <p style="margin:0;color:#94a3b8;font-size:13px;">
                Faremos mais ${4 - tentativa} tentativa${4 - tentativa !== 1 ? 's' : ''} automática${4 - tentativa !== 1 ? 's' : ''}. Se não resolver, a assinatura será cancelada e seus dados ficam salvos por 30 dias.
              </p>
            </div>

            <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Jurivox · Dificuldades? Responda este e-mail.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('[Resend] Erro ao enviar e-mail de pagamento falhou:', err)
  }
}

// -----------------------------------------------
// E-mail: Resumo de contas a receber vencidas
// -----------------------------------------------
export async function emailContasVencidas({
  emailAdvogado,
  nomeAdvogado,
  nomeEscritorio,
  qtdVencidas,
  valorTotalVencido,
  qtdVencendoHoje,
}: {
  emailAdvogado: string
  nomeAdvogado: string
  nomeEscritorio: string
  qtdVencidas: number
  valorTotalVencido: number
  qtdVencendoHoje: number
}) {
  const resend = getResend()
  if (!resend || !emailAdvogado) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jurivox.com.br'
  const valorFormatado = valorTotalVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const total = qtdVencidas + qtdVencendoHoje

  try {
    await resend.emails.send({
      from: REMETENTE,
      to: emailAdvogado,
      subject: `💰 ${total} cobrança${total !== 1 ? 's' : ''} precisando de atenção — ${nomeEscritorio}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">⚖️ Jurivox</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Resumo Financeiro — ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            <div style="padding:32px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá, <strong style="color:#0f172a;">${nomeAdvogado}</strong></p>
              <h2 style="margin:0 0 20px;color:#0f172a;font-size:20px;font-weight:700;">Cobranças que precisam de atenção</h2>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
                ${qtdVencidas > 0 ? `
                <div style="background:#fef2f2;border-radius:12px;padding:16px;border:1px solid #fecaca;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#dc2626;text-transform:uppercase;">Em atraso</p>
                  <p style="margin:0;font-size:28px;font-weight:700;color:#b91c1c;">${qtdVencidas}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#ef4444;">${valorFormatado}</p>
                </div>` : ''}
                ${qtdVencendoHoje > 0 ? `
                <div style="background:#fffbeb;border-radius:12px;padding:16px;border:1px solid #fde68a;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#d97706;text-transform:uppercase;">Vence hoje</p>
                  <p style="margin:0;font-size:28px;font-weight:700;color:#b45309;">${qtdVencendoHoje}</p>
                </div>` : ''}
              </div>

              <a href="${appUrl}/contas-receber" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#1c1917;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:20px;">
                Ver cobranças →
              </a>

              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                Acesse a plataforma para registrar recebimentos e enviar lembretes aos clientes.
              </p>
            </div>

            <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Jurivox · Enviado automaticamente.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (err) {
    console.error('[Resend] Erro ao enviar e-mail de contas vencidas:', err)
  }
}
