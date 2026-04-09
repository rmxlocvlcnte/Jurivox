import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('página de login carrega corretamente', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveURL(/sign-in/)
    // Clerk renderiza um formulário com campo de e-mail
    await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 15000 })
  })

  test('página de cadastro carrega corretamente', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page).toHaveURL(/sign-up/)
    await page.waitForSelector('form', { timeout: 15000 })
  })

  test('rota protegida redireciona para sign-in sem sessão', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })

  test('rota /processos redireciona sem autenticação', async ({ page }) => {
    await page.goto('/processos')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })

  test('rota /clientes redireciona sem autenticação', async ({ page }) => {
    await page.goto('/clientes')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })

  test('rota /financeiro redireciona sem autenticação', async ({ page }) => {
    await page.goto('/financeiro')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })

  test('rota /equipe redireciona sem autenticação', async ({ page }) => {
    await page.goto('/equipe')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })

  test('rota /ia redireciona sem autenticação', async ({ page }) => {
    await page.goto('/ia')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })

  test('API /api/backup retorna 401 sem autenticação', async ({ request }) => {
    const res = await request.get('/api/backup')
    expect([401, 403]).toContain(res.status())
  })

  test('API /api/chat retorna 401 sem autenticação', async ({ request }) => {
    const res = await request.post('/api/chat', { data: { mensagem: 'teste' } })
    expect([401, 403]).toContain(res.status())
  })

  test('health check responde 200', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
  })
})
