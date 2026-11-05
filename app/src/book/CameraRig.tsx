/**
 * Camera: looks down ~38° onto the book, fits the book to ~85% of the viewport width, allows a small
 * orbit (±15°) and pinch-zoom, eases to a new framing when the view changes, and resets on request.
 */
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CAMERA_POLAR_DEG } from './dims'

export interface Framing {
  /** Point the camera looks at. */
  target: [number, number, number]
  /** World width that must fit, and the fraction of the viewport width it should fill. */
  width: number
  depth: number
  fill?: number
  /** Extra height above the page (pop-ups) to keep in view. */
  height?: number
  /** Fraction of the viewport height the book may use (leaves room for the toolbar). */
  vfill?: number
  polarDeg?: number
}

const ORBIT_LIMIT = MathUtils.degToRad(15)

function fitDistance(cam: PerspectiveCamera, f: Framing, aspect: number): number {
  const vfov = MathUtils.degToRad(cam.fov)
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
  const polar = MathUtils.degToRad(f.polarDeg ?? CAMERA_POLAR_DEG)
  const fill = f.fill ?? 0.85
  const dW = f.width / fill / 2 / Math.tan(hfov / 2)
  // Projected depth of the book plus the pop-up height, with room for the toolbar.
  const projected = f.depth * Math.cos(polar) + (f.height ?? 0) * Math.sin(polar)
  const dH = projected / (f.vfill ?? 0.78) / 2 / Math.tan(vfov / 2)
  return Math.max(dW, dH)
}

export function CameraRig({ framing, resetTick }: { framing: Framing; resetTick: number }) {
  const { camera, size } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const anim = useRef<{ fromPos: Vector3; toPos: Vector3; fromTarget: Vector3; toTarget: Vector3; t: number } | null>(null)
  const basePolar = MathUtils.degToRad(framing.polarDeg ?? CAMERA_POLAR_DEG)

  useEffect(() => {
    const cam = camera as PerspectiveCamera
    const d = fitDistance(cam, framing, size.width / size.height)
    const target = new Vector3(...framing.target)
    const pos = new Vector3(0, Math.cos(basePolar) * d, Math.sin(basePolar) * d).add(target)
    const c = controls.current
    anim.current = {
      fromPos: cam.position.clone(),
      toPos: pos,
      fromTarget: c ? c.target.clone() : target.clone(),
      toTarget: target,
      t: cam.position.lengthSq() < 1e-6 ? 1 : 0,
    }
    if (c) {
      c.minDistance = d * 0.55
      c.maxDistance = d * 1.25
    }
  }, [camera, framing, size.width, size.height, resetTick, basePolar])

  useFrame((_, dt) => {
    const a = anim.current
    const c = controls.current
    if (!a || !c) return
    a.t = Math.min(1, a.t + dt / 0.8)
    const e = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2
    camera.position.lerpVectors(a.fromPos, a.toPos, e)
    c.target.lerpVectors(a.fromTarget, a.toTarget, e)
    c.update()
    if (a.t >= 1) anim.current = null
  })

  return (
    <OrbitControls
      ref={controls as never}
      enablePan={false}
      enableDamping
      dampingFactor={0.12}
      minPolarAngle={Math.max(0.05, basePolar - ORBIT_LIMIT)}
      maxPolarAngle={basePolar + ORBIT_LIMIT}
      minAzimuthAngle={-ORBIT_LIMIT}
      maxAzimuthAngle={ORBIT_LIMIT}
      rotateSpeed={0.5}
    />
  )
}
