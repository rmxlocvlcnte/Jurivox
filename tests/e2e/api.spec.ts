import { test, expect } from '@playwright/test'

/**
 * Testes de API — verificam segurança e comportamento dos endpoints públicos.
 * Não requerem autenticação, testam respostas sem sessão.
 */
test.describe('APIs — sem autenticação', () => {
  test('GET /api/health responde 200', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('status')
  })

  test('POST /api/chat retorna 401 sem auth', async ({ request }) => {
    const res = await request.post('/api/chat', {
      data: { messages: [{ role: 'user', content: 'teste' }] },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('GET /api/backup retorna 401 sem auth', async ({ request }) => {
    const res = await request.get('/api/backup')
    expect([401, 403]).toContain(res.status())
  })

  test('POST /api/backup/importar retorna 401 sem auth', async ({ request }) => {
    const res = await request.post('/api/backup/importar', { data: {} })
    expect([401, 403]).toContain(res.status())
  })

  test('GET /api/stripe/portal retorna 401 sem auth', async ({ request }) => {
    const res = await request.get('/api/stripe/portal')
    expect([401, 403, 404, 405]).toContain(res.status())
  })

  test('POST /api/push/send retorna 401 sem cron secret', async ({ request }) => {
    const res = await request.post('/api/push/send', {
      data: { membroIds: [], titulo: 'test', corpo: 'test' },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('GET /api/monitoramento/sync retorna 401 sem auth', async ({ request }) => {
    const res = await request.get('/api/monitoramento/sync')
    expect([401, 403, 405]).toContain(res.status())
  })
})

test.describe('APIs — rotas públicas', () => {
  test('GET /api/assinaturas/public — token inválido retorna 404', async ({ request }) => {
    const res = await request.get('/api/assinaturas/public/token-invalido-xyz')
    expect([400, 404]).toContain(res.status())
  })
})
