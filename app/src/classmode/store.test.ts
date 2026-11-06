import { beforeEach, describe, expect, it } from 'vitest'
import { scoreRound, useClass, winners, type Team } from './store'

const teams = (scores: number[]): Team[] => scores.map((score, i) => ({ id: 'ABCD'[i], letter: 'ABCD'[i], color: '#000', score }))

describe('class mode scoring', () => {
  it('a correct pick wins its stake and a wrong one loses it, never below 0', () => {
    const r = scoreRound(teams([2, 1, 0]), { A: { option: 0, stake: 3 }, B: { option: 1, stake: 2 }, C: { option: 2, stake: 1 } }, 0)
    expect(r.teams.map((t) => t.score)).toEqual([5, 0, 0])
    expect(r.deltas).toEqual({ A: 3, B: -1, C: 0 })
  })

  it('a team that did not pick loses its stake', () => {
    expect(scoreRound(teams([3]), { A: { stake: 2 } }, 0).teams[0].score).toBe(1)
  })

  it('finds the winner, and shares it on a tie', () => {
    expect(winners(teams([4, 7, 2])).map((t) => t.id)).toEqual(['B'])
    expect(winners(teams([5, 5])).map((t) => t.id)).toEqual(['A', 'B'])
  })
})

describe('class mode flow', () => {
  beforeEach(() => useClass.getState().reset('t4-bab1-bandul'))

  it('starts with 2 default teams and allows 2 to 4', () => {
    const s = useClass.getState()
    expect(s.teams.map((t) => t.letter)).toEqual(['A', 'B'])
    s.removeTeam()
    expect(useClass.getState().teams).toHaveLength(2)
    for (let i = 0; i < 5; i++) useClass.getState().addTeam()
    expect(useClass.getState().teams).toHaveLength(4)
  })

  it('plays 3 rounds and ends on the winner screen', () => {
    const s = useClass.getState()
    s.start()
    for (let round = 0; round < 3; round++) {
      expect(useClass.getState().round).toBe(round)
      useClass.getState().pick('A', 0)
      useClass.getState().setStake('A', 2)
      useClass.getState().pick('B', 1)
      useClass.getState().beginRun()
      useClass.getState().reveal(0)
      expect(useClass.getState().phase).toBe('reveal')
      useClass.getState().next()
    }
    const end = useClass.getState()
    expect(end.phase).toBe('winner')
    expect(end.teams.find((t) => t.id === 'A')!.score).toBe(6)
    expect(end.teams.find((t) => t.id === 'B')!.score).toBe(0)
  })
})
