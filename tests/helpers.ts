import { Page, expect } from '@playwright/test'

export const BASE_URL = 'http://127.0.0.1:4173'
export const TEST_EMAIL = 'yangustavofarias@gmail.com'
export const TEST_PASSWORD = 'Yan@02042004'
export const TEST_NAME = 'Yan Farias'

/**
 * Logs into the app. If user doesn't exist in IndexedDB (fresh context),
 * registers first then the register flow logs them in automatically.
 */
export async function login(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible({ timeout: 15000 })

  await page.getByLabel('E-mail').fill(TEST_EMAIL)
  await page.getByLabel('Senha').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /entrar/i }).click()

  // Either app shell appears (success) or error appears (user doesn't exist yet)
  const appShell = page.locator('aside').filter({ hasText: 'FOCUS' })
  const loginError = page.locator('p').filter({ hasText: /E-mail ou senha incorretos/i })

  const result = await Promise.race([
    appShell.waitFor({ timeout: 10000 }).then(() => 'success' as const),
    loginError.waitFor({ timeout: 10000 }).then(() => 'needsRegister' as const),
  ]).catch(() => 'timeout' as const)

  if (result === 'needsRegister') {
    // User doesn't exist in this fresh context — register them
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible({ timeout: 5000 })
    await page.getByLabel('Nome').fill(TEST_NAME)
    await page.getByLabel('E-mail').fill(TEST_EMAIL)
    await page.getByLabel('Senha').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(appShell).toBeVisible({ timeout: 15000 })
  } else if (result === 'success') {
    await expect(appShell).toBeVisible({ timeout: 5000 })
  } else {
    throw new Error('Login timed out — could not determine success or failure')
  }
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}
