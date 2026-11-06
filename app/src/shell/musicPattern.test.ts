import { describe, expect, it } from 'vitest'
import { barEvents, BEATS_PER_BAR, BPM, FORM_BARS, LEAD_SCALE, midiToHz } from './musicPattern'

const kinds = (bar: number, kind: string) => barEvents(bar).filter((e) => e.kind === kind)

describe('background music pattern (upbeat)', () => {
  it('is upbeat: about 100 BPM', () => {
    expect(BPM).toBeGreaterThanOrEqual(96)
    expect(BPM).toBeLessThanOrEqual(112)
  })

  it('is the same every time for the same bar, and the 8-bar form loops', () => {
    expect(barEvents(5)).toEqual(barEvents(5))
    expect(barEvents(FORM_BARS)).toEqual(barEvents(0))
    expect(barEvents(1)).not.toEqual(barEvents(0))
  })

  it('every bar has bass, off-beat chords, kick, snaps on 2 and 4, shaker and a melody', () => {
    for (let bar = 0; bar < FORM_BARS; bar++) {
      expect(kinds(bar, 'bass').length).toBeGreaterThanOrEqual(3)
      expect(kinds(bar, 'stab').every((e) => (e.beat * 2) % 2 === 1)).toBe(true)
      expect(kinds(bar, 'kick').map((e) => e.beat)).toContain(0)
      expect(kinds(bar, 'snap').map((e) => e.beat)).toEqual(expect.arrayContaining([1, 3]))
      expect(kinds(bar, 'shaker')).toHaveLength(8)
      expect(kinds(bar, 'lead').length).toBeGreaterThanOrEqual(3)
      for (const e of barEvents(bar)) {
        expect(e.beat).toBeGreaterThanOrEqual(0)
        expect(e.beat).toBeLessThan(BEATS_PER_BAR)
      }
    }
  })

  it('the melody only uses the C major pentatonic scale and lifts in bars 5-8', () => {
    const avg = (bars: number[]) => {
      const notes = bars.flatMap((b) => kinds(b, 'lead').map((e) => e.midi))
      for (const n of notes) expect(LEAD_SCALE).toContain(n)
      return notes.reduce((a, b) => a + b, 0) / notes.length
    }
    expect(avg([4, 5, 6, 7])).toBeGreaterThan(avg([0, 1, 2, 3]))
  })

  it('the last bar of the form has a drum fill', () => {
    expect(kinds(FORM_BARS - 1, 'snap').length).toBeGreaterThan(kinds(0, 'snap').length)
  })

  it('converts MIDI to Hz', () => {
    expect(midiToHz(69)).toBe(440)
    expect(midiToHz(81)).toBeCloseTo(880, 6)
  })
})
