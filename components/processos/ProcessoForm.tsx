'use client'

// -----------------------------------------------
// Formulário de Processo — Componente de Cliente
// -----------------------------------------------
// Este componente precisa ser client-side porque tem
// campos condicionais: dependendo da área jurídica
// escolhida, aparecem campos diferentes na tela.
// Exemplo: se Criminal → campo "Delegacia" aparece.
// -----------------------------------------------

import { useState } from 'react'

type Cliente = { id: string; nome: string }

type ProcessoFormProps = {
  action: (formData: FormData) => Promise<{ erro?: string } | void>
  clientes: Cliente[]
  valores?: {
    cliente_id?: string
    numero_cnj?: string
    tribunal?: string
    vara?: string
    classe?: string
    area_juridica?: string
    delegacia?: string
    numero_inquerito?: string
    reclamado?: string
    numero_beneficio?: string
    status?: string
    descricao?: string
  }
  botaoLabel?: string
}

// Máscara de formatação do número CNJ: 0000000-00.0000.0.00.0000
function formatarCNJ(valor: string) {
  const numeros = valor.replace(/\D/g, '')
  let resultado = numeros
  if (numeros.length > 7) resultado = numeros.slice(0, 7) + '-' + numeros.slice(7)
  if (numeros.length > 9) resultado = resultado.slice(0, 10) + '.' + resultado.slice(10)
  if (numeros.length > 13) resultado = resultado.slice(0, 15) + '.' + resultado.slice(15)
  if (numeros.length > 14) resultado = resultado.slice(0, 17) + '.' + resultado.slice(17)
  if (numeros.length > 16) resultado = resultado.slice(0, 20) + '.' + resultado.slice(20)
  return resultado.slice(0, 25)
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

export default function ProcessoForm({ action, clientes, valores = {}, botaoLabel = 'Salvar' }: ProcessoFormProps) {
  const [numeroCNJ, setNumeroCNJ] = useState(valores.numero_cnj ?? '')
  const [areaJuridica, setAreaJuridica] = useState(valores.area_juridica ?? 'civil')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await action(formData)
      if (result && 'erro' in result) setErro(result.erro ?? null)
    } catch {
      // redirect() lança uma exceção internamente — é comportamento normal
    } finally {
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {erro}
        </div>
      )}

      {/* Área jurídica — escolhida primeiro pois define campos condicionais */}
      <div>
        <label className={labelCls}>Área Jurídica <span className="text-red-500">*</span></label>
        <select
          name="area_juridica"
          value={areaJuridica}
          onChange={(e) => setAreaJuridica(e.target.value)}
          required
          className={inputCls}
        >
          <option value="civil">Cível</option>
          <option value="criminal">Criminal</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="previdenciario">Previdenciário</option>
          <option value="tributario">Tributário</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      {/* Número CNJ com formatação automática */}
      <div>
        <label className={labelCls}>
          Número CNJ <span className="text-red-500">*</span>
          <span className="text-slate-400 font-normal ml-1 text-xs">(formato: 0000000-00.0000.0.00.0000)</span>
        </label>
        <input
          name="numero_cnj"
          type="text"
          value={numeroCNJ}
          onChange={(e) => setNumeroCNJ(formatarCNJ(e.target.value))}
          placeholder="0000000-00.0000.0.00.0000"
          required
          className={`${inputCls} font-mono`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tribunal <span className="text-red-500">*</span></label>
          <input
            name="tribunal"
            type="text"
            defaultValue={valores.tribunal}
            placeholder="Ex: TJSP, TRT-15, TRF-3"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Vara / Câmara</label>
          <input
            name="vara"
            type="text"
            defaultValue={valores.vara}
            placeholder="Ex: 3ª Vara Cível"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Classe Processual</label>
        <input
          name="classe"
          type="text"
          defaultValue={valores.classe}
          placeholder="Ex: Ação de Indenização por Danos Morais"
          className={inputCls}
        />
      </div>

      {/* Cliente */}
      <div>
        <label className={labelCls}>Cliente</label>
        <select name="cliente_id" defaultValue={valores.cliente_id ?? ''} className={inputCls}>
          <option value="">— Selecionar cliente —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {!clientes.length && (
          <p className="text-xs text-slate-400 mt-1">
            Nenhum cliente cadastrado.{' '}
            <a href="/clientes/novo" className="text-amber-600 hover:underline">Cadastrar cliente</a>
          </p>
        )}
      </div>

      {/* ---- CAMPOS CONDICIONAIS POR ÁREA JURÍDICA ---- */}

      {/* Criminal: Delegacia e Inquérito */}
      {areaJuridica === 'criminal' && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-4">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Dados Criminais</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Delegacia</label>
              <input name="delegacia" type="text" defaultValue={valores.delegacia} placeholder="Ex: 1ª DP — Centro" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Número do Inquérito</label>
              <input name="numero_inquerito" type="text" defaultValue={valores.numero_inquerito} placeholder="Ex: 123/2024" className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {/* Trabalhista: Empresa reclamada */}
      {areaJuridica === 'trabalhista' && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Dados Trabalhistas</p>
          <div>
            <label className={labelCls}>Empresa Reclamada</label>
            <input name="reclamado" type="text" defaultValue={valores.reclamado} placeholder="Razão social da empresa" className={inputCls} />
          </div>
        </div>
      )}

      {/* Previdenciário: Número do benefício */}
      {areaJuridica === 'previdenciario' && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Dados Previdenciários</p>
          <div>
            <label className={labelCls}>Número do Benefício</label>
            <input name="numero_beneficio" type="text" defaultValue={valores.numero_beneficio} placeholder="Ex: 12.345.678-9" className={inputCls} />
          </div>
        </div>
      )}

      {/* Status */}
      <div>
        <label className={labelCls}>Status</label>
        <select name="status" defaultValue={valores.status ?? 'ativo'} className={inputCls}>
          <option value="ativo">Ativo</option>
          <option value="arquivado">Arquivado</option>
          <option value="encerrado">Encerrado</option>
        </select>
      </div>

      {/* Descrição / observações */}
      <div>
        <label className={labelCls}>Descrição / Observações</label>
        <textarea
          name="descricao"
          defaultValue={valores.descricao}
          rows={3}
          placeholder="Informações adicionais sobre o processo..."
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={carregando}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          {carregando ? 'Salvando...' : botaoLabel}
        </button>
        <a href="/processos" className="px-6 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </a>
      </div>
    </form>
  )
}
