'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Clock, Calendar, X } from 'lucide-react'
import Link from 'next/link'

type Item = {
  id: string
  tipo: 'prazo_vencido' | 'prazo_urgente' | 'evento_hoje'
  titulo: string
  subtitulo: string
  urgencia: 'alta' | 'media' | 'normal'
}

const ICON_TIPO = {
  prazo_vencido: AlertTriangle,
  prazo_urgente: Clock,
  evento_hoje: Calendar,
}

const COR_URGENCIA = {
  alta: 'text-red-500 bg-red-50',
  media: 'text-amber-500 bg-amber-50',
  normal: 'text-blue-500 bg-blue-50',
}

const LINK_TIPO = {
  prazo_vencido: (id: string) => `/prazos/${id}`,
  prazo_urgente: (id: string) => `/prazos/${id}`,
  evento_hoje: (id: string) => `/agenda`,
}

export function NotificacoesBell() {
  const [aberto, setAberto] = useState(false)
  const [total, setTotal] = useState(0)
  const [itens, setItens] = useState<Item[]>([])
  const [carregando, setCarregando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Busca dados ao montar e a cada 5 minutos
  useEffect(() => {
    fetchBadges()
    const interval = setInterval(fetchBadges, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchBadges() {
    try {
      const res = await fetch('/api/notificacoes/badges')
      if (!res.ok) return
      const data = await res.json()
      setTotal(data.total ?? 0)
      setItens(data.itens ?? [])
    } catch {
      // silencioso — não quebra o header
    }
  }

  function toggleAberto() {
    setAberto(v => !v)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleAberto}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label={`Notificações${total > 0 ? ` (${total})` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: '#ef4444' }}
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Notificações {total > 0 && <span className="text-red-500">({total})</span>}
            </h3>
            <button onClick={() => setAberto(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {itens.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Tudo em dia!</p>
                <p className="text-xs text-slate-300 mt-0.5">Sem alertas no momento.</p>
              </div>
            ) : (
              itens.map(item => {
                const Icon = ICON_TIPO[item.tipo]
                const corCls = COR_URGENCIA[item.urgencia]
                const href = LINK_TIPO[item.tipo](item.id)
                return (
                  <Link
                    key={item.id}
                    href={href}
                    onClick={() => setAberto(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${corCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.subtitulo}</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <Link
              href="/prazos"
              onClick={() => setAberto(false)}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              Ver todos os prazos →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
