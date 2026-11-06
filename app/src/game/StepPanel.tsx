/**
 * The interactive part of the left page: one panel per game step (build prompt section 6).
 * Variables use tap-to-place (tap a slot button on each chip), which works on touch and for accessibility.
 */
import clsx from 'clsx'
import { ArrowRight, Coins, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getModel } from '../experiments/models'
import { useT } from '../i18n'
import type { Page } from '../storage/packSchema'
import type { Stake } from './scoring'
import { optionOrder } from './shuffle'
import { readingsReady, useGame, type Slot } from './store'

const SLOTS: { slot: Slot; key: 'variables.manipulated' | 'variables.responding' | 'variables.constant'; short: string }[] = [
  { slot: 'manipulated', key: 'variables.manipulated', short: 'M' },
  { slot: 'responding', key: 'variables.responding', short: 'R' },
  { slot: 'constant', key: 'variables.constant', short: 'K' },
]

function Btn({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={clsx(
        'tap rounded-lg border-[1.5px] border-ink px-3 text-[15px] font-semibold disabled:opacity-40 active:translate-y-px',
        className,
      )}
    />
  )
}

function Mission({ page }: { page: Page }) {
  const { t, tx } = useT()
  const accept = useGame((s) => s.acceptMission)
  return (
    <div className="flex flex-col gap-2">
      {page.concept.map((c, i) => (
        <p key={i} className="text-[14px] leading-snug">
          {tx(c)}
        </p>
      ))}
      <div className="mt-1 rounded-lg border-[1.5px] border-dashed border-ink bg-white/70 p-2.5">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">{t('step.mission')}</div>
        <p className="font-serif text-[16px] leading-snug">{tx(page.mission)}</p>
      </div>
      <Btn data-testid="mission-accept" className="mt-1 flex items-center justify-center gap-2 bg-ink text-paper" onClick={accept}>
        {t('mission.start')} <ArrowRight size={18} />
      </Btn>
    </div>
  )
}

function Variables({ page }: { page: Page }) {
  const { t, tk } = useT()
  const { placement, place, checkVariables, feedback } = useGame(useShallow((s) => ({ placement: s.placement, place: s.place, checkVariables: s.checkVariables, feedback: s.feedback })))
  const [shake, setShake] = useState(0)
  const ids = getModel(page.template).meta.variableIds
  const wrong = feedback?.key === 'variables.unfair'
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[14px]">{t('variables.prompt')}</p>
      {/* A key instead of column headings: full names like "Manipulated" do not fit over 52 px buttons. */}
      <p data-testid="slot-key" className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] leading-snug text-ink-soft">
        {SLOTS.map((s) => (
          <span key={s.slot} className="whitespace-nowrap">
            <b className="font-mono text-ink">{s.short}</b> = {t(s.key)}
          </span>
        ))}
      </p>
      {ids.map((id) => (
        <div key={`${id}-${shake}`} data-testid={`chip-${id}`} className={clsx('flex items-center gap-1', wrong && shake > 0 && 'shake')}>
          <span className="flex-1 rounded-full border-[1.5px] border-ink bg-white px-2.5 py-1 text-[14px] font-semibold">{tk(`var.${id}`)}</span>
          {SLOTS.map((s) => (
            <button
              key={s.slot}
              data-testid={`place-${id}-${s.slot}`}
              aria-pressed={placement[id] === s.slot}
              aria-label={`${tk(`var.${id}`)}: ${t(s.key)}`}
              onClick={() => place(id, placement[id] === s.slot ? undefined : s.slot)}
              className={clsx(
                'tap h-12 w-[52px] rounded-lg border-[1.5px] font-mono text-[15px]',
                placement[id] === s.slot ? 'border-ink bg-ink text-paper' : 'border-ink-soft bg-transparent text-ink-soft',
              )}
            >
              {s.short}
            </button>
          ))}
        </div>
      ))}
      {wrong && (
        <p className="text-[13px] font-semibold text-bad" role="alert">
          ✗ {t('variables.unfair')}. <span className="font-normal text-ink">{t('variables.hint')}</span>
        </p>
      )}
      <Btn
        data-testid="variables-check"
        className="bg-ink text-paper"
        disabled={ids.some((id) => !placement[id])}
        onClick={() => {
          if (!checkVariables()) setShake((n) => n + 1)
        }}
      >
        {t('variables.check')}
      </Btn>
    </div>
  )
}

function Predict({ page }: { page: Page }) {
  const { t, tx } = useT()
  const lock = useGame((s) => s.lockPrediction)
  const [choice, setChoice] = useState<number | null>(null)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-serif text-[16px] leading-snug">{tx(page.prediction.question)}</p>
      {optionOrder(`${page.pageId}:prediction`, page.prediction.options.length).map((i) => (
        <Btn
          key={i}
          data-testid={`predict-${i}`}
          aria-pressed={choice === i}
          className={clsx('text-left', choice === i ? 'bg-ink text-paper' : 'bg-white/70')}
          onClick={() => setChoice(i)}
        >
          {tx(page.prediction.options[i])}
        </Btn>
      ))}
      <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-soft">
        <Coins size={16} /> {t('predict.stake')}
      </p>
      <div className="flex gap-2">
        {([1, 2, 3] as Stake[]).map((s) => (
          <button
            key={s}
            data-testid={`stake-${s}`}
            data-sound="coin"
            data-stake={s}
            disabled={choice === null}
            onClick={() => choice !== null && lock(choice, s)}
            className="tap flex flex-1 items-center justify-center gap-0.5 rounded-full border-[1.5px] border-ink bg-white/70 disabled:opacity-40"
            aria-label={`${s}`}
          >
            {Array.from({ length: s }, (_, k) => (
              <span key={k} className="inline-block h-4 w-4 rounded-full border-[1.5px] border-ink bg-cover" />
            ))}
          </button>
        ))}
      </div>
    </div>
  )
}

function Run({ page }: { page: Page }) {
  const { t } = useT()
  // Select only what this panel needs: the run clock changes every frame and must not re-render the page.
  const readings = useGame((s) => s.readings)
  const running = useGame((s) => s.run.running)
  const finishRun = useGame((s) => s.finishRun)
  const clearReadings = useGame((s) => s.clearReadings)
  const ready = readingsReady(page, readings)
  const enough = ready.reason === 'ok' || ready.reason === 'curved'
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] leading-snug">{t('run.need')}</p>
      <div className="flex items-center gap-1" aria-label={`${readings.length} ${t('run.readings')}`}>
        {Array.from({ length: Math.max(5, readings.length) }, (_, i) => (
          <span key={i} className={clsx('h-3 flex-1 rounded-full border border-ink', i < readings.length ? 'bg-ink' : 'bg-transparent')} />
        ))}
      </div>
      <p className="font-mono text-[13px] text-ink-soft">
        {readings.length} {t('run.readings')}
        {ready.reason === 'narrow-span' && ` · ${t('formula.needSpread')}`}
      </p>
      <div className="flex gap-2">
        <Btn className="bg-white/70" onClick={clearReadings} disabled={!readings.length || running} aria-label={t('run.reset')}>
          <RotateCcw size={18} />
        </Btn>
        <Btn data-testid="run-continue-page" className="flex flex-1 items-center justify-center gap-2 bg-ink text-paper" disabled={!enough || running} onClick={finishRun}>
          {t('run.next')} <ArrowRight size={18} />
        </Btn>
      </div>
    </div>
  )
}

function Explain({ page }: { page: Page }) {
  const { t, tx } = useT()
  const { explainChoice, answerExplain, goFormula } = useGame(useShallow((s) => ({ explainChoice: s.explainChoice, answerExplain: s.answerExplain, goFormula: s.goFormula })))
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-serif text-[16px] leading-snug">{tx(page.explain.question)}</p>
      {optionOrder(`${page.pageId}:explain`, page.explain.options.length).map((i) => {
        const o = page.explain.options[i]
        const answered = explainChoice !== null
        const right = i === page.explain.answer
        return (
          <Btn
            key={i}
            data-testid={`explain-${i}`}
            disabled={answered && !right && explainChoice !== i}
            className={clsx(
              'py-1.5 text-left text-[14px] leading-snug',
              answered && right ? 'border-good bg-good text-paper' : answered && explainChoice === i ? 'border-bad bg-bad text-paper' : 'bg-white/70',
            )}
            onClick={() => answerExplain(i)}
          >
            {answered && right ? '✓ ' : answered && explainChoice === i ? '✗ ' : ''}
            {tx(o)}
          </Btn>
        )
      })}
      {explainChoice !== null && (
        <Btn data-testid="explain-continue" className="flex items-center justify-center gap-2 bg-ink text-paper" onClick={goFormula}>
          {t('run.next')} <ArrowRight size={18} />
        </Btn>
      )}
    </div>
  )
}

function Formula({ page }: { page: Page }) {
  const { t, tk } = useT()
  const { graphId, unlock, chooseGraph, confirmStraight } = useGame(useShallow((s) => ({ graphId: s.graphId, unlock: s.unlock, chooseGraph: s.chooseGraph, confirmStraight: s.confirmStraight })))
  const meta = getModel(page.template).meta
  const label = (q: string) => tk(`q.${q}`)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[14px] leading-snug">{t('formula.prompt')}</p>
      <div className="flex gap-2">
        {meta.graphs.map((g) => (
          <Btn
            key={g.id}
            data-testid={`graph-${g.id}`}
            aria-pressed={graphId === g.id}
            className={clsx('flex-1 font-mono', graphId === g.id ? 'bg-ink text-paper' : 'bg-white/70')}
            onClick={() => chooseGraph(g.id)}
          >
            {label(g.y)} – {label(g.x)}
          </Btn>
        ))}
      </div>
      {unlock && !unlock.ok && graphId && (
        <p className="text-[13px] font-semibold text-bad" role="alert">
          ✗ {t(unlock.reason === 'curved' ? 'formula.tryAnother' : unlock.reason === 'narrow-span' ? 'formula.needSpread' : 'formula.needMore')}
        </p>
      )}
      {unlock?.ok && (
        <>
          <p className="font-mono text-[13px]">
            {t('formula.gradient')} ≈ {unlock.k!.toFixed(2)}
          </p>
          <Btn data-testid="formula-confirm" className="bg-accent text-ink" onClick={confirmStraight}>
            {t('formula.confirm')}
          </Btn>
        </>
      )}
    </div>
  )
}

function Done() {
  const { t } = useT()
  const score = useGame((s) => s.score)
  const page = useGame((s) => s.page)
  const found = useGame((s) => s.mistakesFound.length)
  const startMistakes = useGame((s) => s.startMistakes)
  const hasMistakes = !!page?.mistakes.length
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-[2.5px] border-ink bg-good text-[30px] text-paper shadow-[3px_3px_0_var(--ink)]">★</div>
      <div className="font-serif text-[22px]">{t('done.title')}</div>
      <div className="font-mono text-[15px]">
        {score} {t('result.points')}
      </div>
      {hasMistakes && found === page!.mistakes.length ? (
        <p className="font-mono text-[13px]">
          ✓ {t('mistakes.done')} {found}/{page!.mistakes.length}
        </p>
      ) : hasMistakes ? (
        <Btn data-testid="mistakes-start" className="mt-1 bg-white/70" onClick={startMistakes}>
          {t('done.bonus')} →
        </Btn>
      ) : null}
    </div>
  )
}

function Mistakes({ page }: { page: Page }) {
  const { t } = useT()
  const found = useGame((s) => s.mistakesFound.length)
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] leading-snug">{t('mistakes.intro')}</p>
      <p className="font-mono text-[15px]">
        {found}/{page.mistakes.length} {t('mistakes.found')}
      </p>
    </div>
  )
}

export function StepPanel({ page }: { page: Page }) {
  const step = useGame((s) => s.step)
  switch (step) {
    case 'mission':
      return <Mission page={page} />
    case 'variables':
      return <Variables page={page} />
    case 'predict':
      return <Predict page={page} />
    case 'run':
      return <Run page={page} />
    case 'explain':
      return <Explain page={page} />
    case 'formula':
      return <Formula page={page} />
    case 'done':
      return <Done />
    case 'mistakes':
      return <Mistakes page={page} />
  }
}
