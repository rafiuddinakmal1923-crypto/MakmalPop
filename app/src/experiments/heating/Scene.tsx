/**
 * Heating pop-up scene on the right page (build prompt 7.2). Local frame: origin at the page centre on the paper,
 * x to the right, y up out of the page, z toward the reader.
 *
 * Orange means heat and current only: the glowing coil, the current in the wires, the heat-flow lines in the
 * water and the thermometer column. Everything else is cream line art.
 */
import { Html, Line, QuadraticBezierLine } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type Mesh, type MeshBasicMaterial, type MeshLambertMaterial } from 'three'
import { ACCENT, ACCENT_GLOW, INK, Part, PAPER } from '../../book/lineart'
import { htmlLayer } from '../../book/PageHtml'
import { PopUp } from '../../book/PopUp'
import { useT } from '../../i18n'
import { Hotspot, type Mistakes } from '../Hotspot'
import type { SceneProps } from '../types'
import type { HeatingState } from './model'

const Z = -1.0
const BEAKER: [number, number, number] = [0.35, 0, Z]
const BEAKER_R = 0.55
const BEAKER_H = 1.3
const WATER_H = 1.0
const HEATER_X = BEAKER[0] - 0.18
const THERMO_X = BEAKER[0] + 0.22
const THERMO_X_ON_HEATER = HEATER_X + 0.08
const SUPPLY: [number, number, number] = [-1.1, 0.3, Z + 0.1]
const THERMO_BOTTOM = 0.3
const THERMO_LEN = 1.75
const html = htmlLayer as React.RefObject<HTMLElement>

function Label({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html position={position} portal={html} style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
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

/** One animated orange line (dash offset moves while the heater is on). */
function Flow({ start, end, mid, on, lite, speed = 1.2, width = 2.2 }: { start: [number, number, number]; end: [number, number, number]; mid: [number, number, number]; on: boolean; lite: boolean; speed?: number; width?: number }) {
  const ref = useRef<{ material: { dashOffset: number } } | null>(null)
  useFrame((_, dt) => {
    if (ref.current && on && !lite) ref.current.material.dashOffset -= dt * speed
  })
  return (
    <QuadraticBezierLine
      ref={ref as never}
      start={start}
      end={end}
      mid={mid}
      color={ACCENT}
      lineWidth={width}
      dashed
      dashSize={0.07}
      gapSize={0.06}
      transparent
      opacity={on ? 1 : 0.15}
    />
  )
}

export function HeatingScene({ getState, settings, running, lite, mistakes }: SceneProps<HeatingState>) {
  const { t } = useT()
  const coil = useRef<MeshLambertMaterial>(null)
  const column = useRef<Mesh>(null)
  const glow = useRef<MeshBasicMaterial>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const insulated = settings.insulated === false ? false : settings.insulated !== 0
  const stirred = settings.stirred !== false
  const onHeater = settings.thermometerOnHeater === true
  const thermoX = onHeater ? THERMO_X_ON_HEATER : THERMO_X
  const paper = useMemo(() => new Color(PAPER), [])
  const hot = useMemo(() => new Color(ACCENT), [])
  const tmp = useMemo(() => new Color(), [])
  const waterTop = BEAKER[1] + WATER_H

  useFrame(() => {
    const s = getState()
    const on = running && s.heaterOn
    if (coil.current) coil.current.color.copy(tmp.copy(paper).lerp(hot, on ? 1 : Math.min(1, s.level * 1.5)))
    if (glow.current) glow.current.opacity = on ? 0.35 : 0
    if (column.current) {
      const h = 0.08 + s.level * (THERMO_LEN - 0.25)
      column.current.scale.y = h
      column.current.position.y = THERMO_BOTTOM + h / 2
    }
    if (readout.current) readout.current.textContent = `${s.theta.toFixed(1)} °C`
  })

  // Heat-flow curves rising from the coil through the water.
  const flows = useMemo(
    () =>
      [-0.25, -0.1, 0.1, 0.25].map((dx, i) => ({
        start: [HEATER_X, 0.35 + i * 0.05, Z] as [number, number, number],
        mid: [HEATER_X + dx * 1.6, 0.6 + i * 0.08, Z + (i % 2 ? 0.25 : -0.25)] as [number, number, number],
        end: [HEATER_X + dx * 1.4, waterTop - 0.05, Z + (i % 2 ? 0.15 : -0.15)] as [number, number, number],
      })),
    [waterTop],
  )

  return (
    // Scaled up so the heater, thermometer and heat flow read clearly from the back of a class.
    <group scale={1.25} position={[0.2, 0, -0.15]}>
      {/* 0: power supply */}
      <PopUp index={0}>
        <Part position={SUPPLY}>
          <boxGeometry args={[0.95, 0.6, 0.65]} />
        </Part>
        {[-0.2, 0.2].map((dx) => (
          <Part key={dx} position={[SUPPLY[0] + dx, SUPPLY[1] + 0.36, SUPPLY[2]]} edgeThreshold={60}>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 12]} />
          </Part>
        ))}
        <Label position={[SUPPLY[0] - 0.45, SUPPLY[1] + 0.3, SUPPLY[2]]} text={t('label.power')} />
      </PopUp>

      {/* 1: beaker of water (and the lagging jacket when insulated) */}
      <PopUp index={1}>
        <mesh position={[BEAKER[0], BEAKER_H / 2, Z]}>
          <cylinderGeometry args={[BEAKER_R, BEAKER_R, BEAKER_H, 28, 1, true]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.25} depthWrite={false} side={2} />
        </mesh>
        <Line
          points={Array.from({ length: 33 }, (_, i) => {
            const a = (i / 32) * Math.PI * 2
            return [BEAKER[0] + Math.cos(a) * BEAKER_R, BEAKER_H, Z + Math.sin(a) * BEAKER_R] as [number, number, number]
          })}
          color={INK}
          lineWidth={1.4}
        />
        <Line points={[[BEAKER[0] - BEAKER_R, 0.01, Z], [BEAKER[0] - BEAKER_R, BEAKER_H, Z]]} color={INK} lineWidth={1.4} />
        <Line points={[[BEAKER[0] + BEAKER_R, 0.01, Z], [BEAKER[0] + BEAKER_R, BEAKER_H, Z]]} color={INK} lineWidth={1.4} />
        {/* Water */}
        <mesh position={[BEAKER[0], WATER_H / 2, Z]}>
          <cylinderGeometry args={[BEAKER_R - 0.02, BEAKER_R - 0.02, WATER_H, 28]} />
          <meshBasicMaterial color="#e7eef0" transparent opacity={0.55} depthWrite={false} />
        </mesh>
        <Line
          points={Array.from({ length: 33 }, (_, i) => {
            const a = (i / 32) * Math.PI * 2
            return [BEAKER[0] + Math.cos(a) * (BEAKER_R - 0.02), waterTop, Z + Math.sin(a) * (BEAKER_R - 0.02)] as [number, number, number]
          })}
          color={INK}
          lineWidth={1}
          transparent
          opacity={0.5}
        />
        {insulated && (
          // See-through lagging jacket with wrap lines, so the heater and heat flow stay visible.
          <group>
            <mesh position={[BEAKER[0], (BEAKER_H - 0.15) / 2, Z]}>
              <cylinderGeometry args={[BEAKER_R + 0.08, BEAKER_R + 0.08, BEAKER_H - 0.15, 28, 1, true]} />
              <meshBasicMaterial color="#E9E1CF" transparent opacity={0.3} side={2} depthWrite={false} />
            </mesh>
            {[0.15, 0.4, 0.65, 0.9].map((y) => (
              <Line
                key={y}
                points={Array.from({ length: 33 }, (_, i) => {
                  const a = (i / 32) * Math.PI * 2
                  return [BEAKER[0] + Math.cos(a) * (BEAKER_R + 0.08), y, Z + Math.sin(a) * (BEAKER_R + 0.08)] as [number, number, number]
                })}
                color={INK}
                lineWidth={0.8}
                transparent
                opacity={0.45}
              />
            ))}
          </group>
        )}
        <Label position={[BEAKER[0] + BEAKER_R + 0.1, 0.35, Z]} text={t(insulated ? 'label.lagging' : 'label.beaker')} />
      </PopUp>

      {/* 2: immersion heater with its coil, and the wires carrying current */}
      <PopUp index={2}>
        <Part position={[HEATER_X, 1.15, Z]} edgeThreshold={60}>
          <cylinderGeometry args={[0.045, 0.045, 1.6, 12]} />
        </Part>
        {[0.32, 0.42, 0.52, 0.62].map((y) => (
          <mesh key={y} position={[HEATER_X, y, Z]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.11, 0.025, 8, 20]} />
            <meshLambertMaterial ref={y === 0.32 ? coil : undefined} color={PAPER} />
          </mesh>
        ))}
        <mesh position={[HEATER_X, 0.47, Z]}>
          <sphereGeometry args={[0.24, 16, 12]} />
          <meshBasicMaterial ref={glow} color={ACCENT_GLOW} transparent opacity={0} depthWrite={false} />
        </mesh>
        <Flow start={[SUPPLY[0] - 0.2, SUPPLY[1] + 0.42, SUPPLY[2]]} mid={[-0.9, 2.3, Z]} end={[HEATER_X - 0.03, 1.95, Z]} on={running} lite={lite} speed={2} width={1.8} />
        <Flow start={[SUPPLY[0] + 0.2, SUPPLY[1] + 0.42, SUPPLY[2]]} mid={[-0.5, 2.1, Z]} end={[HEATER_X + 0.03, 1.95, Z]} on={running} lite={lite} speed={-2} width={1.8} />
        {flows.map((f, i) => (
          <Flow key={i} {...f} on={running} lite={lite} />
        ))}
        <Label position={[HEATER_X - 0.1, 2.0, Z]} text={t('label.heater')} />
      </PopUp>

      {/* 3: thermometer with its column and live reading, and the stirrer */}
      <PopUp index={3}>
        <Part position={[thermoX, THERMO_BOTTOM + THERMO_LEN / 2, Z + 0.15]} edgeThreshold={60}>
          <cylinderGeometry args={[0.035, 0.035, THERMO_LEN, 10]} />
        </Part>
        <Part position={[thermoX, THERMO_BOTTOM, Z + 0.15]} edgeThreshold={80}>
          <sphereGeometry args={[0.06, 12, 10]} />
        </Part>
        <mesh ref={column} position={[thermoX, THERMO_BOTTOM + 0.05, Z + 0.15]}>
          <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
        <Html position={[thermoX + 0.08, THERMO_BOTTOM + THERMO_LEN, Z + 0.15]} portal={html} style={{ pointerEvents: 'none' }} zIndexRange={[6, 0]}>
          <div
            data-testid="thermometer-reading"
            style={{ background: '#FBF8F1', border: `1.5px solid ${INK}`, borderRadius: 6, padding: '0 6px', font: '500 14px JetBrains Mono, monospace', color: INK, whiteSpace: 'nowrap', transform: 'translate(4px, -50%)' }}
          >
            <span ref={readout}>27.0 °C</span>
          </div>
        </Html>
        <Label position={[thermoX + 0.1, 1.45, Z + 0.15]} text={t('label.thermometer')} />
        {stirred ? (
          <Part position={[BEAKER[0] + 0.05, 0.85, Z - 0.3]} rotation={[0.25, 0, -0.18]} edgeThreshold={60}>
            <cylinderGeometry args={[0.025, 0.025, 1.6, 8]} />
          </Part>
        ) : (
          // Cikgu Silap: the stirrer lies unused on the page.
          <Part position={[BEAKER[0] + 1.1, 0.03, Z + 0.7]} rotation={[0, 0.4, Math.PI / 2]} edgeThreshold={60}>
            <cylinderGeometry args={[0.025, 0.025, 1.4, 8]} />
          </Part>
        )}
      </PopUp>

      {mistakes && <PlantedMistakes mistakes={mistakes} />}
    </group>
  )
}

function PlantedMistakes({ mistakes }: { mistakes: Mistakes }) {
  return (
    <group>
      {/* Thermometer touching the heater */}
      <Hotspot position={[(HEATER_X + THERMO_X_ON_HEATER) / 2, 0.75, Z + 0.6]} id="thermometer-on-heater" mistakes={mistakes} />
      {/* Stirrer left on the page */}
      <Hotspot position={[BEAKER[0] + 1.1, 0.45, Z + 0.7]} id="no-stirring" mistakes={mistakes} />
      {/* No lagging around the beaker */}
      <Hotspot position={[BEAKER[0] + BEAKER_R + 0.35, 1.0, Z]} id="no-insulation" mistakes={mistakes} />
    </group>
  )
}
