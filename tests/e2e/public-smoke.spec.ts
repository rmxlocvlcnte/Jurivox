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
  await expect(page.getByRole('heading', { name: /politica de privacidade/i })).toBeVisible()

  await page.goto('/termos-de-uso')
  await expect(page.getByRole('heading', { name: /termos de uso/i })).toBeVisible()

  await page.goto('/dpa')
  await expect(page.getByRole('heading', { name: /acordo de processamento de dados/i })).toBeVisible()
})
