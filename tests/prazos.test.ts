import { describe, expect, it } from 'vitest'
import { calcularDataVencimento, calcularDataVencimentoComFeriados, extrairPrazoDaDescricao } from '@/lib/utils/prazos'

describe('prazos utils', () => {
  it('calcula vencimento em dias corridos', () => {
    const vencimento = calcularDataVencimento('2026-04-01', 5, false)
    expect(vencimento).toBe('2026-04-06')
  })

  it('calcula vencimento em dias uteis (sem feriados)', () => {
    // 2026-04-03 e sexta-feira. +2 dias uteis -> 2026-04-07 (terca).
    const vencimento = calcularDataVencimento('2026-04-03', 2, true)
    expect(vencimento).toBe('2026-04-07')
  })

  it('pula feriado nacional no calculo de dias uteis', () => {
    // 2026-04-19 e domingo. 2026-04-20 e segunda (dia útil 1). 2026-04-21 e Tiradentes (feriado, pula).
    // 2026-04-22 e quarta (dia útil 2) -> resultado correto
    const feriados = new Set(['2026-04-21']) // Tiradentes
    const vencimento = calcularDataVencimentoComFeriados('2026-04-19', 2, true, feriados)
    expect(vencimento).toBe('2026-04-22')
  })

  it('nao pula feriado em dias corridos', () => {
    // Dias corridos ignora feriados — apenas conta dias
    const feriados = new Set(['2026-04-21'])
    const vencimento = calcularDataVencimentoComFeriados('2026-04-19', 2, false, feriados)
    expect(vencimento).toBe('2026-04-21')
  })

  it('pula multiplos feriados consecutivos', () => {
    // Carnaval 2026: 16 (segunda) e 17 (terca) de fevereiro
    // A partir de 2026-02-14 (sabado), +3 dias uteis
    // Pula: 14(sab), 15(dom), 16(feriado), 17(feriado) -> conta: 18(qua)=1, 19(qui)=2, 20(sex)=3
    const feriados = new Set(['2026-02-16', '2026-02-17'])
    const vencimento = calcularDataVencimentoComFeriados('2026-02-14', 3, true, feriados)
    expect(vencimento).toBe('2026-02-20')
  })

  it('extrai prazo simples da descricao', () => {
    const extraido = extrairPrazoDaDescricao('Intimacao com prazo de 15 dias uteis para manifestacao.')
    expect(extraido).toEqual({ quantidadeDias: 15, diasUteis: true })
  })

  it('retorna null quando nao ha prazo na descricao', () => {
    const extraido = extrairPrazoDaDescricao('Juntada de peticao e conclusao para despacho.')
    expect(extraido).toBeNull()
  })

  it('extrai prazo em dias corridos', () => {
    const extraido = extrairPrazoDaDescricao('Prazo de 30 dias para cumprimento da decisao.')
    expect(extraido).toEqual({ quantidadeDias: 30, diasUteis: false })
  })
})
