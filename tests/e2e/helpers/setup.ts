import { Page } from '@playwright/test'

/** URL base da aplicação */
export const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000'

/** Credenciais de teste — configure em .env.test ou variáveis de CI */
export const TEST_USER = {
  email: process.env.TEST_EMAIL ?? 'teste@jurivox.com.br',
  password: process.env.TEST_PASSWORD ?? 'Teste@123!',
}

/**
 * Faz login via Clerk na página de sign-in.
 * Retorna após o redirecionamento para o dashboard.
 */
export async function loginComClerk(page: Page) {
  await page.goto('/sign-in')
  await page.waitForSelector('input[name="identifier"]', { timeout: 15000 })

  await page.fill('input[name="identifier"]', TEST_USER.email)
  await page.click('button[type="submit"]')

  await page.waitForSelector('input[name="password"]', { timeout: 10000 })
  await page.fill('input[name="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')

  // Aguarda redirect para dashboard ou bem-vindo
  await page.waitForURL(/\/(dashboard|bem-vindo|onboarding)/, { timeout: 20000 })
}

/** Aguarda o spinner sumir e o conteúdo carregar */
export async function aguardarCarregamento(page: Page) {
  await page.waitForLoadState('networkidle')
}
