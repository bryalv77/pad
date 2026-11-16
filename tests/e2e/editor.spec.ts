import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/harness.html')
})

test('a font choice is applied to the editor and saved', async ({ page }) => {
  await page.getByLabel('Font').selectOption('georgia')

  await expect(page.locator('[data-font]')).toHaveAttribute('data-font', 'georgia')
  const family = await page.locator('.ProseMirror').evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family).toContain('Georgia')
  await expect(page.getByTestId('saved')).toHaveAttribute('data-saved', /"font":"georgia"/)
})

test('markdown source renders as html in preview', async ({ page }) => {
  await page.getByRole('button', { name: 'Markdown mode' }).click()
  await expect(page.getByRole('textbox', { name: 'Markdown source' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Markdown source' }).fill('# Heading\n\n- one\n- two')
  await page.getByRole('button', { name: 'Preview' }).click()

  const preview = page.getByTestId('markdown-preview')
  await expect(preview.getByRole('heading', { level: 1 })).toHaveText('Heading')
  await expect(preview.getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('textbox', { name: 'Markdown source' })).toHaveCount(0)
})

test('switching modes converts existing content and back', async ({ page }) => {
  await expect(page.locator('.ProseMirror h1')).toHaveText('Hello')

  await page.getByRole('button', { name: 'Markdown mode' }).click()
  await expect(page.getByRole('textbox', { name: 'Markdown source' })).toHaveValue(/# Hello/)

  await page.getByRole('textbox', { name: 'Markdown source' }).fill('# Changed\n\nNew text')
  await page.getByRole('button', { name: 'Markdown mode' }).click()

  await expect(page.locator('.ProseMirror h1')).toHaveText('Changed')
  await expect(page.locator('.ProseMirror')).toContainText('New text')
  await expect(page.getByTestId('saved')).toHaveAttribute('data-saved', /"markdownMode":false/)
})

test('the chosen font applies to the markdown source and preview', async ({ page }) => {
  await page.getByRole('button', { name: 'Markdown mode' }).click()
  await page.getByLabel('Font').selectOption('courier')

  const sourceFont = await page
    .getByRole('textbox', { name: 'Markdown source' })
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(sourceFont).toContain('Courier New')

  await page.getByRole('button', { name: 'Preview' }).click()
  const previewFont = await page
    .getByTestId('markdown-preview')
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(previewFont).toContain('Courier New')
})

test('markdown preview never executes scripts or javascript urls', async ({ page }) => {
  await page.getByRole('button', { name: 'Markdown mode' }).click()
  await page
    .getByRole('textbox', { name: 'Markdown source' })
    .fill('<script>window.__pwned = true</script>\n\n[bad](javascript:alert(1))')
  await page.getByRole('button', { name: 'Preview' }).click()

  await expect(page.getByTestId('markdown-preview').locator('script')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { __pwned?: boolean }).__pwned)).toBeUndefined()
  expect(await page.getByTestId('markdown-preview').innerHTML()).not.toContain('javascript:')
})
