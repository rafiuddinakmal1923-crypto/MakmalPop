/**
 * Monochrome line-art look: cream surfaces with thin dark outlines (build prompt section 4).
 * Orange (accent) is only for energy, heat, current and motion.
 */
import { Edges } from '@react-three/drei'
import type { ReactNode } from 'react'
import type { ThreeElements } from '@react-three/fiber'

export const INK = '#262626'
export const PAPER = '#fbf8f1'
export const ACCENT = '#F26B1D'
export const ACCENT_GLOW = '#FFB37A'

type MeshProps = ThreeElements['mesh']

/** A line-art mesh: flat cream fill plus ink edges. Put the geometry as the child. */
export function Part({
  children,
  color = PAPER,
  edgeThreshold = 30,
  edges = true,
  ...props
}: MeshProps & { children: ReactNode; color?: string; edgeThreshold?: number; edges?: boolean }) {
  return (
    <mesh {...props}>
      {children}
      <meshLambertMaterial color={color} />
      {edges && <Edges threshold={edgeThreshold} color={INK} lineWidth={1.4} />}
    </mesh>
  )
}
