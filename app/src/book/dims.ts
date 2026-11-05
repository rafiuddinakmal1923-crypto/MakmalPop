/** Book and table dimensions in world units (1 unit ≈ 4 cm of book). */
export const PAGE_W = 4.0
export const PAGE_D = 5.4
/** Height of the page surface above the table (cover board + page block). */
export const PAGE_Y = 0.3
export const COVER_T = 0.06
export const COVER_OVERHANG = 0.14
export const BOOK_W = 2 * (PAGE_W + COVER_OVERHANG)
export const BOOK_D = PAGE_D + 2 * COVER_OVERHANG

/**
 * DOM size of a page rendered with drei <Html transform>. 320 px wide = PAGE_W units, chosen so 16 px text
 * stays about 16 px on a 915x412 phone in landscape (and about 40 px on a 1080p projector).
 */
export const PAGE_PX_W = 320
export const PAGE_PX_H = Math.round((PAGE_PX_W * PAGE_D) / PAGE_W)
/** drei Html transform maps 40 px to 1 world unit (distanceFactor 10), so scale it to fit the page. */
export const HTML_SCALE = PAGE_W / (PAGE_PX_W / 40)

/** Camera tilt from vertical (the build prompt asks for 35-40 degrees). */
export const CAMERA_POLAR_DEG = 38

export const PAGE_TURN_MS = 600
export const POP_STAGGER_MS = 60
