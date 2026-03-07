'use client';

import { useChat } from '@ai-sdk/react';

export default function LegalChat() {
  // Usamos 'as any' para evitar que o TS trave a renderização por erro de tipagem
  const { messages, input, handleInputChange, handleSubmit, status } = useChat() as any;

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-slate-900">
      {/* Header Simples sem ícones por enquanto */}
      <header className="p-4 bg-white border-b shadow-sm">
        <h1 className="text-xl font-bold text-blue-700">Página Protótipo SaaS</h1>
      </header>

      {/* Área de Mensagens */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 mt-10">Digite algo para iniciar a análise jurídica...</p>
        )}

        {messages.map((m: any) => (
          <div key={m.id} className={`p-4 rounded-lg max-w-[80%] ${
            m.role === 'user' 
              ? 'bg-blue-600 text-white ml-auto' 
              : 'bg-white border text-slate-800 shadow-sm'
          }`}>
            <p className="font-bold text-xs mb-1">{m.role === 'user' ? 'Advogado' : 'DeepSeek-R1'}</p>
            <div className="text-sm whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}

        {/* Indicador de Status */}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="text-blue-600 text-xs italic animate-pulse">
            DeepSeek está processando...
          </div>
        )}
      </main>

      {/* Footer / Input */}
      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            className="flex-1 p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={input}
            placeholder="Analise o artigo 5º..."
            onChange={handleInputChange}
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
            disabled={status !== 'idle' || !input}
          >
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}