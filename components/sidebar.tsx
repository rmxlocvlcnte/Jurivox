'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Calendar,
  DollarSign,
  Bot,
  Scale,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/processos',  label: 'Processos',    icon: FolderOpen },
  { href: '/clientes',   label: 'Clientes',     icon: Users },
  { href: '/prazos',     label: 'Prazos',       icon: Calendar },
  { href: '/financeiro', label: 'Financeiro',   icon: DollarSign },
  { href: '/ia',         label: 'Assistente IA', icon: Bot },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col w-64 min-h-screen shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0d1b3e 0%, #050e24 60%, #020917 100%)',
        borderRight: '1px solid rgba(245, 158, 11, 0.08)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}
        >
          <Scale className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-gradient">JurisFlow</span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-400 hover:text-white'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
              } : undefined}
            >
              <Icon className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                isActive ? 'text-slate-900' : 'text-slate-500'
              )} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-slate-400">Sistema online</p>
        </div>
        <p className="text-xs text-slate-600">JurisFlow v0.1</p>
      </div>
    </aside>
  )
}
