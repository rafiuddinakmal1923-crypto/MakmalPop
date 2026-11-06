# MakmalPop

Offline-first 3D pop-up virtual lab book for KSSM Physics (Form 4 and Form 5), built for rural
secondary schools without proper science labs.

Entry for the Festival Idea Putrajaya 2026 Innovation Challenge (Cabaran Inovasi & Teknologi Kreatif),
IPT category. Theme: Edutainment & Innovation.

## Key dates
- 9 Nov 2026, 11.59 pm: entry closes (form + video, max 5 minutes)
- 12 Nov 2026: finalists announced
- 18 Nov 2026: live pitch at Dewan Putra A, PICC

## Documents
- docs/SRS.md, docs/SDS.md, docs/claude-code-prompt.md: the current versions (updated 6 Nov after review)
- Live SRS: https://claude.ai/artifact/HGxwiLBFUtTcWjQxe6EXt9 (behind the .md file; needs syncing)
- Live SDS: https://claude.ai/artifact/P3L65m8HKqWqX7iWJnz5yY (behind the .md file; needs syncing)
- The live docs are private to the owner's account until shared with the team.

## Tech stack
TypeScript, Vite, React, Three.js (React Three Fiber + drei), @react-spring/three, framer-motion,
@react-three/postprocessing (capable devices only), zustand, Tailwind CSS v4, lucide-react, KaTeX,
@fontsource fonts (bundled), vite-plugin-pwa (offline), Dexie (IndexedDB), Zod (content pack validation),
Vitest, Testing Library, Playwright, optional Capacitor (Android APK). Full table: docs/claude-code-prompt.md section 2.

## Folder structure
- docs/        SRS, SDS, build prompt, rubric; docs/reference/ and docs/textbooks/ are git-ignored
- research/    problem statement, evidence, benchmark, teacher interviews
- app/         source code (Vite + React + Three.js); src/ split by module
- content/     JSON content packs (fizik-t4, fizik-t5)
- assets/      3D models, textures, sounds, fonts
- video/       script, footage, final cut
- submission/  entry form answers and video link

## Run, test, build
Needs Node 20+ (built with Node 24). From `app/`:

| Command | What it does |
| --- | --- |
| `npm install` | Install packages (once) |
| `npx playwright install chromium` | Browser for the end-to-end tests (once) |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run check` | Type check + unit tests + content-pack validation. Run before every merge |
| `npm run check:content` | Validate `content/*.json` only |
| `npm run test:e2e` | Builds, then runs Playwright: full pendulum loop, saved progress, offline, screenshots |
| `npm run build` | Production build in `app/dist` (deploy this folder) |

Production build size (6 Nov): 2.1 MB precached for offline use (about 0.7 MB over the network), against a 15 MB budget.

## Deploy
`.github/workflows/ci.yml` runs `npm run check` and the Playwright tests on every pull request and push, and deploys
`main` to GitHub Pages at `https://<user>.github.io/<repo>/`. One-time setup on GitHub: Settings → Pages → Build and
deployment → Source: **GitHub Actions**. Open the deployed link once on each phone while online; after that it works
in airplane mode.

## Working in parallel
See `docs/workplan.md` for the two lanes, file ownership and task order.
