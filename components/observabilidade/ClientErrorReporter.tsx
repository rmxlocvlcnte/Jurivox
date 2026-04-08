'use client'

import { useEffect } from 'react'

const habilitado = process.env.NEXT_PUBLIC_ENABLE_CLIENT_ERROR_REPORTING !== 'false'

function enviar(payload: { mensagem: string; stack?: string; origem: string; url: string }) {
  void fetch('/api/observabilidade/erros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  })
}

export function ClientErrorReporter() {
  useEffect(() => {
    if (!habilitado) return

    const onError = (event: ErrorEvent) => {
      enviar({
        mensagem: event.message || 'Erro de runtime no cliente',
        stack: event.error?.stack,
        origem: 'window.error',
        url: window.location.href,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === 'string'
          ? event.reason
          : event.reason?.message || 'Promise rejection sem mensagem'

      enviar({
        mensagem: reason,
        stack: event.reason?.stack,
        origem: 'window.unhandledrejection',
        url: window.location.href,
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}

