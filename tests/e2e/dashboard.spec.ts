import { test, expect } from '@playwright/test'
import { loginComClerk, aguardarCarregamento } from './helpers/setup'

test.describe('Dashboard (autenticado)', () => {
  test.skip(!process.env.TEST_EMAIL, 'Variável TEST_EMAIL não definida — pulando testes de integração.')

  test.beforeEach(async ({ page }) => {
    await loginComClerk(page)
    await page.goto('/dashboard')
    await aguardarCarregamento(page)
  })

  test('dashboard carrega sem erro', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/)
    // Deve ter pelo menos um KPI visível
    await expect(page.locator('[class*="rounded-xl"]').first()).toBeVisible()
  })

  test('sidebar contém links de navegação', async ({ page }) => {
    await expect(page.getByRole('link', { name: /processos/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /clientes/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /prazos/i }).first()).toBeVisible()
  })

  test('não há erros de crash na página', async ({ page }) => {
    await expect(page.getByText(/Algo deu errado|Something went wrong/i)).not.toBeVisible()
    await expect(page.getByText(/Erro interno/i)).not.toBeVisible()
  })
})

test.describe('Dashboard — sem autenticação', () => {
  test('GET /dashboard redireciona para sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })
})
