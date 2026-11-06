import type { Page } from '@playwright/test'

/**
 * Elements on the 3D pages move with the idle camera drift, so Playwright never sees them as "stable".
 * Force the click (the element is still checked for visibility and hit-tested by the browser).
 */
export async function tap(page: Page, testId: string) {
  const el = page.getByTestId(testId)
  // Wait until it has settled (page DOM re-renders, camera moves) so the click lands where the button is.
  let box = await el.boundingBox()
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(60)
    const next = await el.boundingBox()
    const still = box && next && Math.abs(next.x - box.x) < 2 && Math.abs(next.y - box.y) < 2
    box = next
    if (still) break
  }
  await el.click({ force: true })
}

export async function openPendulum(page: Page) {
  await page.goto('/')
  await tap(page, 'cover-student')
  await page.getByTestId('contents-t4-bab1-bandul').waitFor()
  await tap(page, 'contents-t4-bab1-bandul')
  await page.getByTestId('mission-direct').waitFor()
}

export async function playToRun(page: Page) {
  await tap(page, 'mission-direct')
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

/** Drag a shelf card onto a + mark with a real mouse (press, move in steps, release). */
export async function dragPart(page: Page, part: string, slot: string) {
  const a = await page.getByTestId(`part-${part}`).boundingBox()
  // The + marks follow the 3D scene; wait until this one has settled (camera moves, pop-up springs).
  let b = await page.getByTestId(`slot-${slot}`).boundingBox()
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(80)
    const next = await page.getByTestId(`slot-${slot}`).boundingBox()
    const still = b && next && Math.abs(next.x - b.x) < 2 && Math.abs(next.y - b.y) < 2
    b = next
    if (still) break
  }
  if (!a || !b) throw new Error(`drag: cannot find part-${part} or slot-${slot}`)
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 })
  await page.mouse.up()
}
