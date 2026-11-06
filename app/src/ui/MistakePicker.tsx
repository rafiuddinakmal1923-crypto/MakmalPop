/**
 * Cikgu Silap card: shows how many mistakes are found and, after a ? on the apparatus is tapped, the 3 reasons
 * to choose from (build prompt section 6, step 7). Screen-space, so it works on every screen size.
 */
import clsx from 'clsx'
import { optionOrder } from '../game/shuffle'
import { useGame } from '../game/store'
import { useT } from '../i18n'

export function MistakePicker({ className }: { className?: string }) {
  const { t, tk, tx } = useT()
  const page = useGame((s) => s.page)
  const step = useGame((s) => s.step)
  const found = useGame((s) => s.mistakesFound)
  const selected = useGame((s) => s.mistakeSelected)
  const answer = useGame((s) => s.answerMistake)
  const end = useGame((s) => s.endMistakes)
  if (!page || step !== 'mistakes') return null
  const total = page.mistakes.length
  const m = page.mistakes.find((x) => x.id === selected)
  const all = found.length === total

  return (
    <section data-testid="mistake-picker" className={clsx('paper-card pointer-events-auto flex flex-col gap-2 p-3', className)}>
      <div className="flex items-center justify-between">
        <span className="font-serif text-[18px]">{t('step.mistakes')}</span>
        <span className="flex gap-1" aria-label={`${found.length}/${total} ${t('mistakes.found')}`}>
          {page.mistakes.map((x) => (
            <span key={x.id} className={clsx('h-4 w-4 rounded-full border-[1.5px] border-ink', found.includes(x.id) && 'bg-good')} />
          ))}
        </span>
      </div>
      {all ? (
        <>
          <p className="text-[15px] font-semibold">{t('mistakes.allFound')}</p>
          <button data-testid="mistakes-end" onClick={end} className="tap rounded-lg border-[1.5px] border-ink bg-ink px-4 font-semibold text-paper">
            {t('mistakes.back')}
          </button>
        </>
      ) : m ? (
        <>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">{tk(`mistake.${m.id}`)}</p>
          <p className="font-serif text-[16px]">{t('mistakes.why')}</p>
          {optionOrder(`${page.pageId}:mistake:${m.id}`, m.reasons.length).map((i) => (
            <button
              key={i}
              data-testid={`reason-${i}`}
              onClick={() => answer(i)}
              className="tap rounded-lg border-[1.5px] border-ink bg-white/70 px-3 py-1.5 text-left text-[14px] leading-snug font-semibold"
            >
              {tx(m.reasons[i])}
            </button>
          ))}
        </>
      ) : (
        <p className="text-[14px] text-ink-soft">{t('mistakes.pick')}</p>
      )}
    </section>
  )
}
