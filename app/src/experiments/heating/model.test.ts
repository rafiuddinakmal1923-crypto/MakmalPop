import { describe, expect, it } from 'vitest'
import { checkUnlock } from '../../game/unlock'
import { bundledPackSources, parsePack } from '../../storage/packs'
import { exactRng, seededRng } from '../types'
import { heatingMeta } from './meta'
import { BOILING_C, ETA_BARE, measure, measuredC, ROOM_C, simulate, SPECIFIC_HEAT, temperatureRise } from './model'

describe('heating model', () => {
  it('Δθ = Pt/(mc) for known values', () => {
    // 100 W for 300 s into 0.5 kg of water: 30000 J / (0.5 × 4200) = 14.29 °C
    expect(temperatureRise(100, 300, 0.5, SPECIFIC_HEAT.water)).toBeCloseTo(14.2857, 4)
    // Aluminium heats up 4200/900 times faster than the same mass of water.
    expect(temperatureRise(50, 120, 1, SPECIFIC_HEAT.aluminium)).toBeCloseTo(6.6667, 4)
  })

  it('measured c is the true value with insulation and higher without', () => {
    const insulated = measure({ time_s: 300, mass_g: 500, power_W: 100, insulated: 1 }, exactRng)
    expect(measuredC(100, 300, 0.5, insulated.dtheta_C)).toBeCloseTo(4200, 6)
    const bare = measure({ time_s: 300, mass_g: 500, power_W: 100, insulated: 0 }, exactRng)
    expect(measuredC(100, 300, 0.5, bare.dtheta_C)).toBeCloseTo(4200 / ETA_BARE, 6)
  })

  it('water stops at 100 °C', () => {
    const s = simulate({ time_s: 900, mass_g: 100, power_W: 200 }, 900)
    expect(s.theta).toBe(BOILING_C)
    expect(s.boiling).toBe(true)
  })

  it('starts at room temperature and the heater is on while running', () => {
    expect(simulate({ time_s: 300 }, 0).theta).toBe(ROOM_C)
    expect(simulate({ time_s: 300 }, 150).heaterOn).toBe(true)
    expect(simulate({ time_s: 300 }, 300).heaterOn).toBe(false)
  })

  it('planted mistakes shift the reading: thermometer on the heater reads high, no stirring reads low', () => {
    const base = measure({ time_s: 300 }, exactRng).theta_C
    expect(measure({ time_s: 300, thermometerOnHeater: true }, exactRng).theta_C).toBeGreaterThan(base + 5)
    expect(measure({ time_s: 300, stirred: false }, exactRng).theta_C).toBeLessThan(base - 1)
  })

  it('reading error is repeatable with a seed and switched off by default', () => {
    const a = measure({ time_s: 300, humanError: true }, seededRng(5)).theta_C
    const b = measure({ time_s: 300, humanError: true }, seededRng(5)).theta_C
    expect(a).toBe(b)
    expect(Math.abs(a - measure({ time_s: 300 }, exactRng).theta_C)).toBeLessThanOrEqual(0.3)
  })
})

describe('heating unlock', () => {
  const times = [60, 120, 180, 240, 300, 360, 420, 480, 540, 600]
  const rows = (rng = exactRng, humanError = false) => times.map((t, i) => measure({ time_s: t, humanError }, i % 2 ? rng : seededRng(i)))
  const range: [number, number] = [60, 600]

  it('Δθ vs t passes, also with reading error', () => {
    for (const r of [rows(), rows(seededRng(9), true)]) {
      const res = checkUnlock({ x: r.map((x) => x.t_s), y: r.map((x) => x.dtheta_C), manipulated: times, range })
      expect(res.ok).toBe(true)
    }
  })

  it('raw θ vs t fails (it starts at room temperature)', () => {
    const r = rows()
    expect(checkUnlock({ x: r.map((x) => x.t_s), y: r.map((x) => x.theta_C), manipulated: times, range }).reason).toBe('curved')
  })
})

describe('bundled heating pages', () => {
  const pages = Object.entries(bundledPackSources).flatMap(([n, src]) => parsePack(src, n).pages.filter((p) => p.template === 'heating'))

  it('exist', () => expect(pages.length).toBeGreaterThan(0))

  it('never pass 95 °C anywhere in their ranges', () => {
    for (const p of pages) {
      const range = (key: string, def: number): [number, number] => p.ranges[key] ?? [def, def]
      const c = (k: string) => heatingMeta.controls.find((x) => x.key === k)!
      const [, tMax] = range('time_s', c('time_s').safeMax)
      const [mMin] = range('mass_g', c('mass_g').default)
      const [, pMax] = range('power_W', c('power_W').default)
      const hottest = simulate({ time_s: tMax, mass_g: mMin, power_W: pMax, material: 0, insulated: 1, thermometerOnHeater: true }, tMax)
      expect(hottest.theta).toBeLessThan(95)
    }
  })
})
