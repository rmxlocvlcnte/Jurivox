import { describe, expect, it } from 'vitest'

// ─── Funções de validação (espelham regras do backend) ───────────────────────

function validarCpf(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11) return false
  if (/^(\d)\1+$/.test(nums)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(nums[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(nums[10])
}

function validarNumeroCnj(cnj: string): boolean {
  // Formato: NNNNNNN-DD.AAAA.J.TT.OOOO
  return /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(cnj.trim())
}

function formatarTelefone(tel: string): string {
  const nums = tel.replace(/\D/g, '')
  if (nums.length === 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  if (nums.length === 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
  return tel
}

function mascararCpf(cpf: string): string {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11) return cpf
  return `***.***.***.${nums.slice(9)}`
}

// ─── Testes de CPF ────────────────────────────────────────────────────────────

describe('validarCpf', () => {
  it('aceita CPF válido com máscara', () => {
    // CPF de teste válido
    expect(validarCpf('529.982.247-25')).toBe(true)
  })

  it('aceita CPF válido sem máscara', () => {
    expect(validarCpf('52998224725')).toBe(true)
  })

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(validarCpf('111.111.111-11')).toBe(false)
    expect(validarCpf('000.000.000-00')).toBe(false)
    expect(validarCpf('999.999.999-99')).toBe(false)
  })

  it('rejeita CPF com comprimento errado', () => {
    expect(validarCpf('123.456.789')).toBe(false)
    expect(validarCpf('123.456.789-0')).toBe(false)
    expect(validarCpf('')).toBe(false)
  })

  it('rejeita CPF com dígitos verificadores errados', () => {
    expect(validarCpf('529.982.247-26')).toBe(false)
    expect(validarCpf('529.982.247-00')).toBe(false)
  })
})

// ─── Testes de número CNJ ─────────────────────────────────────────────────────

describe('validarNumeroCnj', () => {
  it('aceita número CNJ válido', () => {
    expect(validarNumeroCnj('0001234-12.2024.8.26.0100')).toBe(true)
    expect(validarNumeroCnj('0000001-00.2023.5.02.0001')).toBe(true)
  })

  it('rejeita CNJ sem hífens e pontos', () => {
    expect(validarNumeroCnj('0001234122024826010')).toBe(false)
  })

  it('rejeita CNJ com formato errado', () => {
    expect(validarNumeroCnj('123456-12.2024.8.26.0100')).toBe(false)  // 6 dígitos no início
    expect(validarNumeroCnj('0001234-12.2024.8.26.010')).toBe(false)   // 3 dígitos no final
    expect(validarNumeroCnj('0001234-1.2024.8.26.0100')).toBe(false)   // 1 dígito DD
  })

  it('rejeita string vazia ou parcial', () => {
    expect(validarNumeroCnj('')).toBe(false)
    expect(validarNumeroCnj('0001234')).toBe(false)
  })

  it('aceita CNJ com espaços nas bordas (após trim)', () => {
    expect(validarNumeroCnj('  0001234-12.2024.8.26.0100  ')).toBe(true)
  })
})

// ─── Testes de telefone ───────────────────────────────────────────────────────

describe('formatarTelefone', () => {
  it('formata celular com 11 dígitos', () => {
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321')
  })

  it('formata fixo com 10 dígitos', () => {
    expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444')
  })

  it('remove caracteres não numéricos antes de formatar', () => {
    expect(formatarTelefone('(11) 98765-4321')).toBe('(11) 98765-4321')
  })

  it('retorna original se comprimento desconhecido', () => {
    expect(formatarTelefone('123')).toBe('123')
  })
})

// ─── Testes de mascaramento de CPF ───────────────────────────────────────────

describe('mascararCpf', () => {
  it('mascara CPF formatado', () => {
    const result = mascararCpf('529.982.247-25')
    expect(result).toBe('***.***.***.25')
  })

  it('mascara CPF sem formatação', () => {
    const result = mascararCpf('52998224725')
    expect(result).toBe('***.***.***.25')
  })

  it('retorna original se CPF inválido', () => {
    const result = mascararCpf('abc')
    expect(result).toBe('abc')
  })
})

// ─── Testes de escopo de API key ──────────────────────────────────────────────

describe('escopos de API key', () => {
  const ESCOPOS_VALIDOS = [
    'processos:read', 'processos:write',
    'clientes:read', 'clientes:write',
    'prazos:read', 'prazos:write',
  ]

  function temEscopo(escopos: string[], escopo: string): boolean {
    return escopos.includes(escopo)
  }

  it('verifica escopo presente', () => {
    expect(temEscopo(['processos:read', 'clientes:read'], 'processos:read')).toBe(true)
  })

  it('verifica escopo ausente', () => {
    expect(temEscopo(['processos:read'], 'processos:write')).toBe(false)
  })

  it('escopo de leitura não implica escrita', () => {
    const escopos = ['processos:read', 'clientes:read']
    expect(temEscopo(escopos, 'processos:write')).toBe(false)
    expect(temEscopo(escopos, 'clientes:write')).toBe(false)
  })

  it('lista de escopos válidos está completa', () => {
    expect(ESCOPOS_VALIDOS).toHaveLength(6)
    expect(ESCOPOS_VALIDOS).toContain('prazos:write')
  })
})
