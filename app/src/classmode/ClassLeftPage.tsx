/**
 * Left page in class mode: the big scoreboard (build prompt 5.5). DOM text at 16 px shows at about 40 px on a
 * 1080p projector, so the score numbers here are large enough to read from the back of a class.
 */
import { useT } from '../i18n'
import type { Page } from '../storage/packSchema'
import { ROUNDS, useClass } from './store'

export function ClassLeftPage({ page }: { page: Page }) {
  const { t, tx } = useT()
  const { teams, round, phase, deltas } = useClass()
  const best = Math.max(...teams.map((x) => x.score))
  return (
    <div data-testid="scoreboard" className="flex h-full flex-col gap-3 bg-paper px-5 py-5 text-ink">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">{t('class.title')}</span>
        {phase !== 'lobby' && (
          <span className="font-mono text-[14px] font-semibold">
            {t('class.round')} {Math.min(round + 1, ROUNDS)}/{ROUNDS}
          </span>
        )}
      </div>
      <h2 className="font-serif text-[24px] leading-none">{tx(page.title)}</h2>
      <ol className="mt-1 flex flex-1 flex-col gap-2.5">
        {teams.map((team) => (
          <li key={team.id} className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white/70 px-3 py-2" style={{ borderLeft: `10px solid ${team.color}` }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink font-mono text-[20px] font-bold text-paper" style={{ background: team.color }}>
              {team.letter}
            </span>
            <span className="flex-1 text-[17px] font-semibold">
              {t('class.team')} {team.letter}
              {phase === 'winner' && team.score === best && ' ★'}
            </span>
            {phase === 'reveal' && deltas[team.id] !== undefined && deltas[team.id] !== 0 && (
              <span className={deltas[team.id] > 0 ? 'font-mono text-[16px] font-bold text-good' : 'font-mono text-[16px] font-bold text-bad'}>
                {deltas[team.id] > 0 ? '+' : ''}
                {deltas[team.id]}
              </span>
            )}
            <span data-testid={`score-${team.id}`} className="w-12 text-right font-mono text-[30px] font-bold leading-none">
              {team.score}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
