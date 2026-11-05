/**
 * Simple pendulum (Form 4, Bab 1, 1.2). Pure functions only: no React, no three.js.
 *
 * Small-angle model, T = 2π√(l/g). Amplitude is capped at 10° except in the Cikgu Silap
 * large-amplitude replay, which uses the correction T ≈ T₀(1 + θ₀²/16).
 */
import type { Rng, Settings, TemplateModel } from '../types'
import { pendulumMeta } from './meta'

export const G = 9.81
export const OSCILLATIONS_TIMED = 20
export const MAX_SMALL_ANGLE_DEG = 10
const DEG = Math.PI / 180

/** Small-angle period for a string length in metres. */
export function period(lengthM: number): number {
  return 2 * Math.PI * Math.sqrt(lengthM / G)
}

/** Period with the first large-angle correction. Used only by the Cikgu Silap 30° replay. */
export function largeAnglePeriod(lengthM: number, amplitudeDeg: number): number {
  const theta0 = amplitudeDeg * DEG
  return period(lengthM) * (1 + (theta0 * theta0) / 16)
}

export interface PendulumState {
  /** String angle from vertical, radians (positive to the right). */
  theta: number
  /** Angular velocity, rad/s (for the trail and highlights). */
  omega: number
  /** Complete oscillations finished by time t. */
  oscillations: number
  /** Period used for this run, seconds. */
  period: number
  lengthM: number
}

interface Resolved {
  lengthM: number
  amplitudeDeg: number
  largeAngle: boolean
  oscillations: number
  humanError: boolean
  parallaxCm: number
}

/** Read settings with defaults and the 10° cap. Mistake replays pass `largeAngle`, `oscillations`, `parallax_cm`. */
function resolve(settings: Settings): Resolved {
  const num = (k: string, d: number) => (typeof settings[k] === 'number' ? (settings[k] as number) : d)
  const largeAngle = settings.largeAngle === true
  const amp = num('amplitude_deg', 8)
  return {
    lengthM: num('length_cm', 50) / 100,
    amplitudeDeg: largeAngle ? amp : Math.min(amp, MAX_SMALL_ANGLE_DEG),
    largeAngle,
    oscillations: num('oscillations', OSCILLATIONS_TIMED),
    humanError: settings.humanError === true,
    parallaxCm: num('parallax_cm', 0),
  }
}

function runPeriod(r: Resolved): number {
  return r.largeAngle ? largeAnglePeriod(r.lengthM, r.amplitudeDeg) : period(r.lengthM)
}

export function simulate(settings: Settings, t: number): PendulumState {
  const r = resolve(settings)
  const T = runPeriod(r)
  const w = (2 * Math.PI) / T
  const theta0 = r.amplitudeDeg * DEG
  return {
    theta: theta0 * Math.cos(w * t),
    omega: -theta0 * w * Math.sin(w * t),
    oscillations: Math.floor(t / T + 1e-9),
    period: T,
    lengthM: r.lengthM,
  }
}

/**
 * Reaction-time error on the stopwatch: 0.1-0.3 s, either sign, from the rng.
 * rng = 0.5 (exactRng) gives zero, so exact readings stay exact.
 */
export function reactionError(rng: Rng): number {
  const u = rng() * 2 - 1 // -1..1
  if (u === 0) return 0
  return Math.sign(u) * (0.1 + 0.2 * Math.abs(u))
}

export function measure(settings: Settings, rng: Rng) {
  const r = resolve(settings)
  const T = runPeriod(r)
  const err = r.humanError ? reactionError(rng) : 0
  const tTotal = Math.max(0, r.oscillations * T + err)
  const Tm = tTotal / r.oscillations
  const lengthReadCm = r.lengthM * 100 + r.parallaxCm
  return {
    length_cm: lengthReadCm,
    length_m: lengthReadCm / 100,
    t20_s: tTotal,
    T_s: Tm,
    T2_s2: Tm * Tm,
  }
}

export function runDuration(settings: Settings): number {
  const r = resolve(settings)
  return r.oscillations * runPeriod(r)
}

export const pendulumModel: TemplateModel<PendulumState> = {
  meta: pendulumMeta,
  simulate,
  measure,
  runDuration,
}
