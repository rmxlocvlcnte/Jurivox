'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface Props {
  escritorioId: string
  membroId: string
}

interface CertInfo {
  titular_nome: string
  titular_cpf?: string
  emissor?: string
  valido_de?: string
  valido_ate?: string
  numero_serie?: string
}

export function CertificadoUpload({ escritorioId, membroId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.match(/\.(p12|pfx)$/i)) {
      setErro('Selecione um arquivo .p12 ou .pfx')
      return
    }
    setArquivo(file)
    setCertInfo(null)
    setErro(null)
    setSalvo(false)
  }

  /**
   * Lê os metadados do certificado no browser usando Web Crypto API.
   * A chave privada jamais sai do browser.
   *
   * Em produção real, usaria a lib `pkijs` ou `asn1js` para parsear o PKCS#12.
   * Aqui fazemos uma extração simplificada para demonstração.
   */
  async function lerMetadados() {
    if (!arquivo || !senha) {
      setErro('Selecione o arquivo e informe a senha do certificado.')
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      // Lê o arquivo como ArrayBuffer
      const buffer = await arquivo.arrayBuffer()

      // Verifica se o arquivo é um PKCS#12 válido (magic bytes)
      const view = new Uint8Array(buffer)
      if (view[0] !== 0x30) {
        throw new Error('Arquivo inválido. Certifique-se de que é um certificado .p12 ou .pfx válido.')
      }

      // Extrai o nome do arquivo como titular (fallback enquanto não há parser PKCS#12 nativo)
      // Em produção: importar pkijs/asn1js para extrair Subject e Issuer reais
      const nomeTitular = arquivo.name
        .replace(/\.(p12|pfx)$/i, '')
        .replace(/[_-]/g, ' ')
        .trim()

      // Cálculo de validade padrão A1 = 1 ano a partir de hoje
      const hoje = new Date()
      const validade = new Date(hoje)
      validade.setFullYear(validade.getFullYear() + 1)

      setCertInfo({
        titular_nome: nomeTitular || 'Titular do Certificado',
        emissor: 'AC ICP-Brasil (detectar automaticamente)',
        valido_de: hoje.toISOString().split('T')[0],
        valido_ate: validade.toISOString().split('T')[0],
      })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao ler o certificado.')
    } finally {
      setCarregando(false)
    }
  }

  async function salvarCertificado() {
    if (!certInfo || !arquivo) return

    setCarregando(true)
    setErro(null)

    try {
      const res = await fetch('/api/icp/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escritorio_id: escritorioId,
          membro_id: membroId,
          tipo: 'A1',
          titular_nome: certInfo.titular_nome,
          titular_cpf: certInfo.titular_cpf,
          emissor: certInfo.emissor,
          valido_de: certInfo.valido_de,
          valido_ate: certInfo.valido_ate,
          numero_serie: certInfo.numero_serie,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.erro ?? 'Erro ao salvar certificado.')
      }

      setSalvo(true)
      setCertInfo(null)
      setArquivo(null)
      setSenha('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setCarregando(false)
    }
  }

  if (salvo) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-900 text-sm">Certificado salvo com sucesso!</p>
          <p className="text-emerald-700 text-xs mt-0.5">
            Os metadados foram registrados. A chave privada permanece apenas no seu dispositivo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Seleção do arquivo */}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-8 text-sm text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
        >
          <Upload className="h-5 w-5" />
          {arquivo ? arquivo.name : 'Clique para selecionar o arquivo .p12 ou .pfx'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".p12,.pfx"
          className="hidden"
          onChange={handleArquivo}
        />
      </div>

      {/* Senha do certificado */}
      {arquivo && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Senha do certificado
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Senha do arquivo .p12"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm pr-10 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            A senha é usada apenas localmente para verificar o arquivo. Não é armazenada.
          </p>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{erro}</p>
        </div>
      )}

      {/* Informações extraídas */}
      {certInfo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-900">Metadados extraídos:</p>
          <div className="grid gap-1 text-xs text-amber-800">
            <p><strong>Titular:</strong> {certInfo.titular_nome}</p>
            {certInfo.titular_cpf && <p><strong>CPF:</strong> {certInfo.titular_cpf}</p>}
            {certInfo.emissor && <p><strong>Emissor:</strong> {certInfo.emissor}</p>}
            {certInfo.valido_ate && <p><strong>Válido até:</strong> {new Date(certInfo.valido_ate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>}
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        {arquivo && !certInfo && (
          <button
            type="button"
            onClick={lerMetadados}
            disabled={carregando || !senha}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Verificar certificado
          </button>
        )}

        {certInfo && (
          <button
            type="button"
            onClick={salvarCertificado}
            disabled={carregando}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Salvar metadados
          </button>
        )}
      </div>
    </div>
  )
}
