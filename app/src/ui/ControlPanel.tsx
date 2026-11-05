/**
 * Control panel card over the lower right page: the manipulated-variable slider, Jalankan (Run),
 * Langkau (Skip), the stopwatch and an orange oscillation counter (build prompt 5.3).
 */
import clsx from 'clsx'
import { FastForward, Play } from 'lucide-react'
import { getModel } from '../experiments/models'
import { manipulatedRange, useGame } from '../game/store'
import { useT } from '../i18n'

export function ControlPanel({ className }: { className?: string }) {
  const { t, tk } = useT()
  const { page, step, settings, setControl, startRun, skipRun, run } = useGame()
  if (!page || step !== 'run') return null
  const model = getModel(page.template)
  const control = model.meta.controls.find((c) => c.key === model.meta.manipulatedControl)!
  const [lo, hi] = manipulatedRange(page)
  const value = settings[control.key] as number
  const state = model.simulate(settings, run.t) as { oscillations?: number }
  const total = page.template === 'pendulum' ? 20 : 0
  const count = run.running || run.t > 0 ? Math.min(total, state.oscillations ?? 0) : 0

  return (
    <section data-testid="control-panel" className={clsx('paper-card pointer-events-auto flex flex-col gap-2 p-3', className)}>
      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-[13px] font-semibold">
          {tk(`var.${control.variableId}`)}
          <span className="font-mono">
            {value} {control.unit}
          </span>
        </span>
        <input
          data-testid="control-slider"
          type="range"
          min={lo}
          max={hi}
          step={control.step}
          value={value}
          disabled={run.running}
          onChange={(e) => setControl(control.key, Number(e.target.value))}
          className="h-12 w-full accent-[#262626]"
        />
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border-[1.5px] border-ink bg-white px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-ink-soft">{t('run.stopwatch')}</div>
          <div data-testid="stopwatch" className="font-mono text-[22px] leading-none tabular-nums">
            {run.t.toFixed(2)}
            <span className="text-[13px]"> s</span>
          </div>
        </div>
        {run.running ? (
          <button data-testid="run-skip" onClick={skipRun} className="tap flex items-center gap-1 rounded-lg border-[1.5px] border-ink bg-white px-3 font-semibold">
            <FastForward size={18} /> {t('run.skip')}
          </button>
        ) : (
          <button data-testid="run-go" onClick={startRun} className="tap flex items-center gap-1 rounded-lg border-[1.5px] border-ink bg-ink px-4 font-semibold text-paper">
            <Play size={18} /> {t('run.go')}
          </button>
        )}
      </div>
      {total > 0 && (
        <div className="flex items-center gap-[3px]" aria-label={`${count} / ${total} ${t('run.oscillations')}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={clsx('h-3 flex-1 rounded-sm', i < count ? 'bg-accent' : 'border border-ink/30')} />
          ))}
          <span className="ml-1 font-mono text-[11px]">
            {count}/{total}
          </span>
        </div>
      )}
    </section>
  )
}
