'use client'

export function RelatorioPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
    >
      Imprimir / Salvar PDF
    </button>
  )
}
