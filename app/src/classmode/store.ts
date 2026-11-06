/**
 * Class battle mode state (build prompt 5.5, SRS FR-30 to FR-33, SDS 6.4). Memory only: nothing about a class
 * is saved, so no student data is kept. The experiment run itself uses the game store's clock (useGame).
 */
import { create } from 'zustand'
import { applyPrediction, type Stake } from '../game/scoring'

export interface Team {
  id: string
  /** Team colour, always shown with the letter so colour is never the only signal (NFR-09). */
  color: string
  letter: string
  score: number
}

export interface Pick {
  option?: number
  stake: Stake
}

export type Phase = 'lobby' | 'predict' | 'running' | 'reveal' | 'winner'

export const ROUNDS = 3
export const MIN_TEAMS = 2
export const MAX_TEAMS = 4
/** No orange (that means energy) and no green/red (those mean right/wrong). */
export const TEAM_STYLES = [
  { letter: 'A', color: '#2F6690' },
  { letter: 'B', color: '#7B4B94' },
  { letter: 'C', color: '#1D7874' },
  { letter: 'D', color: '#8C5E3C' },
] as const

function makeTeam(i: number): Team {
  const st = TEAM_STYLES[i]
  return { id: st.letter, color: st.color, letter: st.letter, score: 0 }
}

/** Points for one round: a correct pick wins its stake, a wrong or missing pick loses it, never below 0. */
export function scoreRound(teams: Team[], picks: Record<string, Pick>, answer: number): { teams: Team[]; deltas: Record<string, number> } {
  const deltas: Record<string, number> = {}
  const next = teams.map((t) => {
    const p = picks[t.id] ?? { stake: 1 }
    const score = applyPrediction(t.score, p.stake, p.option === answer)
    deltas[t.id] = score - t.score
    return { ...t, score }
  })
  return { teams: next, deltas }
}

/** Teams with the top score (more than one on a tie). */
export function winners(teams: Team[]): Team[] {
  const best = Math.max(...teams.map((t) => t.score))
  return teams.filter((t) => t.score === best)
}

interface ClassState {
  pageId: string | null
  teams: Team[]
  round: number
  phase: Phase
  picks: Record<string, Pick>
  deltas: Record<string, number>
  reset: (pageId: string) => void
  addTeam: () => void
  removeTeam: () => void
  start: () => void
  pick: (teamId: string, option: number) => void
  setStake: (teamId: string, stake: Stake) => void
  beginRun: () => void
  reveal: (answer: number) => void
  next: () => void
  playAgain: () => void
}

const freshPicks = (teams: Team[]): Record<string, Pick> => Object.fromEntries(teams.map((t) => [t.id, { stake: 1 as Stake }]))

export const useClass = create<ClassState>()((set, get) => ({
  pageId: null,
  teams: [makeTeam(0), makeTeam(1)],
  round: 0,
  phase: 'lobby',
  picks: {},
  deltas: {},

  reset: (pageId) => {
    const teams = [makeTeam(0), makeTeam(1)]
    set({ pageId, teams, round: 0, phase: 'lobby', picks: freshPicks(teams), deltas: {} })
  },
  addTeam: () => {
    const { teams, phase } = get()
    if (phase !== 'lobby' || teams.length >= MAX_TEAMS) return
    const next = [...teams, makeTeam(teams.length)]
    set({ teams: next, picks: freshPicks(next) })
  },
  removeTeam: () => {
    const { teams, phase } = get()
    if (phase !== 'lobby' || teams.length <= MIN_TEAMS) return
    const next = teams.slice(0, -1)
    set({ teams: next, picks: freshPicks(next) })
  },
  start: () => set((s) => ({ phase: 'predict', round: 0, picks: freshPicks(s.teams), deltas: {} })),
  pick: (teamId, option) => set((s) => ({ picks: { ...s.picks, [teamId]: { ...s.picks[teamId], option } } })),
  setStake: (teamId, stake) => set((s) => ({ picks: { ...s.picks, [teamId]: { ...s.picks[teamId], stake } } })),
  beginRun: () => set({ phase: 'running' }),
  reveal: (answer) => {
    const { teams, picks, phase } = get()
    if (phase !== 'running') return
    const r = scoreRound(teams, picks, answer)
    set({ teams: r.teams, deltas: r.deltas, phase: 'reveal' })
  },
  next: () => {
    const { round, teams } = get()
    if (round + 1 >= ROUNDS) set({ phase: 'winner', deltas: {} })
    else set({ round: round + 1, phase: 'predict', picks: freshPicks(teams), deltas: {} })
  },
  playAgain: () => {
    const teams = get().teams.map((t) => ({ ...t, score: 0 }))
    set({ teams, round: 0, phase: 'predict', picks: freshPicks(teams), deltas: {} })
  },
}))
