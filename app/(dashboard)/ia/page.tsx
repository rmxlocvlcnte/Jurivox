'use client'

// -----------------------------------------------
// ASSISTENTE IA — Chat jurídico com DeepSeek R1
// -----------------------------------------------
// useChat v4+ API:
// - sendMessage({ text }) para enviar mensagem
// - status: 'ready' | 'submitted' | 'streaming' | 'error'
// - messages[].parts — array de partes (TextUIPart, etc.)
// -----------------------------------------------

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bot, User, Send, Loader2, Scale, Trash2 } from 'lucide-react'

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter(p => p.type === 'text')
    .map(p => p.text ?? '')
    .join('')
}

export default function IAPage() {
  const searchParams = useSearchParams()
  const processoId = searchParams.get('processo_id')
  const [input, setInput] = useState('')
  const autoEnviado = useRef(false)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const mensagensRef = useRef<HTMLDivElement>(null)

  // Rola para a última mensagem automaticamente
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight
    }
  }, [messages])

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

  function limparConversa() {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px-48px)] max-w-4xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-500" />
            Assistente Jurídico IA
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Powered by DeepSeek R1 · Especializado em Direito Brasileiro
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={limparConversa}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>

      {/* Área de mensagens */}
      <div
        ref={mensagensRef}
        className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto p-4 space-y-4 mb-4"
      >
        {/* Mensagem de boas-vindas */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="bg-amber-50 p-4 rounded-2xl mb-4">
              <Scale className="w-10 h-10 text-amber-500 mx-auto" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Assistente Jurídico</h3>
            <p className="text-slate-500 text-sm max-w-md">
              Faça perguntas jurídicas, peça análise de movimentações, verificação de prazos,
              ou orientações baseadas no CPC/2015 e Constituição Federal.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {[
                'Quais são os prazos para contestação em ação cível?',
                'Explique o recurso de apelação no CPC/2015',
                'O que é revelia e quais seus efeitos?',
                'Quais documentos são necessários para ação trabalhista?',
              ].map((sugestao) => (
                <button
                  key={sugestao}
                  onClick={() => setInput(sugestao)}
                  className="text-left text-xs bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-700 px-3 py-2.5 rounded-lg transition-colors"
                >
                  {sugestao}
                </button>
              ))}
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
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-amber-500' : 'bg-slate-800'
              }`}>
                {m.role === 'user'
                  ? <User className="w-4 h-4 text-slate-900" />
                  : <Bot className="w-4 h-4 text-white" />
                }
              </div>

              {/* Bolha de mensagem */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
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

      {/* Input de mensagem */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua pergunta jurídica..."
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
        IA pode cometer erros. Sempre verifique informações jurídicas importantes com fontes oficiais.
      </p>
    </div>
  )
}
