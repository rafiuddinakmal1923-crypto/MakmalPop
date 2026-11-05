import type { Page } from '@playwright/test'

/**
 * Elements on the 3D pages move with the idle camera drift, so Playwright never sees them as "stable".
 * Force the click (the element is still checked for visibility and hit-tested by the browser).
 */
export async function tap(page: Page, testId: string) {
  await page.getByTestId(testId).click({ force: true })
}

export async function openPendulum(page: Page) {
  await page.goto('/')
  await tap(page, 'cover-student')
  await page.getByTestId('contents-t4-bab1-bandul').waitFor()
  await tap(page, 'contents-t4-bab1-bandul')
  await page.getByTestId('mission-accept').waitFor()
}

export async function playToRun(page: Page) {
  await tap(page, 'mission-accept')
  for (const [id, slot] of [
    ['length', 'manipulated'],
    ['period', 'responding'],
    ['mass', 'constant'],
    ['amplitude', 'constant'],
  ])
    await tap(page, `place-${id}-${slot}`)
  await tap(page, 'variables-check')
  await tap(page, 'predict-0')
  await tap(page, 'stake-2')
  await page.getByTestId('control-panel').waitFor()
}

export async function takeReading(page: Page, lengthCm: number) {
  await page.getByTestId('control-slider').fill(String(lengthCm), { force: true })
  await tap(page, 'run-go')
  await tap(page, 'run-skip')
  await page.getByTestId('run-go').waitFor()
}
