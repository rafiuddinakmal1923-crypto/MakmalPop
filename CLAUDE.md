# MakmalPop: rules for Claude Code

- Full build spec: docs/claude-code-prompt.md. Requirements: docs/SRS.md. Design: docs/SDS.md. Read all three before any change; if they disagree, the prompt wins for UI and the SRS wins for requirements.
- Offline after first load: no CDN, no analytics, no run-time network or AI calls.
- Physics lives in pure TypeScript models with unit tests; content packs only hold text, ranges and questions.
- Bahasa Melayu first, English second; every student-facing string goes through i18n.
- Target: low-end Android (2-3 GB RAM), first download at most 15 MB, 30 fps or better, lite mode available.
- Visual style: open 3D book on a table, monochrome line-art pop-ups, orange (#F26B1D) only for energy/heat/current.
- Never copy textbook text or images; use textbooks only to verify experiments and constants.
- App code lives in app/; content in content/; assets in assets/. Commit after each milestone.
