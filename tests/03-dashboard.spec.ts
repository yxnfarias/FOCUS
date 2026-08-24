import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.locator('aside nav').getByRole('link', { name: /início/i }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('exibe saudação com nome do usuário', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /bom dia|boa tarde|boa noite/i })).toBeVisible({ timeout: 10000 })
  })

  test('exibe subtítulo do dashboard', async ({ page }) => {
    await expect(page.getByText(/resumo do seu dia/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('exibe card de Finanças com saldo', async ({ page }) => {
    // Use the main dashboard link card (not sidebar)
    const card = page.locator('main a[href="/financas"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await expect(card.getByText('Finanças')).toBeVisible()
    await expect(card.getByText(/R\$/i)).toBeVisible()
  })

  test('exibe card de Hábitos com progresso', async ({ page }) => {
    const card = page.locator('main a[href="/habitos"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await expect(card.getByText('Hábitos')).toBeVisible()
    await expect(card.getByText(/cumpridos hoje/i)).toBeVisible()
  })

  test('exibe card de Tarefas com pendentes', async ({ page }) => {
    const card = page.locator('main a[href="/tarefas"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await expect(card.getByText('Tarefas')).toBeVisible()
    await expect(card.getByText(/pendente/i)).toBeVisible()
  })

  test('exibe card de Desejos com lista', async ({ page }) => {
    const card = page.locator('main a[href="/desejos"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await expect(card.getByText('Desejos')).toBeVisible()
    await expect(card.getByText(/na lista/i)).toBeVisible()
  })

  test('card de Finanças navega para /financas', async ({ page }) => {
    const card = page.locator('main a[href="/financas"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await card.click()
    await expect(page).toHaveURL(/financas/)
  })

  test('card de Hábitos navega para /habitos', async ({ page }) => {
    const card = page.locator('main a[href="/habitos"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await card.click()
    await expect(page).toHaveURL(/habitos/)
  })

  test('card de Tarefas navega para /tarefas', async ({ page }) => {
    const card = page.locator('main a[href="/tarefas"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await card.click()
    await expect(page).toHaveURL(/tarefas/)
  })

  test('card de Desejos navega para /desejos', async ({ page }) => {
    const card = page.locator('main a[href="/desejos"]').first()
    await expect(card).toBeVisible({ timeout: 8000 })
    await card.click()
    await expect(page).toHaveURL(/desejos/)
  })

  test('exibe mensagem de boas-vindas com nome do usuário', async ({ page }) => {
    // The heading should have the user's first name
    await expect(page.locator('h1').filter({ hasText: /yan/i })).toBeVisible({ timeout: 8000 })
  })
})
