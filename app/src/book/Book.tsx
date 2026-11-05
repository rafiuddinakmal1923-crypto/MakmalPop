/**
 * The hardcover book on the table. The left half (cover board + page block) is hinged at the spine:
 * closed = folded over onto the right half, front cover facing up; open = lying flat on the left.
 */
import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import type { Group } from 'three'
import { COVER_OVERHANG, COVER_T, PAGE_D, PAGE_W, PAGE_Y } from './dims'

const PAPER = '#F7F2E7'
const PAPER_SHADE = '#E9E1CF'
const COVER = '#D9A441'
const INK = '#262626'

function Half({ side }: { side: -1 | 1 }) {
  const cx = (side * PAGE_W) / 2
  const blockH = PAGE_Y - COVER_T
  return (
    <group>
      {/* Cover board with mustard edge. */}
      <mesh position={[side * ((PAGE_W + COVER_OVERHANG) / 2), COVER_T / 2, 0]}>
        <boxGeometry args={[PAGE_W + COVER_OVERHANG, COVER_T, PAGE_D + 2 * COVER_OVERHANG]} />
        <meshLambertMaterial color={COVER} />
      </mesh>
      {/* Page block: cream top, shaded edges show the stack thickness. */}
      <mesh position={[cx, COVER_T + blockH / 2, 0]}>
        <boxGeometry args={[PAGE_W, blockH, PAGE_D]} />
        <meshLambertMaterial attach="material-0" color={PAPER_SHADE} />
        <meshLambertMaterial attach="material-1" color={PAPER_SHADE} />
        <meshLambertMaterial attach="material-2" color={PAPER} />
        <meshLambertMaterial attach="material-3" color={PAPER_SHADE} />
        <meshLambertMaterial attach="material-4" color={PAPER_SHADE} />
        <meshLambertMaterial attach="material-5" color={PAPER_SHADE} />
      </mesh>
      {/* Page-edge lines along the outer side of the stack. */}
      {[0.25, 0.5, 0.75].map((f) => (
        <mesh key={f} position={[side * (PAGE_W + 0.001), COVER_T + blockH * f, 0]} rotation={[0, side * (Math.PI / 2), 0]}>
          <planeGeometry args={[PAGE_D * 0.98, 0.006]} />
          <meshBasicMaterial color={INK} transparent opacity={0.25} />
        </mesh>
      ))}
      {/* Soft shadow down the spine. */}
      <mesh position={[side * 0.22, PAGE_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.44, PAGE_D]} />
        <meshBasicMaterial color={INK} transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </group>
  )
}

export interface BookProps {
  /** 0 = closed, 1 = open. Animated toward this target. */
  open: boolean
  /** Content on the front cover (shown while closed). */
  cover?: ReactNode
  /** Content lying on the left page (moves with the left half). */
  left?: ReactNode
  /** Content on the right page. */
  right?: ReactNode
  onOpened?: () => void
}

export function Book({ open, cover, left, right }: BookProps) {
  const hinge = useRef<Group>(null)
  const coverGroup = useRef<Group>(null)
  const leftGroup = useRef<Group>(null)
  const p = useRef(open ? 1 : 0)

  useFrame((_, dt) => {
    const target = open ? 1 : 0
    const speed = 1.6 // full open in ~0.6 s
    p.current += Math.sign(target - p.current) * Math.min(Math.abs(target - p.current), dt * speed)
    const e = p.current < 0.5 ? 2 * p.current * p.current : 1 - (-2 * p.current + 2) ** 2 / 2
    if (hinge.current) hinge.current.rotation.z = -(1 - e) * Math.PI
    if (coverGroup.current) coverGroup.current.visible = e < 0.5
    if (leftGroup.current) leftGroup.current.visible = e > 0.97
  })

  return (
    <group>
      <Half side={1} />
      {/* Hinge axis runs along z at the spine, at page height. */}
      <group position={[0, PAGE_Y, 0]}>
        <group ref={hinge}>
          <group position={[0, -PAGE_Y, 0]}>
            <Half side={-1} />
            {/* Front cover face: the underside of the left half, readable once folded over. */}
            <group ref={coverGroup} position={[-PAGE_W / 2, -0.002, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
              {cover}
            </group>
            <group ref={leftGroup} position={[-PAGE_W / 2, PAGE_Y + 0.003, 0]}>
              {left}
            </group>
          </group>
        </group>
      </group>
      <group position={[PAGE_W / 2, PAGE_Y + 0.003, 0]}>{right}</group>
    </group>
  )
}
