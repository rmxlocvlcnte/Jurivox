'use client'

// ───────────────────────────────────────────────────────────────────────────
// AnaliseRiscoIA — Análise de risco do processo com IA
// Chama /api/processos/[id]/analise-risco e exibe o resultado em painel.
// ───────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Target, Loader2, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

interface Props {
  processoId: string
}

type Estado = 'idle' | 'loading' | 'done' | 'error'

export function AnaliseRiscoIA({ processoId }: Props) {
  const [estado, setEstado] = useState<Estado>('idle')
  const [analise, setAnalise] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)

  async function analisar() {
    setEstado('loading')
    setAberto(true)
    try {
      const res = await fetch(`/api/processos/${processoId}/analise-risco`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || data.erro) {
        setEstado('error')
        setAnalise(data.erro ?? 'Erro ao gerar análise.')
        return
      }
      setAnalise(data.analise)
      setEstado('done')
    } catch {
      setEstado('error')
      setAnalise('Não foi possível conectar com a IA.')
    }
  }

  function fechar() {
    setAberto(false)
    setEstado('idle')
    setAnalise(null)
  }

  // Detecta nível de risco para cor do painel
  function nivelRisco(texto: string): 'critico' | 'prioritario' | 'rotina' | 'monitorar' | null {
    const t = texto.toUpperCase()
    if (t.includes('CRÍTICO') || t.includes('CRITICO')) return 'critico'
    if (t.includes('PRIORITÁRIO') || t.includes('PRIORITARIO')) return 'prioritario'
    if (t.includes('ROTINA')) return 'rotina'
    if (t.includes('MONITORAR')) return 'monitorar'
    return null
  }

  const COR_NIVEL = {
    critico: 'border-red-300 bg-red-50',
    prioritario: 'border-orange-300 bg-orange-50',
    rotina: 'border-blue-200 bg-blue-50',
    monitorar: 'border-slate-200 bg-slate-50',
  }

  const nivel = analise ? nivelRisco(analise) : null

  return (
    <div>
      {/* Botão de gatilho */}
      <button
        onClick={estado === 'idle' || estado === 'error' ? analisar : () => setAberto(o => !o)}
        disabled={estado === 'loading'}
        className="flex items-center gap-2 text-sm border border-red-200 hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {estado === 'loading'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Target className="w-3.5 h-3.5" />
        }
        {estado === 'loading' ? 'Analisando...' : estado === 'done' ? (aberto ? 'Ocultar Risco' : 'Ver Risco IA') : 'Análise de Risco IA'}
        {estado === 'done' && (aberto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>

      {/* Painel de resultado */}
      {aberto && analise && (
        <div className={`mt-3 rounded-xl border p-4 relative ${nivel ? COR_NIVEL[nivel] : 'border-slate-200 bg-white'}`}>
          <button
            onClick={fechar}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-sm font-semibold text-slate-900">Análise de Risco — IA</span>
            {estado === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 ml-1" />}
          </div>

          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {analise}
          </pre>

          <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-200 pt-2">
            ⚠️ Avaliação preliminar para tomada de decisão. Não substitui análise técnica do advogado.
          </p>
        </div>
      )}
    </div>
  )
}
