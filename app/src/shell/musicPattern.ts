/**
 * Background music, as data: an original, upbeat and playful loop for "edutainment".
 *
 *   - 100 BPM, 4/4, a bright 4-chord cycle in C major (C, G, Am, F)
 *   - bouncy bass with octave hops, short plucked chords on the off-beats
 *   - a marimba-like plucked melody on the C major pentatonic scale, in an 8-bar form:
 *     bars 1-4 state the tune, bars 5-8 lift it higher, bar 8 ends with a small drum fill
 *   - light percussion: soft kick, finger snaps on 2 and 4, a quiet shaker
 *
 * Pure and seeded, so the same bar always sounds the same (unit-tested); shell/sound.ts turns events into audio.
 */
import { seededRng } from '../experiments/types'

export const BPM = 100
export const BEATS_PER_BAR = 4
export const SECONDS_PER_BEAT = 60 / BPM
/** Eighth-note slots per bar. */
const SLOTS = BEATS_PER_BAR * 2
export const FORM_BARS = 8

/** C major pentatonic (C D E G A) over two octaves, for the melody. */
export const LEAD_SCALE = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93] as const

/** Chord tones (MIDI) and bass roots: C, G, Am, F. */
const CHORDS = [
  { root: 36, tones: [60, 64, 67] },
  { root: 43, tones: [59, 62, 67] },
  { root: 45, tones: [60, 64, 69] },
  { root: 41, tones: [60, 65, 69] },
] as const

/** Melody rhythms (which eighth-note slots play), cycled through the 8-bar form. Syncopated on purpose. */
const RHYTHMS = [
  [0, 2, 3, 5, 6],
  [0, 3, 4, 6],
  [1, 2, 4, 6, 7],
  [0, 2, 4, 5],
  [0, 2, 3, 5, 6, 7],
  [0, 3, 4, 6],
  [1, 2, 4, 5, 6],
  [0, 2, 4],
] as const

export type MusicKind = 'lead' | 'stab' | 'bass' | 'kick' | 'snap' | 'shaker'

export interface MusicEvent {
  /** Start, in beats from the start of the bar. */
  beat: number
  /** MIDI note (0 for drums). */
  midi: number
  kind: MusicKind
  /** Length in beats. */
  dur: number
  /** Loudness 0..1 (scaled down again by the mixer). */
  vel: number
}

export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12)

const mod = (a: number, n: number) => ((a % n) + n) % n

/** Index in LEAD_SCALE of the scale note closest to a chord tone, near the middle of the range. */
function chordToneIndex(tones: readonly number[], lift: number, pick: number): number {
  const target = tones[pick % tones.length] + 12 // up into the melody octave
  let best = 0
  for (let i = 0; i < LEAD_SCALE.length; i++) if (Math.abs(LEAD_SCALE[i] - target) < Math.abs(LEAD_SCALE[best] - target)) best = i
  return Math.min(LEAD_SCALE.length - 1, best + lift)
}

/** All events for one bar. The 8-bar form repeats, so bar 8 sounds like bar 0. */
export function barEvents(bar: number, seed = 11): MusicEvent[] {
  const inForm = mod(bar, FORM_BARS)
  const chord = CHORDS[mod(bar, CHORDS.length)]
  const rng = seededRng(seed * 1000 + inForm)
  const ev: MusicEvent[] = []
  const at = (slot: number) => slot / 2

  // Bass: root, octave hop, fifth, octave: a bouncy line.
  ev.push({ beat: at(0), midi: chord.root, kind: 'bass', dur: 1, vel: 0.9 })
  ev.push({ beat: at(3), midi: chord.root + 12, kind: 'bass', dur: 0.5, vel: 0.6 })
  ev.push({ beat: at(4), midi: chord.root + 7, kind: 'bass', dur: 1, vel: 0.75 })
  ev.push({ beat: at(6), midi: chord.root + 12, kind: 'bass', dur: 0.5, vel: 0.6 })

  // Off-beat chord plucks (the skip in the step).
  for (const slot of [1, 3, 5, 7]) {
    const vel = slot === 3 || slot === 7 ? 0.8 : 0.45
    for (const midi of chord.tones) ev.push({ beat: at(slot), midi, kind: 'stab', dur: 0.4, vel })
  }

  // Drums: kick on 1 and 3 (plus a push on odd bars), snaps on 2 and 4, shaker on every eighth.
  for (const slot of [0, 4]) ev.push({ beat: at(slot), midi: 0, kind: 'kick', dur: 0.5, vel: 0.9 })
  if (inForm % 2 === 1) ev.push({ beat: at(7), midi: 0, kind: 'kick', dur: 0.5, vel: 0.5 })
  for (const slot of [2, 6]) ev.push({ beat: at(slot), midi: 0, kind: 'snap', dur: 0.25, vel: 0.8 })
  for (let slot = 0; slot < SLOTS; slot++) ev.push({ beat: at(slot), midi: 0, kind: 'shaker', dur: 0.25, vel: slot % 2 ? 0.7 : 0.35 })
  if (inForm === FORM_BARS - 1) {
    // Fill into the loop: extra snaps on the last beat.
    ev.push({ beat: at(7), midi: 0, kind: 'snap', dur: 0.25, vel: 0.6 })
    ev.push({ beat: at(7) + 0.25, midi: 0, kind: 'snap', dur: 0.25, vel: 0.9 })
  }

  // Melody: starts each bar on a chord tone, then moves mostly by step. Bars 5-8 sit two scale steps higher.
  const lift = inForm >= 4 ? 2 : 0
  let idx = chordToneIndex(chord.tones, lift, Math.floor(rng() * 3))
  RHYTHMS[inForm].forEach((slot, n) => {
    if (n > 0) {
      const step = [-2, -1, -1, 1, 1, 2][Math.floor(rng() * 6)]
      idx = Math.min(LEAD_SCALE.length - 1, Math.max(0, idx + step))
    }
    const last = n === RHYTHMS[inForm].length - 1
    ev.push({ beat: at(slot), midi: LEAD_SCALE[idx], kind: 'lead', dur: last ? 1 : 0.5, vel: slot % 2 === 0 ? 0.85 : 0.65 })
  })
  return ev
}
