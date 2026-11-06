/**
 * The 3D scene: table, book, page content, the experiment pop-up, the turning sheet and the camera.
 * Lite mode: pixel ratio 1, no antialias, no idle drift, flat page turn.
 */
import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CanvasTexture, type Group } from 'three'
import { ClassLeftPage } from '../classmode/ClassLeftPage'
import { templates } from '../experiments/registry'
import { useGame } from '../game/store'
import { useNav } from '../shell/nav'
import { useLite, useSettings } from '../shell/settings'
import { allPages } from '../storage/packs'
import type { Page } from '../storage/packSchema'
import { Book } from './Book'
import { CameraRig, type Framing } from './CameraRig'
import { ContentsPage } from './ContentsPage'
import { CoverFace } from './CoverFace'
import { BOOK_D, BOOK_W, PAGE_D, PAGE_W, PAGE_Y } from './dims'
import { LeftPage } from './LeftPage'
import { htmlLayer, PageHtml } from './PageHtml'
import { PageTurn } from './PageTurn'
import { PopUpContext } from './PopUp'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Gentle idle drift: ±1° over an 8 s loop. Off in lite mode and with reduced motion. */
function Drift({ lite, children }: { lite: boolean; children: ReactNode }) {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.rotation.y = lite || reducedMotion() ? 0 : Math.sin((clock.elapsedTime * Math.PI * 2) / 8) * (Math.PI / 180)
  })
  return <group ref={g}>{children}</group>
}

/** A soft blurred shadow under the book (cheaper than real shadows, and it follows the open/closed footprint). */
function BookShadow({ open }: { open: boolean }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')!
    ctx.filter = 'blur(18px)'
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(40, 40, 176, 176)
    return new CanvasTexture(c)
  }, [])
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const targetW = open ? BOOK_W : BOOK_W / 2
    const targetX = open ? 0 : BOOK_W / 4
    g.scale.x += (targetW * 1.25 - g.scale.x) * Math.min(1, dt * 4)
    g.position.x += (targetX - g.position.x) * Math.min(1, dt * 4)
  })
  return (
    <group ref={ref} position={[BOOK_W / 4, 0.005, 0.15]} scale={[BOOK_W / 2, 1, 1]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, BOOK_D * 1.25, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Advances the game's run clock every frame (it drives the scene and the stopwatch). */
function RunClock() {
  useFrame((_, dt) => useGame.getState().tick(Math.min(dt, 0.1)))
  return null
}

/** Turns lite mode on automatically if the median frame time over the first 3 s of a spread is above 40 ms. */
function LiteMonitor({ spread }: { spread: number }) {
  const samples = useRef<number[]>([])
  const start = useRef(0)
  const setLiteAuto = useSettings((s) => s.setLiteAuto)
  useEffect(() => {
    samples.current = []
    start.current = performance.now()
  }, [spread])
  useFrame((_, dt) => {
    if (start.current === 0) return
    const elapsed = performance.now() - start.current
    if (elapsed < 500) return // skip the first frames after a page change (asset upload)
    samples.current.push(dt * 1000)
    if (elapsed > 3500) {
      const s = [...samples.current].sort((a, b) => a - b)
      if (s.length && s[Math.floor(s.length / 2)] > 40) setLiteAuto(true)
      start.current = 0
    }
  })
  return null
}

function Experiment({ page, lite }: { page: Page; lite: boolean }) {
  const tpl = templates[page.template]
  const settings = useGame((s) => s.settings)
  const running = useGame((s) => s.run.running)
  const step = useGame((s) => s.step)
  const found = useGame((s) => s.mistakesFound)
  const selected = useGame((s) => s.mistakeSelected)
  const selectMistake = useGame((s) => s.selectMistake)
  const getState = useCallback(() => {
    const g = useGame.getState()
    return tpl.simulate(g.settings, g.run.t)
  }, [tpl])
  const mistakes = useMemo(
    () => (step === 'mistakes' ? { found, selected, onPick: selectMistake } : undefined),
    [step, found, selected, selectMistake],
  )
  if (!tpl || !settings[tpl.meta.manipulatedControl]) return null
  return <tpl.Scene getState={getState} settings={settings} running={running} lite={lite} mistakes={mistakes} />
}

/** True `ms` after `on` became true (content appears once the cover has opened). */
function useAfter(on: boolean, ms: number) {
  const [v, setV] = useState(on)
  useEffect(() => {
    if (!on) {
      setV(false)
      return
    }
    const id = window.setTimeout(() => setV(true), ms)
    return () => window.clearTimeout(id)
  }, [on, ms])
  return v
}

/**
 * `short`: a phone in landscape (viewport under 560 px tall). The whole open book would make page text ~10 px, so
 * the camera focuses the left page for reading steps and pans to the apparatus for the run.
 */
export function Stage({ portrait, short }: { portrait: boolean; short: boolean }) {
  const lite = useLite()
  const screen = useNav((s) => s.screen)
  const spread = useNav((s) => s.spread)
  const turn = useNav((s) => s.turn)
  const portraitView = useNav((s) => s.portraitView)
  const resetTick = useNav((s) => s.cameraResetTick)
  const pages = allPages()
  const page = spread > 0 ? pages[spread - 1] : null
  const isOpen = screen !== 'cover'
  const opened = useAfter(isOpen, 650)
  const showContent = opened && !turn
  const step = useGame((s) => s.step)
  const popSince = useMemo(() => (showContent ? performance.now() : 0), [showContent, spread])

  const framing = useMemo<Framing>(() => {
    if (!isOpen) return { target: [PAGE_W / 2, PAGE_Y, 0], width: PAGE_W, depth: BOOK_D, fill: 0.55, vfill: 0.62 }
    if (portrait) return { target: [PAGE_W / 2, PAGE_Y + 0.6, -0.2], width: PAGE_W * 1.05, depth: PAGE_D, fill: 0.96, height: 2.5 }
    // Class mode on a projector: closer to the right page, scoreboard still readable on the left.
    if (screen === 'class' && page && !portrait)
      // The book sits on the left ~60% of the screen; the class panel takes the right.
      return { target: [1.9, PAGE_Y + 0.4, 0.1], width: BOOK_W, depth: BOOK_D, fill: 0.56, vfill: 0.84, height: 2.4 }
    if (short && page && (step === 'run' || step === 'mistakes'))
      return { target: [PAGE_W / 2 - 0.1, PAGE_Y + 0.7, -0.6], width: PAGE_W * 0.8, depth: PAGE_D * 0.7, fill: 0.3, vfill: 0.8, height: 2.6 }
    if (short && page) return { target: [-PAGE_W / 2 + 0.35, PAGE_Y, 0.55], width: PAGE_W * 1.3, depth: PAGE_D, fill: 0.62, vfill: 0.72 }
    if (short) return { target: [0, PAGE_Y, 0.35], width: BOOK_W, depth: BOOK_D, fill: 0.92, vfill: 0.86 }
    return { target: [0, PAGE_Y, page ? 0.2 : 0.55], width: BOOK_W, depth: BOOK_D, fill: 0.88, vfill: page ? 0.66 : 0.74, height: page ? 2.4 : 0 }
  }, [isOpen, portrait, page, short, step, screen])

  const left = showContent && !portrait ? (
    page && screen === 'class' ? (
      <PageHtml testId="class-left">
        <ClassLeftPage page={page} />
      </PageHtml>
    ) : page ? (
      <PageHtml testId="left-page">
        <LeftPage page={page} />
      </PageHtml>
    ) : (
      <PageHtml testId="contents-left">
        <ContentsPage form={4} />
      </PageHtml>
    )
  ) : null

  const right = page ? (
    <PopUpContext.Provider value={{ shown: showContent, since: popSince }}>
      <Experiment page={page} lite={lite} />
    </PopUpContext.Provider>
  ) : showContent ? (
    <PageHtml testId="contents-right">
      <ContentsPage form={5} />
    </PageHtml>
  ) : null

  return (
    <>
    <Canvas
      data-testid="stage"
      dpr={lite ? 1 : [1, 2]}
      gl={{ antialias: !lite, powerPreference: 'low-power' }}
      camera={{ fov: 35, near: 0.1, far: 200, position: [0, 0, 0] }}
      frameloop={portrait && portraitView === 'concept' ? 'demand' : 'always'}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={(state) => {
        // Hide the HTML splash once the 3D canvas is ready.
        const splash = document.getElementById('splash')
        if (splash) {
          // Stop catching taps at once: on a slow device the removal timer below can fire seconds late.
          splash.style.pointerEvents = 'none'
          splash.style.opacity = '0'
          window.setTimeout(() => splash.remove(), 450)
        }
        // Dev-only handle for debugging in the browser console and Playwright.
        if (import.meta.env.DEV) (window as unknown as { __r3f: unknown }).__r3f = state
      }}
    >
      <color attach="background" args={['#9DB0A9']} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[-4, 9, 6]} intensity={1.6} />
      <CameraRig framing={framing} resetTick={resetTick} />
      <Drift lite={lite}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial color="#9DB0A9" />
        </mesh>
        <BookShadow open={isOpen} />
        <Book
          open={isOpen}
          cover={
            screen === 'cover' ? (
              <PageHtml testId="cover" flat={false}>
                <CoverFace />
              </PageHtml>
            ) : null
          }
          left={left}
          right={right}
        />
        <PageTurn lite={lite} />
      </Drift>
      <RunClock />
      <LiteMonitor spread={spread} />
    </Canvas>
    {/* Page DOM from <Html> lands here, above the canvas and below the screen overlays. */}
    <div ref={(el) => void (htmlLayer.current = el)} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" />
    </>
  )
}
