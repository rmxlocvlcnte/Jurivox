'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-2xl p-8 shadow-lg border border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">!</div>
          <h2 className="text-lg font-bold text-slate-900">Erro ao carregar</h2>
        </div>
        <p className="text-sm text-slate-600 mb-2">Mensagem do erro:</p>
        <pre className="text-xs bg-red-50 text-red-700 p-3 rounded-lg overflow-auto mb-6 whitespace-pre-wrap">
          {error.message || 'Erro desconhecido'}
          {error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
        <button
          onClick={reset}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-slate-900"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
