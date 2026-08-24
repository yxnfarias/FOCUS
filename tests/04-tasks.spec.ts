import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Tarefas (Kanban)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.locator('aside nav').getByRole('link', { name: /tarefas/i }).click()
    await expect(page).toHaveURL(/tarefas/)
    await expect(page.getByText('A fazer')).toBeVisible({ timeout: 10000 })
  })

  test('exibe três colunas do kanban', async ({ page }) => {
    await expect(page.getByText('A fazer')).toBeVisible()
    await expect(page.getByText('Em andamento')).toBeVisible()
    await expect(page.getByText('Concluído')).toBeVisible()
  })

  test('exibe cabeçalho com título e botão Nova', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tarefas' })).toBeVisible()
    await expect(page.getByRole('button', { name: /nova/i }).first()).toBeVisible()
  })

  test('abre modal de nova tarefa pelo botão Nova', async ({ page }) => {
    // Header "Nova" button (adds to 'todo' column by default)
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })
  })

  test('abre modal de nova tarefa pelo botão + da coluna', async ({ page }) => {
    // Each column has a + button with title "Adicionar em {col.label}"
    await page.getByRole('button', { name: /adicionar em a fazer/i }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })
  })

  test('cria uma nova tarefa na coluna A fazer', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })

    const taskTitle = `Tarefa Teste ${Date.now()}`
    await page.getByPlaceholder(/o que precisa ser feito/i).fill(taskTitle)
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByRole('heading', { name: /nova tarefa/i })).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8000 })
  })

  test('cria tarefa com prioridade Alta', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })

    const taskTitle = `Tarefa Alta Prioridade ${Date.now()}`
    await page.getByPlaceholder(/o que precisa ser feito/i).fill(taskTitle)
    await page.getByLabel(/prioridade/i).selectOption('high')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8000 })
    // Alta badge
    await expect(page.locator('main').getByText('Alta').first()).toBeVisible()
  })

  test('cria tarefa com descrição e data de vencimento', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })

    const taskTitle = `Tarefa Com Detalhes ${Date.now()}`
    await page.getByPlaceholder(/o que precisa ser feito/i).fill(taskTitle)
    await page.getByPlaceholder(/detalhes/i).fill('Descrição da tarefa de teste')
    await page.getByLabel(/vencimento/i).fill('2026-12-31')
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8000 })
  })

  test('cancela criação de tarefa', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /cancelar/i }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('fecha modal ao clicar no backdrop', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })
    // Click the dark backdrop (fixed overlay)
    await page.locator('.fixed.inset-0').click({ position: { x: 5, y: 5 } })
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).not.toBeVisible({ timeout: 3000 })
  })

  test('exclui uma tarefa (delete aparece no hover)', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: 'Nova' }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })
    const taskTitle = `Tarefa Para Deletar ${Date.now()}`
    await page.getByPlaceholder(/o que precisa ser feito/i).fill(taskTitle)
    await page.getByRole('button', { name: /salvar/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8000 })

    // Hover over the task card to reveal the trash button (opacity-0 → opacity-100)
    const taskCard = page.locator('div.group').filter({ hasText: taskTitle }).first()
    await taskCard.hover()

    // The trash icon button is the only button inside the card header
    const deleteBtn = taskCard.locator('button').first()
    await expect(deleteBtn).toBeVisible({ timeout: 3000 })
    await deleteBtn.click()

    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 5000 })
  })

  test('exibe estado vazio nas colunas sem tarefas', async ({ page }) => {
    // When no tasks, column shows "Arraste um card aqui ou clique em +"
    await expect(page.getByText(/arraste um card aqui/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('abre modal para coluna Em andamento', async ({ page }) => {
    await page.getByRole('button', { name: /adicionar em em andamento/i }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /cancelar/i }).click()
  })

  test('abre modal para coluna Concluído', async ({ page }) => {
    await page.getByRole('button', { name: /adicionar em concluído/i }).click()
    await expect(page.getByRole('heading', { name: /nova tarefa/i })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /cancelar/i }).click()
  })
})
