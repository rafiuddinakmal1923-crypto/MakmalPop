/**
 * Heating and specific heat capacity (Form 4, Bab 4, 4.2). Pure functions only: no React, no three.js.
 *
 *   Q = mcΔθ,  Δθ = ηPt / (mc),  c_exp = Pt / (mΔθ)
 *
 * η is the share of heat kept by the material: 1.0 with the lagging jacket, 0.85 without, so the measured c
 * comes out higher than the true value when there is no insulation (a discussion point). Water stops at 100 °C.
 */
import type { Rng, Settings, TemplateModel } from '../types'
import { heatingMeta } from './meta'

/** Specific heat capacities, J kg⁻¹ °C⁻¹ (check against the textbook, docs/textbook-check.md rows 7-8). */
export const SPECIFIC_HEAT = { water: 4200, aluminium: 900 } as const
export const ROOM_C = 27
export const BOILING_C = 100
export const ETA_INSULATED = 1.0
export const ETA_BARE = 0.85
/** A thermometer touching the heater reads this much too high (Cikgu Silap). */
export const HEATER_CONTACT_C = 6
/** Without stirring, the thermometer sits in a cooler layer and reads low by up to this much. */
export const UNSTIRRED_C = 1.5

interface Resolved {
  massKg: number
  powerW: number
  c: number
  isWater: boolean
  eta: number
  timeS: number
  thermometerOnHeater: boolean
  stirred: boolean
  humanError: boolean
}

function resolve(settings: Settings): Resolved {
  const num = (k: string, d: number) => (typeof settings[k] === 'number' ? (settings[k] as number) : d)
  const isWater = num('material', 0) === 0
  const insulated = settings.insulated === false ? false : num('insulated', 1) !== 0
  return {
    massKg: num('mass_g', 500) / 1000,
    powerW: num('power_W', 100),
    c: isWater ? SPECIFIC_HEAT.water : SPECIFIC_HEAT.aluminium,
    isWater,
    eta: insulated ? ETA_INSULATED : ETA_BARE,
    timeS: num('time_s', 300),
    thermometerOnHeater: settings.thermometerOnHeater === true,
    stirred: settings.stirred !== false,
    humanError: settings.humanError === true,
  }
}

/** True temperature rise after t seconds of heating (°C), before any boiling cap. */
export function temperatureRise(powerW: number, timeS: number, massKg: number, c: number, eta = 1): number {
  return (eta * powerW * timeS) / (massKg * c)
}

/** Specific heat capacity worked out from a reading, ignoring heat loss: c_exp = Pt / (mΔθ). */
export function measuredC(powerW: number, timeS: number, massKg: number, riseC: number): number {
  return (powerW * timeS) / (massKg * riseC)
}

function trueTemperature(r: Resolved, t: number): number {
  const theta = ROOM_C + temperatureRise(r.powerW, t, r.massKg, r.c, r.eta)
  return r.isWater ? Math.min(BOILING_C, theta) : theta
}

/** What the thermometer shows (planted mistakes shift it). */
function thermometerTemperature(r: Resolved, t: number): number {
  let theta = trueTemperature(r, t)
  if (r.thermometerOnHeater && t > 0) theta += HEATER_CONTACT_C * Math.min(1, t / 30)
  if (!r.stirred) theta -= UNSTIRRED_C * Math.min(1, t / 120)
  return theta
}

export interface HeatingState {
  /** Simulated time, seconds. */
  t: number
  /** Thermometer reading, °C. */
  theta: number
  /** Fraction of the way from room temperature to 100 °C (for the thermometer column). */
  level: number
  heaterOn: boolean
  boiling: boolean
}

export function simulate(settings: Settings, t: number): HeatingState {
  const r = resolve(settings)
  const tt = Math.min(Math.max(0, t), r.timeS)
  const theta = thermometerTemperature(r, tt)
  return {
    t: tt,
    theta,
    level: Math.min(1, Math.max(0, (theta - ROOM_C) / (BOILING_C - ROOM_C))),
    heaterOn: t > 0 && t < r.timeS,
    boiling: r.isWater && trueTemperature(r, tt) >= BOILING_C,
  }
}

/** Thermometer reading error: 0.1-0.3 °C either way. rng = 0.5 (exactRng) gives zero. */
export function readingError(rng: Rng): number {
  const u = rng() * 2 - 1
  if (u === 0) return 0
  return Math.sign(u) * (0.1 + 0.2 * Math.abs(u))
}

export function measure(settings: Settings, rng: Rng) {
  const r = resolve(settings)
  const theta = thermometerTemperature(r, r.timeS) + (r.humanError ? readingError(rng) : 0)
  return {
    time_s: r.timeS,
    t_s: r.timeS,
    theta_C: theta,
    dtheta_C: theta - ROOM_C,
  }
}

export function runDuration(settings: Settings): number {
  return resolve(settings).timeS
}

export const heatingModel: TemplateModel<HeatingState> = {
  meta: heatingMeta,
  simulate,
  measure,
  runDuration,
}
