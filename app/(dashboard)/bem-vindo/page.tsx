import { getAuthContext } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Scale, CheckCircle2, Circle, ArrowRight,
  Users, FolderOpen, CreditCard, Shield, UserPlus, Sparkles,
  FileText, Plug,
} from 'lucide-react'

// ── Checklist dinâmico baseado em dados reais do banco ─────────────────────

async function buildChecklist(escritorioId: string, supabase: any, cargo: string | null) {
  const [
    { count: totalClientes },
    { count: totalProcessos },
    { data: assinatura },
    { count: totalMembros },
    { count: totalTemplates },
  ] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId),
    supabase.from('processos').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId),
    supabase.from('assinaturas_escritorio').select('plano_id, status').eq('escritorio_id', escritorioId).in('status', ['active', 'trialing']).limit(1).maybeSingle(),
    supabase.from('membros_escritorio').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId).eq('ativo', true),
    supabase.from('templates_documento').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId),
  ])

  return [
    {
      id: 'escritorio',
      titulo: 'Escritório criado',
      desc: 'Seu escritório está configurado e pronto para uso.',
      icone: Scale,
      cor: 'text-amber-500',
      bg: 'bg-amber-50',
      feito: true,
      href: '/configuracoes',
    },
    {
      id: 'cliente',
      titulo: 'Cadastrar primeiro cliente',
      desc: 'Adicione um cliente para começar a organizar seus processos.',
      icone: Users,
      cor: 'text-blue-500',
      bg: 'bg-blue-50',
      feito: (totalClientes ?? 0) > 0,
      href: '/clientes/novo',
      label: 'Adicionar cliente',
    },
    {
      id: 'processo',
      titulo: 'Registrar primeiro processo',
      desc: 'Cadastre um processo jurídico e acompanhe sua evolução.',
      icone: FolderOpen,
      cor: 'text-violet-500',
      bg: 'bg-violet-50',
      feito: (totalProcessos ?? 0) > 0,
      href: '/processos/novo',
      label: 'Novo processo',
    },
    {
      id: 'plano',
      titulo: 'Escolher um plano',
      desc: 'Selecione o plano ideal para o seu escritório.',
      icone: CreditCard,
      cor: 'text-emerald-500',
      bg: 'bg-emerald-50',
      feito: ['active', 'trialing'].includes(assinatura?.status ?? ''),
      href: '/planos',
      label: 'Ver planos',
    },
    {
      id: 'equipe',
      titulo: 'Convidar membro da equipe',
      desc: 'Adicione advogados, estagiários ou administradores.',
      icone: UserPlus,
      cor: 'text-cyan-500',
      bg: 'bg-cyan-50',
      feito: (totalMembros ?? 0) > 1,
      href: '/equipe',
      label: 'Gerenciar equipe',
      ocultar: !['socio', 'admin'].includes(cargo ?? ''),
    },
    {
      id: '2fa',
      titulo: 'Ativar autenticação em 2 fatores',
      desc: 'Proteja sua conta com um segundo fator de segurança.',
      icone: Shield,
      cor: 'text-rose-500',
      bg: 'bg-rose-50',
      feito: false, // verificado via Clerk no client
      href: '/seguranca',
      label: 'Configurar 2FA',
    },
    {
      id: 'template',
      titulo: 'Criar primeiro template de documento',
      desc: 'Modele contratos, petições e procurações com variáveis dinâmicas.',
      icone: FileText,
      cor: 'text-indigo-500',
      bg: 'bg-indigo-50',
      feito: (totalTemplates ?? 0) > 0,
      href: '/templates/novo',
      label: 'Criar template',
    },
    {
      id: 'integracoes',
      titulo: 'Configurar integrações',
      desc: 'Ative WhatsApp, boletos PIX e outras integrações do escritório.',
      icone: Plug,
      cor: 'text-teal-500',
      bg: 'bg-teal-50',
      feito: false, // depende de vars de ambiente, não verificável no banco
      href: '/configuracoes/integracoes',
      label: 'Ver integrações',
      ocultar: !['socio', 'admin'].includes(cargo ?? ''),
    },
  ].filter(item => !item.ocultar)
}

// ── Página ─────────────────────────────────────────────────────────────────

export default async function BemVindoPage() {
  const { escritorioId, cargo, supabase } = await getAuthContext()
  if (!escritorioId || !supabase) redirect('/onboarding')

  const checklist = await buildChecklist(escritorioId, supabase, cargo)
  const feitos = checklist.filter(c => c.feito).length
  const total = checklist.length
  const porcentagem = Math.round((feitos / total) * 100)
  const tudoFeito = feitos === total

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/30">
          <Scale className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {tudoFeito ? 'Tudo pronto! 🎉' : 'Bem-vindo ao Jurivox!'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {tudoFeito
            ? 'Seu escritório está completamente configurado. Bom trabalho!'
            : 'Complete as etapas abaixo para aproveitar tudo que a plataforma oferece.'}
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Progresso da configuração</p>
          <span className="text-sm font-bold text-amber-600">{feitos}/{total} etapas</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
            style={{ width: `${porcentagem}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400 text-right">{porcentagem}% completo</p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {checklist.map((item, idx) => {
          const Icone = item.icone
          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
                item.feito
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Número / check */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                item.feito ? 'bg-emerald-500' : item.bg
              }`}>
                {item.feito
                  ? <CheckCircle2 className="h-5 w-5 text-white" />
                  : <span className={`text-sm font-bold ${item.cor}`}>{idx + 1}</span>
                }
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${item.feito ? 'text-emerald-700 line-through decoration-emerald-400' : 'text-slate-800'}`}>
                  {item.titulo}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>

              {/* CTA */}
              {!item.feito && item.href && (
                <Link
                  href={item.href}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${item.bg} ${item.cor} hover:opacity-80`}
                >
                  {item.label ?? 'Configurar'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}

              {item.feito && (
                <span className="shrink-0 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
                  Concluído
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Dicas rápidas */}
      <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-amber-900">Dicas para começar bem</p>
        </div>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <Circle className="h-3 w-3 mt-1 shrink-0 fill-amber-400 text-amber-400" />
            Use <strong>/busca</strong> para encontrar qualquer coisa na plataforma instantaneamente.
          </li>
          <li className="flex items-start gap-2">
            <Circle className="h-3 w-3 mt-1 shrink-0 fill-amber-400 text-amber-400" />
            O <strong>Monitoramento DataJud</strong> verifica movimentações automaticamente toda manhã.
          </li>
          <li className="flex items-start gap-2">
            <Circle className="h-3 w-3 mt-1 shrink-0 fill-amber-400 text-amber-400" />
            O <strong>Assistente IA</strong> pode ajudar com petições, pesquisas e análise de contratos.
          </li>
        </ul>
      </div>

      {/* Botão ir para o dashboard */}
      <div className="text-center pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-colors"
        >
          Ir para o Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-2 text-xs text-slate-400">Você pode acessar este guia a qualquer momento em Configurações.</p>
      </div>
    </div>
  )
}
