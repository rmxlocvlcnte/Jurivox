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
  Radio,
} from 'lucide-react'

const navItems = [
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
  { href: '/ia',               label: 'Assistente IA',    icon: Bot },
  { href: '/monitoramento',    label: 'Monitoramento',    icon: Radio },
]

const GRUPOS = [
  { label: 'Principal', items: ['/dashboard', '/processos', '/clientes', '/prazos', '/agenda'] },
  { label: 'Gestão', items: ['/contratos', '/timesheet', '/financeiro', '/contas-receber', '/equipe'] },
  { label: 'IA & Automação', items: ['/ia', '/monitoramento'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen } = useSidebar()
  return (

    <>
      {/* Overlay escuro para mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col w-64 shrink-0 transition-transform duration-300 ease-in-out',
          'fixed inset-y-0 left-0 z-50',
          'lg:static lg:inset-auto lg:z-auto lg:translate-x-0 lg:self-stretch',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'linear-gradient(180deg, #0d1b3e 0%, #050e24 60%, #020917 100%)',
          borderRight: '1px solid rgba(245, 158, 11, 0.08)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
              }}
            >
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              JurisFlow
            </span>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {GRUPOS.map(grupo => {
            const grupoItems = navItems.filter(item => grupo.items.includes(item.href))
            return (
              <div key={grupo.label} className="mb-5">
                {/* Label do grupo com mais destaque */}
                <p
                  className="text-xs font-bold uppercase tracking-widest px-3 mb-2"
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
                          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                          isActive
                            ? 'text-slate-900'
                            : 'text-slate-300 hover:text-white hover:bg-white/8',
                        )}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                        } : undefined}
                      >
                        <Icon className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
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

        {/* Rodapé */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-slate-400">Sistema online</p>
          </div>
          <p className="text-xs text-slate-600">JurisFlow v0.2</p>
        </div>
      </aside>
    </>
  )
}
