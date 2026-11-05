import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { LeftPage } from './book/LeftPage'
import { FlatPage } from './book/PageHtml'
import { ContentsPage } from './book/ContentsPage'
import { Stage } from './book/Stage'
import { ClassMode } from './classmode/ClassMode'
import { useGame } from './game/store'
import { useT } from './i18n'
import { useNav } from './shell/nav'
import { useSettings } from './shell/settings'
import { useViewport } from './shell/useViewport'
import { allPages } from './storage/packs'
import { ControlPanel } from './ui/ControlPanel'
import { Notebook } from './ui/Notebook'
import { DemoWatermark, FeedbackToast, RotateBanner, SettingsSheet } from './ui/Overlays'
import { Toolbar } from './ui/Toolbar'

/** Lite mode on by default when the device reports 4 GB of memory or less (Chrome only; frame time covers the rest). */
function useDeviceLite() {
  const setLiteAuto = useSettings((s) => s.setLiteAuto)
  useEffect(() => {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (typeof mem === 'number' && mem <= 4) setLiteAuto(true)
  }, [setLiteAuto])
}

/** Start (or keep) the game for the experiment page that is open. */
function useGameForPage() {
  const screen = useNav((s) => s.screen)
  const spread = useNav((s) => s.spread)
  useEffect(() => {
    if (screen !== 'book' || spread === 0) return
    const page = allPages()[spread - 1]
    if (page && useGame.getState().page?.pageId !== page.pageId) useGame.getState().begin(page)
  }, [screen, spread])
}

function PortraitSwitch() {
  const { t } = useT()
  const view = useNav((s) => s.portraitView)
  const setView = useNav((s) => s.setPortraitView)
  return (
    <div className="pointer-events-auto absolute top-3 left-1/2 z-20 flex -translate-x-1/2 rounded-full border-[1.5px] border-ink bg-paper p-0.5 shadow">
      {(['concept', 'experiment'] as const).map((v) => (
        <button
          key={v}
          data-testid={`portrait-${v}`}
          onClick={() => setView(v)}
          className={clsx('tap rounded-full px-4 text-[15px] font-semibold', view === v ? 'bg-ink text-paper' : '')}
        >
          {t(v === 'concept' ? 'page.concept' : 'page.experiment')}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const vp = useViewport()
  const screen = useNav((s) => s.screen)
  const spread = useNav((s) => s.spread)
  const turn = useNav((s) => s.turn)
  const portraitView = useNav((s) => s.portraitView)
  const step = useGame((s) => s.step)
  const [settingsOpen, setSettingsOpen] = useState(false)
  useDeviceLite()
  useGameForPage()

  const page = spread > 0 ? allPages()[spread - 1] : null
  const inSpread = screen === 'book' && !!page && !turn
  const portrait = vp.portrait && screen !== 'cover'
  const short = !vp.portrait && vp.height < 560
  // Landscape: the notebook sits over the left page during the run, and over the right page afterwards
  // (so it never hides the step panel the student needs next).
  const notebookSide = step === 'run' ? 'left-3' : 'right-3'

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Stage portrait={portrait} short={short} />

      {portrait && screen === 'book' && portraitView === 'concept' && !turn && (
        <FlatPage viewportWidth={vp.width} testId={page ? 'left-page' : 'contents-flat'}>
          {page ? (
            <LeftPage page={page} />
          ) : (
            <>
              <ContentsPage form={4} />
              <ContentsPage form={5} />
            </>
          )}
        </FlatPage>
      )}

      <div className="pointer-events-none absolute inset-0">
        {portrait && screen === 'book' && page && <PortraitSwitch />}
        {vp.portrait && screen === 'cover' && <RotateBanner />}

        {inSpread && !portrait && (
          <>
            <Notebook className={clsx('absolute bottom-[72px]', short ? 'w-[min(38vw,360px)]' : 'w-[min(46vw,440px)]', notebookSide)} />
            <ControlPanel className={clsx('absolute right-3 bottom-[72px]', short ? 'w-[min(27vw,250px)]' : 'w-[min(32vw,300px)]')} />
          </>
        )}
        {inSpread && portrait && portraitView === 'experiment' && (
          <div className="absolute right-2 bottom-[72px] left-2 flex flex-col gap-2">
            <ControlPanel />
            <Notebook />
          </div>
        )}

        {screen === 'class' && <ClassMode />}
        <Toolbar onSettings={() => setSettingsOpen(true)} />
        <FeedbackToast />
        <DemoWatermark />
        {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      </div>
    </div>
  )
}
