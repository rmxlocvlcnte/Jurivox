// ─────────────────────────────────────────────────────────────────────────────
// ASAAS — Cliente da API para emissão de boletos e Pix
// Documentação: https://docs.asaas.com
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.ASAAS_SANDBOX === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3'

const API_KEY = process.env.ASAAS_API_KEY ?? ''

// ── Tipos ──────────────────────────────────────────────────────────────────

export type AsaasBillingType = 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED'

export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'CHARGEBACK_REQUESTED'
  | 'CANCELED'

export interface AsaasCustomer {
  id: string
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
}

export interface AsaasPayment {
  id: string
  customer: string
  billingType: AsaasBillingType
  status: AsaasPaymentStatus
  value: number
  netValue: number
  dueDate: string
  description?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  nossoNumero?: string
  pixTransaction?: { qrCode: { encodedImage: string; payload: string } }
}

export interface AsaasPixQrCode {
  encodedImage: string  // base64 PNG
  payload: string       // código copia-e-cola
  expirationDate: string
}

// ── Helper de request ──────────────────────────────────────────────────────

async function asaasRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  if (!API_KEY || API_KEY === 'seu_asaas_api_key') {
    throw new Error('ASAAS_API_KEY não configurada. Configure no .env.local.')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      access_token: API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'Jurivox/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ errors: [{ description: res.statusText }] }))
    const msg = err?.errors?.[0]?.description ?? `Erro ${res.status}`
    throw new Error(`Asaas: ${msg}`)
  }

  return res.json()
}

// ── Clientes ───────────────────────────────────────────────────────────────

/** Busca cliente pelo CPF/CNPJ ou cria um novo */
export async function obterOuCriarCliente(params: {
  nome: string
  cpfCnpj: string
  email?: string | null
  telefone?: string | null
}): Promise<AsaasCustomer> {
  // Tenta encontrar cliente existente
  const cpfLimpo = params.cpfCnpj.replace(/\D/g, '')
  const lista = await asaasRequest<{ data: AsaasCustomer[] }>(
    'GET', `/customers?cpfCnpj=${cpfLimpo}&limit=1`
  )

  if (lista.data.length > 0) return lista.data[0]

  // Cria novo cliente
  return asaasRequest<AsaasCustomer>('POST', '/customers', {
    name: params.nome,
    cpfCnpj: cpfLimpo,
    email: params.email ?? undefined,
    mobilePhone: params.telefone?.replace(/\D/g, '') ?? undefined,
    notificationDisabled: false,
  })
}

// ── Cobranças ──────────────────────────────────────────────────────────────

/** Cria uma cobrança (boleto ou Pix) */
export async function criarCobranca(params: {
  asaasCustomerId: string
  valor: number
  vencimento: string   // 'YYYY-MM-DD'
  descricao: string
  tipo: 'BOLETO' | 'PIX'
  externalReference?: string
}): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>('POST', '/payments', {
    customer: params.asaasCustomerId,
    billingType: params.tipo,
    value: params.valor,
    dueDate: params.vencimento,
    description: params.descricao,
    externalReference: params.externalReference,
    fine: { value: 2 },         // Multa 2%
    interest: { value: 1 },     // Juros 1% ao mês
    postalService: false,
  })
}

/** Busca dados de uma cobrança */
export async function buscarCobranca(asaasPaymentId: string): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>('GET', `/payments/${asaasPaymentId}`)
}

/** Busca o QR Code Pix de uma cobrança */
export async function buscarQrCodePix(asaasPaymentId: string): Promise<AsaasPixQrCode> {
  return asaasRequest<AsaasPixQrCode>('GET', `/payments/${asaasPaymentId}/pixQrCode`)
}

/** Cancela uma cobrança */
export async function cancelarCobranca(asaasPaymentId: string): Promise<void> {
  await asaasRequest('DELETE', `/payments/${asaasPaymentId}`)
}

/** Lista cobranças de um cliente */
export async function listarCobrancas(asaasCustomerId: string): Promise<AsaasPayment[]> {
  const res = await asaasRequest<{ data: AsaasPayment[] }>(
    'GET', `/payments?customer=${asaasCustomerId}&limit=50`
  )
  return res.data
}

// ── Mapa de status para exibição ───────────────────────────────────────────

export const ASAAS_STATUS_LABEL: Record<AsaasPaymentStatus, string> = {
  PENDING: 'Aguardando pagamento',
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  OVERDUE: 'Vencido',
  REFUNDED: 'Estornado',
  RECEIVED_IN_CASH: 'Recebido em dinheiro',
  CHARGEBACK_REQUESTED: 'Chargeback solicitado',
  CANCELED: 'Cancelado',
}

export const ASAAS_STATUS_COR: Record<AsaasPaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
  RECEIVED_IN_CASH: 'bg-emerald-100 text-emerald-700',
  CHARGEBACK_REQUESTED: 'bg-red-100 text-red-700',
  CANCELED: 'bg-slate-100 text-slate-500',
}
