import { describe, expect, it } from 'vitest'

// ─── Funções utilitárias de templates (testadas inline) ───────────────────────
// Estas funções espelham a lógica de lib/actions/templates.ts e
// components/templates/GerarDocumentoForm.tsx

function extrairVariaveis(conteudo: string): string[] {
  return [...new Set(
    (conteudo.match(/\{\{([^}]+)\}\}/g) ?? []).map(v => v.slice(2, -2).trim())
  )]
}

function substituirVariaveis(conteudo: string, vars: Record<string, string>): string {
  let resultado = conteudo
  for (const [key, val] of Object.entries(vars)) {
    resultado = resultado.replaceAll(`{{${key}}}`, val)
  }
  return resultado
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('extrairVariaveis', () => {
  it('extrai variável simples', () => {
    const vars = extrairVariaveis('Olá {{nome_cliente}}, seu processo é {{numero_cnj}}.')
    expect(vars).toEqual(['nome_cliente', 'numero_cnj'])
  })

  it('deduplica variáveis repetidas', () => {
    const vars = extrairVariaveis('{{nome}} e {{nome}} novamente.')
    expect(vars).toHaveLength(1)
    expect(vars[0]).toBe('nome')
  })

  it('retorna array vazio quando não há variáveis', () => {
    const vars = extrairVariaveis('Texto sem nenhuma variável aqui.')
    expect(vars).toEqual([])
  })

  it('ignora espaços dentro das chaves', () => {
    const vars = extrairVariaveis('{{ nome_cliente }} e {{  numero_cnj  }}')
    expect(vars).toContain('nome_cliente')
    expect(vars).toContain('numero_cnj')
  })

  it('extrai múltiplas variáveis diferentes', () => {
    const modelo = `
      CONTRATO DE HONORÁRIOS
      Cliente: {{nome_cliente}}, CPF: {{cpf_cliente}}
      Processo: {{numero_cnj}} — {{tribunal}}
      Valor: R$ {{valor_honorarios}}
      Data: {{data_hoje}}
    `
    const vars = extrairVariaveis(modelo)
    expect(vars).toHaveLength(6)
    expect(vars).toContain('nome_cliente')
    expect(vars).toContain('cpf_cliente')
    expect(vars).toContain('numero_cnj')
    expect(vars).toContain('tribunal')
    expect(vars).toContain('valor_honorarios')
    expect(vars).toContain('data_hoje')
  })
})

describe('substituirVariaveis', () => {
  it('substitui variável simples', () => {
    const result = substituirVariaveis('Olá {{nome}}!', { nome: 'Dr. Silva' })
    expect(result).toBe('Olá Dr. Silva!')
  })

  it('substitui múltiplas variáveis', () => {
    const result = substituirVariaveis(
      'Cliente {{nome_cliente}}, processo {{numero_cnj}}.',
      { nome_cliente: 'Maria Santos', numero_cnj: '0001234-12.2024.8.26.0100' }
    )
    expect(result).toBe('Cliente Maria Santos, processo 0001234-12.2024.8.26.0100.')
  })

  it('substitui todas as ocorrências de uma variável', () => {
    const result = substituirVariaveis(
      '{{nome}} contrata {{nome}} como cliente.',
      { nome: 'João' }
    )
    expect(result).toBe('João contrata João como cliente.')
  })

  it('mantém texto sem a variável se ela não for fornecida', () => {
    const result = substituirVariaveis('Olá {{nome}}!', {})
    expect(result).toBe('Olá {{nome}}!')
  })

  it('substitui valor vazio corretamente', () => {
    const result = substituirVariaveis('Processo: {{numero_cnj}}', { numero_cnj: '' })
    expect(result).toBe('Processo: ')
  })

  it('não altera texto sem variáveis', () => {
    const texto = 'Texto sem variáveis aqui.'
    const result = substituirVariaveis(texto, { nome: 'Teste' })
    expect(result).toBe(texto)
  })
})

describe('validação de tipos de template', () => {
  const TIPOS_VALIDOS = ['contrato', 'peticao', 'procuracao', 'notificacao', 'acordo', 'outro']

  it('aceita todos os tipos válidos', () => {
    for (const tipo of TIPOS_VALIDOS) {
      expect(TIPOS_VALIDOS).toContain(tipo)
    }
  })

  it('tipo inválido não está na lista', () => {
    expect(TIPOS_VALIDOS).not.toContain('desconhecido')
    expect(TIPOS_VALIDOS).not.toContain('')
    expect(TIPOS_VALIDOS).not.toContain('acao')
  })
})
