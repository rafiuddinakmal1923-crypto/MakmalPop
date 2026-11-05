/**
 * Pendulum pop-up scene on the right page. Local frame: origin at the page centre on the paper,
 * x to the right, y up out of the page, z toward the reader. The bob swings in the x-y plane.
 */
import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { ACCENT, ACCENT_GLOW, INK, Part } from '../../book/lineart'
import { htmlLayer } from '../../book/PageHtml'
import { PopUp } from '../../book/PopUp'
import { useT } from '../../i18n'
import type { SceneProps } from '../types'
import type { PendulumState } from './model'

/** World units per metre of string. */
const UNIT_PER_M = 2.0
const PIVOT: [number, number, number] = [0.2, 2.45, -1.1]
const ROD_X = -1.0
const RULE_X = 0.85

function Label({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} portal={htmlLayer as React.RefObject<HTMLElement>} style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
      <div
        style={{
          whiteSpace: 'nowrap',
          fontFamily: 'Fraunces, serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: INK,
          borderBottom: `1px solid ${INK}`,
          paddingRight: 4,
          transform: 'translate(6px, -100%)',
        }}
      >
        {text}
      </div>
    </Html>
  )
}

export function PendulumScene({ getState, settings, running, lite }: SceneProps<PendulumState>) {
  const { t } = useT()
  const swing = useRef<Group>(null)
  const bob = useRef<Mesh>(null)
  const glow = useRef<Mesh>(null)
  const dash = useRef<{ material: { dashOffset: number } } | null>(null)

  const lengthM = (settings.length_cm as number) / 100
  const L = lengthM * UNIT_PER_M
  const massG = (settings.mass_g as number) ?? 50
  const bobR = 0.1 + 0.05 * Math.cbrt(massG / 200)
  const amp = (Math.min((settings.amplitude_deg as number) ?? 8, 10) * Math.PI) / 180

  // Orange arc the bob sweeps through (the motion trail).
  const arc = useMemo(() => {
    const pts: [number, number, number][] = []
    const a = amp * 1.15
    for (let i = 0; i <= 24; i++) {
      const th = -a + (2 * a * i) / 24
      pts.push([Math.sin(th) * L, -Math.cos(th) * L, 0])
    }
    return pts
  }, [L, amp])

  useFrame((_, dt) => {
    const s = getState()
    if (swing.current) swing.current.rotation.z = s.theta
    if (glow.current) {
      const speed = Math.abs(s.omega) / Math.max(1e-6, amp * ((2 * Math.PI) / s.period))
      glow.current.visible = running
      glow.current.scale.setScalar(1 + 0.6 * speed)
    }
    if (dash.current && running && !lite) dash.current.material.dashOffset -= dt * 1.5
  })

  // Metre-rule ticks every 10 cm, from the pivot down.
  const ticks = useMemo(() => {
    const segs: [number, number, number][] = []
    for (let cm = 0; cm <= 100; cm += 10) {
      const y = PIVOT[1] - (cm / 100) * UNIT_PER_M
      const w = cm % 50 === 0 ? 0.12 : 0.07
      segs.push([RULE_X - 0.06, y, PIVOT[2] + 0.04], [RULE_X - 0.06 + w, y, PIVOT[2] + 0.04])
    }
    return segs
  }, [])

  return (
    <group>
      {/* 0: stand base */}
      <PopUp index={0}>
        <Part position={[ROD_X + 0.55, 0.05, PIVOT[2]]}>
          <boxGeometry args={[1.4, 0.08, 0.8]} />
        </Part>
      </PopUp>
      {/* 1: rod and clamp */}
      <PopUp index={1}>
        <Part position={[ROD_X, (PIVOT[1] + 0.2) / 2, PIVOT[2]]}>
          <cylinderGeometry args={[0.045, 0.045, PIVOT[1] + 0.2, 10]} />
        </Part>
        <Part position={[(ROD_X + PIVOT[0]) / 2, PIVOT[1], PIVOT[2]]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, PIVOT[0] - ROD_X, 8]} />
        </Part>
        <Part position={[ROD_X, PIVOT[1], PIVOT[2]]}>
          <boxGeometry args={[0.18, 0.16, 0.16]} />
        </Part>
        <Label position={[ROD_X, 0.9, PIVOT[2]]} text={t('label.stand')} />
      </PopUp>
      {/* 2: metre rule */}
      <PopUp index={2}>
        <Part position={[RULE_X, PIVOT[1] - UNIT_PER_M / 2, PIVOT[2]]}>
          <boxGeometry args={[0.16, UNIT_PER_M + 0.1, 0.05]} />
        </Part>
        <Line points={ticks} segments color={INK} lineWidth={1} />
        <Label position={[RULE_X + 0.1, PIVOT[1] - UNIT_PER_M * 0.75, PIVOT[2]]} text={t('label.rule')} />
      </PopUp>
      {/* 3: protractor, string and bob */}
      <PopUp index={3}>
        <group position={PIVOT}>
          <mesh rotation={[0, 0, Math.PI]}>
            <ringGeometry args={[0.26, 0.3, 24, 1, 0, Math.PI]} />
            <meshBasicMaterial color="#fbf8f1" side={2} />
          </mesh>
          <Line
            points={Array.from({ length: 25 }, (_, i) => {
              const th = Math.PI + (Math.PI * i) / 24
              return [Math.cos(th) * 0.3, Math.sin(th) * 0.3, 0] as [number, number, number]
            })}
            color={INK}
            lineWidth={1}
          />
          {/* Orange arc trail: the motion of the bob. */}
          <Line
            ref={dash as never}
            points={arc}
            color={ACCENT}
            lineWidth={2.5}
            dashed
            dashSize={0.08}
            gapSize={0.06}
            transparent
            opacity={running ? 1 : 0.35}
          />
          <group ref={swing}>
            <Line points={[[0, 0, 0], [0, -L, 0]]} color={INK} lineWidth={1.4} />
            <Part ref={bob} position={[0, -L, 0]} edgeThreshold={80}>
              <sphereGeometry args={[bobR, 20, 14]} />
            </Part>
            <mesh ref={glow} position={[0, -L, 0]} visible={false}>
              <sphereGeometry args={[bobR * 1.35, 16, 12]} />
              <meshBasicMaterial color={ACCENT_GLOW} transparent opacity={0.45} depthWrite={false} />
            </mesh>
            <Label position={[bobR, -L, 0]} text={t('label.bob')} />
          </group>
        </group>
      </PopUp>
    </group>
  )
}
