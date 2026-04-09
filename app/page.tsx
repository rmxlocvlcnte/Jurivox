import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import {
  ArrowRight, Scale, Sparkles, CheckCircle2,
  FolderOpen, Calendar, DollarSign, Bot,
  Radio, FileSignature, Shield, Clock,
  Users, Zap, Star,
} from 'lucide-react'
import { SplashScreen } from '@/components/splash-screen'

// ── Dados estáticos ────────────────────────────────────────────────────────

const STATS = [
  { valor: '2.400+', label: 'Processos gerenciados' },
  { valor: 'R$ 1,2M+', label: 'Em honorários controlados' },
  { valor: '99,9%', label: 'Uptime garantido' },
  { valor: '14 dias', label: 'Trial gratuito' },
]

const FEATURES = [
  {
    icon: FolderOpen,
    titulo: 'Gestão de Processos',
    desc: 'Acompanhe cada processo com timeline de movimentações, documentos anexos e vinculação de clientes.',
    cor: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Calendar,
    titulo: 'Prazos & Agenda',
    desc: 'Alertas automáticos de prazos processuais. Nunca mais perca uma audiência ou protocolo.',
    cor: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: DollarSign,
    titulo: 'Financeiro Completo',
    desc: 'Honorários, despesas, contas a receber e relatórios financeiros em um único painel.',
    cor: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Bot,
    titulo: 'Assistente IA Jurídico',
    desc: 'IA especializada em direito brasileiro. Pesquise jurisprudência, gere minutas e analise documentos.',
    cor: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: Radio,
    titulo: 'Monitoramento DataJud',
    desc: 'Sincronização automática com o sistema do CNJ. Receba notificações de novas movimentações.',
    cor: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: FileSignature,
    titulo: 'Assinatura Digital',
    desc: 'Envie documentos para assinatura eletrônica com validade jurídica e trilha de auditoria.',
    cor: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
]

const PLANOS = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 'R$ 50',
    periodo: '/mês',
    desc: 'Para advogados autônomos',
    destaque: false,
    items: ['50 processos ativos', '150 clientes', '2 membros', '5 templates', 'Prazos e Agenda', 'Financeiro básico'],
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 'R$ 150',
    periodo: '/mês',
    desc: 'Para escritórios em crescimento',
    destaque: true,
    items: ['500 processos ativos', '1.000 clientes', '15 membros', '50 templates', 'Assistente IA jurídico', 'Monitoramento DataJud', 'Assinatura Digital'],
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'R$ 300',
    periodo: '/mês',
    desc: 'Para grandes escritórios',
    destaque: false,
    items: ['Tudo ilimitado', 'Tudo do plano Pro', 'Suporte prioritário 4h', 'Onboarding dedicado', 'API personalizada'],
  },
]

const DEPOIMENTOS = [
  {
    nome: 'Dra. Ana Lima',
    cargo: 'Advogada Trabalhista',
    texto: 'Reduzi em 3 horas por dia o tempo gasto em controle de prazos. O monitoramento automático é indispensável.',
    estrelas: 5,
  },
  {
    nome: 'Dr. Carlos Mendes',
    cargo: 'Sócio — Mendes & Associados',
    texto: 'Migramos de planilhas para o Jurivox em um fim de semana. A equipe de 8 pessoas adotou sem resistência.',
    estrelas: 5,
  },
  {
    nome: 'Dra. Patrícia Souza',
    cargo: 'Especialista em Direito Civil',
    texto: 'A IA jurídica me economiza horas de pesquisa. É como ter um assistente sênior disponível 24h.',
    estrelas: 5,
  },
]

// ── Componente mockup do dashboard ─────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/60">
      {/* Barra superior do browser */}
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <div className="mx-auto flex w-48 items-center gap-2 rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-400">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          app.jurivox.com.br
        </div>
      </div>

      <div className="flex">
        {/* Sidebar mini */}
        <div className="hidden w-14 flex-col items-center gap-4 border-r border-slate-800 bg-slate-950 py-4 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
            <Scale className="h-4 w-4 text-amber-400" />
          </div>
          {[FolderOpen, Calendar, DollarSign, Users].map((Icon, i) => (
            <div key={i} className={`flex h-7 w-7 items-center justify-center rounded-lg ${i === 0 ? 'bg-amber-500/20' : 'hover:bg-slate-800'}`}>
              <Icon className={`h-3.5 w-3.5 ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
          ))}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 p-4">
          {/* Header do dashboard */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Bom dia, Dr. Rafael</p>
              <p className="text-sm font-semibold text-slate-100">Painel Principal</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">Sistema ok</span>
            </div>
          </div>

          {/* Cards de métricas */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Processos', val: '47', cor: 'text-amber-400', icon: FolderOpen },
              { label: 'Prazos Hoje', val: '3', cor: 'text-rose-400', icon: Clock },
              { label: 'Receita/mês', val: 'R$18k', cor: 'text-emerald-400', icon: DollarSign },
            ].map((m, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-800/50 p-2.5">
                <m.icon className={`mb-1 h-3 w-3 ${m.cor}`} />
                <p className={`text-base font-bold ${m.cor}`}>{m.val}</p>
                <p className="text-[10px] text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Lista de processos */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/30">
            <div className="border-b border-slate-800 px-3 py-2">
              <p className="text-xs font-medium text-slate-300">Processos recentes</p>
            </div>
            {[
              { num: '0001234-12.2024.8.26.0100', area: 'Trabalhista', status: 'Ativo' },
              { num: '0005678-09.2024.4.03.6100', area: 'Tributário', status: 'Aguardando' },
              { num: '0009012-45.2023.8.26.0302', area: 'Civil', status: 'Audiência' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-800/50 px-3 py-2 last:border-0">
                <div>
                  <p className="font-mono text-[9px] text-slate-300">{p.num}</p>
                  <p className="text-[9px] text-slate-500">{p.area}</p>
                </div>
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                  p.status === 'Ativo' ? 'bg-emerald-500/15 text-emerald-400' :
                  p.status === 'Audiência' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-slate-700 text-slate-400'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────────────

export default async function Home() {
  const { userId } = await auth()

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
      <SplashScreen />

      {/* ── Gradientes de fundo ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-20%] top-[-10%] h-[600px] w-[600px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
        <div className="absolute right-[-15%] top-[20%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] h-[400px] w-[400px] rounded-full bg-violet-600/[0.04] blur-[100px]" />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
              <Scale className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Juri<span className="text-amber-400">vox</span>
            </span>
          </Link>

          {/* Nav central */}
          <nav className="hidden items-center gap-1 md:flex">
            {['Recursos', 'Planos', 'Suporte'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block"
            >
              Entrar
            </Link>
            <Link
              href={userId ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:from-amber-300 hover:to-amber-400"
            >
              {userId ? 'Abrir Dashboard' : 'Começar Grátis'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Texto */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-medium text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Plataforma jurídica completa — Trial grátis por 14 dias
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white md:text-5xl lg:text-[3.5rem]">
                Gestão jurídica que{' '}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  trabalha enquanto
                </span>{' '}
                você advoga
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
                Centralize processos, prazos, clientes, financeiro e equipe em um único sistema.
                Monitoramento automático no DataJud, IA jurídica integrada e assinatura digital.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={userId ? '/dashboard' : '/sign-up'}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-slate-900 shadow-xl shadow-amber-500/30 transition hover:from-amber-300 hover:to-amber-400"
                >
                  {userId ? 'Ir para o Dashboard' : 'Criar Conta Gratuita'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#recursos"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/60 hover:text-white"
                >
                  Ver recursos
                </Link>
              </div>

              {/* Micro-prova social */}
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500'].map((c, i) => (
                      <div key={i} className={`h-7 w-7 rounded-full border-2 border-slate-950 ${c}/80`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">+500 escritórios ativos</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs text-slate-400">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Mockup do dashboard */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/10 blur-2xl" />
              <div className="relative">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="border-y border-slate-800/60 bg-slate-900/30">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.valor} className="text-center">
                  <p className="text-2xl font-extrabold text-white md:text-3xl">{s.valor}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="recursos" className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Tudo que seu escritório precisa
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Uma plataforma,{' '}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                tudo integrado
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Cada módulo foi desenvolvido especificamente para a realidade jurídica brasileira,
              integrado ao DataJud, CNJ e OAB.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.titulo}
                className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.cor}`} />
                </div>
                <h3 className="mb-2 font-semibold text-slate-100">{f.titulo}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLANOS ── */}
        <section id="planos" className="bg-slate-900/30 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                Preço justo, sem surpresas
              </p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Planos para todos os tamanhos
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                14 dias grátis em qualquer plano. Sem cartão de crédito.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {PLANOS.map((p) => (
                <div
                  key={p.id}
                  className={`relative rounded-2xl border p-6 transition ${
                    p.destaque
                      ? 'border-amber-400/50 bg-gradient-to-b from-amber-500/10 to-slate-900 shadow-xl shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  {p.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-0.5 text-xs font-bold text-slate-900">
                        Mais popular
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-slate-400">{p.nome}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${p.destaque ? 'text-amber-300' : 'text-white'}`}>
                      {p.preco}
                    </span>
                    <span className="text-sm text-slate-500">{p.periodo}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p.desc}</p>

                  <ul className="my-6 space-y-2.5">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${p.destaque ? 'text-amber-400' : 'text-emerald-500'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={userId ? '/dashboard' : '/sign-up'}
                    className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                      p.destaque
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/30 hover:from-amber-300'
                        : 'border border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {userId ? 'Acessar plano' : 'Começar grátis'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTOS ── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Quem já usa o{' '}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Jurivox
              </span>
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DEPOIMENTOS.map((d) => (
              <div
                key={d.nome}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: d.estrelas }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-300">"{d.texto}"</p>
                <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/20 text-sm font-bold text-amber-300">
                    {d.nome.charAt(4)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{d.nome}</p>
                    <p className="text-xs text-slate-500">{d.cargo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="pb-20 px-6">
          <div className="mx-auto max-w-3xl rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 p-10 text-center shadow-2xl shadow-amber-500/5">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/40">
              <Scale className="h-7 w-7 text-slate-900" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-white">
              Comece hoje. Grátis por 14 dias.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-slate-400">
              Sem cartão de crédito. Sem burocracia. Configure seu escritório em menos de 5 minutos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={userId ? '/dashboard' : '/sign-up'}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-sm font-bold text-slate-900 shadow-xl shadow-amber-500/30 transition hover:from-amber-300"
              >
                {userId ? 'Abrir Dashboard' : 'Criar conta gratuita'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center rounded-xl border border-slate-700 px-7 py-3.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/60"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20">
                <Scale className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-slate-300">
                Juri<span className="text-amber-400">vox</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-5 text-xs text-slate-500">
              <Link href="/termos-de-uso" className="transition hover:text-slate-300">Termos de Uso</Link>
              <Link href="/privacidade" className="transition hover:text-slate-300">Privacidade</Link>
              <Link href="/dpa" className="transition hover:text-slate-300">DPA</Link>
            </div>
            <p className="text-xs text-slate-600">© 2025 Jurivox. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
