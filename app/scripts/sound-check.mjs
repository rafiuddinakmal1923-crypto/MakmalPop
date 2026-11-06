// Measures the app's audio without speakers: taps through the pendulum page in headless Chromium with a level
// meter spliced in before the speakers, and reports peak/RMS for silence, music, effects and mute.
// Run with the dev server up: node scripts/sound-check.mjs
import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

await page.addInitScript(() => {
  const Real = window.AudioContext
  window.__meter = { peak: 0, sumSq: 0, n: 0, contexts: 0 }
  window.AudioContext = class extends Real {
    constructor(...a) {
      super(...a)
      window.__meter.contexts++
      const tap = this.createGain()
      const an = this.createAnalyser()
      an.fftSize = 2048
      tap.connect(an)
      tap.connect(super.destination)
      Object.defineProperty(this, 'destination', { get: () => tap })
      const buf = new Float32Array(an.fftSize)
      setInterval(() => {
        an.getFloatTimeDomainData(buf)
        for (const v of buf) {
          const a = Math.abs(v)
          if (a > window.__meter.peak) window.__meter.peak = a
          window.__meter.sumSq += v * v
          window.__meter.n++
        }
      }, 20)
    }
  }
})

const reset = () => page.evaluate(() => Object.assign(window.__meter, { peak: 0, sumSq: 0, n: 0 }))
const read = async (label) => {
  const m = await page.evaluate(() => window.__meter)
  const rms = m.n ? Math.sqrt(m.sumSq / m.n) : 0
  console.log(`${label.padEnd(28)} peak ${m.peak.toFixed(3)}  rms ${rms.toFixed(4)}  (${m.contexts} context)`)
  return { peak: m.peak, rms }
}
const tap = (id) => page.getByTestId(id).click({ force: true })

await page.goto(process.env.URL ?? 'http://localhost:5173/')
await page.waitForTimeout(2500)
await reset()
await page.waitForTimeout(800)
const before = await read('before any tap')

await tap('cover-student') // first gesture: unlocks audio, starts music, page flip
await page.waitForTimeout(1200)
await reset()
await page.waitForTimeout(5000)
const music = await read('music only (5 s)')

await tap('contents-t4-bab1-bandul')
await page.waitForTimeout(300)
await reset()
await page.waitForTimeout(1200)
const popups = await read('page flip + pop-ups')

await tap('mission-accept')
for (const [id, slot] of [['length', 'manipulated'], ['period', 'responding'], ['mass', 'constant'], ['amplitude', 'constant']]) await tap(`place-${id}-${slot}`)
await reset()
await tap('variables-check')
await page.waitForTimeout(900)
const ding = await read('correct answer (ding)')
await tap('predict-0')
await reset()
await tap('stake-3')
await page.waitForTimeout(600)
const coin = await read('stake 3 (coins)')
await reset()
await tap('run-go')
await page.waitForTimeout(3000)
const ticks = await read('run (tick-tock)')

await page.evaluate(() => {
  const raw = localStorage.getItem('makmalpop-settings')
  void raw
})
await tap('nav-sound') // mute everything
await page.waitForTimeout(1500)
await reset()
await page.waitForTimeout(2000)
const muted = await read('muted')

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no page errors')
const ok =
  before.peak < 0.001 && music.rms > 0.002 && music.peak < 0.95 && popups.peak > 0.01 && ding.peak > music.peak * 0.8 && coin.peak > 0.01 && ticks.peak > 0.01 && muted.peak < 0.002 && !errors.length
console.log(ok ? 'SOUND CHECK PASSED' : 'SOUND CHECK FAILED')
await browser.close()
process.exit(ok ? 0 : 1)
