import { describe, expect, it } from 'vitest'
import { barEvents, BEATS_PER_BAR, BELL_SCALE, midiToHz } from './musicPattern'

describe('background music pattern', () => {
  it('is the same every time for the same bar', () => {
    expect(barEvents(5)).toEqual(barEvents(5))
  })

  it('every bar has a pad chord and a bass note, and events sit inside the bar', () => {
    for (let bar = 0; bar < 16; bar++) {
      const ev = barEvents(bar)
      expect(ev.filter((e) => e.kind === 'pad')).toHaveLength(4)
      expect(ev.filter((e) => e.kind === 'bass')).toHaveLength(1)
      for (const e of ev) {
        expect(e.beat).toBeGreaterThanOrEqual(0)
        expect(e.beat).toBeLessThan(BEATS_PER_BAR)
      }
    }
  })

  it('bells only use the D major pentatonic scale and are not too busy', () => {
    let bells = 0
    for (let bar = 0; bar < 32; bar++) {
      for (const e of barEvents(bar).filter((x) => x.kind === 'bell')) {
        expect(BELL_SCALE).toContain(e.midi)
        bells++
      }
    }
    expect(bells / 32).toBeGreaterThan(1)
    expect(bells / 32).toBeLessThan(5)
  })

  it('the chord cycle repeats every 4 bars', () => {
    const pads = (bar: number) => barEvents(bar).filter((e) => e.kind !== 'bell')
    expect(pads(0)).toEqual(pads(4))
    expect(pads(1)).not.toEqual(pads(0))
  })

  it('converts MIDI to Hz', () => {
    expect(midiToHz(69)).toBe(440)
    expect(midiToHz(81)).toBeCloseTo(880, 6)
  })
})
