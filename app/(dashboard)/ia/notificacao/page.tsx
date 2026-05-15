'use client'

// ───────────────────────────────────────────────────────────────────────────
// NOTIFICAÇÃO EXTRAJUDICIAL IA — Geração de notificações com IA
// Baseado no skill demand-draft do anthropics/claude-for-legal,
// adaptado para o Direito Brasileiro.
// ───────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Send, Loader2, Copy, CheckCheck, FileText, AlertTriangle } from 'lucide-react'

type TipoNotificacao = 'mora' | 'rescisao' | 'cobranca' | 'obrigacao' | 'irregularidade'

interface FormData {
  tipo: TipoNotificacao
  notificante: string
  notificado: string
  fatos: string
  prazo: string
  valor: string
  fundamentoContratual: string
}

const TIPOS: { value: TipoNotificacao; label: string; descricao: string }[] = [
  { value: 'mora', label: 'Constituição em Mora', descricao: 'art. 397, parágrafo único, CC' },
  { value: 'rescisao', label: 'Rescisão Contratual', descricao: 'art. 473, CC' },
  { value: 'cobranca', label: 'Cobrança de Dívida', descricao: 'art. 396, CC' },
  { value: 'obrigacao', label: 'Obrigação de Fazer', descricao: 'art. 389, CC' },
  { value: 'irregularidade', label: 'Irregularidade', descricao: 'notificação geral' },
]

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-amber-400 bg-white'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

export default function NotificacaoIAPage() {
  const [form, setForm] = useState<FormData>({
    tipo: 'mora',
    notificante: '',
    notificado: '',
    fatos: '',
    prazo: '5 (cinco) dias úteis',
    valor: '',
    fundamentoContratual: '',
  })
  const [estado, setEstado] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [resultado, setResultado] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  function atualizar(campo: keyof FormData, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function gerar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.notificante.trim() || !form.notificado.trim() || !form.fatos.trim()) return

    setEstado('loading')
    setResultado(null)
    setErroMsg(null)

    try {
      const res = await fetch('/api/ia/notificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.erro) {
        setEstado('error')
        setErroMsg(data.erro ?? 'Erro ao gerar notificação.')
        return
      }
      setResultado(data.notificacao)
      setEstado('done')
    } catch {
      setEstado('error')
      setErroMsg('Não foi possível conectar com o servidor.')
    }
  }

  async function copiar() {
    if (!resultado) return
    await navigator.clipboard.writeText(resultado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/ia" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Assistente IA
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">Notificação Extrajudicial</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">📬</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notificação Extrajudicial</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Geração de notificações jurídicas com IA — adaptado de{' '}
            <span className="font-medium">anthropics/claude-for-legal</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Formulário */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" /> Dados da Notificação
          </h2>

          <form onSubmit={gerar} className="space-y-4">
            {/* Tipo */}
            <div>
              <label className={labelCls}>Tipo de Notificação *</label>
              <div className="grid grid-cols-1 gap-2">
                {TIPOS.map(t => (
                  <label key={t.value} className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="tipo"
                      value={t.value}
                      checked={form.tipo === t.value}
                      onChange={() => atualizar('tipo', t.value)}
                      className="mt-0.5 accent-amber-500"
                    />
                    <span className="text-sm">
                      <span className="font-medium text-slate-800">{t.label}</span>
                      <span className="text-slate-400 text-xs ml-1">— {t.descricao}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notificante */}
            <div>
              <label className={labelCls}>Notificante (quem notifica) *</label>
              <input
                type="text"
                value={form.notificante}
                onChange={e => atualizar('notificante', e.target.value)}
                placeholder="Nome completo, CPF/CNPJ, endereço"
                required
                className={inputCls}
              />
            </div>

            {/* Notificado */}
            <div>
              <label className={labelCls}>Notificado (quem recebe) *</label>
              <input
                type="text"
                value={form.notificado}
                onChange={e => atualizar('notificado', e.target.value)}
                placeholder="Nome completo, CPF/CNPJ, endereço"
                required
                className={inputCls}
              />
            </div>

            {/* Valor (opcional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Valor em Aberto</label>
                <input
                  type="text"
                  value={form.valor}
                  onChange={e => atualizar('valor', e.target.value)}
                  placeholder="R$ 10.000,00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Prazo para Regularização</label>
                <input
                  type="text"
                  value={form.prazo}
                  onChange={e => atualizar('prazo', e.target.value)}
                  placeholder="5 dias úteis"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Fundamento contratual */}
            <div>
              <label className={labelCls}>Cláusula / Fundamento Contratual</label>
              <input
                type="text"
                value={form.fundamentoContratual}
                onChange={e => atualizar('fundamentoContratual', e.target.value)}
                placeholder="Ex: Cláusula 5ª do Contrato de 01/01/2024"
                className={inputCls}
              />
            </div>

            {/* Fatos */}
            <div>
              <label className={labelCls}>Descrição dos Fatos *</label>
              <textarea
                value={form.fatos}
                onChange={e => atualizar('fatos', e.target.value)}
                rows={5}
                required
                minLength={20}
                placeholder="Descreva os fatos de forma objetiva: o que aconteceu, quando, quais obrigações foram descumpridas..."
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-slate-400 mt-1">Seja específico — a IA usa apenas o que você fornecer.</p>
            </div>

            {/* Alerta de pre-draft check */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
              <strong>Verificação automática:</strong> A IA checará riscos de admissão de fatos prejudiciais e adequação do tom antes de redigir.
            </div>

            <button
              type="submit"
              disabled={estado === 'loading' || !form.notificante || !form.notificado || !form.fatos}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors"
            >
              {estado === 'loading'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando notificação...</>
                : <><Send className="w-4 h-4" /> Gerar Notificação</>
              }
            </button>
          </form>
        </div>

        {/* Resultado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span>📄</span> Rascunho Gerado
            </h2>
            {estado === 'done' && resultado && (
              <button
                onClick={copiar}
                className="flex items-center gap-1.5 text-xs border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {copiado
                  ? <><CheckCheck className="w-3.5 h-3.5 text-green-600" /> Copiado!</>
                  : <><Copy className="w-3.5 h-3.5" /> Copiar</>
                }
              </button>
            )}
          </div>

          <div className="flex-1 min-h-[400px]">
            {estado === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <span className="text-4xl mb-3">📬</span>
                <p className="text-sm">Preencha o formulário e clique em <strong>Gerar Notificação</strong> para a IA redigir o documento.</p>
              </div>
            )}

            {estado === 'loading' && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm">Analisando dados e redigindo notificação...</p>
              </div>
            )}

            {estado === 'error' && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
                <p className="text-sm text-red-600 font-medium">{erroMsg}</p>
                <button onClick={() => setEstado('idle')} className="mt-3 text-xs text-slate-500 underline">
                  Tentar novamente
                </button>
              </div>
            )}

            {estado === 'done' && resultado && (
              <div>
                <pre className="text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-200">
                  {resultado}
                </pre>
                <p className="text-xs text-slate-400 mt-3 p-3 border border-amber-100 bg-amber-50 rounded-lg">
                  ⚠️ <strong>Rascunho para revisão do advogado antes do envio.</strong> A notificação é documento formal com efeitos jurídicos.
                  Verifique datas, valores e fundamentos legais antes de assinar e enviar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
