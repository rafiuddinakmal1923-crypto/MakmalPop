/**
 * The turning sheet: a segmented paper strip hinged at the spine that rotates over with a slight curl
 * (600 ms, ease-in-out). Built as a chain of segments so the paper keeps its length while it bends.
 */
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, PlaneGeometry, type Mesh } from 'three'
import { useNav } from '../shell/nav'
import { PAGE_D, PAGE_TURN_MS, PAGE_W, PAGE_Y } from './dims'

const SEGS = 24

export function PageTurn({ lite }: { lite: boolean }) {
  const turn = useNav((s) => s.turn)
  const mesh = useRef<Mesh>(null)
  const geom = useMemo(() => new PlaneGeometry(PAGE_W, PAGE_D, SEGS, 1), [])

  useFrame(() => {
    const m = mesh.current
    if (!m || !turn) return
    const raw = Math.min(1, (performance.now() - turn.startedAt) / PAGE_TURN_MS)
    const p = raw < 0.5 ? 2 * raw * raw : 1 - (-2 * raw + 2) ** 2 / 2
    const prog = turn.dir === 1 ? p : 1 - p
    const theta = prog * Math.PI
    // Lite mode: a flat sheet (no curl) to keep it cheap and simple.
    const curl = lite ? 0 : -0.9 * Math.sin(prog * Math.PI)
    const pos = geom.attributes.position
    const seg = PAGE_W / SEGS
    let x = 0
    let y = 0
    for (let i = 0; i <= SEGS; i++) {
      for (let row = 0; row < 2; row++) pos.setXYZ(row * (SEGS + 1) + i, x, y, row === 0 ? -PAGE_D / 2 : PAGE_D / 2)
      const a = theta + curl * (i / SEGS)
      x += Math.cos(a) * seg
      y += Math.sin(a) * seg
    }
    pos.needsUpdate = true
    geom.computeVertexNormals()
    geom.computeBoundingSphere()
  })

  if (!turn) return null
  return (
    <mesh ref={mesh} geometry={geom} position={[0, PAGE_Y + 0.01, 0]} frustumCulled={false}>
      <meshLambertMaterial color="#F7F2E7" side={DoubleSide} />
    </mesh>
  )
}
