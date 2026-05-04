import { describe, it, expect } from 'vitest'
import {
  CARGOS,
  PERMISSOES_MODULO,
  exigirCargo,
  podeVer,
  podeEditar,
  exigirAcessoModulo,
  type Cargo,
  type Modulo,
} from '@/lib/permissoes'

// ── CARGOS ────────────────────────────────────────────────────────────────
describe('CARGOS', () => {
  it('contém exatamente os 4 cargos definidos', () => {
    expect(CARGOS).toContain('socio')
    expect(CARGOS).toContain('admin')
    expect(CARGOS).toContain('advogado')
    expect(CARGOS).toContain('estagiario')
    expect(CARGOS).toHaveLength(4)
  })
})

// ── exigirCargo ───────────────────────────────────────────────────────────
describe('exigirCargo', () => {
  it('retorna null quando cargo está na lista permitida', () => {
    expect(exigirCargo('socio', ['socio', 'admin'])).toBeNull()
    expect(exigirCargo('admin', ['socio', 'admin'])).toBeNull()
  })

  it('retorna erro quando cargo não está na lista', () => {
    const resultado = exigirCargo('estagiario', ['socio', 'admin'])
    expect(resultado).not.toBeNull()
    expect(resultado?.erro).toBeTruthy()
  })

  it('retorna erro para cargo null', () => {
    const resultado = exigirCargo(null, ['socio'])
    expect(resultado?.erro).toBeTruthy()
  })

  it('usa mensagem personalizada quando fornecida', () => {
    const resultado = exigirCargo('estagiario', ['socio'], 'Acesso negado.')
    expect(resultado?.erro).toBe('Acesso negado.')
  })

  it('mensagem padrão é genérica quando não especificada', () => {
    const resultado = exigirCargo('estagiario', ['socio'])
    expect(typeof resultado?.erro).toBe('string')
    expect(resultado!.erro.length).toBeGreaterThan(0)
  })
})

// ── podeVer ───────────────────────────────────────────────────────────────
describe('podeVer', () => {
  it('sócio pode ver todos os módulos', () => {
    const modulos = Object.keys(PERMISSOES_MODULO) as Modulo[]
    for (const modulo of modulos) {
      expect(podeVer('socio', modulo)).toBe(true)
    }
  })

  it('admin pode ver todos os módulos', () => {
    const modulos = Object.keys(PERMISSOES_MODULO) as Modulo[]
    for (const modulo of modulos) {
      expect(podeVer('admin', modulo)).toBe(true)
    }
  })

  it('estagiário não pode ver financeiro', () => {
    expect(podeVer('estagiario', 'financeiro')).toBe(false)
  })

  it('estagiário não pode ver honorários', () => {
    expect(podeVer('estagiario', 'honorarios')).toBe(false)
  })

  it('estagiário pode ver processos', () => {
    expect(podeVer('estagiario', 'processos')).toBe(true)
  })

  it('estagiário pode ver clientes', () => {
    expect(podeVer('estagiario', 'clientes')).toBe(true)
  })

  it('estagiário pode ver prazos', () => {
    expect(podeVer('estagiario', 'prazos')).toBe(true)
  })

  it('cargo null retorna false para qualquer módulo', () => {
    const modulos = Object.keys(PERMISSOES_MODULO) as Modulo[]
    for (const modulo of modulos) {
      expect(podeVer(null, modulo)).toBe(false)
    }
  })

  it('cargo inválido retorna false', () => {
    expect(podeVer('invalido', 'processos')).toBe(false)
  })
})

// ── podeEditar ────────────────────────────────────────────────────────────
describe('podeEditar', () => {
  it('estagiário não pode editar financeiro', () => {
    expect(podeEditar('estagiario', 'financeiro')).toBe(false)
  })

  it('advogado pode editar processos', () => {
    expect(podeEditar('advogado', 'processos')).toBe(true)
  })

  it('estagiário pode editar timesheet (próprio)', () => {
    expect(podeEditar('estagiario', 'timesheet')).toBe(true)
  })

  it('ninguém pode editar analytics (módulo read-only)', () => {
    for (const cargo of CARGOS) {
      expect(podeEditar(cargo as Cargo, 'analytics')).toBe(false)
    }
  })

  it('apenas sócio pode editar configurações', () => {
    expect(podeEditar('socio', 'configuracoes')).toBe(true)
    expect(podeEditar('admin', 'configuracoes')).toBe(false)
    expect(podeEditar('advogado', 'configuracoes')).toBe(false)
    expect(podeEditar('estagiario', 'configuracoes')).toBe(false)
  })

  it('cargo null retorna false para qualquer módulo', () => {
    const modulos = Object.keys(PERMISSOES_MODULO) as Modulo[]
    for (const modulo of modulos) {
      expect(podeEditar(null, modulo)).toBe(false)
    }
  })

  it('sócio pode editar todos os módulos que permitem edição', () => {
    const modulos = Object.keys(PERMISSOES_MODULO) as Modulo[]
    for (const mod of modulos) {
      if (PERMISSOES_MODULO[mod].editar.length > 0) {
        expect(podeEditar('socio', mod)).toBe(true)
      }
    }
  })
})

// ── exigirAcessoModulo ────────────────────────────────────────────────────
describe('exigirAcessoModulo', () => {
  it('retorna null quando tem acesso de edição', () => {
    expect(exigirAcessoModulo('socio', 'processos', 'editar')).toBeNull()
    expect(exigirAcessoModulo('advogado', 'processos', 'editar')).toBeNull()
  })

  it('retorna erro quando não tem acesso de edição', () => {
    const resultado = exigirAcessoModulo('estagiario', 'financeiro', 'editar')
    expect(resultado?.erro).toBeTruthy()
  })

  it('operação padrão é editar', () => {
    const resultado = exigirAcessoModulo('estagiario', 'financeiro')
    expect(resultado?.erro).toBeTruthy()
  })

  it('verifica acesso de leitura corretamente', () => {
    expect(exigirAcessoModulo('estagiario', 'processos', 'ver')).toBeNull()
    expect(exigirAcessoModulo('estagiario', 'financeiro', 'ver')).not.toBeNull()
  })
})

// ── Invariantes de segurança (SQA — Administração da segurança) ───────────
describe('Invariantes de segurança da matriz de permissões', () => {
  it('estagiário não acessa módulos financeiros nem de gestão', () => {
    const modulosRestritos: Modulo[] = ['financeiro', 'honorarios', 'relatorios', 'backup', 'seguranca', 'equipe', 'configuracoes']
    for (const mod of modulosRestritos) {
      expect(podeVer('estagiario', mod)).toBe(false)
      expect(podeEditar('estagiario', mod)).toBe(false)
    }
  })

  it('hierarquia: sócio ≥ admin ≥ advogado (todos os módulos operacionais)', () => {
    const modulosOp: Modulo[] = ['processos', 'clientes', 'prazos', 'agenda']
    for (const mod of modulosOp) {
      if (podeVer('advogado', mod)) {
        expect(podeVer('admin', mod)).toBe(true)
        expect(podeVer('socio', mod)).toBe(true)
      }
    }
  })

  it('IA não está disponível para estagiários', () => {
    expect(podeVer('estagiario', 'ia')).toBe(false)
    expect(podeEditar('estagiario', 'ia')).toBe(false)
  })

  it('módulo backup restrito a sócio e admin', () => {
    expect(podeVer('socio', 'backup')).toBe(true)
    expect(podeVer('admin', 'backup')).toBe(true)
    expect(podeVer('advogado', 'backup')).toBe(false)
    expect(podeVer('estagiario', 'backup')).toBe(false)
  })
})
