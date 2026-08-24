import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Finanças', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.locator('aside nav').getByRole('link', { name: /finanças/i }).click()
    await expect(page).toHaveURL(/financas/)
    await page.waitForLoadState('networkidle')
  })

  test('exibe cabeçalho com título e botão Nova', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Finanças' })).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: 'Nova' })).toBeVisible()
  })

  test('exibe aba Extrato ativa por padrão', async ({ page }) => {
    // Should show the extrato tab content
    await expect(page.getByText(/extrato/i).first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/R\$/i).first()).toBeVisible()
  })

  test('exibe cards de resumo financeiro', async ({ page }) => {
    // Summary cards: income, expense, balance
    await expect(page.getByText(/R\$/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('navega para aba Investimentos', async ({ page }) => {
    const investTab = page.getByRole('button', { name: /investimentos/i })
    await expect(investTab).toBeVisible({ timeout: 8000 })
    await investTab.click()
    await expect(page.getByText(/investimento/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('volta para aba Extrato após visitar Investimentos', async ({ page }) => {
    await page.getByRole('button', { name: /investimentos/i }).click()
    await page.getByRole('button', { name: /extrato/i }).click()
    await expect(page.getByText(/R\$/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('abre modal de nova transação', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).toBeVisible({ timeout: 5000 })
  })

  test('adiciona uma receita', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).toBeVisible({ timeout: 5000 })

    // Select income type (+ Receita button)
    await page.getByRole('button', { name: /\+ receita/i }).click()

    await page.getByLabel(/valor/i).fill('1500')
    await page.getByLabel(/categoria/i).selectOption('Salário')
    await page.getByLabel(/descrição/i).fill('Salário do mês')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByRole('heading', { name: /nova transação/i })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Salário do mês')).toBeVisible({ timeout: 8000 })
  })

  test('adiciona um gasto', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).toBeVisible({ timeout: 5000 })

    // Expense is default (− Gasto)
    await page.getByRole('button', { name: /− gasto/i }).click()

    await page.getByLabel(/valor/i).fill('50')
    await page.getByLabel(/categoria/i).selectOption('Alimentação')
    await page.getByLabel(/descrição/i).fill('Almoço restaurante')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByRole('heading', { name: /nova transação/i })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Almoço restaurante')).toBeVisible({ timeout: 8000 })
  })

  test('cancela adição de transação', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /cancelar/i }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('fecha modal ao clicar no backdrop', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).toBeVisible({ timeout: 5000 })
    await page.locator('.fixed.inset-0').click({ position: { x: 5, y: 5 } })
    await expect(page.getByRole('heading', { name: /nova transação/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('exibe botão de importar extrato', async ({ page }) => {
    const importBtn = page.getByRole('button', { name: /importar/i })
    await expect(importBtn).toBeVisible({ timeout: 8000 })
  })

  test('abre modal de importação de CSV', async ({ page }) => {
    await page.getByRole('button', { name: /importar/i }).click()
    // Import modal should appear
    await expect(page.locator('.fixed.inset-0').last()).toBeVisible({ timeout: 5000 })
    // Close it
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('exclui uma transação', async ({ page }) => {
    // Create transaction first
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).toBeVisible({ timeout: 5000 })
    await page.getByLabel(/valor/i).fill('99')
    await page.getByLabel(/categoria/i).selectOption('Alimentação')
    await page.getByLabel(/descrição/i).fill('Transação Para Deletar')
    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByText('Transação Para Deletar')).toBeVisible({ timeout: 8000 })

    // Hover and find delete button
    const row = page.locator('div').filter({ hasText: 'Transação Para Deletar' }).first()
    await row.hover()
    await row.locator('button').last().click()

    await expect(page.getByText('Transação Para Deletar')).not.toBeVisible({ timeout: 5000 })
  })

  test('muda categoria de acordo com tipo receita/despesa', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova transação/i })).toBeVisible({ timeout: 5000 })

    // Start as expense — categories are expense-type
    const catSelect = page.getByLabel(/categoria/i)
    await catSelect.selectOption('Alimentação')

    // Switch to income — categories change
    await page.getByRole('button', { name: /\+ receita/i }).click()
    // Income categories: Salário, Freelance, etc.
    await catSelect.selectOption('Salário')
    await expect(catSelect).toHaveValue('Salário')

    await page.getByRole('button', { name: /cancelar/i }).click()
  })
})
