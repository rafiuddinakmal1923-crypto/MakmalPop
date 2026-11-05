import { test } from '@playwright/test'
import { openPendulum, tap } from './helpers'

// Screenshots of every screen at phone landscape, phone portrait and projector sizes (build prompt section 12).
for (const [name, viewport] of [
  ['phone-landscape', { width: 915, height: 412 }],
  ['phone-portrait', { width: 412, height: 915 }],
  ['projector', { width: 1920, height: 1080 }],
] as const) {
  test(`screens at ${name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.getByTestId('cover-student').waitFor()
    await page.screenshot({ path: `test-results/screens/${name}-1-cover.png` })
    await openPendulum(page)
    await page.screenshot({ path: `test-results/screens/${name}-2-spread.png` })
    if (name === 'phone-portrait') {
      await tap(page, 'portrait-experiment')
      await page.waitForTimeout(1200)
      await page.screenshot({ path: `test-results/screens/${name}-3-experiment.png` })
    }
  })
}
