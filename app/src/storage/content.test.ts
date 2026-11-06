import { describe, expect, it } from 'vitest'
import { bundledPackSources, parsePack } from './packs'
import { packSchema } from './packSchema'

describe('bundled content packs', () => {
  for (const [name, src] of Object.entries(bundledPackSources)) {
    it(`${name} passes the schema`, () => {
      expect(() => parsePack(src, name)).not.toThrow()
    })
  }
})

describe('pack schema rejects bad packs', () => {
  const good = structuredClone(bundledPackSources['fizik-t4']) as any
  const bad = (edit: (p: any) => void) => {
    const p = structuredClone(good)
    edit(p.pages[0])
    return packSchema.safeParse(p).success
  }

  it('accepts the bundled pendulum page', () => expect(bad(() => {})).toBe(true))
  it('rejects a missing en field', () => expect(bad((p) => delete p.mission.en)).toBe(false))
  it('rejects an answer index out of range', () => expect(bad((p) => (p.prediction.answer = 9))).toBe(false))
  it('rejects an unknown variable id', () => expect(bad((p) => (p.variables.manipulated = 'colour'))).toBe(false))
  it('rejects an unknown mistake id', () => expect(bad((p) => (p.mistakes[0].id = 'spilled-tea'))).toBe(false))
  it('rejects an unknown template', () => expect(bad((p) => (p.template = 'rocket'))).toBe(false))
  it('rejects a range wider than the model allows', () => expect(bad((p) => (p.ranges.amplitude_deg = [5, 30]))).toBe(false))
  it('rejects a curved unlock graph', () => expect(bad((p) => (p.formula.unlockGraph = 'T-vs-l'))).toBe(false))
  it('rejects a control character in the formula', () => expect(bad((p) => (p.formula.latex = 'T = 2\pi	'))).toBe(false))
  it('rejects anything other than 3 class rounds', () => expect(bad((p) => p.classRounds.pop())).toBe(false))
})
