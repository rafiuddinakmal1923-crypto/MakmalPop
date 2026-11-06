# MakmalPop: Software Design Specification (SDS)

Snapshot of the live doc, 6 Nov 2026, updated the same day after a review (template contract, pack schema, formula
unlock rule, heating graph, Ohm's law page, class rounds, tech stack). This file is now ahead of the live version and
needs syncing back: https://claude.ai/artifact/P3L65m8HKqWqX7iWJnz5yY

## 1. Overview and tech stack

MakmalPop is a static, offline-first web app (PWA) built with React and Three.js. All physics runs as fixed equations in TypeScript, and content comes from JSON packs, so no server, internet or AI is needed at run time.

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript | Type safety for physics models and content schemas |
| Build tool | Vite | Fast setup and hot reload; small production bundles |
| UI | React | Fast to build pages, game screens and class mode |
| 3D | Three.js via React Three Fiber (+ selected drei helpers) | 3D pop-up scenes in React components; runs in any modern mobile browser |
| Animation | @react-spring/three (3D), framer-motion (2D); @react-three/postprocessing Bloom on capable devices only | Pop-up springs, page turns, flaps; glow is skipped in lite mode |
| Physics | Hand-written equation models (no physics engine) | Exact, deterministic textbook results; tiny and testable |
| State | zustand | Small store for the game loop state machine and settings |
| Styling | Tailwind CSS (v4 with `@tailwindcss/vite`), clsx, lucide-react icons | Quick responsive layouts for phone and projector |
| Formulas and fonts | KaTeX; Fraunces, Inter, JetBrains Mono via @fontsource (bundled, Latin subset only) | Formulas and type render offline |
| Offline | vite-plugin-pwa (Workbox service worker) | Caches the whole app on first load; installable |
| Local storage | IndexedDB via Dexie | Progress and scores saved on the device |
| Content | JSON content packs validated with Zod | Experiments added as data, not code; schema catches bad packs |
| Language switch | Simple i18n dictionary (BM, EN) | No extra library needed for two languages |
| Charts | Lightweight SVG graph component | Plots T² vs l, temperature vs time, V vs I without a heavy chart library |
| Android (optional) | Capacitor | Wraps the PWA as an APK for Bluetooth/USB sharing |
| Testing | Vitest, Testing Library, Playwright + manual device tests | Unit tests for physics and the unlock rule; browser tests offline and at phone and projector sizes; low-end phone tests |
| Hosting (download only) | GitHub Pages or Netlify | Free static hosting for the one-time download |
| Version control | Git + GitHub | Team collaboration |

## 2. System architecture and offline strategy

Content is made and checked centrally while online; the finished app and packs are downloaded or shared once, and everything after that runs on the device.

```text
CENTRAL (online, once)                    ON THE DEVICE (works offline)
+---------------------------+             +---------------------------------------------------+
| Content authoring         |             | Service worker: caches the app and content packs  |
| Team or AI drafts,        |             +---------------------------------------------------+
| a teacher checks          |             | App shell: routing, language, offline status      |
+-------------+-------------+             +-------------------------+-------------------------+
              |                           | Book                    | Class mode              |
              v                           | pages, stickers, locks  | teams, scoreboard       |
+---------------------------+  download   +-------------------------+-------------------------+
| Static hosting            |  once, or   | Game engine          -> | Experiment engine       |
| GitHub Pages or Netlify   |------------>| missions, bets, scoring | templates + physics     |
+---------------------------+  share      +-------------------------+-------------------------+
                               offline    | Storage: progress in IndexedDB, imported packs    |
                                          +---------------------------------------------------+
```

The game engine drives the experiment engine through the template contract (section 3.1); the service worker is the piece that makes the offline promise true.

### 2.1 Offline strategy

- **Cache everything on first load:** the service worker pre-caches the app shell, 3D assets and the bundled content packs.
- **No run-time network calls:** no login, analytics or AI calls; the app never waits for a connection.
- **Offline sharing:** the APK or content pack files can move by Bluetooth, USB or SD card; a teacher's laptop hotspot can also serve the app to phones on a local network.
- **Updates when possible:** new packs are checked for only when a connection exists and are never required to keep working.
- **Small assets:** low-poly models and compressed textures keep the first download within 15 MB (NFR-02).

## 3. Module design

The app has six modules; experiment templates and the game engine never import each other, so a new experiment plugs into the same game loop.

| Module | Responsibility | Key parts | Covers |
| --- | --- | --- | --- |
| App shell | Routing, language, install prompt, offline status | `App`, `Router`, `i18n`, `useOnline` | FR-03, FR-41 |
| Book | Cover, chapter list, page-turn, stickers, locks | `BookCover`, `ChapterList`, `PageSpread`, `Sticker` | FR-01, FR-02, FR-04, FR-27 |
| Experiment engine | Loads a content pack page, picks its template, runs the physics model, collects readings | `TemplateRegistry`, `PendulumTemplate`, `HeatingTemplate`, `CircuitTemplate`, `DataTable`, `Graph` | FR-10 to FR-14 |
| Game engine | Runs the loop: mission, variables, predict, bet, run, explain, formula unlock, Cikgu Silap | `GameLoop` state machine, `Scoring`, `FormulaCard`, `MistakeHunt` | FR-20 to FR-26 |
| Class mode | Projector layout, teams, one-tap prediction entry, scoreboard | `ClassLobby`, `TeamPanel`, `Scoreboard` | FR-30 to FR-33 |
| Storage | Saves progress, scores, settings; imports content packs | `db` (Dexie), `progressStore`, `packLoader` (Zod validation) | FR-42, FR-44 |

### 3.1 Template contract

Every experiment template (`src/experiments/<id>/`) exports the same interface, so the game engine can drive any of them:

- `meta.ts`: variable ids with units and default ranges, and the graph options (x and y quantities, and whether each
  should pass the unlock rule). Display names come from the i18n dictionary (`var.<id>`).
- `model.ts` → `simulate(settings, t)`: returns the scene state at time t (pure function)
- `model.ts` → `measure(settings, rng)`: returns one reading for the data table. `rng` is a seeded random number
  generator, so human-error noise is repeatable in tests; a zero-noise rng gives exact readings.
- `Scene.tsx`: the React Three Fiber component that draws the state
- Planted-mistake replays for Cikgu Silap, keyed by the mistake ids the pack may use

## 4. Data design

All content is JSON that names a template and fills its settings; the physics itself never lives in content, which keeps AI-generated or teacher-written packs safe.

### 4.1 Content pack (example: pendulum page)

Every student-facing text field is an object with `ms` and `en`. The example is shortened: a real page has 2–4
`concept` paragraphs and all 3 `mistakes` (parallax, timing-one-oscillation, large-amplitude). BM wording in the
example still needs a native-speaker check.

```json
{
  "packId": "fizik-t4-v1",
  "version": "1.0.0",
  "curriculum": "KSSM Fizik Tingkatan 4",
  "pages": [
    {
      "pageId": "t4-bab1-bandul",
      "template": "pendulum",
      "chapter": { "form": 4, "number": 1, "title": { "ms": "Pengukuran", "en": "Measurement" } },
      "subtopic": { "ms": "1.2 Penyiasatan Saintifik", "en": "1.2 Scientific Investigation" },
      "title": { "ms": "Bandul Ringkas", "en": "Simple Pendulum" },
      "concept": [
        {
          "ms": "Bandul ringkas ialah ladung kecil yang tergantung pada seutas tali. Masa untuk satu ayunan lengkap dipanggil tempoh, T.",
          "en": "A simple pendulum is a small bob hanging on a string. The time for one complete oscillation is called the period, T."
        }
      ],
      "mission": {
        "ms": "Jam datuk di rumah Atuk lambat. Laraskan bandulnya supaya tepat semula!",
        "en": "Atuk's old clock is running slow. Adjust its pendulum to fix it!"
      },
      "variables": {
        "manipulated": "length",
        "responding": "period",
        "constant": ["mass", "amplitude"]
      },
      "ranges": { "length_cm": [20, 100], "mass_g": [50, 200], "amplitude_deg": [5, 10] },
      "prediction": {
        "question": { "ms": "Jika tali lebih panjang, tempoh ayunan akan...", "en": "If the string is longer, the period will..." },
        "options": [
          { "ms": "bertambah", "en": "increase" },
          { "ms": "berkurang", "en": "decrease" },
          { "ms": "tidak berubah", "en": "stay the same" }
        ],
        "answer": 0
      },
      "explain": {
        "question": { "ms": "Kenapa tempoh bertambah apabila tali lebih panjang?", "en": "Why does the period increase when the string is longer?" },
        "options": [
          { "ms": "Ladung bergerak dalam lengkok yang lebih panjang tetapi pecutannya tidak bertambah", "en": "The bob travels a longer arc but its acceleration does not increase" },
          { "ms": "Ladung menjadi lebih berat", "en": "The bob becomes heavier" },
          { "ms": "Graviti menjadi lebih lemah", "en": "Gravity becomes weaker" }
        ],
        "answer": 0
      },
      "formula": { "latex": "T = 2\\pi\\sqrt{\\frac{l}{g}}", "unlockGraph": "T2-vs-l" },
      "classRounds": [
        {
          "question": { "ms": "Tali dipanjangkan. Tempoh akan...", "en": "The string is made longer. The period will..." },
          "options": [{ "ms": "bertambah", "en": "increase" }, { "ms": "berkurang", "en": "decrease" }, { "ms": "tidak berubah", "en": "stay the same" }],
          "answer": 0
        },
        {
          "question": { "ms": "Ladung diganti dengan yang lebih berat. Tempoh akan...", "en": "The bob is swapped for a heavier one. The period will..." },
          "options": [{ "ms": "bertambah", "en": "increase" }, { "ms": "berkurang", "en": "decrease" }, { "ms": "tidak berubah", "en": "stay the same" }],
          "answer": 2
        },
        {
          "question": { "ms": "Berapakah tempoh bagi tali 80 cm?", "en": "What is the period for an 80 cm string?" },
          "options": [{ "ms": "kira-kira 1.0 s", "en": "about 1.0 s" }, { "ms": "kira-kira 1.8 s", "en": "about 1.8 s" }, { "ms": "kira-kira 2.5 s", "en": "about 2.5 s" }],
          "answer": 1,
          "settings": { "length_cm": 80 }
        }
      ],
      "mistakes": [
        {
          "id": "parallax",
          "reasons": [
            { "ms": "Mata tidak berserenjang dengan skala pembaris (ralat paralaks)", "en": "The eye is not perpendicular to the ruler scale (parallax error)" },
            { "ms": "Pembaris terlalu pendek", "en": "The ruler is too short" },
            { "ms": "Tali terlalu ringan", "en": "The string is too light" }
          ],
          "answer": 0
        }
      ],
      "reviewedBy": null
    }
  ]
}
```

Zod rules beyond shape: every `answer` is a valid index into its `options` or `reasons`; variable ids, `unlockGraph`
and mistake ids exist in the template's `meta.ts`; `classRounds` has exactly 3 entries; every text object has both
`ms` and `en`; ranges stay inside the template's safe limits (for example pendulum amplitude at most 10°, heating
final temperature below 95 °C).

### 4.2 Progress record (IndexedDB)

| Field | Type | Example |
| --- | --- | --- |
| pageId | string | t4-bab1-bandul |
| completed | boolean | true |
| predictionsCorrect | number | 3 |
| pointsEarned | number | 7 |
| formulaUnlocked | boolean | true |
| mistakesFound | number of 3 | 2 |
| updatedAt | ISO date-time | 2026-11-07T10:15:00+08:00 |

### 4.3 Class session (memory only, not saved)

`teams[]` (name, colour, letter, score; 2 default teams), `currentPageId`, `round` (1–3, each using the page's `classRounds[round]`), `predictions{teamId: {option, stake}}`. Nothing in class mode is stored, so no student data is kept.

## 5. Physics models (MVP experiments)

Each model is a pure TypeScript function with unit tests against the textbook equations; constants are checked against the Form 4 and Form 5 textbooks before release.

### 5.1 Simple pendulum (Form 4, Chapter 1)

Small-angle model; amplitude is capped at 10° so the formula stays valid.

```latex
T = 2\pi\sqrt{\frac{l}{g}} \qquad T^2 = \frac{4\pi^2}{g}\,l \qquad \theta(t) = \theta_0\cos\left(\sqrt{\tfrac{g}{l}}\,t\right)
```

- g = 9.81 m s⁻²; length 20–100 cm; mass has no effect (a teaching point).
- Reading: time for 20 oscillations, plus optional human reaction error of ±0.1–0.3 s from the seeded rng (used by Cikgu Silap).
- Formula unlock: the student's T² vs l plot is a straight line through the origin; gradient ≈ 4π²/g. T vs l is the curved option.
- Cikgu Silap large-amplitude replay only: it goes past the 10° cap and uses T ≈ T₀(1 + θ₀²/16), about 1.7% longer at 30°, so the planted mistake really changes the reading.

### 5.2 Heating and specific heat capacity (Form 4, Chapter 4)

```latex
Q = mc\Delta\theta \qquad \Delta\theta = \frac{\eta P t}{mc} \qquad c_{\text{exp}} = \frac{Pt}{m\Delta\theta}
```

- Manipulated: heating time t; responding: temperature rise Δθ; constant: mass m, heater power P (e.g. 50 W) and material (check the textbook's 4.2 experiment). Water c = 4200 J kg⁻¹ °C⁻¹, aluminium c = 900 J kg⁻¹ °C⁻¹ (verify against the textbook).
- η = fraction of heat kept (0.85–1.0): below 1 when insulation is off, so the measured c comes out higher than the true value, a discussion point.
- Water temperature is capped at 100 °C (boiling). Pack ranges keep the final temperature below 95 °C so the graph stays straight (water 0.5 kg, 50 W, 600 s gives a rise of about 14 °C).
- Graphs: the notebook shows temperature θ vs t; the unlock graph is Δθ vs t, which passes through the origin with gradient ηP/(mc). The raw θ vs t graph starts at room temperature and never passes the unlock rule.

### 5.3 Ohm's law and circuits (Form 5, Chapter 3)

```latex
V = IR \qquad R_{\text{series}} = R_1 + R_2 \qquad \frac{1}{R_{\text{parallel}}} = \frac{1}{R_1} + \frac{1}{R_2} \qquad P = \frac{V^2}{R}
```

- Main page: the rheostat sets current 0.1–1.0 A through a constantan wire; the V vs I plot gives R as the gradient. R is fixed: constantan is used because its resistance barely changes as it warms, so the model has no heating effect.
- Optional challenge (FR-12a): series and parallel bulbs, brightness drawn from each bulb's power. Bulbs are treated as fixed resistors (a stated simplification: real bulbs are non-ohmic).

## 6. Game logic

The `GameLoop` is a state machine: mission → variables → predict and bet → run → explain → formula → sticker, with Cikgu Silap as an optional bonus step after the sticker. A wrong variable setup loops back, and the formula stays locked until the data supports it. Runs play live for a few seconds, then fast-forward (10x); a Skip button jumps to the reading. Locks apply to student mode only: class mode and the "unlock all" demo setting ignore them.

### 6.0 Two ways to start

After the mission the student chooses **Uji terus** (apparatus ready, loop as above) or **Susun sendiri**, which adds
a set-up step before the variables. Each template's `meta.assembly` lists its parts (with a slot position in the
scene and the parts each one needs first) and distractors. `game/assembly.ts` (pure, tested) judges each drop:
not needed, wrong place, needs another part first, or placed. The scene shows only placed parts plus a dashed +
mark per empty slot; the shelf supports drag-and-drop and tap-then-tap.

### 6.1 Scoring

| Event | Points | Rule |
| --- | --- | --- |
| Apparatus set up with no mistakes (Susun sendiri only) | +1 | Any wrong piece, place or order earns 0 |
| Variables set correctly on first try | +1 | Second try earns 0; a hint shows after a wrong try |
| Prediction correct | + stake (1–3) | Stake chosen before the run |
| Prediction wrong | − stake | Score never goes below 0 |
| "Why" question correct | +1 | One question after each run |
| Formula discovered | +2 | See 6.2 |
| Mistake found in Cikgu Silap (bonus) | +1 each | 3 mistakes per experiment; not needed for the sticker |
| Steps mission to formula complete | Sticker | Unlocks the next experiment page |

### 6.2 Formula unlock rule

A pure function in `game/`, unit-tested. Plain R² is not used: an ordinary straight-line fit gives R² ≈ 0.99 for the curved T vs l graph, and R² through the origin reaches 0.988 when readings only cover 50–100 cm, so either would unlock on the wrong graph.

1. The student records at least 5 readings at distinct values of the manipulated variable.
2. The readings span at least 60% of the allowed range (pendulum: at least 48 cm of 20–100 cm).
3. The student picks which graph to plot from the template's graph options (pendulum: T vs l, or T² vs l).
4. The app fits y = kx through the origin (k = Σxy / Σx²) and computes the relative RMS residual √(mean((y − kx)²)) / mean(|y|).
5. If it is at most 5%, the student confirms "straight line" and the formula card unlocks. Otherwise a hint suggests trying another graph. No points are lost.

Checked values: T² vs l is 0% with exact readings and about 2% with the largest ±0.3 s reaction error; T vs l is about 18% over 20–100 cm and 11% over 50–100 cm. Heating uses Δθ vs t (through the origin); Ohm's law uses V vs I.

### 6.3 Cikgu Silap

A bonus step (FR-26, should have; finalist phase). A replayed experiment contains 3 planted mistakes from the page's `mistakes` list (pendulum: reading the ruler at an angle, timing one oscillation instead of 20, swinging at 30°; heating: thermometer touching the heater, no stirring, no insulation; Ohm's law: voltmeter in series, ammeter zero error, reading a needle meter at an angle). The student taps each one and picks the reason from the 3 `reasons` in the pack.

### 6.4 Class battle mode

Same rules per team: the teacher taps each team's prediction and stake (default 1), runs the experiment once, and the scoreboard applies the points. Each round asks a different question from `classRounds`, so round 1's answer does not give the later rounds away. The team with the most points after 3 rounds wins. Class mode starts in 3 taps after the app opens (Mod Kelas → experiment → Mula) with 2 default teams.

## 7. UI flow, folders, build plan and testing

### 7.1 UI flow

1. Cover: choose **Belajar** (student) or **Mod Kelas** (class mode); language toggle.
2. Chapter list: Form 4 and Form 5 chapters, stickers and locks shown.
3. Page spread: concept on the left, 3D experiment on the right, game loop steps across the bottom.
4. Class mode: pick an experiment (locks ignored) → lobby with 2 default teams (optionally 3–4, rename) → 3 rounds with different questions → scoreboard and winner.

### 7.2 Project folder (D:\MakmalPop)

```text
MakmalPop/
  README.md            project overview and links to the SRS and SDS
  CLAUDE.md            rules for Claude Code
  docs/                SRS, SDS, Claude Code prompt, rubric
    reference/         visual reference screenshots (git-ignored)
    textbooks/         chapter PDFs for checking facts (git-ignored)
  research/            problem statement, evidence, benchmark, teacher interviews
  app/                 Vite + React + Three.js source code
    src/
      shell/           routing, settings, offline status
      i18n/            BM and EN dictionaries
      ui/              shared UI: toolbar, cards, buttons, graph
      book/            cover, chapters, page spread, stickers
      experiments/     templates: pendulum, heating, circuit + physics models
      game/            game loop, scoring, formula card, Cikgu Silap
      classmode/       lobby, teams, scoreboard
      storage/         Dexie db, progress, pack loader
    vite.config.ts     server.fs.allow ['..'] so content/ and assets/ load in dev
    public/            icons, manifest
  content/             JSON content packs (fizik-t4, fizik-t5)
  assets/              3D models, textures, sounds, fonts
  video/               script, storyboard, raw footage, final cut
  submission/          entry form answers (title, problem, solution, video link)
```

### 7.3 Build plan (4 days)

The day-by-day split below was written for four roles. The team is working in two parallel lanes instead;
`docs/workplan.md` is the current plan and owns the file split. The table is kept as a timing guide.

| Day | 3D dev (experiments) | Game dev (loop + class mode) | App dev (shell, offline, data) | Content + video lead |
| --- | --- | --- | --- | --- |
| Fri 6 Nov | Pendulum physics model + unit tests; first 3D pendulum scene | Game loop state machine; formula unlock rule + tests; mission and variable-setup screens | `git init`; scaffold Vite + React; PWA offline setup; book shell and navigation | Check experiments against the textbooks; write BM mission and page text; contact a rural teacher |
| Sat 7 Nov | Pendulum stopwatch, fast-forward and Skip, readings, graph; start heating scene | Predict + confidence bet, explain, scoring, formula card | Dexie storage, content pack loader with Zod; pendulum pack JSON | Video script and storyboard; test Pandai offline; draft form answers |
| Sun 8 Nov | Finish heating experiment; low-poly polish | Class mode: default teams, 3 rounds, team predictions, scoreboard | Low-end phone and airplane-mode tests; fix speed issues | Film the demo (airplane mode, class mode); teacher interview clip |
| Mon 9 Nov | Bug fixes for the final cut | Bug fixes for the final cut | Deploy to hosting; final offline check | Edit the 5-minute video; upload with "Anyone with the link"; submit by the morning |

Cikgu Silap, Ohm's law, English strings and the APK are finalist polish (by 18 Nov), not part of this 4-day plan.

### 7.4 Testing

- Unit tests (Vitest): pendulum period, heating temperature rise, Ohm's law values against hand calculations
- Unlock rule (Vitest): T² vs l passes with and without reaction error; T vs l fails over 20–100 cm and 50–100 cm; too few or too narrow readings fail; heating Δθ vs t passes
- Pack schema (Vitest): bad packs are rejected (missing `en`, bad answer index, unknown variable or mistake id, heating range above 95 °C)
- Browser (Playwright): full pendulum loop; class mode in 3 taps with 2 teams; whole app offline; screenshots at 412x915, 915x412 and 1920x1080
- Offline: load once, enable airplane mode, run every MVP feature
- Device: one low-end Android phone (2–3 GB RAM) and one projector or TV
- Content: one person with a physics background checks every value and label against the textbook
- Usability: a teacher (or a classmate acting as one) starts class mode while being timed
