import { expect, test } from '@playwright/test'

test('landing publica renderiza links institucionais', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /controle real de ponta a ponta/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /termos de uso/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /privacidade/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /^dpa$/i })).toBeVisible()
})

test('paginas institucionais publicas respondem', async ({ page }) => {
  await page.goto('/privacidade')
  await expect(page.getByRole('heading', { name: /pol[ií]tica de privacidade/i })).toBeVisible()

  await page.goto('/termos-de-uso')
  await expect(page.getByRole('heading', { name: /termos de uso/i })).toBeVisible()

  await page.goto('/dpa')
  await expect(page.getByRole('heading', { name: /acordo de processamento de dados/i })).toBeVisible()
})

test('banner de consentimento de cookies aparece na primeira visita', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('jurivox-cookie-consent'))
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: /preferências de cookies/i })).toBeVisible()
  await page.getByRole('button', { name: /apenas essenciais/i }).click()
  await expect(page.getByRole('dialog', { name: /preferências de cookies/i })).not.toBeVisible()
})
