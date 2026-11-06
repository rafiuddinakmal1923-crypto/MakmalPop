/** The contents spread: Form 4 chapters on the left page, Form 5 on the right (build prompt 5.2). */
import { Check, Lock } from 'lucide-react'
import { useT } from '../i18n'
import { CHAPTERS } from '../i18n/strings/book'
import { useNav } from '../shell/nav'
import { useSettings } from '../shell/settings'
import { playFlip } from '../shell/sound'
import { useProgress } from '../storage/db'
import { allPages } from '../storage/packs'
import { isUnlocked } from './locks'

export function ContentsPage({ form }: { form: 4 | 5 }) {
  const { t, tk, tx } = useT()
  const pages = allPages()
  const progress = useProgress()
  const { mode, goTo, startClass } = useNav()
  const unlockAll = useSettings((s) => s.unlockAll)

  return (
    <div className="h-full bg-paper px-6 py-6 text-ink">
      {form === 4 && <div className="mb-1 font-serif text-[26px] leading-tight">{t('contents.title')}</div>}
      <div className="mb-3 border-b border-ink pb-1 text-[14px] font-semibold uppercase tracking-wide text-ink-soft">
        {form === 4 ? t('contents.form4') : t('contents.form5')}
      </div>
      <ol className="flex flex-col gap-1.5">
        {CHAPTERS[form].map((n) => {
          const chapterPages = pages.map((p, i) => ({ p, i })).filter(({ p }) => p.chapter.form === form && p.chapter.number === n)
          return (
            <li key={n} className="text-[15px]">
              <div className="flex items-baseline gap-2">
                <span className="w-5 shrink-0 font-mono text-[13px] text-ink-soft">{n}</span>
                <span className={chapterPages.length ? 'font-semibold' : 'text-ink-soft'}>{tk(`chapter.${form}.${n}`)}</span>
                {!chapterPages.length && <span className="ml-auto text-[12px] italic text-ink-soft">{t('contents.soon')}</span>}
              </div>
              {chapterPages.map(({ p, i }) => {
                const open = isUnlocked(i, pages, progress, { mode, unlockAll })
                const done = progress[p.pageId]?.completed
                return (
                  <button
                    key={p.pageId}
                    data-testid={`contents-${p.pageId}`}
                    disabled={!open}
                    onClick={() => {
                      playFlip(mode === 'class')
                      if (mode === 'class') startClass(i + 1)
                      else goTo(i + 1)
                    }}
                    className="tap ml-7 mt-1 flex w-[calc(100%-1.75rem)] items-center gap-2 rounded-lg border-[1.5px] border-ink bg-white/60 px-3 text-left disabled:border-dashed disabled:border-ink-soft disabled:bg-transparent"
                  >
                    <span className="flex-1">
                      <span className="block font-serif text-[16px]">{tx(p.title)}</span>
                      {!open && <span className="block text-[12px] text-ink-soft">{t('contents.locked')}</span>}
                    </span>
                    {!open && <Lock size={18} aria-label={t('contents.locked')} />}
                    {done && (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-good text-paper" title={t('contents.done')}>
                        <Check size={18} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
