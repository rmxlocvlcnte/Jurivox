'use client'

// -----------------------------------------------
// NOVO PRAZO — Formulário com cálculo automático
// -----------------------------------------------
// Este componente é client-side para poder calcular
// a data de vencimento em tempo real enquanto o
// advogado preenche os campos.
// -----------------------------------------------

import { useState, useEffect } from 'react'
import { criarPrazo } from '@/lib/actions/prazos'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function calcularVencimento(dataInicio: string, quantidadeDias: number, diasUteis: boolean): string {
  if (!dataInicio || isNaN(quantidadeDias) || quantidadeDias <= 0) return ''
  const inicio = new Date(dataInicio + 'T12:00:00')
  const data = new Date(inicio)
  let diasContados = 0
  while (diasContados < quantidadeDias) {
    data.setDate(data.getDate() + 1)
    if (diasUteis) {
      const dia = data.getDay()
      if (dia !== 0 && dia !== 6) diasContados++
    } else {
      diasContados++
    }
  }
  return data.toLocaleDateString('pt-BR')
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white'

export default function NovoPrazoPage() {
  const searchParams = useSearchParams()
  const [processos, setProcessos] = useState<{ id: string; numero_cnj: string; clientes: any }[]>([])
  const [processoSelecionado, setProcessoSelecionado] = useState(searchParams.get('processo_id') ?? '')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [quantidadeDias, setQuantidadeDias] = useState(15)
  const [diasUteis, setDiasUteis] = useState(true)
  const [dataVencimento, setDataVencimento] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const _router = useRouter()

  // Atualiza a data de vencimento sempre que os campos mudarem
  useEffect(() => {
    const result = calcularVencimento(dataInicio, quantidadeDias, diasUteis)
    setDataVencimento(result)
  }, [dataInicio, quantidadeDias, diasUteis])

  // Carrega a lista de processos ao abrir a página
  useEffect(() => {
    fetch('/api/processos')
      .then(r => r.json())
      .then(data => setProcessos(data ?? []))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await criarPrazo(formData)
      if (result && 'erro' in result) setErro(result.erro ?? null)
    } catch {
      // redirect() lança exceção — comportamento normal
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/prazos" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Prazos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Novo Prazo</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Cadastrar Prazo</h1>

        {erro && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Processo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Processo <span className="text-red-500">*</span>
            </label>
            <select
              name="processo_id"
              required
              value={processoSelecionado}
              onChange={e => setProcessoSelecionado(e.target.value)}
              className={inputCls}
            >
              <option value="">— Selecionar processo —</option>
              {processos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.numero_cnj}{p.clientes?.nome ? ` — ${p.clientes.nome}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição do Prazo <span className="text-red-500">*</span>
            </label>
            <input
              name="descricao"
              type="text"
              required
              placeholder="Ex: Prazo para contestação"
              className={inputCls}
            />
          </div>

          {/* Data de início */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data de Início <span className="text-red-500">*</span>
            </label>
            <input
              name="data_inicio"
              type="date"
              required
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Quantidade de dias + tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantidade de Dias <span className="text-red-500">*</span>
              </label>
              <input
                name="quantidade_dias"
                type="number"
                required
                min={1}
                value={quantidadeDias}
                onChange={e => setQuantidadeDias(parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Dias</label>
              <select
                name="dias_uteis"
                value={diasUteis ? 'true' : 'false'}
                onChange={e => setDiasUteis(e.target.value === 'true')}
                className={inputCls}
              >
                <option value="true">Dias Úteis</option>
                <option value="false">Dias Corridos</option>
              </select>
            </div>
          </div>

          {/* Data de vencimento calculada */}
          {dataVencimento && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">Data de Vencimento Calculada</p>
              <p className="text-2xl font-bold text-amber-800 mt-1">{dataVencimento}</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {quantidadeDias} dias {diasUteis ? 'úteis' : 'corridos'} a partir de{' '}
                {new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={carregando}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {carregando ? 'Salvando...' : 'Cadastrar Prazo'}
            </button>
            <Link href="/prazos" className="px-6 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
