'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, X, Check, AlertCircle, Download, Loader2 } from 'lucide-react'
import { importarClientes, importarProcessos } from '@/lib/actions/importar'
import { toast } from 'sonner'

interface Props {
  entidade: 'clientes' | 'processos'
  colunas: string[]
}

type ParsedRow = Record<string, string>

export function ImportCSVButton({ entidade, colunas }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [resultado, setResultado] = useState<{ importados: number; erros: string[] } | null>(null)

  function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
    // Remove BOM
    const clean = text.replace(/^\uFEFF/, '')
    const lines = clean.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return { headers: [], rows: [] }

    const separador = lines[0].includes(';') ? ';' : ','
    const parseRow = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
          else { inQuotes = !inQuotes }
        } else if (ch === separador && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
      result.push(current.trim())
      return result
    }

    const hdrs = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
    const parsed = lines.slice(1).map(line => {
      const vals = parseRow(line)
      return Object.fromEntries(hdrs.map((h, i) => [h, vals[i] ?? '']))
    }).filter(r => Object.values(r).some(v => v))

    return { headers: hdrs, rows: parsed }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { headers: hdrs, rows: parsed } = parseCSV(text)
      if (!parsed.length) {
        toast.error('CSV vazio ou inválido.')
        return
      }
      setHeaders(hdrs)
      setRows(parsed)
      setResultado(null)
      setModalAberto(true)
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  function handleImportar() {
    startTransition(async () => {
      const res = entidade === 'clientes'
        ? await importarClientes(rows)
        : await importarProcessos(rows)

      if (res && 'erro' in res) {
        toast.error(res.erro)
        return
      }
      if (res) {
        setResultado(res as any)
        if ((res as any).importados > 0) {
          toast.success(`${(res as any).importados} registro(s) importado(s)!`)
        }
      }
    })
  }

  function baixarTemplate() {
    const header = colunas.join(',')
    const exemplo = colunas.map(() => '').join(',')
    const csv = '\uFEFF' + header + '\n' + exemplo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_importacao_${entidade}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const label = entidade === 'clientes' ? 'Importar Clientes' : 'Importar Processos'

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

      <button
        onClick={() => inputRef.current?.click()}
        title={label}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Importar CSV</span>
      </button>

      {/* Modal de preview */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900">{label}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {resultado
                    ? `Importação concluída: ${resultado.importados} registro(s)`
                    : `${rows.length} linha(s) detectada(s) · confirme antes de importar`}
                </p>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Resultado */}
            {resultado && (
              <div className="px-6 py-4 space-y-2">
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">{resultado.importados} registro(s) importado(s) com sucesso</span>
                </div>
                {resultado.erros.length > 0 && (
                  <div className="bg-red-50 rounded-lg px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2 text-red-700 mb-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium">{resultado.erros.length} erro(s):</span>
                    </div>
                    {resultado.erros.map((e, i) => (
                      <p key={i} className="text-xs text-red-600 pl-6">{e}</p>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setModalAberto(false)}
                  className="w-full mt-2 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Preview da tabela */}
            {!resultado && (
              <>
                <div className="flex-1 overflow-auto px-6 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {headers.map(h => (
                          <th key={h} className="text-left py-2 px-2 font-semibold text-slate-600 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                          {headers.map(h => (
                            <td key={h} className="py-1.5 px-2 text-slate-700 max-w-[140px] truncate">
                              {row[h] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 10 && (
                    <p className="text-xs text-slate-400 mt-2 text-center">
                      + {rows.length - 10} linha(s) não exibidas
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={baixarTemplate}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar template CSV
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalAberto(false)}
                      className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleImportar}
                      disabled={isPending}
                      className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60"
                    >
                      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Importar {rows.length} registro(s)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
