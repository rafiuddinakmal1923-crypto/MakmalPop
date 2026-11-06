/**
 * Floating pill toolbar (build prompt 4): prev, "1 / 3 · Bandul Ringkas", next, and icon buttons for language,
 * contents, lite mode, reset camera and settings. Shows the offline chip when there is no connection.
 */
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Feather, Languages, List, LocateFixed, Settings2, Volume2, VolumeX, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isUnlocked } from '../book/locks'
import { useT } from '../i18n'
import { useNav } from '../shell/nav'
import { useLite, useSettings } from '../shell/settings'
import { playFlip } from '../shell/sound'
import { useProgress } from '../storage/db'
import { allPages } from '../storage/packs'

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', on)
    }
  }, [])
  return online
}

function IconBtn({ label, onClick, active, children, testId, disabled }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode; testId?: string; disabled?: boolean }) {
  return (
    <button
      data-testid={testId}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={clsx('tap flex items-center justify-center rounded-full disabled:opacity-30', active ? 'bg-ink text-paper' : 'text-ink hover:bg-black/5')}
    >
      {children}
    </button>
  )
}

export function Toolbar({ onSettings }: { onSettings: () => void }) {
  const { t, tx, lang } = useT()
  const { screen, mode, spread, goTo, resetCamera, turn } = useNav()
  const toggleLang = useSettings((s) => s.toggleLang)
  const lite = useLite()
  const setLiteOverride = useSettings((s) => s.setLiteOverride)
  const unlockAll = useSettings((s) => s.unlockAll)
  const sound = useSettings((s) => s.sound)
  const setSettings = useSettings((s) => s.set)
  const progress = useProgress()
  const online = useOnline()
  const pages = allPages()

  const total = pages.length
  const title = spread === 0 ? t('toolbar.contents') : `${spread} / ${total} · ${tx(pages[spread - 1].title)}`
  const canPrev = screen === 'book' && spread > 0 && !turn
  const canNext = screen === 'book' && spread < total && !turn && isUnlocked(spread, pages, progress, { mode, unlockAll })
  const go = (to: number) => {
    playFlip(mode === 'class')
    goTo(to)
  }

  return (
    <nav
      data-testid="toolbar"
      className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-black/10 bg-white/80 px-1.5 py-1 shadow-lg backdrop-blur"
    >
      {screen === 'book' && (
        <>
          <IconBtn testId="nav-prev" label={t('toolbar.prev')} onClick={() => go(spread - 1)} disabled={!canPrev}>
            <ChevronLeft />
          </IconBtn>
          <span data-testid="nav-title" className="max-w-[24vw] truncate px-1 text-center text-[14px] font-semibold sm:max-w-[38vw]">
            {title}
          </span>
          <IconBtn testId="nav-next" label={t('toolbar.next')} onClick={() => go(spread + 1)} disabled={!canNext}>
            <ChevronRight />
          </IconBtn>
          <span className="mx-0.5 hidden h-6 w-px bg-black/15 sm:block" />
          <span className="hidden sm:contents">
            <IconBtn label={t('toolbar.contents')} onClick={() => go(0)} disabled={spread === 0 || !!turn}>
              <List size={20} />
            </IconBtn>
          </span>
        </>
      )}
      <IconBtn testId="nav-lang" label={t('toolbar.language')} onClick={toggleLang}>
        <span className="flex items-center gap-0.5 text-[12px] font-bold">
          <Languages size={16} />
          {lang === 'ms' ? 'BM' : 'EN'}
        </span>
      </IconBtn>
      <span className="hidden sm:contents">
        <IconBtn testId="nav-sound" label={t('toolbar.sound')} active={!sound} onClick={() => setSettings({ sound: !sound })}>
          {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </IconBtn>
      </span>
      <IconBtn testId="nav-lite" label={t('toolbar.lite')} active={lite} onClick={() => setLiteOverride(!lite)}>
        <Feather size={19} />
      </IconBtn>
      <span className="hidden sm:contents">
        <IconBtn label={t('toolbar.resetCamera')} onClick={resetCamera}>
          <LocateFixed size={19} />
        </IconBtn>
      </span>
      <IconBtn testId="nav-settings" label={t('toolbar.settings')} onClick={onSettings}>
        <Settings2 size={19} />
      </IconBtn>
      {!online && (
        <span data-testid="offline-chip" className="ml-1 hidden items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[12px] font-semibold text-paper sm:flex">
          <WifiOff size={14} /> {t('offline.chip')}
        </span>
      )}
    </nav>
  )
}
