import { describe, expect, it } from 'vitest'
import { book } from './strings/book'
import { common } from './strings/common'
import { experiments } from './strings/experiments'
import { game } from './strings/game'

describe('i18n dictionaries', () => {
  for (const [name, m] of Object.entries({ common, book, game, experiments })) {
    it(`${name}: every BM key has an English entry`, () => {
      expect(Object.keys(m.en).sort()).toEqual(Object.keys(m.ms).sort())
    })
  }
})
