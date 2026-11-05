import type { TemplateMeta } from '../types'

export const pendulumMeta: TemplateMeta = {
  id: 'pendulum',
  variableIds: ['length', 'period', 'mass', 'amplitude'],
  controls: [
    { key: 'length_cm', kind: 'slider', variableId: 'length', unit: 'cm', safeMin: 10, safeMax: 100, step: 10, default: 50 },
    { key: 'mass_g', kind: 'slider', variableId: 'mass', unit: 'g', safeMin: 20, safeMax: 200, step: 10, default: 50 },
    // Capped at 10 degrees: the small-angle formula only holds for small swings.
    { key: 'amplitude_deg', kind: 'slider', variableId: 'amplitude', unit: '°', safeMin: 3, safeMax: 10, step: 1, default: 8 },
  ],
  manipulatedControl: 'length_cm',
  quantities: [
    { id: 'length_cm', unit: 'cm', decimals: 0 },
    { id: 'length_m', unit: 'm', decimals: 2 },
    { id: 't20_s', unit: 's', decimals: 1 },
    { id: 'T_s', unit: 's', decimals: 3 },
    { id: 'T2_s2', unit: 's²', decimals: 3 },
  ],
  columns: ['length_cm', 't20_s', 'T_s', 'T2_s2'],
  graphs: [
    { id: 'T-vs-l', x: 'length_m', y: 'T_s', straight: false },
    { id: 'T2-vs-l', x: 'length_m', y: 'T2_s2', straight: true },
  ],
  mistakeIds: ['parallax', 'timing-one-oscillation', 'large-amplitude'],
}
