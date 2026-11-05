# App

Scaffold with Vite's react-ts template. This folder already holds this README, so
`npm create vite@latest . -- --template react-ts` stops and asks what to do. Never choose "Remove existing files".
Either scaffold into a temporary folder and move the files here, or move this README aside first.

Then add:
three @react-three/fiber @react-three/drei @react-spring/three @react-three/postprocessing framer-motion zustand
tailwindcss @tailwindcss/vite clsx lucide-react katex dexie dexie-react-hooks zod vite-plugin-pwa
@fontsource/fraunces @fontsource/inter @fontsource/jetbrains-mono
Dev: vitest @testing-library/react @playwright/test

Notes:
- Tailwind v4 is set up through the `@tailwindcss/vite` plugin, not a PostCSS config.
- content/ and assets/ sit outside this folder: set `server.fs.allow: ['..']` in vite.config.ts and import them from code
  so they are bundled and precached.
- Workbox `globPatterns` must include glb, woff2, json and the sound format.

Module folders under src/: shell, book, experiments, game, classmode, storage, i18n, ui (SDS section 7.2).
