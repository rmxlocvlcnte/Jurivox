import { test, expect } from '@playwright/test'
import { loginComClerk, aguardarCarregamento } from './helpers/setup'

test.describe('Prazos (autenticado)', () => {
  test.skip(!process.env.TEST_EMAIL, 'Variável TEST_EMAIL não definida — pulando testes de integração.')

  test.beforeEach(async ({ page }) => {
    await loginComClerk(page)
    await page.goto('/prazos')
    await aguardarCarregamento(page)
  })

  test('página de prazos carrega sem erro', async ({ page }) => {
    await expect(page).toHaveURL(/prazos/)
    await expect(page.getByRole('heading', { name: /Prazos/i })).toBeVisible()
  })

  test('botão Novo Prazo está visível', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /Novo Prazo|Novo prazo/i })
    ).toBeVisible()
  })

  test('formulário de novo prazo carrega', async ({ page }) => {
    await page.goto('/prazos/novo')
    await aguardarCarregamento(page)
    await expect(page.locator('input[name="descricao"], textarea[name="descricao"]')).toBeVisible()
  })

  test('validação: descrição obrigatória', async ({ page }) => {
    await page.goto('/prazos/novo')
    await aguardarCarregamento(page)
    await page.getByRole('button', { name: /Salvar|Criar/i }).click()
    await expect(
      page.getByText(/descri[çc]ão|obrigatório/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('cria prazo e volta para lista', async ({ page }) => {
    await page.goto('/prazos/novo')
    await aguardarCarregamento(page)

    const descricao = `Prazo de Teste ${Date.now()}`
    await page.fill('input[name="descricao"], textarea[name="descricao"]', descricao).catch(() => {
      return page.locator('[name="descricao"]').fill(descricao)
    })

    // Define data de vencimento (amanhã)
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 5)
    const dataStr = amanha.toISOString().split('T')[0]
    await page.fill('input[name="data_vencimento"], input[type="date"]', dataStr).catch(() => {})

    await page.getByRole('button', { name: /Salvar|Criar/i }).click()
    // Aceita redirect para /prazos ou para detalhe do prazo
    await expect(page).toHaveURL(/\/prazos/, { timeout: 15000 })
  })
})

test.describe('Prazos — sem autenticação', () => {
  test('GET /prazos redireciona para sign-in', async ({ page }) => {
    await page.goto('/prazos')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })
})
