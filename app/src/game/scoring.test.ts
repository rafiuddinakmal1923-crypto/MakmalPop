import { describe, expect, it } from 'vitest'
import { applyPrediction, addPoints } from './scoring'

describe('scoring', () => {
  it('a correct prediction wins the stake', () => expect(applyPrediction(2, 3, true)).toBe(5))
  it('a wrong prediction loses the stake', () => expect(applyPrediction(5, 2, false)).toBe(3))
  it('the score never goes below 0', () => {
    expect(applyPrediction(1, 3, false)).toBe(0)
    expect(addPoints(0, -4)).toBe(0)
  })
})
