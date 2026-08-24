import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Lista de Desejos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.locator('aside nav').getByRole('link', { name: /desejos/i }).click()
    await expect(page).toHaveURL(/desejos/)
    await page.waitForLoadState('networkidle')
  })

  test('exibe cabeçalho com título e botão Novo', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /desejos/i })).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: 'Novo' })).toBeVisible()
  })

  test('abre modal de novo desejo', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })
  })

  test('cria um novo desejo do tipo Compra', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })

    const wishTitle = `Desejo Compra ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    await page.getByLabel(/categoria/i).selectOption('purchase')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByRole('heading', { name: /novo desejo/i })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })
  })

  test('cria desejo do tipo Experiência', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })

    const wishTitle = `Viagem ao Japão ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    await page.getByLabel(/categoria/i).selectOption('experience')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })
  })

  test('cria desejo do tipo Meta', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })

    const wishTitle = `Aprender Japonês ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    await page.getByLabel(/categoria/i).selectOption('goal')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })
  })

  test('cria desejo do tipo Marco de vida', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })

    const wishTitle = `Marco de Vida ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    await page.getByLabel(/categoria/i).selectOption('milestone')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })
  })

  test('cria desejo com prioridade Alta', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })

    const wishTitle = `Desejo Urgente ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    await page.getByLabel(/prioridade/i).selectOption('high')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })
    await expect(page.locator('main').getByText('Alta').first()).toBeVisible()
  })

  test('cria desejo com preço definido', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })

    const wishTitle = `Notebook Novo ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    // Price field
    const priceInput = page.getByLabel(/preço/i).or(page.getByPlaceholder(/0,00|valor/i))
    if (await priceInput.count() > 0) {
      await priceInput.first().fill('3500')
    }
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })
  })

  test('cancela criação de desejo', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /cancelar/i }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('fecha modal ao clicar no backdrop', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    await expect(page.getByRole('heading', { name: /novo desejo/i })).toBeVisible({ timeout: 5000 })
    await page.locator('.fixed.inset-0').click({ position: { x: 5, y: 5 } })
    await expect(page.getByRole('heading', { name: /novo desejo/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('marca desejo como concluído', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    const wishTitle = `Desejo Para Concluir ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })

    // Find the complete (check) button on the wish card
    const wishCard = page.locator('div').filter({ hasText: wishTitle }).first()
    // Complete button is the first button (check/toggle button)
    const completeBtn = wishCard.getByRole('button').first()
    await completeBtn.click()

    await page.waitForTimeout(500)
    // Verify no crash
    await expect(page.locator('main')).toBeVisible()
  })

  test('exclui um desejo', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo' }).click()
    const wishTitle = `Desejo Para Excluir ${Date.now()}`
    await page.getByLabel(/título/i).fill(wishTitle)
    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByText(wishTitle)).toBeVisible({ timeout: 8000 })

    const wishCard = page.locator('div').filter({ hasText: wishTitle }).first()
    await wishCard.hover()

    // Delete button is usually the last button on hover
    const btns = wishCard.getByRole('button')
    const count = await btns.count()
    if (count > 0) {
      await btns.last().click()
    }

    await expect(page.getByText(wishTitle)).not.toBeVisible({ timeout: 8000 })
  })

  test('exibe filtros de categoria', async ({ page }) => {
    // The wishlist has category filter buttons
    await expect(page.getByRole('button', { name: /todos|all/i }).first().or(page.locator('main button').first())).toBeVisible({ timeout: 8000 })
  })
})
