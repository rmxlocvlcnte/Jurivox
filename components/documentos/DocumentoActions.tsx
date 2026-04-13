'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, Trash2, Loader2 } from 'lucide-react'
import { excluirDocumentoGerado } from '@/lib/actions/templates'
import { toast } from 'sonner'

interface Props {
  id: string
  nome: string
  conteudo: string
  redirectTo?: string
}

export function DocumentoActions({ id, nome, conteudo, redirectTo = '/documentos' }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmar, setConfirmar] = useState(false)
  const [baixando, setBaixando] = useState(false)
  const router = useRouter()

  async function gerarPDF() {
    setBaixando(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const usableWidth = pageWidth - margin * 2

      doc.setFillColor(245, 158, 11)
      doc.rect(0, 0, pageWidth, 16, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Jurivox', margin, 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - margin, 10, { align: 'right' })

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(nome, margin, 28)

      doc.setDrawColor(226, 232, 240)
      doc.line(margin, 32, pageWidth - margin, 32)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)

      const linhas = doc.splitTextToSize(conteudo, usableWidth)
      let y = 40
      const lineHeight = 5.5

      for (const linha of linhas) {
        if (y + lineHeight > pageHeight - 20) {
          doc.addPage()
          doc.setFillColor(245, 158, 11)
          doc.rect(0, 0, pageWidth, 10, 'F')
          y = 18
        }
        doc.text(linha, margin, y)
        y += lineHeight
      }

      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.text(
          `Jurivox · ${nome} · Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        )
      }

      doc.save(`${nome.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')}.pdf`)
      toast.success('PDF gerado!')
    } catch {
      toast.error('Erro ao gerar PDF.')
    } finally {
      setBaixando(false)
    }
  }

  function handleExcluir() {
    startTransition(async () => {
      const res = await excluirDocumentoGerado(id)
      if (res && 'erro' in res) {
        toast.error(res.erro)
        setConfirmar(false)
      } else {
        toast.success('Documento excluído.')
        router.push(redirectTo)
      }
    })
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={gerarPDF}
        disabled={baixando}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
      >
        {baixando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        Baixar PDF
      </button>

      {!confirmar ? (
        <button
          onClick={() => setConfirmar(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex gap-1">
          <button
            onClick={() => setConfirmar(false)}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Não
          </button>
          <button
            onClick={handleExcluir}
            disabled={isPending}
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : 'Excluir'}
          </button>
        </div>
      )}
    </div>
  )
}
