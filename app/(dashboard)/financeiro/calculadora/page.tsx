'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Calculator, Info } from 'lucide-react'

type Area = 'civil' | 'trabalhista' | 'criminal' | 'tributario' | 'previdenciario' | 'familia' | 'empresarial'
type Modalidade = 'fixo' | 'exito' | 'misto' | 'retainer'

interface Faixa {
  min: number
  max: number
  percentual: number
}

const FAIXAS_OAB: Record<Area, Faixa[]> = {
  civil: [
    { min: 0,           max: 10000,     percentual: 20 },
    { min: 10000,       max: 50000,     percentual: 18 },
    { min: 50000,       max: 200000,    percentual: 15 },
    { min: 200000,      max: 1000000,   percentual: 12 },
    { min: 1000000,     max: Infinity,  percentual: 10 },
  ],
  trabalhista: [
    { min: 0,           max: 10000,     percentual: 25 },
    { min: 10000,       max: 50000,     percentual: 20 },
    { min: 50000,       max: 200000,    percentual: 15 },
    { min: 200000,      max: Infinity,  percentual: 12 },
  ],
  criminal: [
    { min: 0,           max: Infinity,  percentual: 0 }, // valor fixo
  ],
  tributario: [
    { min: 0,           max: 50000,     percentual: 15 },
    { min: 50000,       max: 500000,    percentual: 12 },
    { min: 500000,      max: Infinity,  percentual: 10 },
  ],
  previdenciario: [
    { min: 0,           max: Infinity,  percentual: 30 }, // até 30% do benefício
  ],
  familia: [
    { min: 0,           max: 30000,     percentual: 20 },
    { min: 30000,       max: 200000,    percentual: 15 },
    { min: 200000,      max: Infinity,  percentual: 12 },
  ],
  empresarial: [
    { min: 0,           max: 50000,     percentual: 15 },
    { min: 50000,       max: 300000,    percentual: 12 },
    { min: 300000,      max: Infinity,  percentual: 10 },
  ],
}

const FIXO_MIN: Record<Area, number> = {
  civil:          2000,
  trabalhista:    1500,
  criminal:       3000,
  tributario:     5000,
  previdenciario: 0,
  familia:        2500,
  empresarial:    5000,
}

const RETAINER_SUGERIDO: Record<Area, { min: number; max: number }> = {
  civil:          { min: 2000,  max: 8000  },
  trabalhista:    { min: 1500,  max: 5000  },
  criminal:       { min: 3000,  max: 15000 },
  tributario:     { min: 5000,  max: 20000 },
  previdenciario: { min: 1000,  max: 3000  },
  familia:        { min: 2000,  max: 8000  },
  empresarial:    { min: 5000,  max: 25000 },
}

function calcularHonorario(area: Area, valor: number): number {
  const faixas = FAIXAS_OAB[area]
  if (faixas.length === 1) return FIXO_MIN[area] // criminal = valor fixo
  const faixa = faixas.find(f => valor >= f.min && valor <= f.max)
  if (!faixa) return 0
  const percentual = faixa.percentual / 100
  return Math.max(valor * percentual, FIXO_MIN[area])
}

function fmtValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const AREAS: { value: Area; label: string }[] = [
  { value: 'civil',          label: 'Cível' },
  { value: 'trabalhista',    label: 'Trabalhista' },
  { value: 'criminal',       label: 'Criminal / Penal' },
  { value: 'tributario',     label: 'Tributário / Fiscal' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'familia',        label: 'Família e Sucessões' },
  { value: 'empresarial',    label: 'Empresarial / Societário' },
]

const MODALIDADES: { value: Modalidade; label: string; desc: string }[] = [
  { value: 'fixo',     label: 'Fixo',             desc: 'Valor determinado independente do resultado' },
  { value: 'exito',    label: 'Por Êxito',         desc: 'Percentual sobre o proveito econômico obtido' },
  { value: 'misto',    label: 'Fixo + Êxito',      desc: 'Parte fixa + percentual de êxito reduzido' },
  { value: 'retainer', label: 'Avença Mensal',      desc: 'Mensalidade para assessoria contínua' },
]

const cls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 bg-white'

export default function CalculadoraHonorariosPage() {
  const [area, setArea] = useState<Area>('civil')
  const [modalidade, setModalidade] = useState<Modalidade>('misto')
  const [valorCausa, setValorCausa] = useState('')
  const [instancias, setInstancias] = useState(1)

  const valor = parseFloat(valorCausa.replace(/\./g, '').replace(',', '.')) || 0
  const honorarioBase = calcularHonorario(area, valor)

  const faixas = FAIXAS_OAB[area]
  const faixaAtual = faixas.find(f => valor >= f.min && valor <= f.max)
  const percentualAtual = faixaAtual?.percentual ?? 0

  const resultados = {
    fixo: {
      recomendado: honorarioBase * (1 + (instancias - 1) * 0.5),
      minimo:      FIXO_MIN[area] * (1 + (instancias - 1) * 0.3),
    },
    exito: {
      percentual: percentualAtual,
      valor: valor * (percentualAtual / 100),
    },
    misto: {
      fixo:  honorarioBase * 0.4,
      exito: percentualAtual * 0.6,
      valorExito: valor * (percentualAtual * 0.6 / 100),
    },
    retainer: RETAINER_SUGERIDO[area],
  }

  const isCriminal = area === 'criminal'
  const isPrevidenciario = area === 'previdenciario'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/financeiro" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-4 h-4" /> Financeiro
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Calculadora de Honorários OAB</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-amber-500" />
          Calculadora de Honorários
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Estimativa baseada na Tabela de Honorários da OAB e CED. Valores indicativos — adeque ao caso concreto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Dados da causa</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Área jurídica</label>
            <select value={area} onChange={e => setArea(e.target.value as Area)} className={cls}>
              {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Modalidade de honorários</label>
            <div className="space-y-2">
              {MODALIDADES.map(m => (
                <label key={m.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  modalidade === m.value ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="modalidade"
                    value={m.value}
                    checked={modalidade === m.value}
                    onChange={() => setModalidade(m.value)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.label}</p>
                    <p className="text-xs text-slate-500">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {modalidade !== 'retainer' && !isCriminal && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Valor da causa (R$)
              </label>
              <input
                type="text"
                value={valorCausa}
                onChange={e => setValorCausa(e.target.value)}
                placeholder="Ex: 50.000,00"
                className={cls}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Número de instâncias previstas
            </label>
            <select value={instancias} onChange={e => setInstancias(Number(e.target.value))} className={cls}>
              <option value={1}>1ª instância</option>
              <option value={2}>Até 2ª instância</option>
              <option value={3}>Até tribunais superiores</option>
            </select>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          {/* Card principal */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Honorário estimado</p>

            {modalidade === 'fixo' && !isCriminal && (
              <>
                <p className="text-3xl font-bold">{fmtValor(resultados.fixo.recomendado)}</p>
                <p className="text-sm opacity-75 mt-1">mínimo ético: {fmtValor(resultados.fixo.minimo)}</p>
              </>
            )}
            {modalidade === 'fixo' && isCriminal && (
              <>
                <p className="text-3xl font-bold">{fmtValor(FIXO_MIN.criminal)}</p>
                <p className="text-sm opacity-75 mt-1">base mínima — ajuste pela complexidade do caso</p>
              </>
            )}
            {modalidade === 'exito' && !isPrevidenciario && (
              <>
                <p className="text-3xl font-bold">{percentualAtual}%</p>
                <p className="text-sm opacity-75 mt-1">
                  {valor > 0 ? `≈ ${fmtValor(resultados.exito.valor)} sobre ${fmtValor(valor)}` : 'informe o valor da causa'}
                </p>
              </>
            )}
            {modalidade === 'exito' && isPrevidenciario && (
              <>
                <p className="text-3xl font-bold">até 30%</p>
                <p className="text-sm opacity-75 mt-1">calculado sobre o valor do benefício obtido retroativo</p>
              </>
            )}
            {modalidade === 'misto' && (
              <>
                <p className="text-xl font-bold">{fmtValor(resultados.misto.fixo)}</p>
                <p className="text-sm opacity-75">fixo +</p>
                <p className="text-xl font-bold mt-1">{(resultados.misto.exito).toFixed(1)}% por êxito</p>
                {valor > 0 && (
                  <p className="text-sm opacity-75 mt-1">êxito ≈ {fmtValor(resultados.misto.valorExito)}</p>
                )}
              </>
            )}
            {modalidade === 'retainer' && (
              <>
                <p className="text-3xl font-bold">{fmtValor(resultados.retainer.min)}</p>
                <p className="text-sm opacity-75 mt-1">a {fmtValor(resultados.retainer.max)} por mês</p>
              </>
            )}
          </div>

          {/* Tabela de faixas */}
          {!isCriminal && modalidade !== 'retainer' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Faixas OAB — {AREAS.find(a => a.value === area)?.label}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {FAIXAS_OAB[area].filter(f => f.percentual > 0).map((f, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${
                    faixaAtual === f ? 'bg-amber-50' : ''
                  }`}>
                    <p className="text-xs text-slate-600">
                      {fmtValor(f.min)} — {f.max === Infinity ? 'acima' : fmtValor(f.max)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${faixaAtual === f ? 'text-amber-700' : 'text-slate-700'}`}>
                        {f.percentual}%
                      </span>
                      {faixaAtual === f && <span className="text-xs text-amber-600">← sua causa</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Honorários sucumbenciais */}
          {valor > 0 && modalidade !== 'retainer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-800 mb-1">Honorários sucumbenciais (art. 85, CPC)</p>
                  <p className="text-xs text-blue-700">
                    Em caso de êxito, o juiz fixará entre 10% e 20% do valor da condenação —{' '}
                    <strong>{fmtValor(valor * 0.1)}</strong> a <strong>{fmtValor(valor * 0.2)}</strong>.{' '}
                    Estes pertencem ao advogado (§14°). Inclua cláusula específica no contrato de honorários.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aviso */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              ⚠️ <strong>Estimativa orientativa.</strong> Consulte sempre a Tabela de Honorários da sua Seccional OAB para valores mínimos vinculantes.
              Honorários excessivos ou inferiores ao mínimo são vedados pelo CED/OAB.
              Formalize sempre por contrato escrito (art. 48, CED).
            </p>
          </div>
        </div>
      </div>

      {/* Atalhos */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/ia?modo=contrato-honorarios"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          Gerar contrato de honorários com IA →
        </Link>
        <Link
          href="/contratos/novo"
          className="flex items-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          Criar contrato manualmente
        </Link>
      </div>
    </div>
  )
}
