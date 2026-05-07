import { describe, it, expect } from 'vitest'
import {
  CATEGORIAS_ERRO,
  analisarPareto,
  calcularConfiabilidade,
  obterMetricasQualidade,
  calcularPontuacaoRisco,
  classificarNivelRisco,
  type CategoriaErro,
  type ProbabilidadeRisco,
  type ImpactoRisco,
} from '@/lib/sqa'

// ── CATEGORIAS_ERRO (Figura 16.2 — Pressman) ─────────────────────────────
describe('CATEGORIAS_ERRO (Pressman Fig. 16.2)', () => {
  it('contém exatamente as 12 categorias definidas por Pressman', () => {
    const esperadas: CategoriaErro[] = [
      'IES', 'MCC', 'IDS', 'VPS', 'EDR',
      'ICI', 'EDL', 'IET', 'IID', 'PLT', 'HCI', 'MIS',
    ]
    expect(Object.keys(CATEGORIAS_ERRO)).toHaveLength(12)
    for (const cat of esperadas) {
      expect(CATEGORIAS_ERRO).toHaveProperty(cat)
    }
  })

  it('todas as descrições são strings não-vazias', () => {
    for (const desc of Object.values(CATEGORIAS_ERRO)) {
      expect(typeof desc).toBe('string')
      expect(desc.length).toBeGreaterThan(5)
    }
  })

  it('IES descreve especificações incompletas', () => {
    expect(CATEGORIAS_ERRO.IES.toLowerCase()).toContain('especifica')
  })

  it('VPS descreve violação de padrões de programação', () => {
    expect(CATEGORIAS_ERRO.VPS.toLowerCase()).toContain('padr')
  })

  it('HCI descreve interface homem-máquina', () => {
    expect(CATEGORIAS_ERRO.HCI.toLowerCase()).toContain('interface')
  })
})

// ── analisarPareto (Seção 16.5 — Princípio de Pareto) ────────────────────
describe('analisarPareto', () => {
  it('retorna array (vazio quando sem dados no banco)', async () => {
    const resultado = await analisarPareto(30)
    expect(Array.isArray(resultado)).toBe(true)
  })

  it('aceita diferentes períodos retroativos', async () => {
    const r7  = await analisarPareto(7)
    const r90 = await analisarPareto(90)
    expect(Array.isArray(r7)).toBe(true)
    expect(Array.isArray(r90)).toBe(true)
  })
})

// ── calcularConfiabilidade (Seção 16.6 — MTBF/MTTF/MTTR) ────────────────
describe('calcularConfiabilidade', () => {
  it('retorna estrutura completa de métricas', async () => {
    const resultado = await calcularConfiabilidade(30)
    expect(resultado).toHaveProperty('mtbf_horas')
    expect(resultado).toHaveProperty('mttf_horas')
    expect(resultado).toHaveProperty('mttr_horas')
    expect(resultado).toHaveProperty('disponibilidade_percentual')
    expect(resultado).toHaveProperty('total_incidentes')
    expect(resultado).toHaveProperty('periodo_dias')
  })

  it('disponibilidade está entre 0% e 100%', async () => {
    const resultado = await calcularConfiabilidade(30)
    expect(resultado.disponibilidade_percentual).toBeGreaterThanOrEqual(0)
    expect(resultado.disponibilidade_percentual).toBeLessThanOrEqual(100)
  })

  it('período retroativo é preservado no resultado', async () => {
    const r7  = await calcularConfiabilidade(7)
    const r90 = await calcularConfiabilidade(90)
    expect(r7.periodo_dias).toBe(7)
    expect(r90.periodo_dias).toBe(90)
  })

  it('todos os valores numéricos são não-negativos', async () => {
    const r = await calcularConfiabilidade(30)
    expect(r.mtbf_horas).toBeGreaterThanOrEqual(0)
    expect(r.mttf_horas).toBeGreaterThanOrEqual(0)
    expect(r.mttr_horas).toBeGreaterThanOrEqual(0)
    expect(r.total_incidentes).toBeGreaterThanOrEqual(0)
  })
})

// ── obterMetricasQualidade (Seção 16.3.2 — metas e métricas) ─────────────
describe('obterMetricasQualidade', () => {
  it('retorna todas as métricas esperadas', async () => {
    const m = await obterMetricasQualidade()
    expect(m).toHaveProperty('total_erros_abertos')
    expect(m).toHaveProperty('total_erros_graves')
    expect(m).toHaveProperty('taxa_resolucao_percentual')
    expect(m).toHaveProperty('tempo_medio_resolucao_horas')
    expect(m).toHaveProperty('densidade_defeitos')
    expect(m).toHaveProperty('cobertura_revisoes')
  })

  it('taxa de resolução está entre 0% e 100%', async () => {
    const m = await obterMetricasQualidade()
    expect(m.taxa_resolucao_percentual).toBeGreaterThanOrEqual(0)
    expect(m.taxa_resolucao_percentual).toBeLessThanOrEqual(100)
  })

  it('contagens são não-negativas', async () => {
    const m = await obterMetricasQualidade()
    expect(m.total_erros_abertos).toBeGreaterThanOrEqual(0)
    expect(m.total_erros_graves).toBeGreaterThanOrEqual(0)
    expect(m.tempo_medio_resolucao_horas).toBeGreaterThanOrEqual(0)
    expect(m.densidade_defeitos).toBeGreaterThanOrEqual(0)
    expect(m.cobertura_revisoes).toBeGreaterThanOrEqual(0)
  })
})

// ── Fórmulas de confiabilidade (Pressman 16.6.1) — testes matemáticos ────
describe('Fórmula de disponibilidade MTBF (Pressman 16.6.1)', () => {
  function calcularDisponibilidade(mttf: number, mttr: number): number {
    const mtbf = mttf + mttr
    return mtbf > 0 ? (mttf / mtbf) * 100 : 100
  }

  it('cenário típico: 718h MTTF, 2h MTTR → ~99.72% disponível', () => {
    expect(calcularDisponibilidade(718, 2)).toBeCloseTo(99.72, 1)
  })

  it('sem incidentes (MTTR=0) → 100% disponível', () => {
    expect(calcularDisponibilidade(720, 0)).toBe(100)
  })

  it('MTBF = MTTF + MTTR', () => {
    const mttf = 100
    const mttr = 20
    const mtbf = mttf + mttr
    expect(mtbf).toBe(120)
    expect(calcularDisponibilidade(mttf, mttr)).toBeCloseTo(83.33, 1)
  })

  it('alta disponibilidade: 99.9% (SLA típico)', () => {
    // MTTF=999h, MTTR=1h → 99.9%
    expect(calcularDisponibilidade(999, 1)).toBeCloseTo(99.9, 1)
  })
})

// ── Princípio de Pareto (80/20) — lógica pura ────────────────────────────
describe('Princípio de Pareto (Seção 16.5)', () => {
  function simularPareto(contagens: number[]): { percentualAcumulado: number; vitais: boolean }[] {
    const total = contagens.reduce((s, c) => s + c, 0)
    const limiar80 = total * 0.8
    let acumulado = 0
    return contagens
      .slice()
      .sort((a, b) => b - a)
      .map(count => {
        const antesDeAdicionar = acumulado
        acumulado += count
        return {
          percentualAcumulado: Math.round((acumulado / total) * 1000) / 10,
          vitais: antesDeAdicionar < limiar80,
        }
      })
  }

  it('as primeiras categorias são identificadas como vitais (80/20)', () => {
    const resultado = simularPareto([50, 30, 10, 5, 5])
    expect(resultado[0].vitais).toBe(true)
    expect(resultado[1].vitais).toBe(true)
    expect(resultado[2].vitais).toBe(false)
  })

  it('percentual acumulado sobe monotonicamente', () => {
    const resultado = simularPareto([40, 30, 20, 10])
    for (let i = 1; i < resultado.length; i++) {
      expect(resultado[i].percentualAcumulado).toBeGreaterThan(resultado[i - 1].percentualAcumulado)
    }
  })

  it('último item sempre tem 100% acumulado', () => {
    const resultado = simularPareto([60, 40])
    expect(resultado[resultado.length - 1].percentualAcumulado).toBe(100)
  })
})

// ── ISO 9001:2015 — Matriz de risco (Cláusula 6.1.2) ─────────────────────
describe('calcularPontuacaoRisco (ISO 9001:2015 Cláusula 6.1.2)', () => {
  it('risco máximo: alta probabilidade × alto impacto = 9', () => {
    expect(calcularPontuacaoRisco('alta', 'alto')).toBe(9)
  })

  it('risco mínimo: baixa probabilidade × baixo impacto = 1', () => {
    expect(calcularPontuacaoRisco('baixa', 'baixo')).toBe(1)
  })

  it('probabilidade média × impacto médio = 4', () => {
    expect(calcularPontuacaoRisco('media', 'medio')).toBe(4)
  })

  it('alta × médio = 6', () => {
    expect(calcularPontuacaoRisco('alta', 'medio')).toBe(6)
  })

  it('baixa × alto = 3', () => {
    expect(calcularPontuacaoRisco('baixa', 'alto')).toBe(3)
  })

  it('pontuação é sempre entre 1 e 9', () => {
    const probabilidades: ProbabilidadeRisco[] = ['alta', 'media', 'baixa']
    const impactos: ImpactoRisco[] = ['alto', 'medio', 'baixo']
    for (const p of probabilidades) {
      for (const i of impactos) {
        const score = calcularPontuacaoRisco(p, i)
        expect(score).toBeGreaterThanOrEqual(1)
        expect(score).toBeLessThanOrEqual(9)
      }
    }
  })
})

// ── ISO 9001:2015 — Classificação de nível de risco ──────────────────────
describe('classificarNivelRisco (ISO 9001:2015)', () => {
  it('pontuação ≥ 7 → nível alto', () => {
    expect(classificarNivelRisco(9)).toBe('alto')
    expect(classificarNivelRisco(7)).toBe('alto')
  })

  it('pontuação 4-6 → nível médio', () => {
    expect(classificarNivelRisco(6)).toBe('medio')
    expect(classificarNivelRisco(4)).toBe('medio')
  })

  it('pontuação ≤ 3 → nível baixo', () => {
    expect(classificarNivelRisco(3)).toBe('baixo')
    expect(classificarNivelRisco(1)).toBe('baixo')
  })

  it('toda combinação probabilidade × impacto tem nível classificado', () => {
    const probabilidades: ProbabilidadeRisco[] = ['alta', 'media', 'baixa']
    const impactos: ImpactoRisco[] = ['alto', 'medio', 'baixo']
    const niveisValidos = ['alto', 'medio', 'baixo']
    for (const p of probabilidades) {
      for (const i of impactos) {
        const score = calcularPontuacaoRisco(p, i)
        const nivel = classificarNivelRisco(score)
        expect(niveisValidos).toContain(nivel)
      }
    }
  })

  it('alta × alto = 9 = nível alto (risco crítico para segurança)', () => {
    const score = calcularPontuacaoRisco('alta', 'alto')
    expect(classificarNivelRisco(score)).toBe('alto')
  })

  it('baixa × baixo = 1 = nível baixo (risco aceitável)', () => {
    const score = calcularPontuacaoRisco('baixa', 'baixo')
    expect(classificarNivelRisco(score)).toBe('baixo')
  })
})
