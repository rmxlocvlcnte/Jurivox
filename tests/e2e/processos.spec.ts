import { test, expect } from '@playwright/test'
import { loginComClerk, aguardarCarregamento } from './helpers/setup'

/**
 * Testes de Processos — requerem usuário autenticado.
 * Configure TEST_EMAIL e TEST_PASSWORD no ambiente de CI.
 */
test.describe('Processos (autenticado)', () => {
  test.skip(!process.env.TEST_EMAIL, 'Variável TEST_EMAIL não definida — pulando testes de integração.')

  test.beforeEach(async ({ page }) => {
    await loginComClerk(page)
    await page.goto('/processos')
    await aguardarCarregamento(page)
  })

  test('página de processos carrega sem erro', async ({ page }) => {
    await expect(page).toHaveURL(/processos/)
    await expect(page.getByRole('heading', { name: /Processos/i })).toBeVisible()
  })

  test('botão Novo Processo está visível', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Novo Processo|Novo processo/i })).toBeVisible()
  })

  test('formulário de novo processo carrega', async ({ page }) => {
    await page.goto('/processos/novo')
    await aguardarCarregamento(page)
    await expect(page.locator('input[name="numero_cnj"]')).toBeVisible()
    await expect(page.locator('input[name="tribunal"]')).toBeVisible()
    await expect(page.locator('select[name="area_juridica"]')).toBeVisible()
  })

  test('validação: CNJ obrigatório', async ({ page }) => {
    await page.goto('/processos/novo')
    await page.locator('input[name="tribunal"]').fill('TJSP')
    await page.selectOption('select[name="area_juridica"]', 'civil')
    // Tenta submeter sem CNJ
    await page.getByRole('button', { name: /Salvar|Criar/i }).click()
    await expect(page.getByText(/CNJ|cnj|obrigatório/i)).toBeVisible({ timeout: 5000 })
  })

  test('cria processo e redireciona para detalhes', async ({ page }) => {
    await page.goto('/processos/novo')
    await aguardarCarregamento(page)

    await page.fill('input[name="numero_cnj"]', `${Date.now()}-12.2024.8.26.0100`)
    await page.fill('input[name="tribunal"]', 'TJSP-TEST')
    await page.selectOption('select[name="area_juridica"]', 'civil')

    await page.getByRole('button', { name: /Salvar|Criar/i }).click()
    await expect(page).toHaveURL(/\/processos\/[0-9a-f-]{36}$/, { timeout: 15000 })
  })
})

test.describe('Processos — sem autenticação', () => {
  test('GET /processos redireciona para sign-in', async ({ page }) => {
    await page.goto('/processos')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })
})
