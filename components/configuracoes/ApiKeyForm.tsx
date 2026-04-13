'use client'

import { useState, useTransition } from 'react'
import { criarApiKey, revogarApiKey, excluirApiKey } from '@/lib/actions/api-keys'
import { toast } from 'sonner'
import { Key, Plus, Copy, Check, X, ShieldOff, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'

const ESCOPOS = [
  { value: 'processos:read',  label: 'Processos — Leitura', desc: 'GET /api/v1/processos' },
  { value: 'processos:write', label: 'Processos — Escrita', desc: 'Criar/atualizar processos' },
  { value: 'clientes:read',   label: 'Clientes — Leitura',  desc: 'GET /api/v1/clientes' },
  { value: 'clientes:write',  label: 'Clientes — Escrita',  desc: 'Criar/atualizar clientes' },
  { value: 'prazos:read',     label: 'Prazos — Leitura',    desc: 'GET /api/v1/prazos' },
  { value: 'prazos:write',    label: 'Prazos — Escrita',    desc: 'Criar prazos' },
]

interface ApiKey {
  id: string
  nome: string
  key_preview: string
  escopos: string[]
  ativo: boolean
  ultimo_uso_em: string | null
  criado_em: string
}

export function ApiKeyForm({ chavesIniciais }: { chavesIniciais: ApiKey[] }) {
  const [chaves, setChaves] = useState<ApiKey[]>(chavesIniciais)
  const [showForm, setShowForm] = useState(false)
  const [chaveGerada, setChaveGerada] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [escoposSelecionados, setEscoposSelecionados] = useState<string[]>(['processos:read', 'clientes:read', 'prazos:read'])
  const [isPending, startTransition] = useTransition()

  function toggleEscopo(escopo: string) {
    setEscoposSelecionados(prev =>
      prev.includes(escopo) ? prev.filter(e => e !== escopo) : [...prev, escopo]
    )
  }

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    escoposSelecionados.forEach(s => formData.append('escopos', s))

    startTransition(async () => {
      const res = await criarApiKey(formData)
      if (res && 'erro' in res) {
        toast.error(res.erro)
      } else if (res && 'chave' in res) {
        setChaveGerada(res.chave as string)
        setShowForm(false)
        // Recarrega a lista adicionando a nova chave
        window.location.reload()
      }
    })
  }

  function handleRevogar(id: string, nome: string) {
    startTransition(async () => {
      const res = await revogarApiKey(id)
      if (res && 'erro' in res) {
        toast.error(res.erro)
      } else {
        toast.success(`Chave "${nome}" revogada.`)
        setChaves(prev => prev.map(c => c.id === id ? { ...c, ativo: false } : c))
      }
    })
  }

  function handleExcluir(id: string, nome: string) {
    startTransition(async () => {
      const res = await excluirApiKey(id)
      if (res && 'erro' in res) {
        toast.error(res.erro)
      } else {
        toast.success(`Chave "${nome}" excluída.`)
        setChaves(prev => prev.filter(c => c.id !== id))
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Modal de chave gerada */}
      {chaveGerada && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Key className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-800 mb-1">Chave criada com sucesso!</p>
              <p className="text-xs text-emerald-700 mb-3">
                Copie agora — esta chave <strong>não será exibida novamente</strong>.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono text-emerald-900 break-all">
                  {chaveGerada}
                </code>
                <button
                  onClick={() => copiar(chaveGerada)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                >
                  {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
            <button onClick={() => setChaveGerada(null)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Formulário de nova chave */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Nova Chave de API</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da chave *</label>
            <input
              name="nome"
              required
              placeholder="Ex: Integração CRM, Sistema Interno..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Escopos de acesso *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ESCOPOS.map(escopo => (
                <label
                  key={escopo.value}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    escoposSelecionados.includes(escopo.value)
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={escoposSelecionados.includes(escopo.value)}
                    onChange={() => toggleEscopo(escopo.value)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{escopo.label}</p>
                    <p className="text-xs text-slate-400">{escopo.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending || escoposSelecionados.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Gerar Chave
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Chave de API
        </button>
      )}

      {/* Lista de chaves */}
      {chaves.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Key className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma chave criada ainda.</p>
          <p className="text-slate-400 text-sm mt-1">Crie uma chave para integrar sistemas externos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chaves.map(chave => (
            <div key={chave.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${chave.ativo ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                  <Key className={`w-4 h-4 ${chave.ativo ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{chave.nome}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${chave.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {chave.ativo ? 'Ativa' : 'Revogada'}
                    </span>
                  </div>
                  <code className="text-xs text-slate-500 font-mono">{chave.key_preview}</code>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(chave.escopos ?? []).map(s => (
                      <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Criada em {new Date(chave.criado_em).toLocaleDateString('pt-BR')}
                    {chave.ultimo_uso_em && ` · Último uso: ${new Date(chave.ultimo_uso_em).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {chave.ativo && (
                    <button
                      onClick={() => handleRevogar(chave.id, chave.nome)}
                      disabled={isPending}
                      title="Revogar chave"
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ShieldOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleExcluir(chave.id, chave.nome)}
                    disabled={isPending}
                    title="Excluir chave"
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
