/**
 * Formula unlock rule (SDS 6.2, build prompt section 6). Pure and unit-tested.
 *
 * Plain R² is not used: a straight-line fit gives R² ≈ 0.99 for the curved T vs l graph, so it would
 * unlock on the wrong graph. Instead we fit y = kx through the origin and look at the relative RMS residual.
 */
export const MIN_READINGS = 5
export const MIN_SPAN_FRACTION = 0.6
export const MAX_RELATIVE_RESIDUAL = 0.05

export type UnlockReason = 'ok' | 'too-few' | 'narrow-span' | 'curved'

export interface UnlockResult {
  ok: boolean
  reason: UnlockReason
  /** Gradient of the best line through the origin (undefined if there were too few points). */
  k?: number
  /** Relative RMS residual, 0..1. */
  residual?: number
}

export interface UnlockInput {
  x: number[]
  y: number[]
  /** Values of the manipulated variable for each reading (for the distinct-count and span checks). */
  manipulated: number[]
  /** Allowed range of the manipulated variable on this page. */
  range: [number, number]
}

/** Gradient of y = kx through the origin, and the relative RMS residual. */
export function fitThroughOrigin(x: number[], y: number[]): { k: number; residual: number } {
  const sxy = x.reduce((s, v, i) => s + v * y[i], 0)
  const sxx = x.reduce((s, v) => s + v * v, 0)
  const k = sxx === 0 ? 0 : sxy / sxx
  const n = x.length
  const rms = Math.sqrt(y.reduce((s, v, i) => s + (v - k * x[i]) ** 2, 0) / n)
  const meanAbs = y.reduce((s, v) => s + Math.abs(v), 0) / n
  return { k, residual: meanAbs === 0 ? Infinity : rms / meanAbs }
}

export function checkUnlock({ x, y, manipulated, range }: UnlockInput): UnlockResult {
  const distinct = new Set(manipulated.map((v) => Math.round(v * 1e6))).size
  if (x.length < MIN_READINGS || distinct < MIN_READINGS) return { ok: false, reason: 'too-few' }
  const span = Math.max(...manipulated) - Math.min(...manipulated)
  if (span < MIN_SPAN_FRACTION * (range[1] - range[0]) - 1e-9) return { ok: false, reason: 'narrow-span' }
  const { k, residual } = fitThroughOrigin(x, y)
  if (residual > MAX_RELATIVE_RESIDUAL) return { ok: false, reason: 'curved', k, residual }
  return { ok: true, reason: 'ok', k, residual }
}
