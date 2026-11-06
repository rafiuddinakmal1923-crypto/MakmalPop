/** Screen-level extras: DEMO watermark, settings sheet, rotate banner, and the correct/wrong toast with confetti. */
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../game/store'
import { useT, type Key } from '../i18n'
import { useLite, useSettings } from '../shell/settings'
import { playDing, playThud, playUnlock } from '../shell/sound'

export function DemoWatermark() {
  const on = useSettings((s) => s.demoWatermark)
  const { t } = useT()
  if (!on) return null
  return (
    <div data-testid="demo-watermark" className="pointer-events-none absolute top-2 right-3 rotate-[-4deg] rounded border-2 border-bad px-2 font-mono text-[14px] font-bold tracking-widest text-bad opacity-70">
      {t('demo.watermark')}
    </div>
  )
}

function Toggle({ label, value, onChange, testId }: { label: string; value: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <label className="tap flex items-center justify-between gap-4 text-[16px]">
      {label}
      <input data-testid={testId} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[#262626]" />
    </label>
  )
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const s = useSettings()
  const lite = useLite()
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div role="dialog" aria-label={t('settings.title')} className="paper-card w-[min(92vw,360px)] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[22px]">{t('settings.title')}</h2>
          <button className="tap flex items-center justify-center" aria-label={t('settings.close')} onClick={onClose}>
            <X />
          </button>
        </div>
        <Toggle testId="setting-sound" label={t('settings.sound')} value={s.sound} onChange={(v) => s.set({ sound: v })} />
        <Toggle testId="setting-music" label={t('settings.music')} value={s.music && s.sound} onChange={(v) => s.set({ music: v, ...(v ? { sound: true } : {}) })} />
        <Toggle label={t('settings.lite')} value={lite} onChange={(v) => s.setLiteOverride(v)} />
        <Toggle testId="setting-unlock-all" label={t('settings.unlockAll')} value={s.unlockAll} onChange={(v) => s.set({ unlockAll: v })} />
        <Toggle label={t('settings.demo')} value={s.demoWatermark} onChange={(v) => s.set({ demoWatermark: v })} />
      </div>
    </div>
  )
}

export function RotateBanner() {
  const { t } = useT()
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <div className="pointer-events-auto absolute top-2 left-2 right-2 z-30 flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-[14px] text-paper">
      <span className="flex-1">↻ {t('rotate.banner')}</span>
      <button className="tap flex items-center justify-center" aria-label={t('rotate.dismiss')} onClick={() => setHidden(true)}>
        <X size={18} />
      </button>
    </div>
  )
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        angle: (i / 18) * Math.PI * 2 + Math.random() * 0.3,
        dist: 50 + Math.random() * 50,
        size: 5 + Math.random() * 5,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2">
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-sm bg-accent"
          style={{
            width: b.size,
            height: b.size * 0.6,
            animation: 'confetti 700ms ease-out forwards',
            ['--dx' as string]: `${Math.cos(b.angle) * b.dist}px`,
            ['--dy' as string]: `${Math.sin(b.angle) * b.dist}px`,
          }}
        />
      ))}
      <style>{`@keyframes confetti { from { transform: translate(0,0) rotate(0); opacity: 1 } to { transform: translate(var(--dx), var(--dy)) rotate(200deg); opacity: 0 } }`}</style>
    </div>
  )
}

/** Short toast after an answer, with ding/thud and an orange confetti burst for correct answers. */
export function FeedbackToast() {
  const { t, tk } = useT()
  const feedback = useGame((s) => s.feedback)
  const dismiss = useGame((s) => s.dismissFeedback)
  useEffect(() => {
    if (!feedback) return
    if (feedback.key === 'done.title') playUnlock()
    else if (feedback.kind === 'good') playDing()
    else playThud()
    // The unfair-test hint stays on the page; the toast itself fades.
    const id = window.setTimeout(() => {
      if (feedback.key !== 'variables.unfair' && feedback.key !== 'formula.tryAnother') dismiss()
    }, 1600)
    return () => window.clearTimeout(id)
  }, [feedback, dismiss])
  if (!feedback || feedback.key === 'variables.unfair') return null
  return (
    <div className="pointer-events-none absolute top-[18%] left-1/2 z-30 -translate-x-1/2" role="status" aria-live="polite">
      <div
        className={clsx(
          'relative rounded-2xl border-2 border-ink px-5 py-2 text-center shadow-[4px_4px_0_var(--ink)]',
          feedback.kind === 'good' ? 'bg-paper' : 'bg-paper-shade',
        )}
      >
        <div className="font-serif text-[22px]">
          {feedback.kind === 'good' ? '✓ ' : '✗ '}
          {t(feedback.key as Key).replace('{part}', feedback.vars?.part ? tk(`part.${feedback.vars.part}`) : '')}
        </div>
        {feedback.points !== undefined && (
          <div className={clsx('font-mono text-[16px]', feedback.points >= 0 ? 'text-good' : 'text-bad')}>
            {feedback.points >= 0 ? '+' : ''}
            {feedback.points} {t('result.points')}
          </div>
        )}
        {feedback.kind === 'good' && <Confetti />}
      </div>
    </div>
  )
}
