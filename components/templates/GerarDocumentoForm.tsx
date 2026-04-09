'use client'

import { useState, useTransition } from 'react'
import { gerarDocumentoDeTemplate } from '@/lib/actions/templates'
import { toast } from 'sonner'
import { FileText, Download, FileDown, Loader2 } from 'lucide-react'

interface Props {
  templateId: string
  templateNome: string
  variaveis: string[]
  processos: { id: string; numero_cnj: string; cliente: string }[]
  clientes: { id: string; nome: string }[]
}

export function GerarDocumentoForm({ templateId, templateNome, variaveis, processos, clientes }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isPDF, setIsPDF] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [processoId, setProcessoId] = useState('')
  const [clienteId, setClienteId] = useState('')

  function handleProcesso(id: string) {
    setProcessoId(id)
    const proc = processos.find(p => p.id === id)
    if (proc) {
      setValores(prev => ({
        ...prev,
        numero_cnj: proc.numero_cnj,
        nome_cliente: proc.cliente,
      }))
    }
  }

  function handleCliente(id: string) {
    setClienteId(id)
    const cli = clientes.find(c => c.id === id)
    if (cli) {
      setValores(prev => ({ ...prev, nome_cliente: cli.nome }))
    }
  }

  function getTodosValores() {
    const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    return { data_hoje: hoje, ...valores }
  }

  async function gerarPDF(conteudo: string, nome: string) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const usableWidth = pageWidth - margin * 2

    // Cabeçalho dourado
    doc.setFillColor(245, 158, 11)
    doc.rect(0, 0, pageWidth, 16, 'F')
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Jurivox', margin, 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - margin, 10, { align: 'right' })

    // Título do documento
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(nome, margin, 28)

    // Linha separadora
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, 32, pageWidth - margin, 32)

    // Conteúdo
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)

    const linhas = doc.splitTextToSize(conteudo, usableWidth)
    let y = 40
    const lineHeight = 5.5

    for (const linha of linhas) {
      if (y + lineHeight > pageHeight - 20) {
        doc.addPage()
        // Cabeçalho nas páginas seguintes
        doc.setFillColor(245, 158, 11)
        doc.rect(0, 0, pageWidth, 10, 'F')
        y = 18
      }
      doc.text(linha, margin, y)
      y += lineHeight
    }

    // Rodapé com paginação em todas as páginas
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
  }

  function handleGerar(tipo: 'salvar' | 'pdf') {
    setIsPDF(tipo === 'pdf')
    const todosValores = getTodosValores()

    startTransition(async () => {
      const res = await gerarDocumentoDeTemplate(
        templateId,
        todosValores,
        processoId || undefined,
        clienteId || undefined,
      )
      if (res && 'erro' in res) {
        toast.error(res.erro)
        return
      }

      if (tipo === 'pdf' && res && 'conteudo' in res) {
        await gerarPDF(res.conteudo as string, res.nome as string ?? templateNome)
        toast.success('PDF gerado!')
      } else {
        toast.success('Documento salvo com sucesso!')
      }
    })
  }

  if (variaveis.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
        <p className="text-xs text-slate-500">Este template não possui variáveis dinâmicas.</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleGerar('salvar')}
            disabled={isPending}
            className="flex-1 py-2 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending && !isPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
            Salvar Documento
          </button>
          <button
            onClick={() => handleGerar('pdf')}
            disabled={isPending}
            title="Baixar como PDF"
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending && isPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Gerar Documento</h3>
      </div>

      {processos.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Vincular processo</label>
          <select
            value={processoId}
            onChange={e => handleProcesso(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-amber-400 bg-white"
          >
            <option value="">Sem processo</option>
            {processos.map(p => (
              <option key={p.id} value={p.id}>{p.numero_cnj} — {p.cliente}</option>
            ))}
          </select>
        </div>
      )}

      {!processoId && clientes.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Vincular cliente</label>
          <select
            value={clienteId}
            onChange={e => handleCliente(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-amber-400 bg-white"
          >
            <option value="">Sem cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {variaveis.filter(v => v !== 'data_hoje').map(v => (
          <div key={v}>
            <label className="text-xs font-medium text-slate-600 block mb-1 font-mono">{'{{'}{v}{'}}'}</label>
            <input
              value={valores[v] ?? ''}
              onChange={e => setValores(prev => ({ ...prev, [v]: e.target.value }))}
              placeholder={v.replace(/_/g, ' ')}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-amber-400"
            />
          </div>
        ))}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <button
          onClick={() => handleGerar('salvar')}
          disabled={isPending}
          className="flex-1 py-2 text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {isPending && !isPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Salvar
        </button>
        <button
          onClick={() => handleGerar('pdf')}
          disabled={isPending}
          title="Baixar como PDF"
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending && isPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-4 h-4" />}
          PDF
        </button>
      </div>
    </div>
  )
}
