/**
 * Background music, as data. An original generative loop: a soft pad on a 4-bar progression in D major, a low
 * bass note per bar, and sparse gamelan-like bell notes on the D major pentatonic scale. Pure and seeded, so the
 * same bar always sounds the same (and it is unit-tested); shell/sound.ts turns the events into Web Audio.
 */
import { seededRng } from '../experiments/types'

export const BPM = 68
export const BEATS_PER_BAR = 4
export const SECONDS_PER_BEAT = 60 / BPM

/** D major pentatonic (D E F# A B) across two octaves, MIDI note numbers, for the bells. */
export const BELL_SCALE = [74, 76, 78, 81, 83, 86, 88, 90, 93] as const

/** Pad voicings (MIDI) and bass roots for the 4-bar loop: D add9, Bm7, Gmaj7, A sus4. */
const CHORDS = [
  { bass: 38, pad: [62, 66, 69, 76] },
  { bass: 35, pad: [62, 66, 69, 71] },
  { bass: 43, pad: [62, 66, 67, 71] },
  { bass: 45, pad: [62, 64, 69, 74] },
] as const

export type MusicKind = 'pad' | 'bass' | 'bell'

export interface MusicEvent {
  /** Start, in beats from the start of the bar. */
  beat: number
  midi: number
  kind: MusicKind
  /** Length in beats. */
  dur: number
  /** Loudness 0..1 (scaled down again by the mixer). */
  vel: number
}

export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12)

/** All events for one bar. Bars repeat the 4-chord cycle; the bell melody varies with the bar number. */
export function barEvents(bar: number, seed = 7): MusicEvent[] {
  const chord = CHORDS[((bar % CHORDS.length) + CHORDS.length) % CHORDS.length]
  const rng = seededRng(seed * 1000 + bar)
  const events: MusicEvent[] = chord.pad.map((midi) => ({ beat: 0, midi, kind: 'pad', dur: BEATS_PER_BAR, vel: 0.5 }))
  events.push({ beat: 0, midi: chord.bass, kind: 'bass', dur: 2, vel: 0.6 })

  // Bells on eighth notes, sparse, moving mostly by step so it sounds like a melody rather than noise.
  let idx = Math.floor(rng() * 4) + 2
  for (let slot = 0; slot < BEATS_PER_BAR * 2; slot++) {
    const play = slot === 0 ? rng() < 0.6 : rng() < 0.32
    if (!play) continue
    const step = Math.floor(rng() * 5) - 2 // -2..2
    idx = Math.min(BELL_SCALE.length - 1, Math.max(0, idx + step))
    events.push({ beat: slot / 2, midi: BELL_SCALE[idx], kind: 'bell', dur: 1.5, vel: 0.35 + rng() * 0.35 })
  }
  return events
}
