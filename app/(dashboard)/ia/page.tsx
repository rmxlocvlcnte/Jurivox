'use client'

// ───────────────────────────────────────────────────────────────────────────
// ASSISTENTE IA — 8 modos especializados de IA jurídica
// Baseado na arquitetura do repositório anthropics/claude-for-legal,
// adaptado para o Direito Brasileiro.
// ───────────────────────────────────────────────────────────────────────────

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bot, User, Send, Loader2, Scale, Trash2, ChevronRight } from 'lucide-react'
import { MODOS, type ModoIA } from '@/lib/ai-prompts'

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter(p => p.type === 'text')
    .map(p => p.text ?? '')
    .join('')
}

const COR_FUNDO: Record<string, string> = {
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  slate: 'bg-slate-50 border-slate-200 text-slate-800',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  red: 'bg-red-50 border-red-200 text-red-800',
}

const COR_ATIVO: Record<string, string> = {
  amber: 'bg-amber-500 text-white border-amber-500',
  blue: 'bg-blue-600 text-white border-blue-600',
  orange: 'bg-orange-500 text-white border-orange-500',
  green: 'bg-green-600 text-white border-green-600',
  purple: 'bg-purple-600 text-white border-purple-600',
  slate: 'bg-slate-700 text-white border-slate-700',
  indigo: 'bg-indigo-600 text-white border-indigo-600',
  red: 'bg-red-600 text-white border-red-600',
}

const COR_SUGESTAO: Record<string, string> = {
  amber: 'hover:bg-amber-50 hover:border-amber-200',
  blue: 'hover:bg-blue-50 hover:border-blue-200',
  orange: 'hover:bg-orange-50 hover:border-orange-200',
  green: 'hover:bg-green-50 hover:border-green-200',
  purple: 'hover:bg-purple-50 hover:border-purple-200',
  slate: 'hover:bg-slate-100 hover:border-slate-300',
  indigo: 'hover:bg-indigo-50 hover:border-indigo-200',
  red: 'hover:bg-red-50 hover:border-red-200',
}

const MODOS_LISTA = Object.entries(MODOS) as [ModoIA, typeof MODOS[ModoIA]][]

export default function IAPage() {
  const searchParams = useSearchParams()
  const processoId = searchParams.get('processo_id')
  const modoInicial = (searchParams.get('modo') as ModoIA) ?? 'geral'

  const [modo, setModo] = useState<ModoIA>(modoInicial)
  const [input, setInput] = useState('')
  const autoEnviado = useRef(false)
  const mensagensRef = useRef<HTMLDivElement>(null)

  const configAtual = MODOS[modo]

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { mode: modo },
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight
    }
  }, [messages])

  // Quando muda o modo, limpa a conversa
  function trocarModo(novoModo: ModoIA) {
    if (novoModo === modo) return
    setModo(novoModo)
    setMessages([])
    setInput('')
    autoEnviado.current = false
  }

  // Se veio de um processo, carrega as movimentações automaticamente
  useEffect(() => {
    if (processoId && !autoEnviado.current) {
      autoEnviado.current = true
      fetch(`/api/processos/${processoId}/movimentacoes`)
        .then(r => r.json())
        .then(data => {
          if (data.resumo) {
            sendMessage({
              text: `Por favor, analise as movimentações deste processo jurídico e me dê um resumo detalhado com sua avaliação:\n\n${data.resumo}`,
            })
          }
        })
        .catch(() => {})
    }
  }, [processoId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || isLoading) return
    sendMessage({ text: texto })
    setInput('')
  }

  function usarSugestao(sugestao: string) {
    if (isLoading) return
    sendMessage({ text: sugestao })
  }

  return (
    <div className="flex h-[calc(100dvh-64px-48px)] gap-4 max-w-6xl mx-auto">

      {/* Painel de modos — coluna esquerda */}
      <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
          Modo de IA
        </p>
        {MODOS_LISTA.map(([chave, config]) => (
          <button
            key={chave}
            onClick={() => trocarModo(chave)}
            className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              modo === chave
                ? COR_ATIVO[config.cor]
                : 'border-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-base leading-none">{config.icone}</span>
            <span className="truncate">{config.label}</span>
            {modo === chave && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
          </button>
        ))}

        {/* Crédito */}
        <div className="mt-auto pt-4 px-1">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Baseado em{' '}
            <span className="font-medium">anthropics/claude-for-legal</span>
            {' '}— adaptado para o Direito Brasileiro
          </p>
        </div>
      </div>

      {/* Área principal — chat */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Cabeçalho do modo */}
        <div className={`flex items-center justify-between mb-3 px-4 py-3 rounded-xl border ${COR_FUNDO[configAtual.cor]}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{configAtual.icone}</span>
            <div>
              <h1 className="text-base font-bold">{configAtual.label}</h1>
              <p className="text-xs opacity-75">{configAtual.descricao}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setInput('') }}
              className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>

        {/* Área de mensagens */}
        <div
          ref={mensagensRef}
          className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto p-4 space-y-4 mb-3"
        >
          {/* Tela inicial com sugestões */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className={`p-4 rounded-2xl mb-4 border ${COR_FUNDO[configAtual.cor]}`}>
                <span className="text-4xl">{configAtual.icone}</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{configAtual.label}</h3>
              <p className="text-slate-500 text-sm max-w-md mb-6">{configAtual.descricao}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {configAtual.sugestoes.map((sugestao) => (
                  <button
                    key={sugestao}
                    onClick={() => usarSugestao(sugestao)}
                    className={`text-left text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg transition-colors ${COR_SUGESTAO[configAtual.cor]}`}
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                <Scale className="w-3 h-3" />
                Powered by DeepSeek R1 · Especializado em Direito Brasileiro
              </div>
            </div>
          )}

          {/* Histórico de mensagens */}
          {messages.map((m) => {
            const texto = getMessageText(m.parts as { type: string; text?: string }[])
            if (!texto) return null
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-amber-500' : 'bg-slate-800'
                }`}>
                  {m.role === 'user'
                    ? <User className="w-4 h-4 text-slate-900" />
                    : <Bot className="w-4 h-4 text-white" />
                  }
                </div>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-amber-500 text-slate-900 rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{texto}</p>
                </div>
              </div>
            )
          })}

          {/* Indicador de carregamento */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                <span className="text-sm text-slate-500">Analisando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`${configAtual.icone} ${configAtual.label}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 p-3 rounded-xl transition-colors shrink-0"
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-5 h-5" />
            }
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-2">
          ⚠️ Toda resposta é um rascunho para revisão do advogado. Não constitui aconselhamento jurídico.
        </p>
      </div>
    </div>
  )
}
