import type { TemplateMeta } from '../types'

/**
 * Heating / specific heat capacity (Form 4, Bab 4, 4.2). Time is the manipulated variable (build prompt 7.2;
 * check against the textbook's 4.2 experiment, docs/textbook-check.md row 6).
 */
export const heatingMeta: TemplateMeta = {
  id: 'heating',
  variableIds: ['time', 'temperatureRise', 'waterMass', 'power', 'material'],
  controls: [
    { key: 'time_s', kind: 'slider', variableId: 'time', unit: 's', safeMin: 30, safeMax: 900, step: 60, default: 300 },
    { key: 'mass_g', kind: 'slider', variableId: 'waterMass', unit: 'g', safeMin: 100, safeMax: 1000, step: 50, default: 500 },
    { key: 'power_W', kind: 'slider', variableId: 'power', unit: 'W', safeMin: 20, safeMax: 200, step: 10, default: 100 },
    // 0 = water, 1 = aluminium (a number so content packs can set it like any other control).
    { key: 'material', kind: 'slider', variableId: 'material', unit: '', safeMin: 0, safeMax: 1, step: 1, default: 0 },
    { key: 'insulated', kind: 'toggle', variableId: 'material', unit: '', safeMin: 0, safeMax: 1, step: 1, default: 1 },
  ],
  manipulatedControl: 'time_s',
  quantities: [
    { id: 'time_s', unit: 's', decimals: 0 },
    { id: 't_s', unit: 's', decimals: 0 },
    { id: 'theta_C', unit: '°C', decimals: 1 },
    { id: 'dtheta_C', unit: '°C', decimals: 1 },
  ],
  columns: ['t_s', 'theta_C', 'dtheta_C'],
  graphs: [
    // Raw temperature starts at room temperature, so it never passes through the origin.
    { id: 'theta-vs-t', x: 't_s', y: 'theta_C', straight: false },
    { id: 'dtheta-vs-t', x: 't_s', y: 'dtheta_C', straight: true },
  ],
  mistakeIds: ['thermometer-on-heater', 'no-stirring', 'no-insulation'],
  // Cikgu Silap replay: thermometer touching the heater, no stirring, no lagging.
  mistakeReplay: { time_s: 300, insulated: 0, thermometerOnHeater: true, stirred: false },
  // A 600 s heating run would take a minute at 10x; 60x plays it in about 13 s.
  fastForward: 60,
  // "Susun sendiri": slots match the scene's own frame (beaker at x = 0.35, heater x = 0.17, supply x = -1.1).
  assembly: {
    parts: [
      { id: 'beaker', slot: [0.35, 0.5, -0.6] },
      { id: 'power', slot: [-1.1, 0.45, -0.9] },
      { id: 'heater', slot: [-0.13, 1.75, -1.0], requires: ['beaker'] },
      { id: 'thermometer', slot: [0.87, 2.0, -0.85], requires: ['beaker'] },
      { id: 'stirrer', slot: [0.4, 1.25, -1.5], requires: ['beaker'] },
      { id: 'lagging', slot: [1.25, 0.6, -1.0], requires: ['beaker'] },
    ],
    distractors: ['bob', 'rule'],
  },
}
