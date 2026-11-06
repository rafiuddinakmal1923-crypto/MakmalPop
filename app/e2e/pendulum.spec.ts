import { expect, test } from '@playwright/test'
import { openPendulum, playToRun, takeReading, tap } from './helpers'

test.use({ viewport: { width: 915, height: 412 } })

test('full pendulum loop: variables, predict, run, explain, formula unlock', async ({ page }) => {
  await openPendulum(page)

  // A wrong variable setup shows the fair-test hint.
  await tap(page, 'mission-direct')
  await tap(page, 'place-length-responding')
  await tap(page, 'place-period-manipulated')
  await tap(page, 'place-mass-constant')
  await tap(page, 'place-amplitude-constant')
  await tap(page, 'variables-check')
  await expect(page.getByRole('alert')).toContainText('Ini bukan ujian yang adil')

  // Fix it and continue.
  await tap(page, 'place-length-manipulated')
  await tap(page, 'place-period-responding')
  await tap(page, 'variables-check')
  await tap(page, 'predict-0')
  await tap(page, 'stake-2')

  // Continue stays disabled until 5 readings span the range.
  for (const l of [20, 40, 60, 80]) await takeReading(page, l)
  await expect(page.getByTestId('run-continue')).toBeDisabled()
  await takeReading(page, 100)
  // T at 1 m is 2.006 s; the reading includes up to 0.3 s of reaction error over 20 swings (±0.015 s).
  await expect(page.getByTestId('notebook')).toContainText(/(1\.99\d|2\.0[0-2]\d)/)
  await tap(page, 'run-continue')

  await tap(page, 'explain-0')
  await tap(page, 'explain-continue')

  // The curved graph does not unlock; T² vs l does.
  await tap(page, 'graph-T-vs-l')
  await expect(page.getByTestId('formula-confirm')).toHaveCount(0)
  await tap(page, 'graph-T2-vs-l')
  await tap(page, 'formula-confirm')
  await expect(page.getByTestId('left-page')).toContainText('Misi selesai')

  await expect(page.getByTestId('formula-flap')).toBeEnabled()
  // Give the page's own React root (drei <Html>) a moment after the unlock before tapping.
  await page.waitForTimeout(800)
  await tap(page, 'formula-flap')
  await expect(page.getByTestId('formula-flap')).toHaveAttribute('aria-expanded', 'true')
})

test('progress is saved and the page shows a sticker on the contents page', async ({ page }) => {
  await openPendulum(page)
  await playToRun(page)
  for (const l of [20, 40, 60, 80, 100]) await takeReading(page, l)
  await tap(page, 'run-continue')
  await tap(page, 'explain-0')
  await tap(page, 'explain-continue')
  await tap(page, 'graph-T2-vs-l')
  await tap(page, 'formula-confirm')
  // Progress is written to IndexedDB in the background; the next page unlocking shows the write landed.
  await expect(page.getByTestId('nav-next')).toBeEnabled()
  await page.reload()
  await tap(page, 'cover-student')
  await expect(page.getByTestId('contents-t4-bab1-bandul')).toContainText('Bandul Ringkas')
  await expect(page.getByTestId('contents-t4-bab1-bandul').getByTitle('Selesai')).toBeVisible()
})

test('Cikgu Silap: find all 3 planted mistakes for bonus points', async ({ page }) => {
  await openPendulum(page)
  await playToRun(page)
  for (const l of [20, 40, 60, 80, 100]) await takeReading(page, l)
  await tap(page, 'run-continue')
  await tap(page, 'explain-0')
  await tap(page, 'explain-continue')
  await tap(page, 'graph-T2-vs-l')
  await tap(page, 'formula-confirm')
  await expect(page.getByTestId('mistakes-start')).toBeVisible()
  await page.waitForTimeout(500)
  await tap(page, 'mistakes-start')
  await expect(page.getByTestId('mistake-picker')).toBeVisible()

  // A wrong reason first: no point for that mistake, but it can still be found.
  await tap(page, 'hotspot-parallax')
  await tap(page, 'reason-1')
  await tap(page, 'reason-0')
  for (const id of ['timing-one-oscillation', 'large-amplitude']) {
    await tap(page, `hotspot-${id}`)
    await tap(page, 'reason-0')
  }
  await expect(page.getByTestId('mistake-picker')).toContainText('Semua kesilapan ditemui')
  await tap(page, 'mistakes-end')
  // 6 points from the main loop (+1 variables, +2 stake, +1 explain, +2 formula) and +2 from Cikgu Silap.
  await expect(page.getByTestId('left-page')).toContainText('8 mata')
  await expect(page.getByTestId('left-page')).toContainText('3/3')
})
