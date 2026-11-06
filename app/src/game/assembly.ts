/**
 * "Susun sendiri" (set it up myself): rules for placing apparatus on the page. Pure and unit-tested.
 * The student must pick the right pieces (some on the shelf are not needed), put each in its own place,
 * and build in a sensible order (for example the clamp before the bob).
 */
import type { Assembly } from '../experiments/types'
import { optionOrder } from './shuffle'

export type DropResult =
  | { ok: true; complete: boolean }
  | { ok: false; reason: 'not-needed' | 'wrong-slot' | 'already' }
  | { ok: false; reason: 'needs'; needs: string }

export function checkDrop(assembly: Assembly, placed: string[], partId: string, slotId: string): DropResult {
  if (assembly.distractors.includes(partId)) return { ok: false, reason: 'not-needed' }
  if (placed.includes(partId)) return { ok: false, reason: 'already' }
  if (partId !== slotId) return { ok: false, reason: 'wrong-slot' }
  const part = assembly.parts.find((p) => p.id === partId)
  if (!part) return { ok: false, reason: 'not-needed' }
  const missing = (part.requires ?? []).find((r) => !placed.includes(r))
  if (missing) return { ok: false, reason: 'needs', needs: missing }
  return { ok: true, complete: placed.length + 1 === assembly.parts.length }
}

/** What is left on the shelf, in a fixed shuffled order (right pieces and distractors mixed). */
export function shelf(assembly: Assembly, placed: string[], key: string): string[] {
  const all = [...assembly.parts.map((p) => p.id), ...assembly.distractors]
  return optionOrder(key, all.length)
    .map((i) => all[i])
    .filter((id) => !placed.includes(id))
}
