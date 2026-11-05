/**
 * Bundled content packs. They are imported from code (not fetched) so Vite bundles them and the
 * service worker precaches them with the app.
 */
import t4 from '../../../content/fizik-t4.json'
import t5 from '../../../content/fizik-t5.json'
import { packSchema, type Pack, type Page } from './packSchema'

export const bundledPackSources: Record<string, unknown> = { 'fizik-t4': t4, 'fizik-t5': t5 }

/** Parse a pack, throwing a readable error listing every problem. */
export function parsePack(source: unknown, name = 'pack'): Pack {
  const result = packSchema.safeParse(source)
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
    throw new Error(`${name} is not a valid content pack:\n${lines.join('\n')}`)
  }
  return result.data
}

let cache: Page[] | null = null

/** All pages from the bundled packs, Form 4 first, in chapter order. */
export function allPages(): Page[] {
  if (!cache) {
    cache = Object.entries(bundledPackSources)
      .flatMap(([name, src]) => parsePack(src, name).pages)
      .sort((a, b) => a.chapter.form - b.chapter.form || a.chapter.number - b.chapter.number)
  }
  return cache
}
