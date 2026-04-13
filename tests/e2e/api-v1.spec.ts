import { test, expect } from '@playwright/test'

/**
 * Testes da API pública v1 — verificam segurança e comportamento dos endpoints.
 * Não requerem autenticação de usuário; testam a camada de API key.
 */
test.describe('API v1 — sem autenticação', () => {
  test('GET /api/v1/processos retorna 401 sem chave', async ({ request }) => {
    const res = await request.get('/api/v1/processos')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('erro')
  })

  test('GET /api/v1/clientes retorna 401 sem chave', async ({ request }) => {
    const res = await request.get('/api/v1/clientes')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('erro')
  })

  test('GET /api/v1/prazos retorna 401 sem chave', async ({ request }) => {
    const res = await request.get('/api/v1/prazos')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('erro')
  })

  test('GET /api/v1/processos retorna 401 com chave malformada', async ({ request }) => {
    const res = await request.get('/api/v1/processos', {
      headers: { Authorization: 'Bearer chave-invalida-123' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/v1/processos retorna 401 com Authorization vazio', async ({ request }) => {
    const res = await request.get('/api/v1/processos', {
      headers: { Authorization: '' },
    })
    expect(res.status()).toBe(401)
  })

  test('resposta de erro contém campo "erro"', async ({ request }) => {
    const res = await request.get('/api/v1/processos')
    const body = await res.json()
    expect(typeof body.erro).toBe('string')
    expect(body.erro.length).toBeGreaterThan(0)
  })
})

test.describe('API v1 — estrutura da resposta (com chave válida)', () => {
  // Estes testes só rodam se a variável API_TEST_KEY estiver configurada
  test.skip(!process.env.API_TEST_KEY, 'Variável API_TEST_KEY não definida.')

  test('GET /api/v1/processos retorna estrutura correta', async ({ request }) => {
    const res = await request.get('/api/v1/processos', {
      headers: { Authorization: `Bearer ${process.env.API_TEST_KEY}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
    expect(body.meta).toHaveProperty('total')
    expect(body.meta).toHaveProperty('page')
    expect(body.meta).toHaveProperty('limit')
    expect(body.meta).toHaveProperty('pages')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/v1/processos respeita paginação', async ({ request }) => {
    const res = await request.get('/api/v1/processos?page=1&limit=5', {
      headers: { Authorization: `Bearer ${process.env.API_TEST_KEY}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.meta.page).toBe(1)
    expect(body.meta.limit).toBe(5)
    expect(body.data.length).toBeLessThanOrEqual(5)
  })

  test('GET /api/v1/clientes mascara CPF', async ({ request }) => {
    const res = await request.get('/api/v1/clientes?limit=10', {
      headers: { Authorization: `Bearer ${process.env.API_TEST_KEY}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    for (const cliente of body.data) {
      if (cliente.cpf) {
        // CPF deve estar mascarado — não pode começar com dígito real
        expect(cliente.cpf).toMatch(/\*/)
      }
    }
  })
})
