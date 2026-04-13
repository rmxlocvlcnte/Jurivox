import { test, expect } from '@playwright/test'
import { loginComClerk, aguardarCarregamento } from './helpers/setup'

/**
 * Testes de Templates e Documentos Gerados — requerem usuário autenticado.
 * Configure TEST_EMAIL e TEST_PASSWORD no ambiente de CI.
 */
test.describe('Templates (autenticado)', () => {
  test.skip(!process.env.TEST_EMAIL, 'Variável TEST_EMAIL não definida — pulando testes de integração.')

  test.beforeEach(async ({ page }) => {
    await loginComClerk(page)
    await page.goto('/templates')
    await aguardarCarregamento(page)
  })

  test('página de templates carrega sem erro', async ({ page }) => {
    await expect(page).toHaveURL(/templates/)
    await expect(page.getByRole('heading', { name: /Templates/i })).toBeVisible()
  })

  test('botão Novo Template está visível', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Novo Template|Novo template/i })).toBeVisible()
  })

  test('formulário de novo template carrega', async ({ page }) => {
    await page.goto('/templates/novo')
    await aguardarCarregamento(page)
    await expect(page.locator('input[name="nome"]')).toBeVisible()
    await expect(page.locator('select[name="tipo"]')).toBeVisible()
    await expect(page.locator('textarea[name="conteudo"]')).toBeVisible()
  })

  test('validação: nome obrigatório', async ({ page }) => {
    await page.goto('/templates/novo')
    await page.locator('textarea[name="conteudo"]').fill('Conteúdo do template')
    await page.getByRole('button', { name: /Criar Template/i }).click()
    // O campo obrigatório deve impedir a submissão
    const nome = page.locator('input[name="nome"]')
    await expect(nome).toHaveAttribute('required')
  })

  test('cria template e redireciona para detalhe', async ({ page }) => {
    await page.goto('/templates/novo')
    await aguardarCarregamento(page)

    const nomeUnico = `Template Teste ${Date.now()}`
    await page.fill('input[name="nome"]', nomeUnico)
    await page.selectOption('select[name="tipo"]', 'contrato')
    await page.fill('textarea[name="conteudo"]', 'Contrato entre {{nome_cliente}} e o escritório.')

    await page.getByRole('button', { name: /Criar Template/i }).click()
    await expect(page).toHaveURL(/\/templates\/[0-9a-f-]{36}$/, { timeout: 15000 })
    await expect(page.getByText(nomeUnico)).toBeVisible()
  })
})

test.describe('Documentos Gerados (autenticado)', () => {
  test.skip(!process.env.TEST_EMAIL, 'Variável TEST_EMAIL não definida — pulando testes de integração.')

  test.beforeEach(async ({ page }) => {
    await loginComClerk(page)
  })

  test('página de documentos gerados carrega sem erro', async ({ page }) => {
    await page.goto('/documentos')
    await aguardarCarregamento(page)
    await expect(page).toHaveURL(/documentos/)
    await expect(page.getByRole('heading', { name: /Documentos Gerados/i })).toBeVisible()
  })

  test('link "Gerar Documento" aponta para /templates', async ({ page }) => {
    await page.goto('/documentos')
    await aguardarCarregamento(page)
    const link = page.getByRole('link', { name: /Gerar Documento|Gerar documento/i }).first()
    await expect(link).toHaveAttribute('href', '/templates')
  })
})

test.describe('Templates — sem autenticação', () => {
  test('GET /templates redireciona para sign-in', async ({ page }) => {
    await page.goto('/templates')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })

  test('GET /documentos redireciona para sign-in', async ({ page }) => {
    await page.goto('/documentos')
    await expect(page).toHaveURL(/sign-in|sign-up/, { timeout: 10000 })
  })
})
