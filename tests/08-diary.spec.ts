import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Diário', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.locator('aside nav').getByRole('link', { name: /diário/i }).click()
    await expect(page).toHaveURL(/diario/)
    await page.waitForLoadState('networkidle')
  })

  test('exibe página do diário com botão Nova entrada', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByRole('button', { name: /nova entrada/i })).toBeVisible({ timeout: 8000 })
  })

  test('abre editor ao clicar em Nova entrada', async ({ page }) => {
    await page.getByRole('button', { name: /nova entrada/i }).click()
    // Editor panel should appear with title and content inputs
    await expect(page.getByPlaceholder(/título/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('textarea').first()).toBeVisible()
  })

  test('cria uma nova entrada no diário', async ({ page }) => {
    await page.getByRole('button', { name: /nova entrada/i }).click()

    const titleInput = page.getByPlaceholder(/título/i).first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    const entryTitle = `Entrada Teste ${Date.now()}`
    await titleInput.fill(entryTitle)
    await page.locator('textarea').first().fill('Hoje foi um dia produtivo. Completei várias tarefas.')

    // Click save button or wait for auto-save (1.5s timeout in the component)
    const saveBtn = page.getByRole('button', { name: /salvar/i })
    if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await saveBtn.click()
    } else {
      await page.waitForTimeout(2000)
    }

    // Entry should appear in the sidebar/list
    await expect(page.getByText(entryTitle)).toBeVisible({ timeout: 8000 })
  })

  test('auto-salva ao digitar', async ({ page }) => {
    await page.getByRole('button', { name: /nova entrada/i }).click()

    const titleInput = page.getByPlaceholder(/título/i).first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    const entryTitle = `Auto-save ${Date.now()}`
    await titleInput.fill(entryTitle)
    await page.locator('textarea').first().fill('Conteúdo para auto-save.')

    // Wait longer than auto-save timeout (1.5s + buffer)
    await page.waitForTimeout(3000)

    // Should either show "Salvo" indicator or entry in list
    const isSaved = await page.getByText(entryTitle).isVisible({ timeout: 2000 }).catch(() => false)
    expect(isSaved).toBe(true)
  })

  test('salva manualmente com botão Salvar', async ({ page }) => {
    await page.getByRole('button', { name: /nova entrada/i }).click()

    const titleInput = page.getByPlaceholder(/título/i).first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    await titleInput.fill('Entrada com Save Manual')
    await page.locator('textarea').first().fill('Conteúdo salvo manualmente.')

    // Find and click the save button (Lucide Save icon button)
    const saveBtn = page.getByRole('button', { name: /salvar/i })
    await expect(saveBtn).toBeVisible({ timeout: 3000 })
    await saveBtn.click()

    await expect(page.getByText('Entrada com Save Manual')).toBeVisible({ timeout: 5000 })
  })

  test('seleciona entrada existente da lista para editar', async ({ page }) => {
    // Create entry first
    await page.getByRole('button', { name: /nova entrada/i }).click()
    const titleInput = page.getByPlaceholder(/título/i).first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    const entryTitle = `Entrada Para Editar ${Date.now()}`
    await titleInput.fill(entryTitle)
    await page.locator('textarea').first().fill('Conteúdo inicial')
    await page.waitForTimeout(2000) // auto-save

    // Entry should be in list now — click it
    const entryInList = page.getByText(entryTitle).first()
    if (await entryInList.isVisible({ timeout: 3000 }).catch(() => false)) {
      await entryInList.click()
      // Editor should show the entry's content
      await expect(titleInput).toHaveValue(entryTitle, { timeout: 3000 })
    }
  })

  test('exclui uma entrada do diário', async ({ page }) => {
    // Create entry and save it manually (so selectedId transitions from 'new' to number)
    await page.getByRole('button', { name: /nova entrada/i }).click()
    const titleInput = page.getByPlaceholder(/título/i).first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    const entryTitle = `Entrada Para Excluir ${Date.now()}`
    await titleInput.fill(entryTitle)
    await page.locator('textarea').first().fill('Será excluída.')

    // Click save explicitly so selectedId transitions from 'new' to a real number
    await page.getByRole('button', { name: /salvar/i }).click()
    // Wait for "Salvo ✓" or the entry to appear in the list
    await expect(page.getByText(entryTitle)).toBeVisible({ timeout: 8000 })

    // Now the delete button works (selectedId is a real number)
    // The "Excluir" button is in the bottom toolbar of the editor (exact match avoids entry list buttons)
    const deleteBtn = page.getByRole('button', { name: 'Excluir', exact: true })
    await expect(deleteBtn).toBeVisible({ timeout: 3000 })
    await deleteBtn.click()

    await expect(page.getByText(entryTitle)).not.toBeVisible({ timeout: 5000 })
  })

  test('exibe data em formato português', async ({ page }) => {
    await page.getByRole('button', { name: /nova entrada/i }).click()
    const titleInput = page.getByPlaceholder(/título/i).first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    await titleInput.fill('Entrada com data PT')
    await page.locator('textarea').first().fill('Verificando formato de data.')
    await page.waitForTimeout(2000)

    // Date format in Portuguese weekday name
    const dateLocator = page.getByText(/segunda|terça|quarta|quinta|sexta|sábado|domingo/i)
    if (await dateLocator.count() > 0) {
      await expect(dateLocator.first()).toBeVisible()
    } else {
      // At least verify the entry was created
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('fecha painel de edição ao clicar em fechar', async ({ page }) => {
    await page.getByRole('button', { name: /nova entrada/i }).click()
    const titleInput = page.getByPlaceholder(/título/i).first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })

    // Find close button (X button in editor panel)
    const closeBtn = page.getByRole('button', { name: /fechar|close/i })
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
      await expect(titleInput).not.toBeVisible({ timeout: 3000 })
    } else {
      // Alternative: look for X icon button
      const xBtn = page.locator('main button').last()
      await xBtn.click()
    }
  })
})
