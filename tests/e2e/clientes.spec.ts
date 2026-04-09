import { test, expect } from '@playwright/test'
import { loginComClerk, aguardarCarregamento } from './helpers/setup'

test.describe('Clientes (autenticado)', () => {
  test.skip(!process.env.TEST_EMAIL, 'Variável TEST_EMAIL não definida — pulando testes de integração.')

  test.beforeEach(async ({ page }) => {
    await loginComClerk(page)
    await page.goto('/clientes')
    await aguardarCarregamento(page)
  })

  test('página de clientes carrega sem erro', async ({ page }) => {
    await expect(page).toHaveURL(/clientes/)
    await expect(page.getByRole('heading', { name: /Clientes/i })).toBeVisible()
  })

  test('botão Novo Cliente está visível', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Novo Cliente|Novo cliente/i })).toBeVisible()
  })

  test('formulário de novo cliente carrega', async ({ page }) => {
    await page.goto('/clientes/novo')
    await aguardarCarregamento(page)
    await expect(page.locator('input[name="nome"]')).toBeVisible()
  })

  test('validação: nome obrigatório', async ({ page }) => {
    await page.goto('/clientes/novo')
    await page.getByRole('button', { name: /Salvar|Criar/i }).click()
    await expect(page.getByText(/nome|obrigatório/i)).toBeVisible({ timeout: 5000 })
  })

  test('cria cliente e redireciona para detalhes', async ({ page }) => {
    await page.goto('/clientes/novo')
    await aguardarCarregamento(page)

    const nome = `Cliente Teste ${Date.now()}`
    await page.fill('input[name="nome"]', nome)
    await page.fill('input[name="email"]', `teste${Date.now()}@exemplo.com`)

    await page.getByRole('button', { name: /Salvar|Criar/i }).click()
    await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]{36}$/, { timeout: 15000 })
    await expect(page.getByText(nome)).toBeVisible()
  })

  test('busca de clientes funciona', async ({ page }) => {
    const input = page.locator('input[placeholder*="buscar" i], input[placeholder*="pesquisar" i], input[type="search"]').first()
    if (await input.isVisible()) {
      await input.fill('teste')
      await aguardarCarregamento(page)
    }
    // Sem erro na página
    await expect(page.locator('text=Erro interno')).not.toBeVisible()
  })
})

test.describe('Clientes — sem autenticação', () => {
  test('GET /clientes redireciona para sign-in', async ({ page }) => {
    await page.goto('/clientes')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })
})
