import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { exigirCargo } from '@/lib/permissoes'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle,
  Settings, CreditCard, Bell, Mail, MessageSquare,
  Database, Zap, ExternalLink,
} from 'lucide-react'
import { StripeSetupButton } from '@/components/configuracoes/StripeSetupButton'
import { PushNotificationToggle } from '@/components/PushNotificationToggle'

function statusIcon(ok: boolean, parcial = false) {
  if (ok) return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
  if (parcial) return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
  return <XCircle className="w-4 h-4 text-red-400 shrink-0" />
}

function statusBadge(ok: boolean, parcial = false) {
  if (ok) return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Configurado</span>
  if (parcial) return <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Parcial</span>
  return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Pendente</span>
}

export default async function IntegracoesPage() {
  const { cargo, escritorioId } = await getAuthContext()
  if (!escritorioId) redirect('/onboarding')

  const perm = exigirCargo(cargo, ['socio', 'admin'])
  if (perm) redirect('/dashboard')

  // Verifica cada integração pelas variáveis de ambiente
  const stripe = {
    ok: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder',
    prices: !!(
      process.env.STRIPE_PRICE_STARTER_MENSAL &&
      process.env.STRIPE_PRICE_PRO_MENSAL &&
      process.env.STRIPE_PRICE_ENTERPRISE_MENSAL
    ),
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
  }

  const supabase = {
    ok: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  }

  const clerk = {
    ok: !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
  }

  const deepseek = { ok: !!process.env.DEEPSEEK_API_KEY }
  const resend = { ok: !!process.env.RESEND_API_KEY }
  const zapi = { ok: !!(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE_ID !== 'SEU_INSTANCE_ID') }
  const datajud = { ok: !!process.env.DATAJUD_API_KEY && process.env.DATAJUD_API_KEY !== 'COLOQUE_SUA_CHAVE' }
  const mercadopago = { ok: !!process.env.MP_ACCESS_TOKEN && process.env.MP_ACCESS_TOKEN !== 'SEU_MP_ACCESS_TOKEN' }
  const vapid = { ok: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) }
  const cron = { ok: !!process.env.CRON_SECRET }

  const integracoes = [
    {
      nome: 'Supabase (Banco de Dados)',
      icon: Database,
      status: supabase.ok,
      descricao: 'PostgreSQL + Auth + Storage',
      link: 'https://supabase.com/dashboard',
      instrucao: 'NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
    },
    {
      nome: 'Clerk (Autenticação)',
      icon: Settings,
      status: clerk.ok,
      descricao: 'Login, convites, 2FA',
      link: 'https://dashboard.clerk.com',
      instrucao: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY',
    },
    {
      nome: 'DeepSeek (IA Jurídica)',
      icon: Zap,
      status: deepseek.ok,
      descricao: 'Assistente jurídico com DeepSeek R1',
      link: 'https://platform.deepseek.com/api-keys',
      instrucao: 'DEEPSEEK_API_KEY',
    },
    {
      nome: 'Stripe (Pagamentos)',
      icon: CreditCard,
      status: stripe.ok && stripe.prices,
      parcial: stripe.ok && !stripe.prices,
      descricao: stripe.ok && !stripe.prices
        ? 'Chave configurada — Price IDs faltando (use Setup abaixo)'
        : 'Checkout e assinaturas recorrentes',
      link: 'https://dashboard.stripe.com/apikeys',
      instrucao: 'STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*',
      acaoStripe: stripe.ok && !stripe.prices,
    },
    {
      nome: 'Resend (E-mails)',
      icon: Mail,
      status: resend.ok,
      descricao: 'Notificações, convites, prazos',
      link: 'https://resend.com/api-keys',
      instrucao: 'RESEND_API_KEY, RESEND_FROM_EMAIL',
    },
    {
      nome: 'Z-API (WhatsApp)',
      icon: MessageSquare,
      status: zapi.ok,
      descricao: 'Avisos de prazos via WhatsApp',
      link: 'https://z-api.io',
      instrucao: 'ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN',
    },
    {
      nome: 'DataJud / CNJ (Monitoramento)',
      icon: Database,
      status: datajud.ok,
      descricao: 'Sync automático de movimentações',
      link: 'https://datajud-wiki.cnj.jus.br/api-publica/acesso',
      instrucao: 'DATAJUD_API_KEY',
    },
    {
      nome: 'Mercado Pago (Boletos e Pix)',
      icon: CreditCard,
      status: mercadopago.ok,
      descricao: 'Emissão de boletos e Pix — aceita CPF e CNPJ',
      link: 'https://www.mercadopago.com.br/developers/pt/docs',
      instrucao: 'MP_ACCESS_TOKEN (TEST-xxx para sandbox, APP_USR-xxx para produção)',
    },
    {
      nome: 'Web Push (Notificações)',
      icon: Bell,
      status: vapid.ok,
      descricao: vapid.ok ? 'Notificações push ativas' : 'Chaves VAPID geradas automaticamente',
      instrucao: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY',
    },
    {
      nome: 'Cron Secret',
      icon: Settings,
      status: cron.ok,
      descricao: cron.ok ? 'Jobs agendados protegidos' : 'Gerado automaticamente',
      instrucao: 'CRON_SECRET',
    },
  ]

  const totalOk = integracoes.filter(i => i.status).length
  const total = integracoes.length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrações & Serviços</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalOk}/{total} serviços configurados
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Status geral</span>
          <span className="text-sm font-semibold text-slate-900">{Math.round((totalOk / total) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${(totalOk / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Lista de integrações */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {integracoes.map((intg) => (
          <div key={intg.nome} className="flex items-start gap-4 p-4">
            <div className={`p-2 rounded-lg shrink-0 ${intg.status ? 'bg-emerald-50' : intg.parcial ? 'bg-amber-50' : 'bg-slate-100'}`}>
              <intg.icon className={`w-4 h-4 ${intg.status ? 'text-emerald-600' : intg.parcial ? 'text-amber-600' : 'text-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {statusIcon(intg.status, intg.parcial)}
                <span className="text-sm font-semibold text-slate-900">{intg.nome}</span>
                {statusBadge(intg.status, intg.parcial)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{intg.descricao}</p>
              {!intg.status && (
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{intg.instrucao}</p>
              )}
              {/* Ações especiais */}
              {(intg as any).acaoStripe && (
                <div className="mt-2">
                  <StripeSetupButton />
                </div>
              )}
              {intg.nome.includes('Web Push') && intg.status && (
                <div className="mt-2">
                  <PushNotificationToggle />
                </div>
              )}
            </div>
            {intg.link && !intg.status && (
              <a
                href={intg.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Configurar
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Instrução Vercel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-1">
        <p className="font-semibold text-slate-800">Como adicionar variáveis de ambiente na Vercel</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Acesse <a href="https://vercel.com/dashboard" target="_blank" className="text-amber-600 hover:underline">vercel.com/dashboard</a> → seu projeto → Settings → Environment Variables</li>
          <li>Adicione cada variável marcada como "Pendente" acima</li>
          <li>Faça um novo deploy para as variáveis entrarem em vigor</li>
        </ol>
      </div>
    </div>
  )
}
