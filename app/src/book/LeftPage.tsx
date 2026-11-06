/**
 * Concept page (left page of an experiment spread): chapter label, title, step strip, the current step's
 * panel, and the "lift the flap" card that reveals the formula once it is unlocked (build prompt section 4).
 */
import clsx from 'clsx'
import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StepPanel } from '../game/StepPanel'
import { STEPS, useGame } from '../game/store'
import { useT } from '../i18n'
import type { Page } from '../storage/packSchema'

function StepStrip() {
  const { t, tk } = useT()
  const step = useGame((s) => s.step)
  const current = step === 'done' ? STEPS.length : STEPS.indexOf(step)
  return (
    <div className="flex items-center gap-2">
      <ol className="flex gap-1" aria-label={t('score.label')}>
        {STEPS.map((s, i) => (
          <li
            key={s}
            title={tk(`step.${s}`)}
            aria-current={i === current ? 'step' : undefined}
            className={clsx(
              'flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] font-mono text-[11px] font-semibold',
              i < current && 'border-ink bg-ink text-paper',
              i === current && 'border-ink bg-white text-ink ring-2 ring-ink ring-offset-1 ring-offset-paper',
              i > current && 'border-ink-soft/50 text-ink-soft',
            )}
          >
            {i < current ? '✓' : i + 1}
          </li>
        ))}
      </ol>
      <span className="truncate text-[14px] font-semibold">{step === 'done' ? '★' : tk(`step.${step}`)}</span>
    </div>
  )
}

function FormulaFlap({ latex }: { latex: string }) {
  const { t } = useT()
  const unlocked = useGame((s) => s.formulaUnlocked)
  const [lifted, setLifted] = useState(false)
  // KaTeX is loaded on demand: it is only needed for the formula card, not for the first screen.
  const [html, setHtml] = useState('')
  useEffect(() => {
    let alive = true
    void Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([k]) => {
      if (alive) setHtml(k.default.renderToString(latex, { throwOnError: false, displayMode: true }))
    })
    return () => {
      alive = false
    }
  }, [latex])
  const open = unlocked && lifted
  return (
    <div className="relative mt-auto h-[64px]" style={{ perspective: 600 }}>
      {/* Answer underneath the flap. */}
      <div className="absolute inset-0 flex items-center justify-center rounded-lg border-[1.5px] border-ink bg-white text-[15px]" aria-hidden={!open}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {/* The paper flap, hinged at its top edge. */}
      <button
        data-testid="formula-flap"
        disabled={!unlocked}
        onClick={() => setLifted((v) => !v)}
        aria-expanded={open}
        className="tap absolute inset-0 flex items-center gap-2 rounded-lg border-[1.5px] border-ink bg-paper-shade px-3 text-left text-[14px] font-semibold transition-transform duration-500"
        style={{ transformOrigin: 'top', transform: open ? 'rotateX(115deg)' : 'rotateX(0deg)', backfaceVisibility: 'hidden' }}
      >
        {!unlocked && <Lock size={18} aria-label={t('flap.locked')} />}
        <span className="flex-1">{t('flap.cta')}</span>
        <span className="text-[18px]">{unlocked ? '↑' : ''}</span>
      </button>
    </div>
  )
}

export function LeftPage({ page }: { page: Page }) {
  const { t, tx } = useT()
  const score = useGame((s) => s.score)
  return (
    <div className="flex h-full flex-col gap-2 bg-paper px-5 pt-4 pb-4 text-ink">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
          {t('chapter.label')} {page.chapter.number} · {tx(page.chapter.title)}
        </span>
        <span className="font-mono text-[13px]" aria-label={t('score.label')}>
          ★ {score}
        </span>
      </div>
      <h2 className="-mt-1 font-serif text-[26px] leading-none">{tx(page.title)}</h2>
      <StepStrip />
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        <StepPanel page={page} />
      </div>
      <FormulaFlap latex={page.formula.latex} />
    </div>
  )
}
