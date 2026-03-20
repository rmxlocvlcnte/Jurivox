'use server'

// -----------------------------------------------
// WhatsApp via Z-API
// Documentação: https://developer.z-api.io
// -----------------------------------------------
// Para usar:
// 1. Crie uma conta em z-api.io
// 2. Crie uma instância e conecte seu WhatsApp
// 3. Copie o Instance ID, Token e Client Token
// 4. Preencha as variáveis no .env.local

function getZApiConfig() {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token || instanceId === 'SEU_INSTANCE_ID') return null

  return {
    url: `https://api.z-api.io/instances/${instanceId}/token/${token}`,
    clientToken: clientToken ?? '',
  }
}

// Formata telefone para o padrão internacional (55 + DDD + número)
function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '')
  // Se já começa com 55 (Brasil), retorna como está
  if (numeros.startsWith('55') && numeros.length >= 12) return numeros
  // Adiciona o código do Brasil
  return `55${numeros}`
}

// -----------------------------------------------
// Envia mensagem de texto simples
// -----------------------------------------------
async function enviarMensagem(telefone: string, mensagem: string): Promise<void> {
  const config = getZApiConfig()
  if (!config || !telefone) return

  const telefoneFormatado = formatarTelefone(telefone)

  try {
    const response = await fetch(`${config.url}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': config.clientToken,
      },
      body: JSON.stringify({
        phone: telefoneFormatado,
        message: mensagem,
      }),
    })

    if (!response.ok) {
      const erro = await response.text()
      console.error('[Z-API] Erro ao enviar WhatsApp:', erro)
    }
  } catch (err) {
    // Notificações nunca devem quebrar o fluxo principal
    console.error('[Z-API] Erro de conexão:', err)
  }
}

// -----------------------------------------------
// WhatsApp: Nova movimentação no processo
// -----------------------------------------------
export async function whatsappNovaMovimentacao({
  telefoneCliente,
  nomeCliente,
  numeroCnj,
  descricao,
  nomeEscritorio,
}: {
  telefoneCliente: string
  nomeCliente: string
  numeroCnj: string
  descricao: string
  nomeEscritorio: string
}) {
  const mensagem =
    `*${nomeEscritorio}* — Nova movimentação\n\n` +
    `Olá, *${nomeCliente}*! 👋\n\n` +
    `Seu processo *${numeroCnj}* teve uma atualização:\n\n` +
    `📋 _${descricao}_\n\n` +
    `Entre em contato conosco se tiver dúvidas.`

  await enviarMensagem(telefoneCliente, mensagem)
}

// -----------------------------------------------
// WhatsApp: Novo prazo cadastrado (para o advogado)
// -----------------------------------------------
export async function whatsappNovoPrazo({
  telefoneAdvogado,
  nomeAdvogado,
  numeroCnj,
  descricao,
  dataVencimento,
  diasRestantes,
}: {
  telefoneAdvogado: string
  nomeAdvogado: string
  numeroCnj: string
  descricao: string
  dataVencimento: string
  diasRestantes: number
}) {
  const dataFormatada = new Date(dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')
  const urgencia = diasRestantes <= 1 ? '🚨 *URGENTE*' : diasRestantes <= 3 ? '⚠️ *Atenção*' : '📅'

  const mensagem =
    `${urgencia} *JurisFlow* — Alerta de Prazo\n\n` +
    `Olá, *${nomeAdvogado}*!\n\n` +
    `Um novo prazo foi cadastrado:\n` +
    `• Processo: *${numeroCnj}*\n` +
    `• Prazo: ${descricao}\n` +
    `• Vencimento: *${dataFormatada}*\n` +
    `• Dias restantes: *${diasRestantes}*\n\n` +
    `Acesse o JurisFlow para mais detalhes.`

  await enviarMensagem(telefoneAdvogado, mensagem)
}

// -----------------------------------------------
// WhatsApp: Lembrete de prazo vencendo (usar em cron job)
// -----------------------------------------------
export async function whatsappLembretePrazo({
  telefoneAdvogado,
  numeroCnj,
  descricao,
  dataVencimento,
}: {
  telefoneAdvogado: string
  numeroCnj: string
  descricao: string
  dataVencimento: string
}) {
  const dataFormatada = new Date(dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')

  const mensagem =
    `🚨 *JurisFlow* — Prazo Vencendo HOJE\n\n` +
    `• Processo: *${numeroCnj}*\n` +
    `• Prazo: ${descricao}\n` +
    `• Data: *${dataFormatada}*\n\n` +
    `Acesse o sistema imediatamente!`

  await enviarMensagem(telefoneAdvogado, mensagem)
}
