'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    void fetch('/api/observabilidade/erros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagem: error.message,
        stack: error.stack,
        origem: 'global-error-boundary',
        url: window.location.href,
      }),
      keepalive: true,
    })
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 text-slate-900">
        <main className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Erro inesperado</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ocorreu uma falha e a equipe ja foi notificada pelos logs da aplicacao.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}

