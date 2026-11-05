/**
 * The template contract (SDS 3.1, build prompt 7.4).
 *
 * Frozen after milestone A2: both lanes build against this file. Change it only when both lanes agree.
 *
 * A template is split in two so physics stays testable without React:
 *  - `TemplateModel` (meta + pure functions), exported from `<id>/model.ts` and `<id>/meta.ts`
 *  - `Scene`, the React Three Fiber component, exported from `<id>/Scene.tsx`
 */
import type { ComponentType } from 'react'

/** Seeded random number generator returning values in [0, 1). */
export type Rng = () => number

/** Current values of a template's controls, keyed by `Control.key` (for example `length_cm`). */
export type Settings = Record<string, number | boolean>

/** One row of the notebook table, keyed by quantity id (for example `T_s`). */
export type Reading = Record<string, number>

/** A slider or toggle the student (or a Cikgu Silap replay) can set. */
export interface Control {
  key: string
  kind: 'slider' | 'toggle'
  /** Variable chip this control belongs to (for example `length`); used by the variables step. */
  variableId: string
  unit: string
  /** Widest range the physics model is valid for. A content pack may narrow it, never widen it. */
  safeMin: number
  safeMax: number
  step: number
  default: number
}

/** A measured or derived quantity shown in the notebook or on a graph axis. */
export interface Quantity {
  id: string
  /** Unit shown after the value, for example "s" or "s²". */
  unit: string
  /** Decimal places for display. */
  decimals: number
}

/** One choice in the Formula step's "which graph?" picker. */
export interface GraphOption {
  id: string
  /** Quantity ids for the axes. */
  x: string
  y: string
  /** True if readings on this graph should pass the unlock rule (a straight line through the origin). */
  straight: boolean
}

export interface TemplateMeta {
  id: string
  /** Chip ids for the variables step, for example ['length', 'period', 'mass', 'amplitude']. */
  variableIds: string[]
  controls: Control[]
  /** Control key of the manipulated variable; readings must spread across its range. */
  manipulatedControl: string
  quantities: Quantity[]
  /** Notebook table columns, in order (quantity ids). */
  columns: string[]
  graphs: GraphOption[]
  /** Planted mistakes the template can replay for Cikgu Silap. */
  mistakeIds: string[]
}

export interface TemplateModel<State> {
  meta: TemplateMeta
  /** Scene state at simulated time t (seconds). Pure. */
  simulate(settings: Settings, t: number): State
  /** One notebook reading for these settings. Pure given the rng. */
  measure(settings: Settings, rng: Rng): Reading
  /** How long (simulated seconds) one run lasts, for the stopwatch and fast-forward. */
  runDuration(settings: Settings): number
}

export interface SceneProps<State> {
  /**
   * Current scene state (model.simulate at the run clock). Call it inside useFrame; do not store it in
   * React state, so the scene animates without re-rendering React every frame.
   */
  getState: () => State
  settings: Settings
  /** True while a run is playing. */
  running: boolean
  /** Lite mode: skip costly effects. */
  lite: boolean
}
// Wrap each apparatus part in <PopUp index={i}> (book/PopUp.tsx) so it rises out of the page in sequence.

export interface ExperimentTemplate<State = unknown> extends TemplateModel<State> {
  Scene: ComponentType<SceneProps<State>>
}

/** Zero-noise rng for exact readings (always returns 0.5, the middle of the error range). */
export const exactRng: Rng = () => 0.5

/** Small seeded rng (mulberry32) so readings with human error are repeatable in tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
