'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { enviarWhatsAppCliente } from '@/lib/actions/whatsapp'

export function WhatsAppForm({ clienteId }: { clienteId: string }) {
  const [mensagem, setMensagem] = useState('')
  const [pendente, startTransition] = useTransition()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await enviarWhatsAppCliente(clienteId, formData)
      if (res && 'erro' in res) {
        toast.error(res.erro)
        return
      }
      toast.success(`Mensagem enviada para ${res?.nome ?? 'cliente'}.`)
      setMensagem('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        name="mensagem"
        rows={3}
        required
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        placeholder="Digite a mensagem para o cliente..."
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-400 resize-none"
      />
      <button
        type="submit"
        disabled={pendente}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-60"
      >
        <MessageCircle className="w-4 h-4" /> {pendente ? 'Enviando...' : 'Enviar Mensagem'}
      </button>
    </form>
  )
}
