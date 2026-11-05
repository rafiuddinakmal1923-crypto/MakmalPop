# MakmalPop: parallel work plan

Two lanes work at the same time and own different files, so they rarely touch the same file.
- **Lane A:** Claude Code on the owner's machine. Platform, book, pendulum, game engine.
- **Lane B:** the friend, by hand or with their own Claude Code. Content, heating, class mode, video.

Deadline: entry closes **Mon 9 Nov 2026, 11.59 pm**. Integration and filming happen on **Sun 8 Nov**.
Where this plan differs from the milestone list in `claude-code-prompt.md` section 11, this plan wins.

## How to work together

1. **One GitHub repo.** The owner creates it (private is fine), pushes `main`, and adds the friend as a collaborator.
2. **Short branches.** Use `a/<task>` or `b/<task>` (for example `b/heating-model`). Merge into `main` as soon as a task's
   checks pass. Pull `main` before starting each task.
3. **Checks before merging:** `npm run check` in `app/` (type check, unit tests, content validation). Do not merge red.
4. **Stay inside your own files** (table below). A shared file that you need to change gets one small commit on its own
   branch, merged quickly, and a message to the other lane.
5. **If you use Claude Code**, start with: *"Read CLAUDE.md and docs/workplan.md, then do task B3."*

## File ownership

| Path | Owner | Notes |
| --- | --- | --- |
| `app/` config (package.json, vite, tsconfig, PWA) | A | B asks before adding a package |
| `app/src/experiments/types.ts` | A | **The template contract.** Frozen after A2; changes need both lanes to agree |
| `app/src/storage/packSchema.ts` | A | The zod schema for content packs |
| `app/src/experiments/registry.ts` | A | B adds one line to register heating |
| `app/src/shell/`, `book/`, `ui/`, `storage/`, `game/` | A | |
| `app/src/experiments/pendulum/` | A | The reference template B copies for heating |
| `app/src/experiments/heating/` | B | |
| `app/src/experiments/circuit/` | B | Finalist phase |
| `app/src/classmode/` | B | Uses `game/scoring.ts` and the template contract only |
| `app/src/i18n/strings/<module>.ts` | Owner of that module | One file per module, so dictionaries never conflict |
| `content/*.json` | B | A adds a pendulum stub first so the app runs |
| `docs/textbook-check.md` | B | |
| `video/`, `submission/`, `research/` | B | |
| `docs/` specs | A | B notes any change needed in `docs/textbook-check.md` |

## Milestones

Each task lists what it needs first and what "done" means. ✅ means merged.

### Lane A (Claude Code)

| # | Task | Needs | Done when |
| --- | --- | --- | --- |
| A1 | **Scaffold:** Vite + React + TS, Tailwind v4, PWA, Vitest, folder layout, `npm run check` | – | `npm run build` works and the app loads offline |
| A2 | **Contracts:** template contract (`types.ts`), pack schema (zod), i18n setup, content validation script, pendulum content stub | A1 | `npm run check` validates `content/*.json`. **Unblocks B2 validation and B3** |
| A3 | **Pendulum model + game rules:** `model.ts` with tests; pure `game/unlock.ts` and `game/scoring.ts` with tests | A2 | Tests in SDS 7.4 pass |
| A4 | **Book shell:** table, book, cover → contents → spread, page turn, toolbar, palette, fonts, DEMO watermark | A1 | Screenshots at 915x412 and 412x915 |
| A5 | **Pendulum spread:** pop-up scene, controls, run with fast-forward/Skip, notebook + SVG graph, game steps 1–6, flap unlock, zustand game store | A3, A4 | Full pendulum loop by hand. **Unblocks B4 and B5** |
| A6 | **Storage, offline, lite mode:** Dexie progress, stickers and locks, unlock-all setting, lite mode, offline chip | A5 | Airplane-mode run works; lite mode toggles |
| A7 | **Integration + performance:** merge B's work, Playwright tests, 15 MB check, 4x CPU throttle check | B4, B5 | SRS 5.2 checklist ticked except the filming items |

### Lane B (friend)

| # | Task | Needs | Done when |
| --- | --- | --- | --- |
| B1 | **Textbook check** (start now, no code): fill in `docs/textbook-check.md`. Covers subtopic names, 10 or 20 swings, which variable the 4.2 heating experiment changes, constants, and the Ohm's law subtopic | – | Every row has an answer and a page number |
| B2 | **Content text** (start now): write the BM + EN text for the pendulum and heating pages in `content/fizik-t4.json`, following SDS 4.1. Covers concept paragraphs, mission, prediction, explain, 3 class rounds, mistakes with 3 reasons each | B1 helps; A2 to validate | `npm run check` passes and a BM speaker has read it |
| B3 | **Heating model:** `experiments/heating/model.ts`, `meta.ts` and `model.test.ts`, following the pendulum model. Δθ = ηPt/(mc), η = 1.0 insulated / 0.85 not, cap at 100 °C | A2 (A3 as an example) | Tests pass, including "the bundled pack never passes 95 °C" |
| B4 | **Heating scene:** `experiments/heating/Scene.tsx`. Block or beaker, immersion heater, thermometer, lagging toggle, orange heat-flow lines; register it in `registry.ts` | A5 | The heating spread runs and plots θ vs t, and unlocks on Δθ vs t |
| B5 | **Class mode:** `classmode/`, covering 3 taps to start, 2 default teams (up to 4), one-tap prediction + stake, 3 `classRounds`, scoreboard, winner screen, 32 px+ text | A5 | Playwright: class mode with 2 teams on the pendulum |
| B6 | **Video + form** (in parallel with everything): script and storyboard in `video/`; title and the 600-character solution in `submission/form-answers.md`; test Pandai in airplane mode; contact a rural teacher | – | Script ready by Sat night; filming on Sun |

### Order on the calendar

| Day | Lane A | Lane B |
| --- | --- | --- |
| Fri 6 Nov | A1, A2, A3, start A4 | B1, B2 (text), B6 (script) |
| Sat 7 Nov | A4, A5 | B3, B2 validated, B6 |
| Sun 8 Nov | A6, A7, filming support | B4, B5, filming |
| Mon 9 Nov | Bug fixes, deploy, final offline check | Edit video, submit form |

Fallback if Sunday slips: the video can show the pendulum (hero) and class mode only. Heating can then appear as a
short clip of whatever runs.

## Finalist phase (10–18 Nov)

Cikgu Silap (A), Ohm's law template (B), English pass (B), Capacitor APK (A), and feedback from 1–2 teachers (B).
