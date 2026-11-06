/** A tap target for one planted mistake (Cikgu Silap). Shows ? until found, then ✓. Shared by all templates. */
import { Html } from '@react-three/drei'
import { htmlLayer } from '../book/PageHtml'
import { INK } from '../book/lineart'
import type { SceneProps } from './types'

export type Mistakes = NonNullable<SceneProps<unknown>['mistakes']>

export function Hotspot({ position, id, mistakes }: { position: [number, number, number]; id: string; mistakes: Mistakes }) {
  const found = mistakes.found.includes(id)
  const selected = mistakes.selected === id
  return (
    // pointerEvents auto: the Html layer itself is pointer-events none, and that is inherited.
    <Html position={position} center portal={htmlLayer as React.RefObject<HTMLElement>} style={{ pointerEvents: 'auto' }} zIndexRange={[30, 25]}>
      <button
        data-testid={`hotspot-${id}`}
        aria-label={id}
        disabled={found}
        onClick={() => mistakes.onPick(id)}
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          border: `2.5px solid ${INK}`,
          background: found ? '#2E8B57' : selected ? INK : '#FBF8F1',
          color: found || selected ? '#FBF8F1' : INK,
          font: '700 22px Fraunces, serif',
          boxShadow: `2px 2px 0 ${INK}`,
          cursor: 'pointer',
        }}
      >
        {found ? '✓' : '?'}
      </button>
    </Html>
  )
}
