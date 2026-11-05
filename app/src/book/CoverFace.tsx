/** The closed book's front cover: title and the two entry buttons (build prompt 5.1). */
import { BookOpen, Users } from 'lucide-react'
import { useT } from '../i18n'
import { useNav } from '../shell/nav'
import { playFlip } from '../shell/sound'

export function CoverFace() {
  const { t } = useT()
  const openBook = useNav((s) => s.openBook)
  const open = (mode: 'student' | 'class') => {
    playFlip()
    openBook(mode)
  }
  return (
    <div className="flex h-full flex-col items-center justify-between bg-cover px-7 py-10 text-ink" style={{ borderRadius: 6 }}>
      <div className="w-full rounded-sm border-2 border-ink bg-paper px-4 py-6 text-center shadow-[4px_4px_0_var(--ink)]">
        <div className="font-serif text-[40px] leading-none">
          Makmal<span className="text-accent">Pop</span>
        </div>
        <div className="mt-2 font-sans text-[15px] text-ink-soft">{t('app.subtitle')}</div>
      </div>
      <svg viewBox="0 0 120 90" className="w-40" aria-hidden>
        <path d="M20 10 V80 M20 12 H70" stroke="#262626" strokeWidth="3" fill="none" />
        <path d="M70 12 L88 62" stroke="#262626" strokeWidth="2" />
        <path d="M58 70 Q80 82 104 66" stroke="#F26B1D" strokeWidth="3" fill="none" strokeDasharray="3 5" />
        <circle cx="90" cy="66" r="8" fill="#F7F2E7" stroke="#262626" strokeWidth="2.5" />
        <path d="M8 82 H50" stroke="#262626" strokeWidth="3" />
      </svg>
      <div className="flex w-full flex-col gap-3">
        <button
          data-testid="cover-student"
          onClick={() => open('student')}
          className="tap flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-paper px-4 py-3 text-[18px] font-semibold shadow-[3px_3px_0_var(--ink)] active:translate-y-0.5"
        >
          <BookOpen size={22} /> {t('cover.student')}
        </button>
        <button
          data-testid="cover-class"
          onClick={() => open('class')}
          className="tap flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-ink px-4 py-3 text-[18px] font-semibold text-paper active:translate-y-0.5"
        >
          <Users size={22} /> {t('cover.class')}
        </button>
      </div>
    </div>
  )
}
