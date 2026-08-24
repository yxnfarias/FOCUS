import { test, expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD, TEST_NAME } from './helpers'

test.describe('Autenticação', () => {
  test('exibe tela de login ao acessar o site', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('alterna entre modo login e cadastro', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible({ timeout: 15000 })

    // Switch to register
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()
    await expect(page.getByLabel('Nome')).toBeVisible()

    // Switch back to login
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible()
    await expect(page.getByLabel('Nome')).not.toBeVisible()
  })

  test('alterna tema na tela de login', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible({ timeout: 15000 })
    const themeBtn = page.getByRole('button', { name: /alternar tema/i })
    await expect(themeBtn).toBeVisible()
    await themeBtn.click()
    // Just verify button still works after toggle
    await expect(themeBtn).toBeVisible()
  })

  test('exibe erro ao fazer login com senha incorreta', async ({ page }) => {
    // First register the user so login errors make sense
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible({ timeout: 15000 })

    // Try to register first (might fail if user already exists — ignore)
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()
    await page.getByLabel('Nome').fill(TEST_NAME)
    await page.getByLabel('E-mail').fill(TEST_EMAIL)
    await page.getByLabel('Senha').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /criar conta/i }).click()

    // Either logged in or "already registered" error
    const appShell = page.locator('aside').filter({ hasText: 'FOCUS' })
    const alreadyExists = page.locator('p').filter({ hasText: /já está cadastrado/i })
    await Promise.race([
      appShell.waitFor({ timeout: 10000 }),
      alreadyExists.waitFor({ timeout: 10000 }),
    ]).catch(() => {})

    // If we're logged in, log out first
    if (await appShell.isVisible()) {
      await page.getByRole('button', { name: /sair/i }).click()
      await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible()
    } else {
      // Already on register screen with error — go back to login
      await page.getByRole('button', { name: /entrar/i }).click()
      await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible()
    }

    // Now try login with wrong password
    await page.getByLabel('E-mail').fill(TEST_EMAIL)
    await page.getByLabel('Senha').fill('senhaErrada999')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.locator('p').filter({ hasText: /E-mail ou senha incorretos/i })).toBeVisible({ timeout: 8000 })
  })

  test('valida comprimento mínimo de senha no cadastro', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()

    // Fill all required fields but with password too short (React check fires after native validation)
    await page.getByLabel('Nome').fill('Usuário Teste')
    await page.getByLabel('E-mail').fill('teste_validacao@example.com')
    await page.getByLabel('Senha').fill('abc') // < 6 characters — React validation
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.locator('p').filter({ hasText: /senha deve ter pelo menos/i })).toBeVisible({ timeout: 5000 })
  })

  test('realiza login com sucesso e exibe dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByLabel('E-mail')).toBeVisible({ timeout: 15000 })

    // Register (or get "already exists" error)
    await page.getByRole('button', { name: /criar conta/i }).click()
    await page.getByLabel('Nome').fill(TEST_NAME)
    await page.getByLabel('E-mail').fill(TEST_EMAIL)
    await page.getByLabel('Senha').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /criar conta/i }).click()

    const appShell = page.locator('aside').filter({ hasText: 'FOCUS' })
    const alreadyExists = page.locator('p').filter({ hasText: /já está cadastrado/i })

    const result = await Promise.race([
      appShell.waitFor({ timeout: 10000 }).then(() => 'success' as const),
      alreadyExists.waitFor({ timeout: 10000 }).then(() => 'exists' as const),
    ])

    if (result === 'exists') {
      // Go to login mode and log in
      await page.getByRole('button', { name: /entrar/i }).click()
      await page.getByLabel('E-mail').fill(TEST_EMAIL)
      await page.getByLabel('Senha').fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /entrar/i }).click()
    }

    await expect(appShell).toBeVisible({ timeout: 15000 })
    await expect(page.locator('h1').filter({ hasText: /bom dia|boa tarde|boa noite/i })).toBeVisible({ timeout: 10000 })
  })

  test('faz logout após login', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByLabel('E-mail')).toBeVisible({ timeout: 15000 })

    // Register or login
    await page.getByRole('button', { name: /criar conta/i }).click()
    await page.getByLabel('Nome').fill(TEST_NAME)
    await page.getByLabel('E-mail').fill(TEST_EMAIL)
    await page.getByLabel('Senha').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /criar conta/i }).click()

    const appShell = page.locator('aside').filter({ hasText: 'FOCUS' })
    const alreadyExists = page.locator('p').filter({ hasText: /já está cadastrado/i })

    const result = await Promise.race([
      appShell.waitFor({ timeout: 10000 }).then(() => 'success' as const),
      alreadyExists.waitFor({ timeout: 10000 }).then(() => 'exists' as const),
    ])

    if (result === 'exists') {
      await page.getByRole('button', { name: /entrar/i }).click()
      await page.getByLabel('E-mail').fill(TEST_EMAIL)
      await page.getByLabel('Senha').fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /entrar/i }).click()
    }

    await expect(appShell).toBeVisible({ timeout: 15000 })

    // Click logout
    await page.locator('aside').getByRole('button', { name: /sair/i }).click()
    await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible({ timeout: 10000 })
  })
})
