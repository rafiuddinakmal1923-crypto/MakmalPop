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
  // Cikgu Silap replay: a 60 cm string swung at 30° (past the 10° cap), timed for one swing, ruler read at a slant.
  mistakeReplay: { length_cm: 60, amplitude_deg: 30, largeAngle: true },
  // "Susun sendiri": slots match the scene (pivot at [0.2, 2.45, -1.1], rod at x = -1.0, rule at x = 0.85).
  assembly: {
    parts: [
      // Marks sit at (or just in front of) where each part goes, spread out so 56 px marks never overlap.
      { id: 'stand', slot: [-0.6, 0.15, -0.5] },
      { id: 'clamp', slot: [-0.5, 2.6, -1.1], requires: ['stand'] },
      { id: 'protractor', slot: [0.65, 2.45, -1.1], requires: ['clamp'] },
      { id: 'bob', slot: [0.2, 1.2, -0.5], requires: ['clamp'] },
      { id: 'rule', slot: [1.3, 0.9, -0.6] },
    ],
    distractors: ['beaker', 'thermometer'],
  },
}
