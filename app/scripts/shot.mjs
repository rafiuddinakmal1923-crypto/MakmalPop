// Quick screenshot helper: node scripts/shot.mjs <outDir> <width>x<height> [steps...]
// Steps: click:<testid> | wait:<ms> | eval:<js> | shot:<name>
import { chromium } from '@playwright/test'
const [outDir, size, ...steps] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text().slice(0, 200)) })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
await page.goto(process.env.URL ?? 'http://localhost:5173/')
await page.waitForTimeout(2500)
for (const s of steps) {
  const [kind, ...rest] = s.split(':')
  const arg = rest.join(':')
  if (kind === 'click') await page.getByTestId(arg).click({ timeout: 5000, force: true }).catch((e) => console.log('click failed', arg, e.message.split('\n')[0]))
  else if (kind === 'fill') { const [id, v] = arg.split('='); await page.getByTestId(id).fill(v, { force: true }) }
  else if (kind === 'reload') { await page.reload(); await page.waitForTimeout(2500) }
  else if (kind === 'unlockall') { await page.evaluate(() => localStorage.setItem('makmalpop-settings', JSON.stringify({ state: { lang: 'ms', liteOverride: null, sound: false, unlockAll: true, demoWatermark: true }, version: 0 }))); await page.reload(); await page.waitForTimeout(2500) }
  else if (kind === 'drag') {
    // drag:<part>=<slot> with a real mouse: press on the shelf card, move in steps, release on the + mark.
    const [part, slot] = arg.split('=')
    const a = await page.getByTestId(`part-${part}`).boundingBox()
    const b = await page.getByTestId(`slot-${slot}`).boundingBox()
    if (!a || !b) { console.log('drag: missing', part, slot); continue }
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 })
    if (process.env.SHOT_MIDDRAG) await page.screenshot({ path: `${outDir}/${process.env.SHOT_MIDDRAG}.png` })
    await page.mouse.up()
  }
  else if (kind === 'wait') await page.waitForTimeout(Number(arg))
  else if (kind === 'eval') console.log(JSON.stringify(await page.evaluate(arg)))
  else if (kind === 'shot') await page.screenshot({ path: `${outDir}/${arg}.png` })
}
await browser.close()
