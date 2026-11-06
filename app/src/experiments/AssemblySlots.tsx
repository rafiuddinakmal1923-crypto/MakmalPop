/**
 * "Susun sendiri": a dashed + marker at every empty slot. The shelf's drag-and-drop finds these by their
 * data-slot attribute; tapping one places the part picked on the shelf (tap-then-tap, for touch and access).
 * Render it inside the scene's own group so slot positions use the scene's frame (and scale).
 */
import { Html } from '@react-three/drei'
import { htmlLayer } from '../book/PageHtml'
import type { Assembly, SceneProps } from './types'

export function AssemblySlots({ assembly, state }: { assembly: Assembly; state: NonNullable<SceneProps<unknown>['assembly']> }) {
  return (
    <>
      {assembly.parts
        .filter((p) => !state.placed.includes(p.id))
        .map((p) => (
          // pointerEvents auto: the Html layer itself is pointer-events none, and that is inherited.
          <Html key={p.id} position={p.slot} center portal={htmlLayer as React.RefObject<HTMLElement>} style={{ pointerEvents: 'auto' }} zIndexRange={[28, 22]}>
            <button
              data-slot={p.id}
              data-testid={`slot-${p.id}`}
              data-sound="none"
              aria-label={`+ ${p.id}`}
              onClick={() => state.onSlot(p.id)}
              className={state.selected ? 'slot-marker slot-marker--ready' : 'slot-marker'}
            >
              +
            </button>
          </Html>
        ))}
    </>
  )
}
