import { describe, it, expect } from 'vitest'

// Teste simples do endpoint de health — verifica que o módulo de rate-limit
// funciona corretamente em memória (sem dependência de banco)
import { rateLimit } from '@/lib/rate-limit'

describe('rate-limit', () => {
  it('permite requests dentro do limite', () => {
    const chave = `test:${Date.now()}`
    const resultado = rateLimit(chave, { windowMs: 60_000, maxRequests: 5 })
    expect(resultado.allowed).toBe(true)
    expect(resultado.remaining).toBe(4)
  })

  it('bloqueia apos exceder limite', () => {
    const chave = `test2:${Date.now()}`
    const opts = { windowMs: 60_000, maxRequests: 2 }
    rateLimit(chave, opts)
    rateLimit(chave, opts)
    const terceiro = rateLimit(chave, opts)
    expect(terceiro.allowed).toBe(false)
    expect(terceiro.remaining).toBe(0)
  })

  it('chaves diferentes sao independentes', () => {
    const opts = { windowMs: 60_000, maxRequests: 1 }
    const r1 = rateLimit(`key-a:${Date.now()}`, opts)
    const r2 = rateLimit(`key-b:${Date.now()}`, opts)
    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
  })
})
