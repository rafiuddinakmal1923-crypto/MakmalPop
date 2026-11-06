/**
 * Class battle mode (build prompt 5.5, SRS FR-30 to FR-33). OWNER: Lane B (task B5).
 *
 * This is a placeholder so the entry flow works end to end: Mod Kelas → pick an experiment → this screen.
 * Replace it with the real lobby, teams, rounds and scoreboard. Use only:
 *  - `useNav` (spread, closeBook) and `allPages()` for the current page and its `classRounds`
 *  - `game/scoring.ts` (applyPrediction) for points
 *  - `useGame` for the experiment run only: `setControl(key, value)`, `startRun()`, `skipRun()`, `run`, `readings`.
 *    The Stage already shows the experiment on the right page and moves the camera closer in class mode.
 *  - `ClassLeftPage.tsx` (also yours) is drawn on the left page: put the scoreboard there.
 *  - Round questions come from `page.classRounds[round]`; use `optionOrder` (game/shuffle) for display order.
 */
import { useT } from '../i18n'
import { useNav } from '../shell/nav'
import { allPages } from '../storage/packs'

export function ClassMode() {
  const { tx } = useT()
  const spread = useNav((s) => s.spread)
  const openBook = useNav((s) => s.openBook)
  const page = allPages()[spread - 1]
  return (
    <div data-testid="classmode" className="pointer-events-auto absolute top-4 left-4 paper-card max-w-xs p-4">
      <div className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">Mod Kelas</div>
      <h2 className="font-serif text-[28px]">{page ? tx(page.title) : ''}</h2>
      <p className="mt-2 text-[15px]">Pasukan, ramalan, 3 pusingan dan papan mata akan dibina di sini (tugasan B5).</p>
      <button className="tap mt-3 rounded-lg border-[1.5px] border-ink px-4 font-semibold" onClick={() => openBook('class')}>
        ← Kandungan
      </button>
    </div>
  )
}
