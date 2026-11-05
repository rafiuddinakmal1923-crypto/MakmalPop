/**
 * Variable chips, quantity symbols and apparatus labels for every template.
 * Lane B: add the heating keys (var.time, var.temperatureRise, q.theta_C, label.heater, ...) in a block of your own.
 */
export const experiments = {
  ms: {
    // pendulum
    'var.length': 'Panjang tali',
    'var.period': 'Tempoh ayunan',
    'var.mass': 'Jisim ladung',
    'var.amplitude': 'Sudut ayunan',
    'q.length_cm': 'l',
    'q.length_m': 'l',
    'q.t20_s': 't₂₀',
    'q.T_s': 'T',
    'q.T2_s2': 'T²',
    'label.stand': 'kaki retort',
    'label.bob': 'ladung',
    'label.rule': 'pembaris meter',
    'label.protractor': 'protraktor',
  },
  en: {
    'var.length': 'String length',
    'var.period': 'Period',
    'var.mass': 'Bob mass',
    'var.amplitude': 'Swing angle',
    'q.length_cm': 'l',
    'q.length_m': 'l',
    'q.t20_s': 't₂₀',
    'q.T_s': 'T',
    'q.T2_s2': 'T²',
    'label.stand': 'retort stand',
    'label.bob': 'bob',
    'label.rule': 'metre rule',
    'label.protractor': 'protractor',
  },
} as const
