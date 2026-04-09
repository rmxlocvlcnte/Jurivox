'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Calendar,
  DollarSign,
  Bot,
  Scale,
  X,
  Clock,
  FileText,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Radio,
  Settings2,
} from 'lucide-react'

const navItems = [
<<<<<<< HEAD
  { href: '/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/processos',        label: 'Processos',        icon: FolderOpen },
  { href: '/clientes',         label: 'Clientes',         icon: Users },
  { href: '/prazos',           label: 'Prazos',           icon: Calendar },
  { href: '/agenda',           label: 'Agenda',           icon: Calendar },
  { href: '/contratos',        label: 'Contratos',        icon: FileText },
  { href: '/timesheet',        label: 'Timesheet',        icon: Clock },
  { href: '/financeiro',       label: 'Financeiro',       icon: DollarSign },
  { href: '/contas-receber',   label: 'Contas a Receber', icon: CreditCard },
  { href: '/equipe',           label: 'Equipe',           icon: UserCheck },
  { href: '/seguranca',        label: 'Segurança',        icon: ShieldCheck },
  { href: '/ia',               label: 'Assistente IA',    icon: Bot },
  { href: '/monitoramento',    label: 'Monitoramento',    icon: Radio },
=======
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/processos', label: 'Processos', icon: FolderOpen },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/prazos', label: 'Prazos', icon: Calendar },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/timesheet', label: 'Timesheet', icon: Clock },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/contas-receber', label: 'Contas a Receber', icon: CreditCard },
  { href: '/equipe', label: 'Equipe', icon: UserCheck },
  { href: '/configuracoes', label: 'Configuracoes', icon: Settings2 },
  { href: '/ia', label: 'Assistente IA', icon: Bot },
  { href: '/monitoramento', label: 'Monitoramento', icon: Radio },
>>>>>>> f60585aaf4340e69156a99262218e51d8dbbf59c
]

const GRUPOS = [
  { label: 'Principal', items: ['/dashboard', '/processos', '/clientes', '/prazos', '/agenda'] },
<<<<<<< HEAD
  { label: 'Gestão', items: ['/contratos', '/timesheet', '/financeiro', '/contas-receber', '/equipe', '/seguranca'] },
  { label: 'IA & Automação', items: ['/ia', '/monitoramento'] },
=======
  { label: 'Gestao', items: ['/contratos', '/timesheet', '/financeiro', '/contas-receber', '/equipe', '/configuracoes'] },
  { label: 'IA e Automacao', items: ['/ia', '/monitoramento'] },
>>>>>>> f60585aaf4340e69156a99262218e51d8dbbf59c
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen } = useSidebar()
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col transition-transform duration-300 ease-in-out',
          'lg:static lg:inset-auto lg:z-auto lg:translate-x-0 lg:self-stretch',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'linear-gradient(180deg, #0d1b3e 0%, #050e24 60%, #020917 100%)',
          borderRight: '1px solid rgba(245, 158, 11, 0.08)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
              }}
            >
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-amber-400">
              Jurivox
            </span>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {GRUPOS.map((grupo) => {
            const grupoItems = navItems.filter((item) => grupo.items.includes(item.href))
            return (
              <div key={grupo.label} className="mb-5">
                <p
                  className="mb-2 px-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'rgba(245, 158, 11, 0.5)' }}
                >
                  {grupo.label}
                </p>
                <div className="space-y-0.5">
                  {grupoItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/')
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                          isActive
                            ? 'text-slate-900'
                            : 'text-slate-300 hover:bg-white/8 hover:text-white',
                        )}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                        } : undefined}
                      >
                        <Icon className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-slate-900' : 'text-slate-400',
                        )} />
                        {label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-xs text-slate-400">Sistema online</p>
          </div>
          <p className="text-xs text-slate-600">Jurivox v0.2</p>
        </div>
      </aside>
    </>
  )
}
