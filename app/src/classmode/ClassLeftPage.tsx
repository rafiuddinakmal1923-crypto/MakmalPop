/**
 * Left page in class mode: the big scoreboard (build prompt 5.5). OWNER: Lane B (task B5).
 *
 * Stage puts this on the left page whenever `screen === 'class'`. DOM text at 16 px shows at about 40 px on a
 * 1080p projector, so 14 px here is the smallest size that stays readable from the back of a class (32 px+).
 */
import { useT } from '../i18n'
import type { Page } from '../storage/packSchema'

export function ClassLeftPage({ page }: { page: Page }) {
  const { tx } = useT()
  return (
    <div className="flex h-full flex-col gap-3 bg-paper px-5 py-5 text-ink">
      <div className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">Mod Kelas</div>
      <h2 className="font-serif text-[30px] leading-none">{tx(page.title)}</h2>
      <p className="text-[16px]">Papan mata pasukan (tugasan B5)</p>
    </div>
  )
}
