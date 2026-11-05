/** The notebook card: readings table and graph, sliding up over the lower left page (build prompt 5.3). */
import clsx from 'clsx'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getModel } from '../experiments/models'
import { readingsReady, useGame } from '../game/store'
import { useT } from '../i18n'
import { Graph } from './Graph'

/** Continue button inside the notebook, so it is reachable even when the notebook covers the left page. */
function RunContinue() {
  const { t } = useT()
  const page = useGame((s) => s.page)
  const readings = useGame((s) => s.readings)
  const running = useGame((s) => s.run.running)
  const finishRun = useGame((s) => s.finishRun)
  if (!page) return null
  const ready = readingsReady(page, readings)
  const enough = ready.reason === 'ok' || ready.reason === 'curved'
  return (
    <div className="flex items-center gap-2 border-t border-ink/20 px-3 py-2">
      <span className="flex-1 text-[12px] text-ink-soft">{enough ? '' : ready.reason === 'narrow-span' ? t('formula.needSpread') : t('run.need')}</span>
      <button
        data-testid="run-continue"
        disabled={!enough || running}
        onClick={finishRun}
        className="tap flex items-center gap-1 rounded-lg border-[1.5px] border-ink bg-ink px-4 font-semibold text-paper disabled:opacity-40"
      >
        {t('run.next')} <ArrowRight size={18} />
      </button>
    </div>
  )
}

export function Notebook({ className }: { className?: string }) {
  const { t, tk } = useT()
  const { page, readings, step, graphId, unlock } = useGame(
    useShallow((s) => ({ page: s.page, readings: s.readings, step: s.step, graphId: s.graphId, unlock: s.unlock })),
  )
  const [open, setOpen] = useState(true)
  const [yPick, setYPick] = useState<string | null>(null)
  if (!page || !['run', 'explain', 'formula', 'done'].includes(step)) return null
  const meta = getModel(page.template).meta
  const q = (id: string) => meta.quantities.find((x) => x.id === id)!
  const fmt = (id: string, v: number) => v.toFixed(q(id).decimals)
  // In the Formula step the chosen graph is shown; otherwise the student can switch the y quantity.
  const graph = meta.graphs.find((g) => g.id === graphId) ?? meta.graphs.find((g) => g.y === yPick) ?? meta.graphs[0]
  const judged = step === 'formula' && graphId && unlock

  return (
    <section data-testid="notebook" className={clsx('paper-card pointer-events-auto flex flex-col overflow-hidden', className)}>
      <button className="flex h-10 items-center justify-between px-3 text-[14px] font-semibold" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>
          {t('notebook.title')} · <span className="font-mono">{readings.length}</span>
        </span>
        {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>
      {open && (
        <div className="flex gap-2 px-3 pb-3">
          <table className="min-w-0 flex-1 self-start font-mono text-[12px]">
            <thead>
              <tr className="border-b border-ink">
                {meta.columns.map((c) => (
                  <th key={c} className="px-1 py-0.5 text-right font-semibold">
                    {tk(`q.${c}`)}
                    <span className="block text-[10px] font-normal text-ink-soft">{q(c).unit}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 && (
                <tr>
                  <td colSpan={meta.columns.length} className="py-2 text-center font-sans text-ink-soft">
                    {t('notebook.empty')}
                  </td>
                </tr>
              )}
              {readings.map((r, i) => (
                <tr key={i} className="border-b border-ink/10">
                  {meta.columns.map((c) => (
                    <td key={c} className="px-1 py-0.5 text-right">
                      {fmt(c, r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="w-[48%] shrink-0">
            {step !== 'formula' && (
              <div className="mb-1 flex gap-1">
                {meta.graphs.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setYPick(g.y)}
                    className={clsx('h-7 flex-1 rounded border border-ink font-mono text-[11px]', graph.id === g.id ? 'bg-ink text-paper' : '')}
                  >
                    {tk(`q.${g.y}`)}
                  </button>
                ))}
              </div>
            )}
            <Graph
              xs={readings.map((r) => r[graph.x])}
              ys={readings.map((r) => r[graph.y])}
              xLabel={`${tk(`q.${graph.x}`)} / ${q(graph.x).unit}`}
              yLabel={`${tk(`q.${graph.y}`)} / ${q(graph.y).unit}`}
              showFit={!!judged}
              fitColor={judged ? (unlock!.ok ? '#2E8B57' : '#C0392B') : undefined}
            />
          </div>
        </div>
      )}
      {step === 'run' && <RunContinue />}
    </section>
  )
}
