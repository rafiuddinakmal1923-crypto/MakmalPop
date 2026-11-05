/**
 * Tiny i18n: Bahasa Melayu first, English second. Every student-facing string goes through here.
 * Strings live in one file per module under ./strings, so the two lanes never edit the same file.
 */
import { useSettings } from '../shell/settings'
import type { Text } from '../storage/packSchema'
import { book } from './strings/book'
import { common } from './strings/common'
import { experiments } from './strings/experiments'
import { game } from './strings/game'

const modules = [common, book, game, experiments]

export type Lang = 'ms' | 'en'
export type Key = keyof typeof common.ms | keyof typeof book.ms | keyof typeof game.ms | keyof typeof experiments.ms

const dict: Record<Lang, Record<string, string>> = {
  ms: Object.assign({}, ...modules.map((m) => m.ms)),
  en: Object.assign({}, ...modules.map((m) => m.en)),
}

/** Look up a key; English falls back to BM, and an unknown key shows itself so it is easy to spot. */
export function translate(lang: Lang, key: Key | string): string {
  return dict[lang][key] ?? dict.ms[key] ?? key
}

/** Pick the language from a content-pack text, falling back to BM when English is empty. */
export function pickText(lang: Lang, text: Text): string {
  return (lang === 'en' && text.en) || text.ms
}

export function useT() {
  const lang = useSettings((s) => s.lang)
  return {
    lang,
    /** Typed lookup. Use `translate` directly for computed keys such as `var.${id}`. */
    t: (key: Key) => translate(lang, key),
    /** Computed key, for example `var.${id}` or `chapter.${form}.${n}`. */
    tk: (key: string) => translate(lang, key),
    tx: (text: Text) => pickText(lang, text),
  }
}
