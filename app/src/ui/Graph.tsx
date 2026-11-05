/** Small SVG graph (no chart library): points, axes from the origin, and the best line through the origin. */
import { fitThroughOrigin } from '../game/unlock'

export interface GraphProps {
  xs: number[]
  ys: number[]
  xLabel: string
  yLabel: string
  /** Draw the fitted y = kx line. */
  showFit?: boolean
  /** Line colour for the fit (ink by default; good/bad when judged). */
  fitColor?: string
  width?: number
  height?: number
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p
  return 10 * p
}

export function Graph({ xs, ys, xLabel, yLabel, showFit, fitColor = '#262626', width = 260, height = 170 }: GraphProps) {
  const pad = { l: 34, r: 10, t: 10, b: 28 }
  const W = width - pad.l - pad.r
  const H = height - pad.t - pad.b
  const xMax = niceMax(Math.max(0, ...xs) * 1.05)
  const yMax = niceMax(Math.max(0, ...ys) * 1.05)
  const sx = (x: number) => pad.l + (x / xMax) * W
  const sy = (y: number) => pad.t + H - (y / yMax) * H
  const fit = xs.length >= 2 ? fitThroughOrigin(xs, ys) : null
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={`${yLabel} / ${xLabel}`} className="font-mono">
      {ticks.map((f) => (
        <g key={f}>
          <line x1={sx(f * xMax)} x2={sx(f * xMax)} y1={pad.t} y2={pad.t + H} stroke="#262626" strokeOpacity={0.12} />
          <line x1={pad.l} x2={pad.l + W} y1={sy(f * yMax)} y2={sy(f * yMax)} stroke="#262626" strokeOpacity={0.12} />
          <text x={sx(f * xMax)} y={height - 14} fontSize={9} textAnchor="middle" fill="#6B6B6B">
            {+(f * xMax).toFixed(2)}
          </text>
          <text x={pad.l - 4} y={sy(f * yMax) + 3} fontSize={9} textAnchor="end" fill="#6B6B6B">
            {+(f * yMax).toFixed(2)}
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} stroke="#262626" strokeWidth={1.5} />
      <line x1={pad.l} x2={pad.l} y1={pad.t} y2={pad.t + H} stroke="#262626" strokeWidth={1.5} />
      <text x={pad.l + W} y={height - 2} fontSize={11} textAnchor="end" fill="#262626">
        {xLabel}
      </text>
      <text x={4} y={pad.t + 2} fontSize={11} fill="#262626" dominantBaseline="hanging">
        {yLabel}
      </text>
      {showFit && fit && (
        <line x1={sx(0)} y1={sy(0)} x2={sx(xMax)} y2={sy(fit.k * xMax)} stroke={fitColor} strokeWidth={1.5} strokeDasharray="5 4" />
      )}
      {xs.map((x, i) => (
        <g key={i}>
          <line x1={sx(x) - 4} x2={sx(x) + 4} y1={sy(ys[i]) - 4} y2={sy(ys[i]) + 4} stroke="#262626" strokeWidth={1.6} />
          <line x1={sx(x) - 4} x2={sx(x) + 4} y1={sy(ys[i]) + 4} y2={sy(ys[i]) - 4} stroke="#262626" strokeWidth={1.6} />
        </g>
      ))}
    </svg>
  )
}
