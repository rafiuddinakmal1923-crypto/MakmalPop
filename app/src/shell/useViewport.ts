import { useEffect, useState } from 'react'

export interface Viewport {
  width: number
  height: number
  /** Phone held upright: the book does not fit, so show one page at a time. */
  portrait: boolean
}

function read(): Viewport {
  const width = window.innerWidth
  const height = window.innerHeight
  return { width, height, portrait: height > width && width < 768 }
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState(read)
  useEffect(() => {
    const on = () => setVp(read())
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
  }, [])
  return vp
}
