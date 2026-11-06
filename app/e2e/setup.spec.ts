import { expect, test } from '@playwright/test'
import { dragPart, tap } from './helpers'

test.use({ viewport: { width: 1280, height: 720 } })

async function openSetUp(page: import('@playwright/test').Page) {
  await page.goto('/')
  await tap(page, 'cover-student')
  await tap(page, 'contents-t4-bab1-bandul')
  await tap(page, 'mission-setup')
  await expect(page.getByTestId('parts-shelf')).toBeVisible()
}

test('Susun sendiri: wrong piece, wrong order, then a full build by drag and by tap', async ({ page }) => {
  await openSetUp(page)
  // A piece that is not needed is rejected and stays on the shelf.
  await dragPart(page, 'beaker', 'stand')
  await expect(page.getByRole('status')).toContainText('Radas ini tidak diperlukan')
  await expect(page.getByTestId('part-beaker')).toBeVisible()
  // The clamp needs the retort stand first.
  await dragPart(page, 'clamp', 'clamp')
  await expect(page.getByRole('status')).toContainText('Letakkan kaki retort dahulu')

  await dragPart(page, 'stand', 'stand')
  await expect(page.getByTestId('slot-stand')).toHaveCount(0)
  await dragPart(page, 'rule', 'rule')
  // Tap-then-tap also works.
  await tap(page, 'part-clamp')
  await tap(page, 'slot-clamp')
  await dragPart(page, 'protractor', 'protractor')
  await dragPart(page, 'bob', 'bob')

  // Done: on to the variables step, no set-up point because of the mistakes.
  await expect(page.getByTestId('parts-shelf')).toHaveCount(0)
  await expect(page.getByTestId('chip-length')).toBeVisible()
  await expect(page.getByTestId('left-page')).toContainText('★ 0')
})

test('Susun sendiri: a perfect build earns +1 and the run works on the built apparatus', async ({ page }) => {
  await openSetUp(page)
  for (const p of ['stand', 'clamp', 'protractor', 'bob', 'rule']) await dragPart(page, p, p)
  await expect(page.getByTestId('left-page')).toContainText('★ 1')
  for (const [id, slot] of [
    ['length', 'manipulated'],
    ['period', 'responding'],
    ['mass', 'constant'],
    ['amplitude', 'constant'],
  ])
    await tap(page, `place-${id}-${slot}`)
  await tap(page, 'variables-check')
  await tap(page, 'predict-0')
  await tap(page, 'stake-1')
  await page.getByTestId('control-slider').fill('60', { force: true })
  await tap(page, 'run-go')
  await tap(page, 'run-skip')
  await expect(page.getByTestId('notebook')).toContainText('1.5') // T at 60 cm is about 1.55 s
})
