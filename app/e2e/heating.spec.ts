import { expect, test } from '@playwright/test'
import { tap } from './helpers'

test.use({ viewport: { width: 1280, height: 720 } })

test('heating loop: θ vs t is rejected, Δθ vs t unlocks Q = mcΔθ', async ({ page }) => {
  // The heating page is locked until the pendulum is done; use the "unlock all" setting.
  await page.addInitScript(() =>
    localStorage.setItem('makmalpop-settings', JSON.stringify({ state: { lang: 'ms', liteOverride: null, sound: false, unlockAll: true, demoWatermark: true }, version: 0 })),
  )
  await page.goto('/')
  await tap(page, 'cover-student')
  await tap(page, 'contents-t4-bab4-muatan-haba-tentu')
  await tap(page, 'mission-direct')
  for (const [id, slot] of [
    ['time', 'manipulated'],
    ['temperatureRise', 'responding'],
    ['waterMass', 'constant'],
    ['power', 'constant'],
    ['material', 'constant'],
  ])
    await tap(page, `place-${id}-${slot}`)
  await tap(page, 'variables-check')
  await tap(page, 'predict-0')
  await tap(page, 'stake-1')

  for (const t of [60, 180, 300, 420, 600]) {
    await page.getByTestId('control-slider').fill(String(t), { force: true })
    await tap(page, 'run-go')
    await tap(page, 'run-skip')
    await page.getByTestId('run-go').waitFor()
  }
  // 100 W for 600 s into 0.5 kg of water: a rise of about 28.6 °C, to about 55.6 °C.
  await expect(page.getByTestId('notebook')).toContainText(/5[56]\.\d/)
  await tap(page, 'run-continue')
  await tap(page, 'explain-0')
  await tap(page, 'explain-continue')
  await tap(page, 'graph-theta-vs-t')
  await expect(page.getByTestId('formula-confirm')).toHaveCount(0)
  await tap(page, 'graph-dtheta-vs-t')
  await tap(page, 'formula-confirm')
  await expect(page.getByTestId('left-page')).toContainText('Misi selesai')
})
