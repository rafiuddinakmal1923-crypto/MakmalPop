import { expect, test } from '@playwright/test'
import { tap } from './helpers'

test.use({ viewport: { width: 1920, height: 1080 } })

test('class mode: 3 taps to start, 2 teams, 3 rounds, winner', async ({ page }) => {
  await page.goto('/')
  // Tap 1: Mod Kelas. Tap 2: the experiment (locks are ignored in class mode). Tap 3: Mula.
  await tap(page, 'cover-class')
  await page.getByTestId('contents-t4-bab4-muatan-haba-tentu').waitFor()
  await tap(page, 'contents-t4-bab1-bandul')
  await tap(page, 'class-start')
  await expect(page.getByTestId('scoreboard')).toContainText('Pasukan B')

  for (let round = 0; round < 3; round++) {
    await expect(page.getByTestId('classmode')).toContainText(`Pusingan ${round + 1} / 3`)
    await expect(page.getByTestId('class-run')).toBeDisabled()
    await tap(page, 'class-pick-A-0')
    await tap(page, 'class-stake-A-3')
    await tap(page, 'class-pick-B-1')
    await tap(page, 'class-run')
    await tap(page, 'class-skip')
    await page.getByTestId('class-next').waitFor()
    await tap(page, 'class-next')
  }

  // Round answers are 0, 2 and 1: A wins 3 then loses 3 (floor 0) then loses; B only wins the last round.
  await expect(page.getByTestId('class-winner')).toContainText('Pasukan B')
  await expect(page.getByTestId('score-A')).toHaveText('0')
  await expect(page.getByTestId('score-B')).toHaveText('1')
})
