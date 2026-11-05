import { describe, expect, it } from 'vitest'
import { checkUnlock } from './unlock'
import { measure, period, G } from '../experiments/pendulum/model'
import { exactRng, type Rng } from '../experiments/types'

const RANGE: [number, number] = [20, 100]

function pendulumReadings(lengthsCm: number[], rngFor: (i: number) => Rng = () => exactRng, humanError = false) {
  const rows = lengthsCm.map((l, i) => measure({ length_cm: l, humanError }, rngFor(i)))
  return {
    manipulated: lengthsCm,
    lengthM: rows.map((r) => r.length_m),
    T: rows.map((r) => r.T_s),
    T2: rows.map((r) => r.T2_s2),
  }
}

/** rng that always produces the largest error (+0.3 s or -0.3 s). */
const maxErr = (sign: 1 | -1): Rng => () => (sign > 0 ? 0.999999 : 0)

describe('formula unlock rule', () => {
  const full = pendulumReadings([20, 30, 40, 50, 60, 70, 80, 90, 100])

  it('T² vs l passes with exact readings, gradient 4π²/g', () => {
    const r = checkUnlock({ x: full.lengthM, y: full.T2, manipulated: full.manipulated, range: RANGE })
    expect(r.ok).toBe(true)
    expect(r.k).toBeCloseTo((4 * Math.PI ** 2) / G, 6)
  })

  it('T² vs l passes with the largest reaction-time error, alternating sign', () => {
    const d = pendulumReadings([20, 30, 40, 50, 60, 70, 80, 90, 100], (i) => maxErr(i % 2 ? 1 : -1), true)
    const r = checkUnlock({ x: d.lengthM, y: d.T2, manipulated: d.manipulated, range: RANGE })
    expect(r.ok).toBe(true)
    expect(r.residual!).toBeLessThan(0.03)
  })

  it('T vs l fails over 20-100 cm (curved)', () => {
    const r = checkUnlock({ x: full.lengthM, y: full.T, manipulated: full.manipulated, range: RANGE })
    expect(r).toMatchObject({ ok: false, reason: 'curved' })
    expect(r.residual!).toBeGreaterThan(0.15)
  })

  it('T vs l fails over 50-100 cm, where plain R² would wrongly pass', () => {
    const d = pendulumReadings([50, 60, 70, 80, 90, 100])
    const r = checkUnlock({ x: d.lengthM, y: d.T, manipulated: d.manipulated, range: RANGE })
    expect(r).toMatchObject({ ok: false, reason: 'curved' })
    expect(r.residual!).toBeGreaterThan(0.1)
  })

  it('fails with fewer than 5 readings', () => {
    const d = pendulumReadings([20, 40, 60, 100])
    expect(checkUnlock({ x: d.lengthM, y: d.T2, manipulated: d.manipulated, range: RANGE }).reason).toBe('too-few')
  })

  it('fails with 5 readings at only 2 distinct lengths', () => {
    const d = pendulumReadings([20, 20, 20, 100, 100])
    expect(checkUnlock({ x: d.lengthM, y: d.T2, manipulated: d.manipulated, range: RANGE }).reason).toBe('too-few')
  })

  it('fails when readings span under 60% of the range', () => {
    const d = pendulumReadings([60, 70, 80, 90, 100])
    expect(checkUnlock({ x: d.lengthM, y: d.T2, manipulated: d.manipulated, range: RANGE }).reason).toBe('narrow-span')
  })

  it('heating Δθ vs t passes (straight through the origin)', () => {
    const t = [60, 120, 180, 240, 300, 360]
    const rise = t.map((s) => (0.85 * 50 * s) / (0.5 * 4200))
    expect(checkUnlock({ x: t, y: rise, manipulated: t, range: [0, 600] }).ok).toBe(false) // span 300 < 360
    const t2 = [60, 150, 240, 330, 420, 510]
    const rise2 = t2.map((s) => (0.85 * 50 * s) / (0.5 * 4200))
    expect(checkUnlock({ x: t2, y: rise2, manipulated: t2, range: [0, 600] }).ok).toBe(true)
  })

  it('raw temperature vs time fails (it starts at room temperature)', () => {
    const t = [60, 150, 240, 330, 420, 510]
    const temp = t.map((s) => 27 + (0.85 * 50 * s) / (0.5 * 4200))
    expect(checkUnlock({ x: t, y: temp, manipulated: t, range: [0, 600] }).reason).toBe('curved')
  })

  it('sanity: T² for 1 m is about 4.02 s²', () => expect(period(1) ** 2).toBeCloseTo(4.024, 2))
})
