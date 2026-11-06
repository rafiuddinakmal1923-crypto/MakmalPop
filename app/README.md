# App

Vite 8 + React 19 + TypeScript 7 + React Three Fiber 9 + drei 10. Commands are in the root README.

## Where things are

| Folder | What | Owner |
| --- | --- | --- |
| `src/experiments/types.ts` | The template contract every experiment implements | A (frozen) |
| `src/experiments/pendulum/` | Reference template: `meta.ts`, `model.ts` (+ test), `Scene.tsx` | A |
| `src/experiments/metas.ts`, `models.ts`, `registry.ts` | Template lookups (B adds one line each for heating) | A |
| `src/game/` | Game loop store, unlock rule, scoring, step panels | A |
| `src/book/` | 3D table, book, camera, page turn, cover, contents, left page | A |
| `src/ui/` | Toolbar, notebook + SVG graph, control panel, toasts, settings | A |
| `src/storage/` | Pack schema (zod), bundled packs, Dexie progress | A |
| `src/i18n/strings/<module>.ts` | One BM + EN dictionary per module | module owner |
| `src/classmode/` | Class battle mode (placeholder now) | B |
| `e2e/` | Playwright tests | both |

## Notes
- drei `<Html>` must portal into `htmlLayer` (see `book/PageHtml.tsx`), or pages render empty under React 19.
  `<StrictMode>` is off for the same reason.
- 3D page elements move with the idle drift, so Playwright clicks use `force: true` (see `e2e/helpers.ts`).
- In dev, `window.__r3f` holds the R3F state for debugging.
- Sounds and the background music are synthesised with Web Audio (`shell/sound.ts`, pattern in
  `shell/musicPattern.ts`); there are no audio files. `node scripts/sound-check.mjs` (dev server running)
  measures the levels headless: silence before the first tap, music, effects, and mute.
- `scripts/make-icons.mjs` renders the PNG app icons from `public/icon.svg`;
  `scripts/shot.mjs` takes quick headless screenshots against the dev server.
