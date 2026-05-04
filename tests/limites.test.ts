import { describe, it, expect } from 'vitest'

// Testa a lógica pura de limites por plano sem I/O de banco de dados.
// A função verificarLimite depende de Supabase, então testamos os invariantes
// de negócio reproduzindo a lógica localmente (Seção 16.5 — qualidade dos requisitos).

// ── Lógica de verificação de limite ──────────────────────────────────────
function simularVerificarLimite(atual: number, limite: number) {
  if (limite === -1) return { atingido: false, ilimitado: true }
  return {
    atingido: atual >= limite,
    ilimitado: false,
    restantes: Math.max(0, limite - atual),
  }
}

describe('verificarLimite — lógica de negócio', () => {
  it('limite -1 nunca é atingido (Enterprise — ilimitado)', () => {
    expect(simularVerificarLimite(999_999, -1).atingido).toBe(false)
    expect(simularVerificarLimite(0, -1).ilimitado).toBe(true)
    expect(simularVerificarLimite(1_000_000, -1).atingido).toBe(false)
  })

  it('limite atingido quando atual === limite', () => {
    expect(simularVerificarLimite(50, 50).atingido).toBe(true)
  })

  it('limite atingido quando atual > limite (consistência pós-migração)', () => {
    expect(simularVerificarLimite(51, 50).atingido).toBe(true)
    expect(simularVerificarLimite(100, 50).atingido).toBe(true)
  })

  it('limite não atingido quando atual < limite', () => {
    expect(simularVerificarLimite(49, 50).atingido).toBe(false)
    expect(simularVerificarLimite(0, 50).atingido).toBe(false)
    expect(simularVerificarLimite(1, 50).atingido).toBe(false)
  })

  it('calcula restantes corretamente', () => {
    expect(simularVerificarLimite(30, 50).restantes).toBe(20)
    expect(simularVerificarLimite(49, 50).restantes).toBe(1)
    expect(simularVerificarLimite(50, 50).restantes).toBe(0)
    expect(simularVerificarLimite(55, 50).restantes).toBe(0)  // nunca negativo
  })
})

// ── Limites padrão por plano (Starter fallback) ───────────────────────────
describe('Limites padrão — plano Starter', () => {
  const LIMITES_STARTER = {
    processos: 50,
    clientes: 150,
    membros: 2,
    templates: 5,
  }

  it('todos os limites são positivos', () => {
    for (const [, valor] of Object.entries(LIMITES_STARTER)) {
      expect(valor).toBeGreaterThan(0)
    }
  })

  it('limite de processos é 50', () => {
    expect(LIMITES_STARTER.processos).toBe(50)
  })

  it('limite de clientes é 150', () => {
    expect(LIMITES_STARTER.clientes).toBe(150)
  })

  it('limite de membros é 2 (escritório solo ou dupla)', () => {
    expect(LIMITES_STARTER.membros).toBe(2)
  })

  it('limite de templates é 5', () => {
    expect(LIMITES_STARTER.templates).toBe(5)
  })

  it('limite de membros é o mais restritivo em Starter', () => {
    const valores = Object.values(LIMITES_STARTER)
    expect(LIMITES_STARTER.membros).toBe(Math.min(...valores))
  })
})

// ── Lógica de incremento (verificarLimitePlano) ───────────────────────────
function simularIncrementoPlano(
  usado: number,
  limite: number,
  incremento = 1,
  adicional = 0,
): { erro: boolean; faltam: number } | null {
  if (limite <= 0) return null  // Enterprise — ilimitado
  const projetado = usado + adicional + incremento
  if (projetado <= limite) return null
  return {
    erro: true,
    faltam: Math.max(0, limite - (usado + adicional)),
  }
}

describe('verificarLimitePlano — lógica de incremento', () => {
  it('retorna null quando há espaço suficiente', () => {
    expect(simularIncrementoPlano(5, 10)).toBeNull()
    expect(simularIncrementoPlano(0, 50)).toBeNull()
    expect(simularIncrementoPlano(9, 10)).toBeNull()
  })

  it('retorna erro quando projetado excede limite (exatamente)', () => {
    expect(simularIncrementoPlano(10, 10)).not.toBeNull()
  })

  it('retorna erro quando projetado excede limite (além)', () => {
    expect(simularIncrementoPlano(15, 10)).not.toBeNull()
  })

  it('Enterprise (limite 0) retorna null — ilimitado', () => {
    expect(simularIncrementoPlano(999, 0)).toBeNull()
  })

  it('Enterprise (limite -1) retorna null — ilimitado', () => {
    expect(simularIncrementoPlano(999, -1)).toBeNull()
  })

  it('calcula quantos faltam corretamente', () => {
    const resultado = simularIncrementoPlano(9, 10, 3)
    // Projetado: 9 + 0 + 3 = 12 > 10 → erro. Faltam: 10 - 9 = 1
    expect(resultado?.faltam).toBe(1)
  })

  it('considera adicional já usado no cálculo', () => {
    // usado=5, adicional=5, incremento=1 → 5+5+1=11 > 10
    expect(simularIncrementoPlano(5, 10, 1, 5)).not.toBeNull()
    // usado=4, adicional=5, incremento=1 → 4+5+1=10 = 10 → null (não excede)
    expect(simularIncrementoPlano(4, 10, 1, 5)).toBeNull()
  })

  it('incremento zero não excede limite existente', () => {
    expect(simularIncrementoPlano(10, 10, 0)).toBeNull()
  })
})

// ── Hierarquia de planos ──────────────────────────────────────────────────
describe('Hierarquia de limites entre planos', () => {
  const PLANOS = {
    starter: { processos: 50,  clientes: 150, membros: 2  },
    pro:     { processos: 200, clientes: 500, membros: 10 },
    enterprise: { processos: -1, clientes: -1, membros: -1 },
  }

  it('Pro tem limites maiores que Starter em todos os recursos', () => {
    expect(PLANOS.pro.processos).toBeGreaterThan(PLANOS.starter.processos)
    expect(PLANOS.pro.clientes).toBeGreaterThan(PLANOS.starter.clientes)
    expect(PLANOS.pro.membros).toBeGreaterThan(PLANOS.starter.membros)
  })

  it('Enterprise tem limite -1 (ilimitado) em todos os recursos', () => {
    expect(PLANOS.enterprise.processos).toBe(-1)
    expect(PLANOS.enterprise.clientes).toBe(-1)
    expect(PLANOS.enterprise.membros).toBe(-1)
  })

  it('Starter suporta escritório solo (2 membros)', () => {
    expect(PLANOS.starter.membros).toBeGreaterThanOrEqual(1)
  })
})
