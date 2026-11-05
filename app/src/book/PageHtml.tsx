/** Crisp DOM content lying on a page, via drei <Html transform>. */
import { Html } from '@react-three/drei'
import type { ReactNode } from 'react'
import { HTML_SCALE, PAGE_PX_H, PAGE_PX_W } from './dims'

/**
 * A stable element (rendered by Stage over the canvas) that every <Html> portals into. Without it, drei attaches
 * to `events.connected`, which changes after the first frame; drei then makes a new React root but never renders
 * into it, so the page stays empty (drei 10.7 + React 19).
 */
export const htmlLayer: { current: HTMLDivElement | null } = { current: null }

/**
 * `flat` (default) lays the DOM on a page facing up, top edge away from the reader. Pass flat={false} when the
 * parent group already orients it (the front cover).
 */
export function PageHtml({ children, testId, flat = true }: { children: ReactNode; testId?: string; flat?: boolean }) {
  return (
    <group rotation={flat ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} scale={HTML_SCALE}>
      <Html transform portal={htmlLayer as React.RefObject<HTMLElement>} zIndexRange={[20, 10]} style={{ width: PAGE_PX_W, height: PAGE_PX_H }}>
        <div data-testid={testId} style={{ width: PAGE_PX_W, height: PAGE_PX_H }} className="select-none overflow-hidden">
          {children}
        </div>
      </Html>
    </group>
  )
}

/** The same page DOM shown flat on screen (phone portrait), scaled to fit the width. */
export function FlatPage({ children, testId, viewportWidth }: { children: ReactNode; testId?: string; viewportWidth: number }) {
  const zoom = Math.min(1.2, (viewportWidth - 24) / PAGE_PX_W)
  return (
    <div className="absolute inset-0 flex items-start justify-center overflow-auto bg-table pt-[72px] pb-28">
      <div data-testid={testId} className="rounded-md bg-paper shadow-xl" style={{ width: PAGE_PX_W, minHeight: PAGE_PX_H, zoom }}>
        {children}
      </div>
    </div>
  )
}
