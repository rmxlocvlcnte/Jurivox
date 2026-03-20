'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { salvarMetadadoDocumento, excluirDocumento } from '@/lib/actions/documentos'
import { Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react'

const TIPOS_DOCUMENTO = [
  { value: 'rg', label: 'RG' },
  { value: 'cpf', label: 'CPF' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'certidao', label: 'Certidão' },
  { value: 'comprovante', label: 'Comprovante de Residência' },
  { value: 'outro', label: 'Outro' },
]

type Documento = {
  id: string
  tipo: string
  nome_arquivo: string
  url_arquivo: string
  criado_em: string
}

interface Props {
  clienteId: string
  escritorioId: string
  documentos: Documento[]
}

export function UploadDocumento({ clienteId, escritorioId, documentos: docsIniciais }: Props) {
  const [documentos, setDocumentos] = useState<Documento[]>(docsIniciais)
  const [tipo, setTipo] = useState('rg')
  const [uploading, setUploading] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setErro('Arquivo muito grande. Tamanho máximo: 10MB.')
      return
    }

    setUploading(true)
    setErro(null)
    setSucesso(false)
    setProgresso(10)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const nomeArquivo = `${Date.now()}-${tipo}.${ext}`
      const caminho = `${escritorioId}/${clienteId}/${nomeArquivo}`

      setProgresso(30)

      // Upload para o Supabase Storage
      const { error: erroUpload } = await supabase.storage
        .from('documentos')
        .upload(caminho, file, { upsert: false })

      if (erroUpload) {
        if (erroUpload.message.includes('Bucket not found')) {
          setErro('Bucket "documentos" não encontrado. Crie-o no Supabase Storage.')
        } else {
          setErro(`Erro no upload: ${erroUpload.message}`)
        }
        return
      }

      setProgresso(70)

      // Gera URL pública
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(caminho)

      setProgresso(90)

      // Salva metadados no banco
      const resultado = await salvarMetadadoDocumento({
        clienteId,
        tipo,
        nomeArquivo: file.name,
        urlArquivo: urlData.publicUrl,
        caminho,
      })

      if (resultado.erro) {
        setErro(resultado.erro)
        return
      }

      if (resultado.documento) {
        setDocumentos(prev => [resultado.documento!, ...prev])
      }

      setProgresso(100)
      setSucesso(true)
      if (inputRef.current) inputRef.current.value = ''
      setTimeout(() => { setSucesso(false); setProgresso(0) }, 3000)

    } catch {
      setErro('Erro inesperado durante o upload.')
    } finally {
      setUploading(false)
    }
  }

  async function handleExcluir(doc: Documento) {
    if (!confirm(`Excluir "${doc.nome_arquivo}"?`)) return
    const supabase = createClient()

    // Remove do storage
    const caminho = doc.url_arquivo.split('/documentos/')[1]
    if (caminho) {
      await supabase.storage.from('documentos').remove([caminho])
    }

    await excluirDocumento(doc.id, clienteId)
    setDocumentos(prev => prev.filter(d => d.id !== doc.id))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setArrastando(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const tipoLabel = (t: string) => TIPOS_DOCUMENTO.find(d => d.value === t)?.label ?? t

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          Documentos
          {documentos.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {documentos.length}
            </span>
          )}
        </h2>
      </div>

      {/* Área de upload */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex gap-3 mb-3">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={uploading}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700 disabled:opacity-60"
          >
            {TIPOS_DOCUMENTO.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1e293b',
              boxShadow: uploading ? 'none' : '0 2px 8px rgba(245,158,11,0.3)',
            }}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? 'Enviando...' : 'Selecionar arquivo'}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
        </div>

        {/* Área de arrastar e soltar */}
        <div
          onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
          onDragLeave={() => setArrastando(false)}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer"
          style={{
            borderColor: arrastando ? '#f59e0b' : '#e2e8f0',
            background: arrastando ? 'rgba(245,158,11,0.05)' : 'transparent',
          }}
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-xs text-slate-400">
            Arraste e solte aqui · PDF, JPG, PNG, DOC · até 10MB
          </p>
        </div>

        {/* Barra de progresso */}
        {uploading && progresso > 0 && (
          <div className="mt-3">
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progresso}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{progresso}% enviado</p>
          </div>
        )}

        {/* Feedback */}
        {erro && (
          <div className="flex items-start gap-2 mt-3 p-3 rounded-lg text-xs"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg text-xs"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            Documento enviado com sucesso!
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      <div className="divide-y divide-slate-100">
        {documentos.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhum documento enviado ainda.</p>
          </div>
        ) : (
          documentos.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: '#fef3c7' }}
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.nome_arquivo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: '#f1f5f9', color: '#64748b' }}
                    >
                      {tipoLabel(doc.tipo)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(doc.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.url_arquivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleExcluir(doc)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
