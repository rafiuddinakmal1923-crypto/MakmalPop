import { describe, expect, it } from 'vitest'
import { allPages } from '../storage/packs'
import { optionOrder } from './shuffle'

describe('answer option order', () => {
  it('is a permutation and is the same every time', () => {
    for (const n of [2, 3, 4]) {
      const a = optionOrder('t4-bab1-bandul:prediction', n)
      expect([...a].sort()).toEqual(Array.from({ length: n }, (_, i) => i))
      expect(optionOrder('t4-bab1-bandul:prediction', n)).toEqual(a)
    }
  })

  it('does not always show the correct answer first on the bundled pages', () => {
    for (const page of allPages()) {
      const questions = [
        { key: 'prediction', c: page.prediction },
        { key: 'explain', c: page.explain },
        ...page.classRounds.map((c, i) => ({ key: `round${i}`, c })),
      ]
      const firstIsCorrect = questions.filter(({ key, c }) => optionOrder(`${page.pageId}:${key}`, c.options.length)[0] === c.answer)
      expect(firstIsCorrect.length).toBeLessThan(questions.length)
    }
  })
})
