import { expect, test } from '@playwright/test'
import { tap } from './helpers'

test('the whole app works offline after the first load', async ({ page, context }) => {
  await page.goto('/')
  // Wait until the service worker controls the page (everything is precached by then).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }))
  })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByTestId('cover-student')).toBeVisible()
  await expect(page.getByTestId('offline-chip')).toBeVisible()
  await tap(page, 'cover-student')
  await tap(page, 'contents-t4-bab1-bandul')
  await expect(page.getByTestId('left-page')).toContainText('Bandul Ringkas')
})
