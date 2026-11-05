/** Scoring rules (SDS 6.1). Pure; shared by student mode and class mode. */
export const POINTS = {
  variablesFirstTry: 1,
  explainCorrect: 1,
  formulaDiscovered: 2,
  mistakeFound: 1,
} as const

export type Stake = 1 | 2 | 3

/** Score after a prediction: correct wins the stake, wrong loses it, never below 0. */
export function applyPrediction(score: number, stake: Stake, correct: boolean): number {
  return Math.max(0, score + (correct ? stake : -stake))
}

/** Add points, never going below 0. */
export function addPoints(score: number, points: number): number {
  return Math.max(0, score + points)
}
