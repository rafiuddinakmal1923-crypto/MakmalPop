/** Where the user is in the book. Owner: Lane A. Class mode (Lane B) reads `mode` and `spread`. */
import { create } from 'zustand'
import { PAGE_TURN_MS } from '../book/dims'

export type Screen = 'cover' | 'book' | 'class'
export type Mode = 'student' | 'class'

export interface Turn {
  from: number
  to: number
  /** +1 turns a right page over to the left (forward), -1 backward. */
  dir: 1 | -1
  startedAt: number
}

interface NavState {
  screen: Screen
  mode: Mode
  /** 0 = contents spread, n = experiment page n (1-based, in allPages() order). */
  spread: number
  turn: Turn | null
  /** Phone portrait shows one page at a time. */
  portraitView: 'concept' | 'experiment'
  cameraResetTick: number
  openBook: (mode: Mode) => void
  closeBook: () => void
  goTo: (spread: number) => void
  startClass: (spread: number) => void
  setPortraitView: (v: 'concept' | 'experiment') => void
  resetCamera: () => void
}

export const useNav = create<NavState>()((set, get) => ({
  screen: 'cover',
  mode: 'student',
  spread: 0,
  turn: null,
  portraitView: 'concept',
  cameraResetTick: 0,
  openBook: (mode) => set({ screen: 'book', mode, spread: 0, turn: null }),
  closeBook: () => set({ screen: 'cover', spread: 0, turn: null }),
  goTo: (to) => {
    const { spread, turn } = get()
    if (turn || to === spread) return
    set({ turn: { from: spread, to, dir: to > spread ? 1 : -1, startedAt: performance.now() }, portraitView: 'concept' })
    // The new spread's content appears when the sheet has turned.
    window.setTimeout(() => set({ spread: to, turn: null }), PAGE_TURN_MS)
  },
  startClass: (spread) => set({ screen: 'class', spread, turn: null }),
  setPortraitView: (portraitView) => set({ portraitView }),
  resetCamera: () => set((s) => ({ cameraResetTick: s.cameraResetTick + 1 })),
}))
