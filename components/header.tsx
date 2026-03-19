'use client'

import { UserButton } from '@clerk/nextjs'
import { Search, Bell } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function Header() {
  const [busca, setBusca] = useState('')
  const router = useRouter()

  function handleBusca(e: React.FormEvent) {
    e.preventDefault()
    if (!busca.trim()) return
    router.push(`/busca?q=${encodeURIComponent(busca)}`)
  }

  return (
    <header
      className="flex items-center justify-between h-16 px-6 shrink-0"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Busca global */}
      <form onSubmit={handleBusca} className="flex-1 max-w-md">
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

      {/* Ações */}
      <div className="flex items-center gap-3 ml-4">
        <button
          className="relative p-2 rounded-xl transition-all"
          style={{ color: '#64748b' }}
          aria-label="Notificações"
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
            style={{ background: '#ef4444' }}
          />
        </button>

        <UserButton
          afterSignOutUrl="/sign-in"
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
