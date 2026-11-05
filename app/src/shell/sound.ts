/**
 * Sounds are synthesised with Web Audio, so there are no audio files to download or precache.
 * ding = correct, thud = wrong, flip = page turn.
 */
import { useSettings } from './settings'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (!useSettings.getState().sound) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur)
}

export function playDing() {
  tone(880, 0.35, 'sine', 0.18)
  setTimeout(() => tone(1320, 0.4, 'sine', 0.12), 90)
}

export function playThud() {
  tone(140, 0.25, 'triangle', 0.25, 70)
}

export function playFlip() {
  const a = audio()
  if (!a) return
  const dur = 0.35
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const env = Math.sin((Math.PI * i) / data.length)
    data[i] = (Math.random() * 2 - 1) * env * 0.5
  }
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 2200
  f.Q.value = 0.7
  const g = a.createGain()
  g.gain.value = 0.25
  src.connect(f).connect(g).connect(a.destination)
  src.start()
}
