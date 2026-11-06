/**
 * "Susun sendiri" equipment shelf. Two ways to place a piece:
 *  - drag a card and drop it on a dashed + mark on the page (the nearest mark lights up while dragging), or
 *  - tap a card, then tap a + mark (works with one finger, a mouse, or a keyboard).
 * Some pieces on the shelf do not belong in this experiment; the game store judges every drop.
 */
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { getModel } from '../experiments/models'
import { shelf } from '../game/assembly'
import { useGame } from '../game/store'
import { useT } from '../i18n'
import { PartIcon } from './PartIcon'

/** How close (px) the pointer must be to a + mark for a drop to count. */
const SNAP_PX = 80

function nearestSlot(x: number, y: number): HTMLElement | null {
  let best: HTMLElement | null = null
  let bestD = SNAP_PX
  document.querySelectorAll<HTMLElement>('[data-slot]').forEach((el) => {
    const r = el.getBoundingClientRect()
    const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y)
    if (d < bestD) {
      bestD = d
      best = el
    }
  })
  return best
}

export function PartsShelf({ className }: { className?: string }) {
  const { t, tk } = useT()
  const page = useGame((s) => s.page)
  const step = useGame((s) => s.step)
  const placed = useGame((s) => s.placed)
  const selected = useGame((s) => s.selectedPart)
  const selectPart = useGame((s) => s.selectPart)
  const dropPart = useGame((s) => s.dropPart)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const hover = useRef<HTMLElement | null>(null)

  // Clear any highlighted mark when the shelf goes away mid-drag.
  useEffect(() => () => hover.current?.classList.remove('slot-marker--hover'), [])

  if (!page || step !== 'setup') return null
  const assembly = getModel(page.template).meta.assembly
  if (!assembly) return null
  const items = shelf(assembly, placed, `${page.pageId}:shelf`)

  const setHover = (el: HTMLElement | null) => {
    if (hover.current === el) return
    hover.current?.classList.remove('slot-marker--hover')
    el?.classList.add('slot-marker--hover')
    hover.current = el
  }

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    const start = { x: e.clientX, y: e.clientY }
    let dragging = false
    const move = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8) dragging = true
      if (!dragging) return
      setDrag({ id, x: ev.clientX, y: ev.clientY })
      setHover(nearestSlot(ev.clientX, ev.clientY))
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      setDrag(null)
      setHover(null)
      if (!dragging) {
        selectPart(id) // a tap: pick it, then tap a + mark
        return
      }
      const slot = nearestSlot(ev.clientX, ev.clientY)?.dataset.slot
      if (slot) dropPart(id, slot)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return (
    <>
      <section data-testid="parts-shelf" className={clsx('paper-card pointer-events-auto flex flex-col gap-2 p-3', className)}>
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-[18px]">{t('setup.shelf')}</span>
          <span className="font-mono text-[13px]">
            {placed.length}/{assembly.parts.length}
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
          {items.map((id) => (
            <div
              key={id}
              role="button"
              tabIndex={0}
              data-testid={`part-${id}`}
              aria-pressed={selected === id}
              onPointerDown={(e) => onPointerDown(e, id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPart(id)}
              style={{ touchAction: 'none' }}
              className={clsx(
                'flex min-h-[84px] cursor-grab select-none flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-ink bg-white/80 px-1 py-1.5 text-center active:cursor-grabbing',
                selected === id && 'bg-ink text-paper [&_svg]:invert',
                drag?.id === id && 'opacity-30',
              )}
            >
              <PartIcon id={id} />
              <span className="text-[12px] font-semibold leading-tight first-letter:uppercase">{tk(`part.${id}`)}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-ink-soft">{selected ? t('setup.tapSlot') : t('setup.tapHint')}</p>
      </section>
      {drag && (
        <div className="pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border-2 border-ink bg-paper p-1.5 shadow-xl" style={{ left: drag.x, top: drag.y }}>
          <PartIcon id={drag.id} size={48} />
          <span className="text-[12px] font-semibold">{tk(`part.${drag.id}`)}</span>
        </div>
      )}
    </>
  )
}
