'use client'

import { UserButton } from '@clerk/nextjs'
import { Search, Menu } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from './sidebar-context'
import { NotificacoesBell } from './notificacoes-bell'

export function Header() {
  const [busca, setBusca] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const router = useRouter()
  const { toggle } = useSidebar()

  function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    if (!busca.trim()) return
    setBuscaAberta(false)
    router.push(`/busca?q=${encodeURIComponent(busca)}`)
  }

  return (
    <header
      className="flex items-center h-16 px-4 md:px-6 shrink-0 gap-3"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Hamburguer — só no mobile */}
      <button
        onClick={toggle}
        className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Busca — visível no desktop */}
      <form onSubmit={handleBusca} className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar processo, cliente, CPF..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none transition-all"
            style={{
              background: '#f1f5f9',
              border: '1.5px solid transparent',
              color: '#0f172a',
            }}
            onFocus={(e) => {
              e.target.style.border = '1.5px solid #f59e0b'
              e.target.style.background = '#fff'
              e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1.5px solid transparent'
              e.target.style.background = '#f1f5f9'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
      </form>

      {/* Busca expandida no mobile */}
      {buscaAberta && (
        <form onSubmit={handleBusca} className="flex-1 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
              style={{
                background: '#f1f5f9',
                border: '1.5px solid #f59e0b',
                boxShadow: '0 0 0 3px rgba(245,158,11,0.1)',
                color: '#0f172a',
              }}
              onBlur={() => {
                if (!busca) setBuscaAberta(false)
              }}
            />
          </div>
        </form>
      )}

      {!buscaAberta && <div className="flex-1 sm:hidden" />}

      {/* Ações */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Ícone de busca para mobile */}
        {!buscaAberta && (
          <button
            onClick={() => setBuscaAberta(true)}
            className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        <NotificacoesBell />

        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9 ring-2 ring-amber-400/30',
            },
          }}
        />
      </div>
    </header>
  )
}
