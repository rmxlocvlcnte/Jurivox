import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('exibe o nome Jurivox no header', async ({ page }) => {
    await expect(page.getByText('Jurivox').first()).toBeVisible()
  })

  test('exibe o headline principal', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('jurídica')
  })

  test('tem botão Começar Grátis visível', async ({ page }) => {
    const botao = page.getByRole('link', { name: /Começar Grátis|Criar Conta/i }).first()
    await expect(botao).toBeVisible()
  })

  test('tem botão Entrar visível', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  })

  test('exibe seção de recursos', async ({ page }) => {
    await expect(page.getByText('Gestão de Processos')).toBeVisible()
    await expect(page.getByText('Prazos & Agenda')).toBeVisible()
    await expect(page.getByText('Financeiro Completo')).toBeVisible()
  })

  test('exibe os 3 planos', async ({ page }) => {
    await expect(page.getByText('Starter')).toBeVisible()
    await expect(page.getByText('R$ 50')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
    await expect(page.getByText('R$ 150')).toBeVisible()
    await expect(page.getByText('Enterprise')).toBeVisible()
    await expect(page.getByText('R$ 300')).toBeVisible()
  })

  test('exibe depoimentos de clientes', async ({ page }) => {
    await expect(page.getByText('Dra. Ana Lima')).toBeVisible()
  })

  test('footer tem links legais', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Termos de Uso' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Privacidade' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'DPA' })).toBeVisible()
  })

  test('links do header navegam corretamente', async ({ page }) => {
    await page.getByRole('link', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/sign-in/)
  })

  test('meta title contém Jurivox', async ({ page }) => {
    await expect(page).toHaveTitle(/Jurivox/)
  })
})
