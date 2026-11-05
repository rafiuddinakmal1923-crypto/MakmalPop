/**
 * Student-mode game loop (build prompt section 6, SDS 6). A zustand state machine:
 * mission → variables → predict → run → explain → formula → done (sticker). Cikgu Silap is a bonus after done.
 *
 * The run clock is advanced from inside the canvas (useRunClock) so the 3D scene and the stopwatch share it.
 */
import { create } from 'zustand'
import { getModel } from '../experiments/models'
import { seededRng, type Reading, type Rng, type Settings } from '../experiments/types'
import type { Page } from '../storage/packSchema'
import { saveProgress } from '../storage/db'
import { addPoints, applyPrediction, POINTS, type Stake } from './scoring'
import { checkUnlock, type UnlockResult } from './unlock'

export const STEPS = ['mission', 'variables', 'predict', 'run', 'explain', 'formula'] as const
export type Step = (typeof STEPS)[number] | 'done'

/** Real seconds a run plays at normal speed before it fast-forwards. */
export const LIVE_SECONDS = 3
export const FAST_FORWARD = 10

export interface Feedback {
  kind: 'good' | 'bad'
  /** Points gained (positive) or lost (negative), if any. */
  points?: number
  /** i18n key for the message. */
  key: string
}

export interface RunClock {
  t: number
  duration: number
  running: boolean
}

export type Slot = 'manipulated' | 'responding' | 'constant'

interface GameState {
  page: Page | null
  step: Step
  score: number
  /** Variables step: where the student put each chip. */
  placement: Record<string, Slot | undefined>
  variablesTries: number
  prediction: { choice: number; stake: Stake } | null
  predictionCorrect: boolean | null
  settings: Settings
  readings: Reading[]
  run: RunClock
  explainChoice: number | null
  graphId: string | null
  unlock: UnlockResult | null
  formulaUnlocked: boolean
  feedback: Feedback | null
  rng: Rng

  begin: (page: Page) => void
  acceptMission: () => void
  place: (variableId: string, slot: Slot | undefined) => void
  checkVariables: () => boolean
  lockPrediction: (choice: number, stake: Stake) => void
  setControl: (key: string, value: number) => void
  startRun: () => void
  skipRun: () => void
  tick: (dtReal: number) => void
  clearReadings: () => void
  finishRun: () => void
  answerExplain: (choice: number) => void
  goFormula: () => void
  chooseGraph: (graphId: string) => void
  confirmStraight: () => void
  dismissFeedback: () => void
}

function defaultSettings(page: Page): Settings {
  const meta = getModel(page.template).meta
  const s: Settings = { humanError: true }
  for (const c of meta.controls) {
    const range = page.ranges[c.key]
    s[c.key] = range ? Math.min(Math.max(c.default, range[0]), range[1]) : c.default
  }
  return s
}

/** Manipulated-variable range for this page (pack range, else the template's safe range). */
export function manipulatedRange(page: Page): [number, number] {
  const meta = getModel(page.template).meta
  const c = meta.controls.find((x) => x.key === meta.manipulatedControl)!
  return page.ranges[c.key] ?? [c.safeMin, c.safeMax]
}

/** Readings are enough to move on: at least 5 distinct values across 60% of the range. */
export function readingsReady(page: Page, readings: Reading[]): UnlockResult {
  const meta = getModel(page.template).meta
  const straight = meta.graphs.find((g) => g.straight)!
  return checkUnlock({
    x: readings.map((r) => r[straight.x]),
    y: readings.map((r) => r[straight.y]),
    manipulated: readings.map((r) => r[meta.manipulatedControl]),
    range: manipulatedRange(page),
  })
}

const idleRun: RunClock = { t: 0, duration: 0, running: false }

export const useGame = create<GameState>()((set, get) => ({
  page: null,
  step: 'mission',
  score: 0,
  placement: {},
  variablesTries: 0,
  prediction: null,
  predictionCorrect: null,
  settings: {},
  readings: [],
  run: idleRun,
  explainChoice: null,
  graphId: null,
  unlock: null,
  formulaUnlocked: false,
  feedback: null,
  rng: seededRng(1),

  begin: (page) =>
    set({
      page,
      step: 'mission',
      score: 0,
      placement: {},
      variablesTries: 0,
      prediction: null,
      predictionCorrect: null,
      settings: defaultSettings(page),
      readings: [],
      run: idleRun,
      explainChoice: null,
      graphId: null,
      unlock: null,
      formulaUnlocked: false,
      feedback: null,
      rng: seededRng(Date.now() & 0xffff),
    }),

  acceptMission: () => set({ step: 'variables' }),

  place: (variableId, slot) => set((s) => ({ placement: { ...s.placement, [variableId]: slot } })),

  checkVariables: () => {
    const { page, placement, variablesTries, score } = get()
    if (!page) return false
    const v = page.variables
    const ok =
      placement[v.manipulated] === 'manipulated' &&
      placement[v.responding] === 'responding' &&
      v.constant.every((c) => placement[c] === 'constant')
    if (!ok) {
      set({ variablesTries: variablesTries + 1, feedback: { kind: 'bad', key: 'variables.unfair' } })
      return false
    }
    const pts = variablesTries === 0 ? POINTS.variablesFirstTry : 0
    set({
      score: addPoints(score, pts),
      step: 'predict',
      feedback: { kind: 'good', key: 'result.correct', points: pts || undefined },
    })
    return true
  },

  lockPrediction: (choice, stake) => set({ prediction: { choice, stake }, step: 'run' }),

  setControl: (key, value) => {
    if (get().run.running) return
    set((s) => ({ settings: { ...s.settings, [key]: value } }))
  },

  startRun: () => {
    const { page, settings, run } = get()
    if (!page || run.running) return
    set({ run: { t: 0, duration: getModel(page.template).runDuration(settings), running: true } })
  },

  skipRun: () => {
    const { run } = get()
    if (run.running) get().tick(run.duration) // jumps past the end, which records the reading
  },

  tick: (dtReal) => {
    const { run, page, settings, rng, readings } = get()
    if (!run.running || !page) return
    const speed = run.t < LIVE_SECONDS ? 1 : FAST_FORWARD
    const t = run.t + dtReal * speed
    if (t < run.duration) {
      set({ run: { ...run, t } })
      return
    }
    // Run finished: record the reading, replacing any earlier one at the same setting.
    const model = getModel(page.template)
    const reading = model.measure(settings, rng)
    const key = model.meta.manipulatedControl
    const rest = readings.filter((r) => Math.abs(r[key] - (settings[key] as number)) > 1e-6)
    // Keep the manipulated value exactly as set (the reading may include parallax in Cikgu Silap only).
    const next = [...rest, { ...reading, [key]: settings[key] as number }].sort((a, b) => a[key] - b[key])
    set({ run: { ...run, t: run.duration, running: false }, readings: next })
  },

  clearReadings: () => set({ readings: [] }),

  finishRun: () => {
    const { page, readings, prediction, score } = get()
    if (!page || !prediction) return
    const ready = readingsReady(page, readings)
    if (ready.reason === 'too-few' || ready.reason === 'narrow-span') return
    const correct = prediction.choice === page.prediction.answer
    set({
      step: 'explain',
      predictionCorrect: correct,
      score: applyPrediction(score, prediction.stake, correct),
      feedback: { kind: correct ? 'good' : 'bad', key: correct ? 'result.correct' : 'result.wrong', points: correct ? prediction.stake : -prediction.stake },
    })
  },

  answerExplain: (choice) => {
    const { page, score, explainChoice } = get()
    if (!page || explainChoice !== null) return
    const correct = choice === page.explain.answer
    set({
      explainChoice: choice,
      score: addPoints(score, correct ? POINTS.explainCorrect : 0),
      feedback: { kind: correct ? 'good' : 'bad', key: correct ? 'result.correct' : 'result.wrong', points: correct ? POINTS.explainCorrect : undefined },
    })
  },

  goFormula: () => set({ step: 'formula' }),

  chooseGraph: (graphId) => {
    const { page, readings } = get()
    if (!page) return
    const meta = getModel(page.template).meta
    const g = meta.graphs.find((x) => x.id === graphId)!
    const unlock = checkUnlock({
      x: readings.map((r) => r[g.x]),
      y: readings.map((r) => r[g.y]),
      manipulated: readings.map((r) => r[meta.manipulatedControl]),
      range: manipulatedRange(page),
    })
    set({ graphId, unlock, feedback: unlock.ok ? null : { kind: 'bad', key: unlock.reason === 'curved' ? 'formula.tryAnother' : unlock.reason === 'narrow-span' ? 'formula.needSpread' : 'formula.needMore' } })
  },

  confirmStraight: () => {
    const { unlock, score, page, predictionCorrect } = get()
    if (!unlock?.ok || !page) return
    const newScore = addPoints(score, POINTS.formulaDiscovered)
    set({ formulaUnlocked: true, score: newScore, step: 'done', feedback: { kind: 'good', key: 'done.title', points: POINTS.formulaDiscovered } })
    void saveProgress({
      pageId: page.pageId,
      completed: true,
      predictionsCorrect: predictionCorrect ? 1 : 0,
      pointsEarned: newScore,
      formulaUnlocked: true,
      mistakesFound: 0,
    })
  },

  dismissFeedback: () => set({ feedback: null }),
}))
