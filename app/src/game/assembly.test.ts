import { describe, expect, it } from 'vitest'
import { heatingMeta } from '../experiments/heating/meta'
import { pendulumMeta } from '../experiments/pendulum/meta'
import { checkDrop, shelf } from './assembly'

const pendulum = pendulumMeta.assembly!

describe('apparatus set-up rules', () => {
  it('rejects pieces that are not needed', () => {
    expect(checkDrop(pendulum, [], 'beaker', 'stand')).toEqual({ ok: false, reason: 'not-needed' })
  })

  it('rejects a piece in the wrong place', () => {
    expect(checkDrop(pendulum, [], 'rule', 'stand')).toEqual({ ok: false, reason: 'wrong-slot' })
  })

  it('asks for the parts that must come first', () => {
    expect(checkDrop(pendulum, [], 'clamp', 'clamp')).toEqual({ ok: false, reason: 'needs', needs: 'stand' })
    expect(checkDrop(pendulum, ['stand'], 'bob', 'bob')).toEqual({ ok: false, reason: 'needs', needs: 'clamp' })
  })

  it('accepts a full build in a sensible order and says when it is complete', () => {
    const order = ['stand', 'rule', 'clamp', 'protractor', 'bob']
    const placed: string[] = []
    for (const id of order) {
      const r = checkDrop(pendulum, placed, id, id)
      expect(r.ok).toBe(true)
      placed.push(id)
      if (r.ok) expect(r.complete).toBe(placed.length === pendulum.parts.length)
    }
  })

  it('every template with an assembly has valid dependencies and at least one distractor', () => {
    for (const meta of [pendulumMeta, heatingMeta]) {
      const a = meta.assembly!
      const ids = a.parts.map((p) => p.id)
      for (const p of a.parts) for (const r of p.requires ?? []) expect(ids).toContain(r)
      expect(a.distractors.length).toBeGreaterThan(0)
      for (const d of a.distractors) expect(ids).not.toContain(d)
    }
  })

  it('the shelf mixes parts and distractors and drops placed ones', () => {
    const s = shelf(pendulum, [], 'x')
    expect([...s].sort()).toEqual([...pendulum.parts.map((p) => p.id), ...pendulum.distractors].sort())
    expect(shelf(pendulum, ['stand'], 'x')).not.toContain('stand')
  })
})
