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

## Getting started
This folder is not a git repository yet. Run `git init` before the first milestone (CLAUDE.md asks for a commit
after each one). App setup notes are in app/README.md.
