// ─────────────────────────────────────────────────────────────────────────────
// Mercado Pago — Cliente da API para boletos e Pix
// Documentação: https://www.mercadopago.com.br/developers/pt/docs
// Aceita CPF e CNPJ — sandbox com token TEST-xxx, produção com APP_USR-xxx
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.mercadopago.com'
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? ''

// ── Tipos ──────────────────────────────────────────────────────────────────

export type MPPaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back'

export type MPBillingType = 'BOLETO' | 'PIX'

export interface MPPayment {
  id: number
  status: MPPaymentStatus
  status_detail: string
  transaction_amount: number
  description: string
  date_of_expiration?: string
  transaction_details?: {
    external_resource_url?: string  // URL do boleto
  }
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string         // código copia-e-cola Pix
      qr_code_base64?: string  // imagem PNG em base64
      ticket_url?: string
    }
  }
}

export interface MPPixQrCode {
  encodedImage: string   // base64 PNG
  payload: string        // código copia-e-cola
  expirationDate: string
}

// ── Helper de request ──────────────────────────────────────────────────────

async function mpRequest<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: unknown,
): Promise<T> {
  if (!ACCESS_TOKEN || ACCESS_TOKEN === 'SEU_MP_ACCESS_TOKEN') {
    throw new Error('MP_ACCESS_TOKEN não configurada. Configure no .env.local.')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `jurivox-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const msg = err?.message ?? err?.error ?? `Erro ${res.status}`
    throw new Error(`Mercado Pago: ${msg}`)
  }

  return res.json()
}

// ── Cobranças ──────────────────────────────────────────────────────────────

/** Cria um pagamento (boleto ou Pix) */
export async function criarCobranca(params: {
  nomePagador: string
  cpfCnpj: string
  emailPagador: string
  valor: number
  vencimento: string   // 'YYYY-MM-DD'
  descricao: string
  tipo: 'BOLETO' | 'PIX'
  referencia?: string
}): Promise<MPPayment> {
  const cpfLimpo = params.cpfCnpj.replace(/\D/g, '')
  const tipoDoc = cpfLimpo.length === 11 ? 'CPF' : 'CNPJ'

  // MP exige primeiro e último nome separados
  const partes = params.nomePagador.trim().split(/\s+/)
  const firstName = partes[0]
  const lastName = partes.length > 1 ? partes.slice(1).join(' ') : partes[0]

  // Converte YYYY-MM-DD para ISO 8601 com timezone BR (fim do dia)
  const expiration = `${params.vencimento}T23:59:59.000-03:00`

  const paymentMethodId = params.tipo === 'PIX' ? 'pix' : 'bolbradesco'

  return mpRequest<MPPayment>('POST', '/v1/payments', {
    transaction_amount: params.valor,
    description: params.descricao,
    payment_method_id: paymentMethodId,
    date_of_expiration: expiration,
    external_reference: params.referencia,
    payer: {
      email: params.emailPagador,
      first_name: firstName,
      last_name: lastName,
      identification: {
        type: tipoDoc,
        number: cpfLimpo,
      },
    },
  })
}

/** Busca dados de um pagamento */
export async function buscarCobranca(mpPaymentId: string): Promise<MPPayment> {
  return mpRequest<MPPayment>('GET', `/v1/payments/${mpPaymentId}`)
}

/** Busca QR Code Pix de um pagamento */
export async function buscarQrCodePix(mpPaymentId: string): Promise<MPPixQrCode> {
  const payment = await mpRequest<MPPayment>('GET', `/v1/payments/${mpPaymentId}`)

  const data = payment.point_of_interaction?.transaction_data
  if (!data?.qr_code || !data?.qr_code_base64) {
    throw new Error('QR Code Pix não disponível para este pagamento.')
  }

  return {
    encodedImage: data.qr_code_base64,
    payload: data.qr_code,
    expirationDate: payment.date_of_expiration ?? '',
  }
}

/** Cancela um pagamento */
export async function cancelarCobranca(mpPaymentId: string): Promise<void> {
  await mpRequest('PUT', `/v1/payments/${mpPaymentId}`, { status: 'cancelled' })
}

// ── Mapa de status para exibição ───────────────────────────────────────────

export const MP_STATUS_LABEL: Record<MPPaymentStatus, string> = {
  pending:      'Aguardando pagamento',
  approved:     'Pago',
  authorized:   'Autorizado',
  in_process:   'Em processamento',
  in_mediation: 'Em mediação',
  rejected:     'Rejeitado',
  cancelled:    'Cancelado',
  refunded:     'Estornado',
  charged_back: 'Chargeback',
}

export const MP_STATUS_COR: Record<MPPaymentStatus, string> = {
  pending:      'bg-amber-100 text-amber-700',
  approved:     'bg-emerald-100 text-emerald-700',
  authorized:   'bg-emerald-100 text-emerald-700',
  in_process:   'bg-blue-100 text-blue-700',
  in_mediation: 'bg-orange-100 text-orange-700',
  rejected:     'bg-red-100 text-red-700',
  cancelled:    'bg-slate-100 text-slate-500',
  refunded:     'bg-slate-100 text-slate-600',
  charged_back: 'bg-red-100 text-red-700',
}

// Status que indicam pagamento confirmado
export const MP_STATUS_PAGO: MPPaymentStatus[] = ['approved', 'authorized']
