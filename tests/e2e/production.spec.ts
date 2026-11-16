import { expect, test } from '@playwright/test'

const SITE = 'https://pad.bryanalvarado.com'

test('production home page serves its SEO metadata and icons', async ({ page, request }) => {
  await page.goto(SITE)

  await expect(page).toHaveTitle('Pad — simple shared notepad')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /shared notepad/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/`)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png/)

  await expect(page.locator('link[rel="icon"][type="image/png"]')).toHaveCount(2)

  for (const path of ['/favicon-32.png?v=2', '/apple-touch-icon.png', '/manifest.json', '/robots.txt', '/sitemap.xml']) {
    const response = await request.get(`${SITE}${path}`)
    expect(response.ok(), `${path} should be served`).toBe(true)
  }
})
