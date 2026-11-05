import { describe, expect, it } from 'vitest'
import { exactRng, seededRng } from '../types'
import { largeAnglePeriod, measure, period, reactionError, runDuration, simulate } from './model'

describe('pendulum period', () => {
  it.each([
    [0.1, 0.634],
    [0.5, 1.419],
    [1.0, 2.006],
  ])('T at l = %s m is %s s', (l, T) => {
    expect(period(l)).toBeCloseTo(T, 3)
  })

  it('T² is proportional to l with gradient 4π²/g', () => {
    const k = (4 * Math.PI ** 2) / 9.81
    for (const l of [0.2, 0.6, 1]) expect(period(l) ** 2 / l).toBeCloseTo(k, 9)
  })

  it('mass has no effect', () => {
    const a = measure({ length_cm: 60, mass_g: 50 }, exactRng)
    const b = measure({ length_cm: 60, mass_g: 200 }, exactRng)
    expect(a.T_s).toBe(b.T_s)
  })

  it('caps amplitude at 10 degrees outside the large-angle replay', () => {
    const s = simulate({ length_cm: 50, amplitude_deg: 30 }, 0)
    expect(s.theta).toBeCloseTo((10 * Math.PI) / 180, 9)
  })
})

describe('large-angle replay (Cikgu Silap)', () => {
  it('is about 1.7% longer at 30 degrees', () => {
    const ratio = largeAnglePeriod(0.5, 30) / period(0.5)
    expect(ratio).toBeCloseTo(1.0171, 3)
    const m = measure({ length_cm: 50, amplitude_deg: 30, largeAngle: true }, exactRng)
    expect(m.T_s / period(0.5)).toBeCloseTo(1.0171, 3)
  })
})

describe('readings', () => {
  it('times 20 oscillations and divides by 20', () => {
    const m = measure({ length_cm: 100 }, exactRng)
    expect(m.t20_s).toBeCloseTo(20 * period(1), 9)
    expect(m.T_s).toBeCloseTo(period(1), 9)
    expect(m.T2_s2).toBeCloseTo(period(1) ** 2, 9)
    expect(runDuration({ length_cm: 100 })).toBeCloseTo(20 * period(1), 9)
  })

  it('reaction error is 0.1-0.3 s and repeatable with a seed', () => {
    const a = seededRng(42)
    const b = seededRng(42)
    for (let i = 0; i < 200; i++) {
      const e = reactionError(a)
      expect(e).toBe(reactionError(b))
      expect(Math.abs(e)).toBeGreaterThanOrEqual(0.1)
      expect(Math.abs(e)).toBeLessThanOrEqual(0.3)
    }
    expect(reactionError(exactRng)).toBe(0)
  })

  it('human error only applies when switched on', () => {
    const rng = seededRng(1)
    expect(measure({ length_cm: 50 }, rng).T_s).toBeCloseTo(period(0.5), 12)
    expect(measure({ length_cm: 50, humanError: true }, rng).T_s).not.toBeCloseTo(period(0.5), 4)
  })

  it('counts complete oscillations', () => {
    const T = period(0.5)
    expect(simulate({ length_cm: 50 }, 2.5 * T).oscillations).toBe(2)
    expect(simulate({ length_cm: 50 }, 20 * T).oscillations).toBe(20)
  })
})
