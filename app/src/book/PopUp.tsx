/**
 * Pop-up book effect: a part lies flat on the page, then springs upright with a 60 ms stagger by index.
 * Wrap each apparatus part: <PopUp index={2}>...</PopUp>. The hinge is the part's local origin (on the page).
 */
import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { POP_STAGGER_MS } from './dims'

/** Whether the parts on this page should be standing (true) or folded flat (false). */
export const PopUpContext = createContext<{ shown: boolean; since: number }>({ shown: true, since: 0 })

const STIFFNESS = 170
const DAMPING = 14

export function PopUp({ index = 0, children }: { index?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  const ctx = useContext(PopUpContext)
  const st = useRef({ x: 0, v: 0 })
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useFrame((_, dtRaw) => {
    const g = ref.current
    if (!g) return
    const dt = Math.min(dtRaw, 1 / 30)
    const delayOver = performance.now() - ctx.since > index * POP_STAGGER_MS
    const target = ctx.shown && delayOver ? 1 : 0
    const s = st.current
    if (reduced) {
      s.x = target
      s.v = 0
    } else {
      const a = STIFFNESS * (target - s.x) - DAMPING * s.v
      s.v += a * dt
      s.x += s.v * dt
    }
    const p = Math.max(0, s.x)
    g.visible = p > 0.01
    // Folded flat toward the reader, standing up at p = 1 (a little overshoot looks like paper springing).
    g.rotation.x = (1 - p) * (Math.PI / 2)
    g.scale.setScalar(0.6 + 0.4 * Math.min(p, 1.08))
  })

  return <group ref={ref}>{children}</group>
}
