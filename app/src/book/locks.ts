import type { Mode } from '../shell/nav'
import type { ProgressRecord } from '../storage/db'
import type { Page } from '../storage/packSchema'

/**
 * Page n (0-based in allPages()) is open when it is the first page or the previous page is completed.
 * Locks apply to student mode only: class mode and the "unlock all" setting ignore them (FR-04).
 */
export function isUnlocked(
  index: number,
  pages: Page[],
  progress: Record<string, ProgressRecord>,
  opts: { mode: Mode; unlockAll: boolean },
): boolean {
  if (opts.mode === 'class' || opts.unlockAll || index <= 0) return true
  return !!progress[pages[index - 1]?.pageId]?.completed
}
