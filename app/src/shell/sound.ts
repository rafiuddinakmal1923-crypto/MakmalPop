/**
 * All sound is synthesised with Web Audio: there are no audio files to download or precache, and the background
 * music is original (shell/musicPattern.ts). Gentle by design: soft attacks, a small room reverb, low levels.
 *
 * Mixer: effects → sfx bus ─┐
 *        music  → music bus ─┼→ master → speakers
 *        both   → reverb ────┘   (the music dips briefly whenever an effect plays)
 *
 * Browsers only allow audio after a tap, so nothing plays until unlockAudio() runs from the first pointerdown.
 */
import { barEvents, BEATS_PER_BAR, midiToHz, SECONDS_PER_BEAT, type MusicEvent } from './musicPattern'
import { useSettings } from './settings'

interface Engine {
  ctx: AudioContext
  master: GainNode
  sfx: GainNode
  music: GainNode
  reverb: GainNode
}

const MUSIC_LEVEL = 0.95
let engine: Engine | null = null
let unlocked = false

function makeImpulse(ctx: AudioContext, seconds = 2.4, decay = 3.2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay
  }
  return buf
}

function getEngine(): Engine | null {
  if (!unlocked) return null
  if (engine) {
    if (engine.ctx.state === 'suspended' && document.visibilityState === 'visible') void engine.ctx.resume()
    return engine
  }
  try {
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0.9
    // A gentle limiter so stacked sounds never clip on phone speakers.
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    master.connect(comp).connect(ctx.destination)
    const sfx = ctx.createGain()
    sfx.connect(master)
    const music = ctx.createGain()
    music.gain.value = MUSIC_LEVEL
    music.connect(master)
    const conv = ctx.createConvolver()
    conv.buffer = makeImpulse(ctx)
    const reverb = ctx.createGain()
    reverb.gain.value = 0.22
    reverb.connect(conv).connect(master)
    engine = { ctx, master, sfx, music, reverb }
    return engine
  } catch {
    return null
  }
}

/** Effects play only when sound is on. */
function sfxEngine(): Engine | null {
  return useSettings.getState().sound ? getEngine() : null
}

/** Briefly lower the music so an effect stands out. */
function duck(e: Engine, amount = 0.45, seconds = 0.5) {
  if (musicTimer === null) return // music is off: leave its level alone
  const g = e.music.gain
  const t = e.ctx.currentTime
  g.cancelScheduledValues(t)
  g.setTargetAtTime(MUSIC_LEVEL * amount, t, 0.03)
  g.setTargetAtTime(MUSIC_LEVEL, t + seconds, 0.25)
}

// ---------- building blocks ----------

/** A bell / metallophone note: a few sine partials with a fast attack and exponential decay. */
function bell(e: Engine, dest: AudioNode, freq: number, t: number, dur: number, gain: number, partials: number[] = [1, 2.76, 5.4], wet = 0.6) {
  const out = e.ctx.createGain()
  out.gain.setValueAtTime(0.0001, t)
  out.gain.exponentialRampToValueAtTime(gain, t + 0.005)
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  out.connect(dest)
  const send = e.ctx.createGain()
  send.gain.value = wet
  out.connect(send).connect(e.reverb)
  partials.forEach((ratio, i) => {
    const o = e.ctx.createOscillator()
    const pg = e.ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq * ratio
    pg.gain.value = 1 / (1 + i * 2.2)
    o.connect(pg).connect(out)
    o.start(t)
    o.stop(t + dur + 0.05)
  })
}

/** A simple tone with an attack/decay envelope, optionally gliding to another pitch. */
function tone(e: Engine, dest: AudioNode, freq: number, t: number, dur: number, gain: number, type: OscillatorType = 'sine', glideTo?: number, wet = 0.15) {
  const o = e.ctx.createOscillator()
  const g = e.ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.012, dur / 4))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest)
  if (wet > 0) {
    const s = e.ctx.createGain()
    s.gain.value = wet
    g.connect(s).connect(e.reverb)
  }
  o.start(t)
  o.stop(t + dur + 0.05)
}

let noiseBuf: AudioBuffer | null = null
/** Filtered noise: paper, clicks, bubbles. The filter frequency can sweep from f0 to f1. */
function noise(e: Engine, t: number, dur: number, gain: number, type: BiquadFilterType, f0: number, f1 = f0, q = 1) {
  if (!noiseBuf || noiseBuf.sampleRate !== e.ctx.sampleRate) {
    noiseBuf = e.ctx.createBuffer(1, e.ctx.sampleRate, e.ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = e.ctx.createBufferSource()
  src.buffer = noiseBuf
  const f = e.ctx.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(f0, t)
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
  const g = e.ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur / 3))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(e.sfx)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.05)
}

// ---------- effects ----------

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760 }

/** Soft tap for any button. */
export function playTap() {
  const e = sfxEngine()
  if (!e) return
  const t = e.ctx.currentTime
  tone(e, e.sfx, 1400, t, 0.05, 0.035, 'sine', 900, 0)
  noise(e, t, 0.018, 0.02, 'highpass', 4000)
}

/** Coin clink for a stake. */
export function playCoin(stake = 1) {
  const e = sfxEngine()
  if (!e) return
  const t = e.ctx.currentTime
  for (let i = 0; i < stake; i++) {
    bell(e, e.sfx, NOTE.G6 * (1 + i * 0.06), t + i * 0.07, 0.35, 0.07, [1, 2.4, 4.1], 0.3)
    bell(e, e.sfx, NOTE.C6 * 2.01, t + i * 0.07 + 0.012, 0.25, 0.03, [1, 3.1], 0.2)
  }
}

/** Correct answer: a bright bell arpeggio. */
export function playDing() {
  const e = sfxEngine()
  if (!e) return
  duck(e)
  const t = e.ctx.currentTime
  ;[NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => bell(e, e.sfx, f, t + i * 0.075, 0.9, 0.09, [1, 2, 3.01]))
}

/** Wrong answer: a gentle falling "uh-oh", never harsh. */
export function playThud() {
  const e = sfxEngine()
  if (!e) return
  duck(e, 0.6, 0.4)
  const t = e.ctx.currentTime
  tone(e, e.sfx, 392, t, 0.18, 0.08, 'triangle', 370, 0.2)
  tone(e, e.sfx, 311, t + 0.16, 0.32, 0.08, 'triangle', 262, 0.25)
}

/** Page turn: a papery whoosh with a soft crinkle. Quiet in class mode (build prompt 4). */
export function playFlip(classMode = false) {
  if (classMode) return
  const e = sfxEngine()
  if (!e) return
  const t = e.ctx.currentTime
  noise(e, t, 0.42, 0.16, 'bandpass', 700, 2600, 0.9)
  noise(e, t + 0.18, 0.3, 0.08, 'bandpass', 3200, 1200, 1.4)
  for (let i = 0; i < 3; i++) noise(e, t + 0.05 + i * 0.09, 0.02, 0.05, 'highpass', 5000)
}

/** A part popping up out of the page: a soft "bloop", rising a little with each part. */
export function playPop(index = 0) {
  const e = sfxEngine()
  if (!e) return
  const t = e.ctx.currentTime
  const f = 320 * 1.12 ** index
  tone(e, e.sfx, f * 1.9, t, 0.11, 0.06, 'sine', f, 0.25)
}

let tickAlt = false
let lastTick = 0
/** Pendulum swing: woodblock tick-tock (rate-limited so fast-forward does not rattle). */
export function playTick() {
  const e = sfxEngine()
  if (!e) return
  const t = e.ctx.currentTime
  if (t - lastTick < 0.12) return
  lastTick = t
  tickAlt = !tickAlt
  const f = tickAlt ? 1900 : 1500
  tone(e, e.sfx, f, t, 0.05, 0.05, 'sine', f * 0.92, 0.1)
  noise(e, t, 0.03, 0.03, 'bandpass', f * 1.3, f * 1.3, 4)
}

let lastBubble = 0
/** Water heating: a small bubble. Call often; it rate-limits itself and gets busier as the water warms. */
export function playBubble(level: number) {
  const e = sfxEngine()
  if (!e) return
  const t = e.ctx.currentTime
  if (t - lastBubble < 0.35 - level * 0.25 || Math.random() > 0.25 + level * 0.6) return
  lastBubble = t
  const f = 250 + Math.random() * 300
  tone(e, e.sfx, f, t, 0.07, 0.025 + level * 0.025, 'sine', f * 2.4, 0.3)
}

/** Formula unlocked / mission complete: an ascending pentatonic shimmer. */
export function playUnlock() {
  const e = sfxEngine()
  if (!e) return
  duck(e, 0.3, 1.2)
  const t = e.ctx.currentTime
  ;[NOTE.C5, NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6, NOTE.D6, NOTE.E6, NOTE.G6].forEach((f, i) =>
    bell(e, e.sfx, f, t + i * 0.06, 1.2, 0.06 + i * 0.004, [1, 2.76, 5.4], 0.8),
  )
  tone(e, e.sfx, NOTE.C5 / 2, t, 1.4, 0.05, 'triangle', undefined, 0.6)
}

/** Class-mode winner: a short fanfare. */
export function playFanfare() {
  const e = sfxEngine()
  if (!e) return
  duck(e, 0.2, 2)
  const t = e.ctx.currentTime
  const seq = [NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6]
  seq.forEach((f, i) => {
    tone(e, e.sfx, f, t + i * 0.13, 0.5, 0.05, 'triangle', undefined, 0.4)
    bell(e, e.sfx, f, t + i * 0.13, 0.9, 0.05, [1, 2, 3])
  })
  ;[NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f) => tone(e, e.sfx, f, t + 0.55, 1.6, 0.035, 'sawtooth', undefined, 0.6))
}

// ---------- background music ----------

let musicTimer: number | null = null
let nextBarTime = 0
let bar = 0

function scheduleEvent(e: Engine, ev: MusicEvent, barStart: number, lite: boolean) {
  const t = barStart + ev.beat * SECONDS_PER_BEAT
  const dur = ev.dur * SECONDS_PER_BEAT
  const f = midiToHz(ev.midi)
  if (ev.kind === 'bell') {
    bell(e, e.music, f, t, dur * 1.4, 0.05 * ev.vel, [1, 2.76, 5.4], 0.9)
  } else if (ev.kind === 'bass') {
    tone(e, e.music, f, t, dur, 0.09 * ev.vel, 'sine', undefined, 0.2)
  } else {
    // Pad: slow swell through a low-pass filter; two detuned voices unless in lite mode.
    const g = e.ctx.createGain()
    const lp = e.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1100
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.022 * ev.vel, t + dur * 0.35)
    g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05)
    lp.connect(g).connect(e.music)
    const s = e.ctx.createGain()
    s.gain.value = 0.7
    g.connect(s).connect(e.reverb)
    for (const detune of lite ? [0] : [-7, 7]) {
      const o = e.ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = f
      o.detune.value = detune
      o.connect(lp)
      o.start(t)
      o.stop(t + dur * 1.1)
    }
  }
}

function scheduler() {
  const e = getEngine()
  if (!e) return
  const s = useSettings.getState()
  const lite = s.liteOverride ?? s.liteAuto
  const barLen = BEATS_PER_BAR * SECONDS_PER_BEAT
  if (nextBarTime < e.ctx.currentTime) nextBarTime = e.ctx.currentTime + 0.1
  while (nextBarTime < e.ctx.currentTime + 1.5) {
    for (const ev of barEvents(bar)) scheduleEvent(e, ev, nextBarTime, lite)
    nextBarTime += barLen
    bar++
  }
}

export function startMusic() {
  const s = useSettings.getState()
  if (musicTimer !== null || !s.sound || !s.music) return
  const e = getEngine()
  if (!e) return
  e.music.gain.cancelScheduledValues(e.ctx.currentTime)
  e.music.gain.setValueAtTime(0.0001, e.ctx.currentTime)
  e.music.gain.linearRampToValueAtTime(MUSIC_LEVEL, e.ctx.currentTime + 2.5)
  nextBarTime = e.ctx.currentTime + 0.1
  scheduler()
  musicTimer = window.setInterval(scheduler, 400)
}

export function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer)
  musicTimer = null
  if (engine) {
    const g = engine.music.gain
    g.cancelScheduledValues(engine.ctx.currentTime)
    g.setTargetAtTime(0.0001, engine.ctx.currentTime, 0.3)
  }
}

/**
 * Call once from the first user gesture. Creates the audio context, starts the music if it is on, and keeps
 * music in step with the settings and with the app being hidden or shown.
 */
export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  getEngine()
  startMusic()
  useSettings.subscribe((s, prev) => {
    if (s.sound === prev.sound && s.music === prev.music) return
    if (s.sound && s.music) startMusic()
    else stopMusic()
  })
  document.addEventListener('visibilitychange', () => {
    if (!engine) return
    if (document.visibilityState === 'hidden') void engine.ctx.suspend()
    else void engine.ctx.resume()
  })
}
