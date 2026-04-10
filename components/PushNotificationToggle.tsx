'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) buffer[i] = rawData.charCodeAt(i)
  return buffer.buffer
}

export function PushNotificationToggle() {
  const [suportado, setSuportado] = useState(false)
  const [ativo, setAtivo] = useState(false)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC) return
    setSuportado(true)

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setAtivo(!!sub)
    })
  }, [])

  async function togglePush() {
    if (!suportado) return
    setCarregando(true)

    try {
      const reg = await navigator.serviceWorker.ready

      if (ativo) {
        // Desativar
        const sub = await reg.pushManager.getSubscription()
        await sub?.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: null }),
        })
        setAtivo(false)
        toast.success('Notificações desativadas.')
      } else {
        // Ativar — solicita permissão se necessário
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') {
          toast.error('Permissão de notificação negada pelo navegador.')
          return
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
        setAtivo(true)
        toast.success('Notificações push ativadas!')
      }
    } catch (err) {
      toast.error('Erro ao configurar notificações.')
      console.error('[Push]', err)
    } finally {
      setCarregando(false)
    }
  }

  if (!suportado) return null

  return (
    <button
      onClick={togglePush}
      disabled={carregando}
      title={ativo ? 'Desativar notificações push' : 'Ativar notificações push'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        ativo
          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {carregando ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : ativo ? (
        <Bell className="w-3.5 h-3.5" />
      ) : (
        <BellOff className="w-3.5 h-3.5" />
      )}
      {ativo ? 'Push ativo' : 'Ativar push'}
    </button>
  )
}
