'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, FileDown, Loader2 } from 'lucide-react'

export interface ExportColumn {
  key: string
  label: string
  format?: (row: any) => string
}

interface Props {
  data: any[]
  columns: ExportColumn[]
  filename: string
  label?: string
}

function getValue(row: any, col: ExportColumn): string {
  if (col.format) return col.format(row)
  const val = col.key.split('.').reduce((obj, k) => obj?.[k], row)
  return val == null ? '' : String(val)
}

export function ExportButton({ data, columns, filename, label }: Props) {
  const [loading, setLoading] = useState<'csv' | 'excel' | 'pdf' | null>(null)

  async function handleCSV() {
    setLoading('csv')
    try {
      const header = columns.map(c => `"${c.label}"`).join(',')
      const rows = data.map(row =>
        columns.map(col => {
          const v = getValue(row, col)
          return `"${v.replace(/"/g, '""')}"`
        }).join(',')
      )
      const csv = '\uFEFF' + [header, ...rows].join('\n') // BOM para acentuação no Excel
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      trigger(blob, `${filename}.csv`)
    } finally {
      setLoading(null)
    }
  }

  async function handleExcel() {
    setLoading('excel')
    try {
      const { utils, writeFile } = await import('xlsx')
      const wsData = [
        columns.map(c => c.label),
        ...data.map(row => columns.map(col => getValue(row, col))),
      ]
      const ws = utils.aoa_to_sheet(wsData)
      // Largura automática de colunas
      ws['!cols'] = columns.map((_, i) => ({
        wch: Math.max(
          columns[i].label.length,
          ...wsData.slice(1).map(r => String(r[i] ?? '').length)
        ) + 2,
      }))
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Dados')
      writeFile(wb, `${filename}.xlsx`)
    } finally {
      setLoading(null)
    }
  }

  async function handlePDF() {
    setLoading('pdf')
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Cabeçalho
      doc.setFillColor(245, 158, 11)
      doc.rect(0, 0, 300, 20, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(filename, 14, 13)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · ${data.length} registro(s)`,
        14,
        18.5
      )

      autoTable(doc, {
        head: [columns.map(c => c.label)],
        body: data.map(row => columns.map(col => getValue(row, col))),
        startY: 24,
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 10, right: 10 },
      })

      // Rodapé com paginação
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.text(
          `JurisFlow · Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        )
      }

      doc.save(`${filename}.pdf`)
    } finally {
      setLoading(null)
    }
  }

  function trigger(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const isLoading = loading !== null

  return (
    <div className="flex items-center gap-1">
      {label && (
        <span className="text-xs text-slate-500 mr-1 hidden sm:inline">{label}</span>
      )}
      <button
        onClick={handleCSV}
        disabled={isLoading}
        title="Exportar CSV"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
      >
        {loading === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
        CSV
      </button>
      <button
        onClick={handleExcel}
        disabled={isLoading}
        title="Exportar Excel"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
      >
        {loading === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
        Excel
      </button>
      <button
        onClick={handlePDF}
        disabled={isLoading}
        title="Exportar PDF"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
      >
        {loading === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
        PDF
      </button>
    </div>
  )
}
