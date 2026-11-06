/**
 * Class battle mode (build prompt 5.5, SRS FR-30 to FR-33). The teacher runs it from one device on a projector:
 * lobby (2 default teams) → 3 rounds (each team's answer + stake, one Jalankan, the experiment runs, points)
 * → winner. The scoreboard is on the left page (ClassLeftPage); this panel sits to the right of the book.
 *
 * Sizes use clamp(): about 18 px on a phone and 32-40 px on a 1080p projector (NFR-07).
 */
import clsx from 'clsx'
import { FastForward, Minus, Play, Plus, Trophy } from 'lucide-react'
import { useEffect } from 'react'
import type { Stake } from '../game/scoring'
import { optionOrder } from '../game/shuffle'
import { useGame } from '../game/store'
import { useT } from '../i18n'
import { useNav } from '../shell/nav'
import { playDing, playThud } from '../shell/sound'
import { allPages } from '../storage/packs'
import { MAX_TEAMS, MIN_TEAMS, ROUNDS, useClass, winners, type Team } from './store'

const BIG = 'text-[clamp(18px,1.9vw,38px)]'
const MID = 'text-[clamp(15px,1.45vw,30px)]'
const SMALL = 'text-[clamp(13px,1.05vw,22px)]'

export function TeamBadge({ team, size = 'md' }: { team: Team; size?: 'md' | 'lg' }) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink font-mono font-bold text-paper',
        size === 'lg' ? 'h-[clamp(40px,3.4vw,68px)] w-[clamp(40px,3.4vw,68px)] text-[clamp(20px,1.8vw,36px)]' : 'h-[clamp(32px,2.6vw,52px)] w-[clamp(32px,2.6vw,52px)] text-[clamp(16px,1.4vw,28px)]',
      )}
      style={{ background: team.color }}
    >
      {team.letter}
    </span>
  )
}

function Lobby() {
  const { t } = useT()
  const { teams, addTeam, removeTeam, start } = useClass()
  return (
    <div className="flex flex-col gap-[clamp(10px,1.2vw,24px)]">
      <div className={clsx(MID, 'font-semibold')}>{t('class.teams')}</div>
      <div className="flex flex-wrap gap-3">
        {teams.map((team) => (
          <span key={team.id} className={clsx(MID, 'flex items-center gap-2 font-semibold')}>
            <TeamBadge team={team} /> {t('class.team')} {team.letter}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button data-testid="class-remove-team" aria-label={t('class.removeTeam')} disabled={teams.length <= MIN_TEAMS} onClick={removeTeam} className="tap flex items-center justify-center rounded-xl border-2 border-ink px-4 disabled:opacity-30">
          <Minus />
        </button>
        <button data-testid="class-add-team" aria-label={t('class.addTeam')} disabled={teams.length >= MAX_TEAMS} onClick={addTeam} className="tap flex items-center justify-center rounded-xl border-2 border-ink px-4 disabled:opacity-30">
          <Plus />
        </button>
      </div>
      <button data-testid="class-start" onClick={start} className={clsx(BIG, 'tap rounded-2xl border-2 border-ink bg-ink px-6 py-[clamp(8px,1vw,20px)] font-semibold text-paper')}>
        {t('class.start')} →
      </button>
    </div>
  )
}

function Round() {
  const { t, tx } = useT()
  const spread = useNav((s) => s.spread)
  const page = allPages()[spread - 1]
  const { teams, round, phase, picks, deltas, pick, setStake, beginRun, reveal, next } = useClass()
  const run = useGame((s) => s.run)
  const resetSettings = useGame((s) => s.resetSettings)
  const startRun = useGame((s) => s.startRun)
  const skipRun = useGame((s) => s.skipRun)
  const q = page.classRounds[round]
  const order = optionOrder(`${page.pageId}:round${round}`, q.options.length)
  const allPicked = teams.every((tm) => picks[tm.id]?.option !== undefined)

  // When the run finishes, reveal the answer and apply the points.
  useEffect(() => {
    if (phase === 'running' && !run.running && run.t > 0) {
      reveal(q.answer)
      const anyRight = teams.some((tm) => picks[tm.id]?.option === q.answer)
      if (anyRight) playDing()
      else playThud()
    }
  }, [phase, run.running, run.t, reveal, q.answer, teams, picks])

  const go = () => {
    resetSettings(q.settings)
    beginRun()
    startRun()
  }

  return (
    <div className="flex flex-col gap-[clamp(8px,1vw,20px)]">
      <div className={clsx(SMALL, 'font-semibold uppercase tracking-wide text-ink-soft')}>
        {t('class.round')} {round + 1} / {ROUNDS}
      </div>
      <p data-testid="class-question" className={clsx(BIG, 'font-serif leading-tight')}>
        {tx(q.question)}
      </p>
      <ol className="flex flex-col gap-1">
        {order.map((i, n) => (
          <li
            key={i}
            className={clsx(
              MID,
              'flex items-center gap-2 rounded-xl border-2 px-3 py-1',
              phase === 'reveal' && i === q.answer ? 'border-good bg-good text-paper' : 'border-transparent',
            )}
          >
            <span className="font-mono font-bold">{n + 1}</span> {tx(q.options[i])}
            {phase === 'reveal' && i === q.answer && <span className="ml-auto">✓ {t('class.answer')}</span>}
          </li>
        ))}
      </ol>

      {phase === 'predict' && (
        <>
          <p className={clsx(SMALL, 'text-ink-soft')}>{t('class.pickPrompt')}</p>
          <div className="flex flex-col gap-2">
            {teams.map((team) => (
              <div key={team.id} data-testid={`class-team-${team.id}`} className="flex flex-wrap items-center gap-2">
                <TeamBadge team={team} />
                {order.map((i, n) => (
                  <button
                    key={i}
                    data-testid={`class-pick-${team.id}-${i}`}
                    aria-pressed={picks[team.id]?.option === i}
                    aria-label={`${t('class.team')} ${team.letter}: ${tx(q.options[i])}`}
                    onClick={() => pick(team.id, i)}
                    className={clsx(MID, 'tap min-w-[clamp(48px,3.6vw,72px)] rounded-xl border-2 border-ink font-mono font-bold', picks[team.id]?.option === i ? 'bg-ink text-paper' : 'bg-white/70')}
                  >
                    {n + 1}
                  </button>
                ))}
                <span className={clsx(SMALL, 'ml-2 text-ink-soft')}>{t('class.stake')}</span>
                {([1, 2, 3] as Stake[]).map((st) => (
                  <button
                    key={st}
                    data-testid={`class-stake-${team.id}-${st}`}
                    aria-pressed={picks[team.id]?.stake === st}
                    aria-label={`${t('class.stake')} ${st}`}
                    onClick={() => setStake(team.id, st)}
                    className={clsx(MID, 'tap min-w-[clamp(48px,3.2vw,64px)] rounded-full border-2 border-ink font-mono', picks[team.id]?.stake === st ? 'bg-cover' : 'bg-white/50')}
                  >
                    {st}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <button data-testid="class-run" disabled={!allPicked} onClick={go} className={clsx(BIG, 'tap flex items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-ink py-[clamp(8px,1vw,20px)] font-semibold text-paper disabled:opacity-35')}>
            <Play /> {t('class.run')}
          </button>
        </>
      )}

      {phase === 'running' && (
        <div className="flex items-center gap-3">
          <span className={clsx(MID, 'flex-1')}>{t('class.running')}</span>
          <button data-testid="class-skip" onClick={skipRun} className={clsx(MID, 'tap flex items-center gap-2 rounded-xl border-2 border-ink px-4 font-semibold')}>
            <FastForward /> {t('class.skip')}
          </button>
        </div>
      )}

      {phase === 'reveal' && (
        <>
          <div className="flex flex-wrap gap-3">
            {teams.map((team) => (
              <span key={team.id} className={clsx(MID, 'flex items-center gap-2 font-mono font-bold')}>
                <TeamBadge team={team} />
                <span className={deltas[team.id] > 0 ? 'text-good' : deltas[team.id] < 0 ? 'text-bad' : 'text-ink-soft'}>
                  {deltas[team.id] > 0 ? '+' : ''}
                  {deltas[team.id]}
                </span>
              </span>
            ))}
          </div>
          <button data-testid="class-next" onClick={next} className={clsx(BIG, 'tap rounded-2xl border-2 border-ink bg-ink py-[clamp(8px,1vw,20px)] font-semibold text-paper')}>
            {round + 1 >= ROUNDS ? t('class.seeWinner') : t('class.nextRound')} →
          </button>
        </>
      )}
    </div>
  )
}

function Winner() {
  const { t } = useT()
  const { teams, playAgain } = useClass()
  const openBook = useNav((s) => s.openBook)
  const top = winners(teams)
  useEffect(() => playDing(), [])
  return (
    <div data-testid="class-winner" className="flex flex-col items-center gap-[clamp(10px,1.2vw,24px)] text-center">
      <Trophy className="h-[clamp(48px,5vw,96px)] w-[clamp(48px,5vw,96px)]" />
      <div className="text-[clamp(28px,3.2vw,64px)] font-serif leading-none">{top.length > 1 ? t('class.tie') : t('class.winner')}</div>
      <div className="flex flex-wrap justify-center gap-4">
        {top.map((team) => (
          <span key={team.id} className={clsx(BIG, 'flex items-center gap-2 font-semibold')}>
            <TeamBadge team={team} size="lg" /> {t('class.team')} {team.letter} · {team.score} {t('class.points')}
          </span>
        ))}
      </div>
      <div className="flex gap-3">
        <button data-testid="class-again" onClick={playAgain} className={clsx(MID, 'tap rounded-xl border-2 border-ink bg-ink px-6 font-semibold text-paper')}>
          {t('class.again')}
        </button>
        <button onClick={() => openBook('class')} className={clsx(MID, 'tap rounded-xl border-2 border-ink px-6 font-semibold')}>
          {t('class.exit')}
        </button>
      </div>
    </div>
  )
}

export function ClassMode() {
  const { t, tx } = useT()
  const spread = useNav((s) => s.spread)
  const page = allPages()[spread - 1]
  const pageId = useClass((s) => s.pageId)
  const phase = useClass((s) => s.phase)
  const reset = useClass((s) => s.reset)
  useEffect(() => {
    if (page && pageId !== page.pageId) reset(page.pageId)
  }, [page, pageId, reset])
  if (!page || pageId !== page.pageId) return null

  return (
    <section
      data-testid="classmode"
      className="paper-card pointer-events-auto absolute top-3 right-3 bottom-[76px] flex w-[min(40vw,760px)] min-w-[300px] flex-col gap-[clamp(8px,1vw,20px)] overflow-y-auto p-[clamp(12px,1.4vw,28px)]"
    >
      <div>
        <div className={clsx(SMALL, 'font-semibold uppercase tracking-wide text-ink-soft')}>{t('class.title')}</div>
        <h2 className="text-[clamp(22px,2.4vw,48px)] font-serif leading-none">{tx(page.title)}</h2>
      </div>
      {phase === 'lobby' ? <Lobby /> : phase === 'winner' ? <Winner /> : <Round />}
    </section>
  )
}
