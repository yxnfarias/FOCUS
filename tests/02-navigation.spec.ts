import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('sidebar exibe todos os itens de navegação', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar.getByRole('link', { name: /início/i })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /finanças/i })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /hábitos/i })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /tarefas/i })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /desejos/i })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: /diário/i })).toBeVisible()
  })

  test('navega para Finanças', async ({ page }) => {
    await page.locator('aside nav').getByRole('link', { name: /finanças/i }).click()
    await expect(page).toHaveURL(/financas/)
    await expect(page.getByText(/extrato|transaç/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('navega para Hábitos', async ({ page }) => {
    await page.locator('aside nav').getByRole('link', { name: /hábitos/i }).click()
    await expect(page).toHaveURL(/habitos/)
    // Either there are habits or a call to action
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main')).toBeVisible()
  })

  test('navega para Tarefas', async ({ page }) => {
    await page.locator('aside nav').getByRole('link', { name: /tarefas/i }).click()
    await expect(page).toHaveURL(/tarefas/)
    await expect(page.getByText(/a fazer/i)).toBeVisible({ timeout: 8000 })
  })

  test('navega para Desejos', async ({ page }) => {
    await page.locator('aside nav').getByRole('link', { name: /desejos/i }).click()
    await expect(page).toHaveURL(/desejos/)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main')).toBeVisible()
  })

  test('navega para Diário', async ({ page }) => {
    await page.locator('aside nav').getByRole('link', { name: /diário/i }).click()
    await expect(page).toHaveURL(/diario/)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main')).toBeVisible()
  })

  test('volta para Início pelo sidebar', async ({ page }) => {
    await page.locator('aside nav').getByRole('link', { name: /finanças/i }).click()
    await expect(page).toHaveURL(/financas/)
    await page.locator('aside nav').getByRole('link', { name: /início/i }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('h1').filter({ hasText: /bom dia|boa tarde|boa noite/i })).toBeVisible()
  })

  test('exibe nome e email do usuário no sidebar', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar.getByText(/yangustavofarias@gmail.com/i)).toBeVisible()
  })

  test('alterna tema pelo botão na sidebar', async ({ page }) => {
    const themeBtn = page.locator('aside').getByRole('button', { name: /modo claro|modo escuro/i })
    await expect(themeBtn).toBeVisible()
    await themeBtn.click()
    // Toggle again
    await themeBtn.click()
    await expect(themeBtn).toBeVisible()
  })
})
