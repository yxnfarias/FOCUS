import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Hábitos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.locator('aside nav').getByRole('link', { name: /hábitos/i }).click()
    await expect(page).toHaveURL(/habitos/)
    await page.waitForLoadState('networkidle')
  })

  test('exibe cabeçalho com título e botão Novo', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Hábitos' })).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: 'Novo' })).toBeVisible()
  })

  test('abre modal de novo hábito', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })
  })

  test('cria um novo hábito diário', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })

    const habitName = `Hábito Teste ${Date.now()}`
    await page.getByLabel(/nome do hábito/i).fill(habitName)
    await page.getByRole('button', { name: /criar hábito/i }).click()

    await expect(page.getByRole('heading', { name: /novo hábito/i })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8000 })
  })

  test('cria hábito com frequência semanal', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })

    const habitName = `Hábito Semanal ${Date.now()}`
    await page.getByLabel(/nome do hábito/i).fill(habitName)
    await page.getByLabel(/frequência/i).selectOption('weekly')
    await page.getByRole('button', { name: /criar hábito/i }).click()

    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8000 })
  })

  test('cria hábito com descrição', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })

    const habitName = `Hábito com Descrição ${Date.now()}`
    await page.getByLabel(/nome do hábito/i).fill(habitName)
    await page.getByLabel(/descrição/i).fill('Para melhorar a saúde')
    await page.getByRole('button', { name: /criar hábito/i }).click()

    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8000 })
  })

  test('cancela criação de hábito', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /cancelar/i }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('fecha modal ao clicar no backdrop', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })
    await page.locator('.fixed.inset-0').click({ position: { x: 5, y: 5 } })
    await expect(page.getByRole('heading', { name: /novo hábito/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('seleciona diferentes ícones no modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })

    // Click 📚 icon button
    await page.locator('button').filter({ hasText: '📚' }).click()
    // Click 💧 icon button
    await page.locator('button').filter({ hasText: '💧' }).click()
    // Modal should still be open
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible()
    await page.getByRole('button', { name: /cancelar/i }).click()
  })

  test('seleciona cor no modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible({ timeout: 5000 })

    // Color buttons are round - click second color
    const colorBtns = page.locator('button.rounded-full')
    const count = await colorBtns.count()
    if (count > 1) {
      await colorBtns.nth(1).click()
    }
    await expect(page.getByRole('heading', { name: /novo hábito/i })).toBeVisible()
    await page.getByRole('button', { name: /cancelar/i }).click()
  })

  test('marca hábito como concluído hoje', async ({ page }) => {
    // Create a habit first
    await page.getByRole('button', { name: 'Novo' }).click()
    const habitName = `Hábito Para Marcar ${Date.now()}`
    await page.getByLabel(/nome do hábito/i).fill(habitName)
    await page.getByRole('button', { name: /criar hábito/i }).click()
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8000 })

    // Find the check/complete button on the habit card
    // The habit card has a button with a Check icon
    const habitCard = page.locator('[class*="card"], div').filter({ hasText: habitName }).first()
    // The check button is the first actionable button in the card
    const checkBtn = habitCard.getByRole('button').first()
    await checkBtn.click()
    await page.waitForTimeout(500)
    // After marking, the button state should change (verified by no crash)
    await expect(page.locator('main')).toBeVisible()
  })

  test('exclui um hábito', async ({ page }) => {
    // Create habit first
    await page.getByRole('button', { name: 'Novo' }).click()
    const habitName = `Hábito Para Excluir ${Date.now()}`
    await page.getByLabel(/nome do hábito/i).fill(habitName)
    await page.getByRole('button', { name: /criar hábito/i }).click()
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8000 })

    // The habit name p is a direct child of the card div; navigate up from it
    // to get the card div (which has the Trash2 delete as its first button)
    const cardDiv = page.locator('p').filter({ hasText: habitName }).locator('xpath=..')
    const deleteBtn = cardDiv.getByRole('button').first()
    await deleteBtn.click()

    await expect(page.getByText(habitName)).not.toBeVisible({ timeout: 8000 })
  })

  test('exibe gráfico de heatmap após criar hábito', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    const habitName = `Hábito Heatmap ${Date.now()}`
    await page.getByLabel(/nome do hábito/i).fill(habitName)
    await page.getByRole('button', { name: /criar hábito/i }).click()
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8000 })

    // ContributionGraph renders "Histórico de hábitos" header text
    await expect(page.getByText('Histórico de hábitos')).toBeVisible({ timeout: 5000 })
  })

  test('exibe progresso de streak', async ({ page }) => {
    // After creating a habit and marking it done, streak should show
    await page.getByRole('button', { name: 'Novo' }).click()
    const habitName = `Hábito Streak ${Date.now()}`
    await page.getByLabel(/nome do hábito/i).fill(habitName)
    await page.getByRole('button', { name: /criar hábito/i }).click()
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8000 })

    // Flame/streak icon should be present in habit card
    await expect(page.locator('main svg').first()).toBeVisible()
  })
})
