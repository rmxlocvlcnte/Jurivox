import { getAuthContext } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { buscarQrCodePix } from '@/lib/asaas'
import {
  ArrowLeft, QrCode, Copy, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { CopyPixButton } from '@/components/financeiro/CopyPixButton'

function fmtData(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

function fmtValor(v: number | string) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function PixQrCodePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { escritorioId, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  // Busca boleto no banco
  const { data: boleto } = await supabase
    .from('boletos')
    .select(`
      id, descricao, valor, data_vencimento, tipo, status,
      asaas_payment_id,
      clientes(nome, cpf)
    `)
    .eq('id', id)
    .eq('escritorio_id', escritorioId)
    .eq('tipo', 'PIX')
    .single()

  if (!boleto) notFound()

  const asaasConfigurado = !!(process.env.ASAAS_API_KEY && process.env.ASAAS_API_KEY !== 'seu_asaas_api_key')
  const cliente = boleto.clientes as unknown as { nome: string; cpf: string | null } | null

  // Busca QR Code no Asaas (somente se configurado e houver payment_id)
  let qrCode: { encodedImage: string; payload: string; expirationDate: string } | null = null
  let erroQr: string | null = null

  if (asaasConfigurado && boleto.asaas_payment_id && boleto.status === 'PENDING') {
    try {
      qrCode = await buscarQrCodePix(boleto.asaas_payment_id)
    } catch (err) {
      erroQr = err instanceof Error ? err.message : 'Erro ao buscar QR Code Pix.'
    }
  }

  const jaPago = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(boleto.status)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/financeiro/boletos" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">QR Code Pix</h1>
          <p className="text-sm text-slate-500">{boleto.descricao}</p>
        </div>
      </div>

      {/* Resumo da cobrança */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Valor</span>
          <span className="text-xl font-bold text-slate-900">{fmtValor(boleto.valor)}</span>
        </div>
        {cliente && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Cliente</span>
            <span className="text-sm font-medium text-slate-700">{cliente.nome}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Vencimento</span>
          <span className="text-sm font-medium text-slate-700">{fmtData(boleto.data_vencimento)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Status</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            jaPago
              ? 'bg-emerald-100 text-emerald-700'
              : boleto.status === 'OVERDUE'
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {jaPago ? 'Pago' : boleto.status === 'OVERDUE' ? 'Vencido' : 'Aguardando pagamento'}
          </span>
        </div>
      </div>

      {/* Status: já pago */}
      {jaPago && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Pagamento confirmado</p>
            <p className="text-emerald-700 text-xs mt-1">
              Esta cobrança já foi paga. Não é necessário exibir o QR Code.
            </p>
          </div>
        </div>
      )}

      {/* Asaas não configurado */}
      {!asaasConfigurado && !jaPago && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Asaas não configurado</p>
            <p className="text-amber-700 text-xs mt-1">
              Adicione <code className="bg-amber-100 px-1 rounded">ASAAS_API_KEY</code> no{' '}
              <code className="bg-amber-100 px-1 rounded">.env.local</code> para visualizar o QR Code Pix.
            </p>
          </div>
        </div>
      )}

      {/* Erro ao buscar QR Code */}
      {erroQr && !jaPago && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-sm">Erro ao carregar QR Code</p>
            <p className="text-red-700 text-xs mt-1">{erroQr}</p>
          </div>
        </div>
      )}

      {/* QR Code Pix */}
      {qrCode && !jaPago && (
        <div className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="h-5 w-5 text-violet-600" />
            <h2 className="font-semibold text-slate-900">Escaneie para pagar</h2>
          </div>

          {/* Imagem do QR Code */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${qrCode.encodedImage}`}
              alt="QR Code Pix"
              className="w-56 h-56 rounded-xl border border-slate-200 shadow-sm"
            />
          </div>

          {/* Código copia-e-cola */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Código Pix (copia e cola)</p>
            <div className="flex items-start gap-2">
              <code className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 break-all font-mono">
                {qrCode.payload}
              </code>
              <CopyPixButton payload={qrCode.payload} />
            </div>
          </div>

          {/* Expiração */}
          {qrCode.expirationDate && (
            <p className="text-xs text-slate-400 text-center">
              Válido até {new Date(qrCode.expirationDate).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}

      <div className="text-center">
        <Link
          href="/financeiro/boletos"
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Voltar para cobranças
        </Link>
      </div>
    </div>
  )
}
