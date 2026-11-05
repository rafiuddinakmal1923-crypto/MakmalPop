# MakmalPop: build prompt for Claude Code

Paste everything below the line into Claude Code, opened in `D:\MakmalPop`.

---

Before starting, read docs/SRS.md (requirements, FR/NFR IDs) and docs/SDS.md (architecture, data, physics, game logic). Review them against this prompt and tell me about any conflicts or gaps before you plan.

You are building **MakmalPop**, an offline-first 3D "pop-up lab book" web app for KSSM Physics Form 4 and
Form 5 (Malaysia). It lets rural secondary students run textbook experiments their school cannot run, on a
low-end Android phone or one teacher's phone connected to a projector. It is an entry for the Festival Idea
Putrajaya 2026 Innovation Challenge (theme: Edutainment & Innovation). The submission video is due
**9 Nov 2026**, so build the smallest polished version first and keep it working at every step.

## 0. How to work

Use these plugins and skills (install any that are missing with `/plugin`):

1. **superpowers** - start with `brainstorming` to confirm this spec, then `writing-plans` to turn it into a
   task plan, then `subagent-driven-development` (or `executing-plans`) to build it. Use
   `test-driven-development` for every physics model, `systematic-debugging` for bugs, and
   `verification-before-completion` before claiming any milestone is done.
2. **frontend-design** - for the visual direction in section 4. The look must be distinctive and match the
   reference, not a generic template.
3. **Context7 MCP** - fetch current docs for React Three Fiber, drei, @react-spring/three, vite-plugin-pwa
   and Dexie before using their APIs.
4. **Playwright MCP** - drive the app in a browser: mobile viewport (Android, 412x915 and landscape),
   offline mode (`context.setOffline(true)`), and screenshots of every screen for review.
5. **Chrome DevTools MCP** (optional) - performance traces with 4x CPU throttling to simulate a cheap phone.
6. **Blender MCP** (already installed on this machine, optional) - only if a 3D asset (retort stand, beaker,
   heater, the book itself) is easier to model than to build from primitives. Export low-poly `.glb` under
   200 KB each to `assets/models/`.

Commit to git after each milestone with a clear message.

## 1. Hard rules

- **Offline after first load.** No run-time network calls: no CDN fonts, no analytics, no AI calls, no remote
  models. Everything is bundled and pre-cached by the service worker.
- **Physics lives in code, never in content.** Each experiment has a pure TypeScript model with unit tests.
  Content packs (JSON) only supply text, ranges, missions and questions.
- **Bahasa Melayu first**, English second. All student-facing strings come from the i18n dictionary.
- **Low-end phone target:** Android 9+, 2-3 GB RAM. First download at most 15 MB; 30 fps or better in 3D;
  first interaction within 5 s. Provide a lite mode (section 5.6).
- **Original text only.** Use the textbooks to check experiment names, procedures, variables and constants.
  Do not copy textbook paragraphs or images into the app.
- No login and no personal data. Progress stays on the device.

## 2. Tech stack (use exactly this unless blocked)

| Purpose | Package |
| --- | --- |
| Build | vite, typescript, react, react-dom |
| 3D | three, @react-three/fiber, @react-three/drei |
| 3D animation | @react-spring/three (pop-up springs, page turns) |
| 2D animation | framer-motion (flaps, toolbar, step strip) |
| Glow (desktop only) | @react-three/postprocessing (Bloom), disabled in lite mode and on low-end devices |
| State | zustand |
| Styling | tailwindcss, clsx |
| Icons | lucide-react |
| Formulas | katex (bundled, rendered offline) |
| Fonts | @fontsource/fraunces, @fontsource/inter, @fontsource/jetbrains-mono (bundled) |
| Offline | vite-plugin-pwa (Workbox, precache everything, `registerType: 'autoUpdate'`) |
| Storage | dexie, dexie-react-hooks |
| Content validation | zod |
| Tests | vitest, @testing-library/react, @playwright/test |
| Android (later) | @capacitor/core, @capacitor/android |

Graphs (T-squared vs l, temperature vs time, V vs I) are a small custom SVG component. Do not add a chart library.

## 3. Product summary

An open book lies on a table. Each spread is one experiment:
- **Left page:** the concept, a formula, the game steps, and a "lift the flap" answer card.
- **Right page:** a 3D line-art diagram of the experiment that **pops up out of the page** and runs live.
- **Bottom:** a floating toolbar to turn pages.

Students play a game loop on every spread (section 6). Teachers can switch to **Mod Kelas** (class battle mode)
and run it for the whole class from one device on a projector.

## 4. Visual design

The visual idea (an open 3D book whose diagrams pop up) was inspired by a TikTok demo of a physics textbook
turned into an interactive 3D book (Claude + Three.js). Treat it as inspiration, not a template to copy:
originality is 25% of the judging score, so MakmalPop's own identity (kampung missions, class battle mode,
Cikgu Silap, the palette and type below) must be what stands out. Reference screenshots, if any, go in
`docs/reference/` (git-ignored). The spec below is MakmalPop's own:

**Scene**
- Camera looks down at about 35-40 degrees onto an open hardcover book lying on a flat, matte tabletop.
- The book fills about 85% of the viewport width in landscape. There is a soft contact shadow under the book
  and slight page curvature near the spine.
- There is a gentle idle camera drift (+/-1 degree, 8 s loop). The user can orbit slightly (limit +/-15 degrees) and
  pinch-zoom, and a reset button returns the camera.

**Book**
- Thick hardcover with a mustard/gold edge, a visible page-stack thickness on both sides, cream paper pages,
  and a soft shadow down the spine.
- Page turns are a 3D page mesh rotating about the spine with a slight bend (segmented plane, 600 ms
  ease-in-out). A paper flip sound plays (bundled, muted by default in class mode).

**Left page (concept page)**, laid out like a real textbook page, rendered with drei `<Html transform>` so text is crisp.
`<Html transform>` cannot bend with a turning page and is costly on cheap phones, so: hide it while a page turns
(the turning sheet shows plain paper) and keep its DOM small. On short phone screens in landscape the camera
focuses the left page for reading steps and pans to the apparatus for the run. It contains:
- A small chapter label ("Bab 1 · Pengukuran")
- A serif title ("Bandul Ringkas")
- 2-4 short paragraphs
- One formula block (KaTeX)
- One small inline sketch or icon
- A **step strip** showing the game loop (section 6)
- At the bottom left, a bordered callout card: **"Buka lipatan untuk lihat jawapan"** ("Lift the flap to see the
  answer"; BM wording to be confirmed by a native speaker). Tapping it lifts a paper flap with a 3D hinge (rotateX about its top edge) to reveal the answer or
  the formula. The flap stays locked (padlock icon) until the step that unlocks it.

**Right page (pop-up page)**
- The experiment apparatus is drawn in **monochrome line art**: white or cream surfaces with thin dark
  outlines (drei `<Edges>` / `<Outlines>` on simple meshes, flat or toon shading, no textures).
- When the page opens, parts **rise out of the page** in sequence with a spring (60 ms stagger), like a pop-up
  book.
- **Orange is the only accent colour** and always means energy, motion, heat or current: glowing orange
  flow lines and arrows (animated dashed `<Line>` / `QuadraticBezierLine` with moving dash offset), orange
  motion trails, and orange highlights on the active part. Everything else stays monochrome.
- Small handwritten-style labels with thin leader lines point to parts (retort stand, bob, metre rule).

**Bottom toolbar**
- A floating rounded pill, centred near the bottom, with a translucent white background and a soft shadow.
- Contents: previous arrow, "1 / 3 · Bandul Ringkas" (page index and title), next arrow, and icon buttons for
  language (BM/EN), class mode, lite mode and reset camera.

**Palette (CSS variables and three.js colours)**

| Token | Hex | Use |
| --- | --- | --- |
| --table | #9DB0A9 | tabletop |
| --paper | #F7F2E7 | pages |
| --paper-shade | #E9E1CF | page edges, spine shadow |
| --ink | #262626 | lines, text |
| --ink-soft | #6B6B6B | secondary text |
| --accent | #F26B1D | energy, heat, current, motion (and the brand mark/manifest) |
| --accent-glow | #FFB37A | glow and trails |
| --cover | #D9A441 | book edge |
| --good | #2E8B57 | correct |
| --bad | #C0392B | wrong |

UI active states (selected chip, current step, pressed button) use `--ink`, not orange, so orange keeps one meaning
(CLAUDE.md). The orange confetti on a correct answer is allowed: it is the "energy" burst.

**Type**
- Fraunces (titles, serif)
- Inter (body)
- JetBrains Mono (numbers, readings, stopwatch)

Minimum body size is 16 px on a phone and 32 px in class mode.

## 5. Screens and layouts

### 5.1 Cover
A closed book on the table titled **MakmalPop**, subtitle "Fizik Tingkatan 4 & 5", with two buttons:
**Belajar Sendiri** (student) and **Mod Kelas** (class). The book opens with an animation into the contents page.

### 5.2 Contents page
The book's contents spread lists the chapters for Form 4 and Form 5 (section 7.4). Available experiments
are clickable. Locked ones show a padlock and "Selesaikan misi sebelum ini" ("Finish the previous mission").
Completed ones show a sticker. Chapters with no experiment yet show "Akan datang" ("Coming soon").

Locks apply to Belajar Sendiri only:
- **Mod Kelas ignores locks:** a teacher can pick any available experiment straight away (FR-30).
- **Demo switch:** Settings has "Buka semua halaman" ("Unlock all pages") so the video can be filmed in any order.

### 5.3 Experiment spread
This is the left/right layout from section 4, plus:
- **Control panel:** a small paper card floating over the lower right page. It holds sliders and toggles for
  the manipulated variable (for example a length slider of 20-100 cm in 10 cm steps), a **Jalankan** (Run) button,
  and a stopwatch readout in mono type.
- **Data table and graph:** a "notebook" card that slides up from the bottom of the left page. It shows the
  readings table and the SVG graph, and the student can switch which quantity is on the y-axis.

### 5.4 Phone portrait
The book does not fit, so show **one page at a time** with a page switch (Konsep | Eksperimen) and swipe.
Suggest rotating to landscape with a small dismissible banner.

### 5.5 Class mode (projector)
- **Start in 3 taps after the app opens:** Mod Kelas → pick an experiment → **Mula** (Start). Two teams
  ("Pasukan A", "Pasukan B", with distinct colours) are ready by default; adding a 3rd/4th team or renaming is optional.
- The camera moves closer to the right page.
- The left page becomes a big **scoreboard** with 2-4 team cards (team name, colour, score). Team cards also
  carry a letter or pattern so colour is never the only signal (NFR-09).
- A large prediction panel lets the teacher tap each team's choice, then its stake (1-3, default 1).
- The teacher presses one big **Jalankan** button, the experiment runs, results animate, and points fly to the team cards.
- Run **3 rounds per experiment, each with a different question** from the page's `classRounds` (section 8),
  so round 1's answer does not give away rounds 2 and 3. Then show a winner screen.
- At least 32 px text and high contrast. No student devices needed.

### 5.6 Lite mode
Still 3D, but cheaper: no postprocessing, no antialias, pixel ratio 1, no idle drift, and a flat page turn (no curl).
The left page keeps `<Html transform>` (its DOM is small; see the decisions log in `docs/workplan.md`).

Lite mode turns on automatically when:
- `navigator.deviceMemory` is reported and is 4 or less (it is missing on Safari and Firefox, so do not rely on it), or
- the median frame time over the first 3 s of a spread stays above 40 ms.

CPU core count alone does not trigger it, because most teacher laptops have 4 cores and should keep full quality
on the projector. The user can toggle lite mode at any time, and the choice is saved.

## 6. Game loop (every experiment)

A zustand state machine with these steps, shown in the step strip in this order:
**Misi → Pemboleh ubah → Ramal → Jalankan → Terangkan → Formula → Cikgu Silap (bonus)**

1. **Misi (Mission):** a short local story card opens the spread (for example "Jam datuk di rumah Atuk lambat.
   Laraskan bandulnya!" — "Atuk's old clock is slow. Adjust its pendulum!").
2. **Pemboleh ubah (Variables):** the student drags the variable chips into three slots: dimanipulasikan
   (manipulated, exactly one), bergerak balas (responding, exactly one) and dimalarkan (kept constant, one or more).
   A wrong placement shakes the chip and shows "Ini bukan ujian yang adil" ("This isn't a fair test") with a hint.
   Correct on the first try earns +1.
3. **Ramal (Predict):** the student picks one option (multiple choice only; graph sketching is roadmap), then chooses a
   **confidence stake of 1, 2 or 3**, shown as three coins.
4. **Jalankan (Run):** the apparatus animates with orange energy and motion effects, and readings appear in the
   notebook. Long runs must not stall the lesson or the video: the first few seconds play live, then the run
   fast-forwards (10x, the stopwatch shows simulated time), and a **Langkau** (Skip) button jumps to the reading.
   Collect at least 5 readings that spread across the range (see the unlock rule below).
5. **Terangkan (Explain):** one short multiple-choice "kenapa?" ("why?") question, worth +1.
6. **Formula:** the student chooses which graph to plot from the page's graph options. The flap unlocks (KaTeX formula
   card, +2) only when the **formula unlock rule** below passes and the student confirms "garis lurus" ("straight line").
   A curved choice gives a hint ("Cuba graf lain") and no penalty.
7. **Cikgu Silap ("Teacher's Mistake"), bonus step:** a replay with 3 planted mistakes. The student taps each mistake and
   picks its reason from 3 options, worth +1 each. It is optional in the MVP (SRS FR-26 is "should have"): the sticker
   does not depend on it, and it can ship after the competition video.

**Formula unlock rule** (pure function in `game/`, unit-tested). Plain R² is not used: a straight-line fit gives
R² ≈ 0.99 even for the curved T vs l graph, so it would unlock on the wrong graph.
1. At least 5 readings, at distinct values of the manipulated variable.
2. The readings span at least 60% of the allowed range (pendulum: at least 48 cm of the 20-100 cm range).
3. Fit y = kx through the origin (k = Σxy / Σx²) for the chosen graph's x and y.
4. Pass when the relative RMS residual, √(mean((y − kx)²)) / mean(|y|), is at most 5%.

Checked numbers for the pendulum: T² vs l passes (0% exact, about 2% with the largest ±0.3 s reaction-time error);
T vs l fails at about 18% over 20-100 cm and 11% over 50-100 cm. Every graph that should unlock must go through the
origin, so heating plots the temperature **rise** Δθ against time, not the raw temperature (section 7.2).

**Scoring:** a correct prediction wins the stake and a wrong one loses it; the score never goes below 0. Finishing
steps 1-6 places a sticker on the page and unlocks the next spread (page by page, not chapter by chapter). A correct
answer gets a soft "ding" and a small orange confetti burst; a wrong one gets a gentle "thud". Respect
`prefers-reduced-motion`.

## 7. MVP experiments (build in this order)

Check every name, procedure, variable and constant against the textbooks before marking an experiment done.
Form 4 has 6 chapters (Pengukuran; Daya dan Gerakan I; Kegravitian; Haba; Gelombang; Cahaya dan Optik).
Form 5 has 7 (Daya dan Gerakan II; Tekanan; Elektrik; Keelektromagnetan; Elektronik; Fizik Nuklear; Fizik
Kuantum). Chapter PDFs: https://ecentral.my/buku-teks-fizik-tingkatan-4/ and
https://ecentral.my/buku-teks-fizik-tingkatan-5/ (download into `docs/textbooks/`, git-ignored).

### 7.1 Bandul Ringkas (simple pendulum): Form 4, Bab 1, 1.2 Penyiasatan Saintifik. This is the HERO demo.
- **Model:** T = 2π √(l/g), g = 9.81 m s⁻²; θ(t) = θ₀ cos(√(g/l) · t); amplitude capped at 10 degrees; mass has no effect.
- **Reading:** time for 20 complete oscillations (t₂₀), T = t₂₀ / 20, and T². Add an optional reaction-time error of
  ±0.1-0.3 s (seeded random number generator so tests are deterministic).
- **3D:**
  - Apparatus: a line-art retort stand and clamp, string, and spherical bob, with a protractor at the pivot and a
    metre rule beside the string.
  - Orange motion: the bob leaves an orange arc trail, and orange tick marks count oscillations.
  - Stopwatch: shown in mono type.
- **Variables:** length l (manipulated), period T (responding), bob mass and amplitude (constant).
- **Prediction:** "Jika tali lebih panjang, tempoh ayunan akan... bertambah / berkurang / tidak berubah"
  ("If the string is longer, the period will... increase / decrease / stay the same").
- **Graph options:** T vs l (curved, the hint case) and T² vs l (passes the unlock rule).
- **Formula unlock:** T² vs l is a straight line through the origin, with gradient ≈ 4π²/g.
- **Class rounds:** (1) longer string → period bertambah; (2) heavier bob → tidak berubah; (3) the period at 80 cm is
  about 1.0 s / 1.8 s / 2.5 s (answer 1.8 s; T = 1.794 s).
- **Cikgu Silap mistakes:** reading the metre rule at an angle (parallax), timing one oscillation instead of 20,
  and swinging at 30 degrees. The main experiment stays capped at 10°, where the small-angle formula holds. The 30°
  replay is the one place that goes past the cap: it uses the large-angle correction T ≈ T₀(1 + θ₀²/16) (about 1.7%
  longer at 30°) so the reading is genuinely off. The reason to pick is "the formula only holds for small angles".

### 7.2 Muatan Haba Tentu (specific heat capacity): Form 4, Bab 4, 4.2.
- **Model:**
  - Q = mcΔθ.
  - The temperature rise is Δθ = ηPt/(mc), where η (0.85-1.0) is the share of heat kept: 1.0 with insulation, 0.85 without.
  - The measured value is c_exp = Pt/(mΔθ).
  - Constants: water c = 4200 J kg⁻¹ °C⁻¹, aluminium c = 900 J kg⁻¹ °C⁻¹ (check against the textbook).
  - Water is capped at 100 °C. Pack ranges must keep the final temperature below 95 °C so the graph stays a
    straight line (for example water 0.5 kg, 50 W, up to 600 s gives a rise of about 14 °C); a unit test checks the
    bundled pack.
- **Variables:** heating time t (manipulated), temperature rise Δθ (responding), mass, heater power and material
  (constant). Check against the textbook's experiment for 4.2 and change this if the book manipulates mass instead.
- **3D:**
  - Apparatus: an aluminium block or a beaker of water on the page, with an immersion heater, thermometer, power supply and
    stopwatch, plus an insulation toggle (a lagging jacket that wraps around the block).
  - Orange heat flow: glowing orange lines flow from the heater into the material, like the reference video's
    "Heating" page, and the thermometer liquid rises.
- **Mission:** "Gas untuk kenduri terhad. Berapa lama untuk panaskan air?" ("Gas for the kenduri is limited. How long
  will it take to heat the water?")
- **Graph:** the notebook shows temperature vs time, but the unlock graph is the temperature **rise** Δθ vs t, which
  goes through the origin with gradient ηP/(mc). The raw temperature graph starts at room temperature and would
  never pass the unlock rule.
- **Cikgu Silap mistakes:** thermometer touching the heater, no stirring, and no insulation.

### 7.3 Hukum Ohm (resistance and Ohm's law): Form 5, Bab 3, 3.2 Rintangan.
The main spread is one experiment: V against I for a constantan wire. Series and parallel bulbs are a separate,
optional challenge so the page does not mix two experiments.
- **Model:**
  - V = IR, with R fixed. Constantan is chosen because its resistance barely changes as it warms, so the model has
    no heating effect.
  - The rheostat sets the current between 0.1 and 1.0 A.
- **Variables:** current I (manipulated), potential difference V (responding), wire length, diameter and material (constant).
- **3D:**
  - Apparatus: a battery, rheostat, ammeter, voltmeter and wire on the page, with orange current dots moving along the wires.
  - Meters: needle meters that animate to the reading.
- **Mission:** "Pak Mat mahu guna dawai lama untuk lampu dewan kampung. Berapakah rintangan dawai itu?"
  ("Pak Mat wants to reuse an old wire for the village hall lights. What is its resistance?")
- **Graph:** V vs I, with R as the gradient.
- **Cikgu Silap mistakes:** voltmeter connected in series, ammeter zero error, and reading a needle meter at an angle (parallax).
- **Optional challenge (Cabaran, "could have"):** "Panel solar sekolah tak cukup untuk semua mentol kelas. Pilih litar
  yang betul" ("The school's solar panel can't light every classroom bulb. Pick the right circuit"). Compare series
  and parallel bulbs; brightness comes from P = V²/R, with bulbs treated as fixed resistors (state this simplification
  in the UI: real bulbs are non-ohmic).

### 7.4 Template contract
Every experiment folder `src/experiments/<id>/` exports:
- `model.ts`: pure functions `simulate(settings, t)` and `measure(settings, rng)`. `rng` is a seeded random number
  generator, so readings with human error are repeatable in tests; pass a zero-noise rng for exact readings.
- `model.test.ts`
- `Scene.tsx`: the R3F component
- `meta.ts`: variable ids with units and default ranges, and the graph options (x and y quantities, and whether each
  should pass the unlock rule). Variable display names come from the i18n dictionary (`var.<id>`), not from `meta.ts`.

The game engine only talks to this interface. The SDS (section 3.1) uses the same contract.

## 8. Content packs

Content packs live in `content/fizik-t4.json` and `content/fizik-t5.json`, and are validated with a zod schema at
load. Every student-facing text field has both `ms` and `en`. Each page has:
- `pageId`, `template`
- `chapter` {form, number, title}, `subtopic` (for example "1.2 Penyiasatan Saintifik"), page `title`
- `concept`: 2-4 short paragraphs for the left page
- `mission`
- `variables` {manipulated, responding, constant[]}: variable ids from the template's `meta.ts`
- `ranges`
- `prediction` {question, options[], answer}
- `explain` {question, options[], answer}
- `formula` {latex, unlockGraph}: `unlockGraph` names one of the template's graph options (for example `T2-vs-l`)
- `classRounds[]`: 3 prediction questions {question, options[], answer, settings?}, one per class-mode round;
  `settings` optionally fixes the run's values (for example `length_cm: 80`)
- `mistakes[]`: {id, reasons[3], answer}; the id picks a planted mistake the template knows how to replay
- `reviewedBy`: null until a teacher checks it

The full example is in SDS section 4.1. Packs can also be imported from a local `.json` file (Settings → Import pack)
for offline sharing.

## 9. Offline and storage

- vite-plugin-pwa precaches all JS, CSS, fonts, sounds, models and content. Include a web app manifest
  (name MakmalPop, theme #F26B1D, background #F7F2E7, icons 192/512, `display: standalone`, landscape preferred).
- An offline indicator chip appears in the toolbar ("Luar talian · semua berfungsi" — "Offline · everything works").
- Dexie stores progress records (pageId, completed, predictionsCorrect, pointsEarned, formulaUnlocked, mistakesFound,
  updatedAt) and settings (language, lite mode, sound, unlock-all, DEMO watermark). Class mode state is in memory only.
- Keep the 15 MB budget in view from day one:
  - fonts: import only the Latin subset and the weights used (for example Fraunces 600, Inter 400/600, JetBrains Mono 500);
  - KaTeX: precache only its `.woff2` fonts;
  - Workbox `globPatterns` must include `glb`, `woff2`, `json` and the sound format, or those files will not work offline.

## 10. Folder layout

The project folder is `D:\MakmalPop`. It is not a git repository yet: run `git init` before milestone 1.

Put the app in `app/`:
- `app/` already holds a README, so `npm create vite@latest . -- --template react-ts` will stop and ask what to do.
  Never pick "Remove existing files". Scaffold into a temporary folder and move the files in, or move `app/README.md`
  aside first.
- Tailwind v4 needs `tailwindcss` plus `@tailwindcss/vite`.

Under `app/src/`, use `shell/`, `book/`, `experiments/`, `game/`, `classmode/`, `storage/`, `i18n/` and `ui/`.
Content goes in `../content/`, assets in `../assets/`. These sit outside the Vite root, so:
- set `server.fs.allow: ['..']` in `vite.config.ts` (the dev server blocks them otherwise);
- import packs and assets from code (JSON imports and `?url` imports) so they are bundled, hashed and precached.

Keep `README.md` updated with how to run, test and build.

## 11. Milestones (each must pass its checks before moving on)

Who does what, in what order, and which files each person owns is in `docs/workplan.md`. It splits these
milestones into two parallel lanes; where it differs from the list below, the workplan wins.

1. **Scaffold:** Vite + React + TS + Tailwind + PWA running; `npm run build` works; the app loads offline in Playwright.
2. **Book shell:** the table scene, the book, the cover → contents → spread flow, page turns, the toolbar and the palette.
   Playwright screenshots in landscape and portrait.
3. **Pendulum, full loop:** model and tests, the pop-up scene, controls, notebook and graph, game steps 1-6 with
   fast-forward and Skip, and the flap unlock. This is the video hero, so polish it first.
4. **Class mode** on the pendulum: default teams, 3 different rounds, predictions, stakes, scoreboard and winner.
5. **Heating experiment.**
6. **Lite mode, performance pass,** 15 MB budget check, and a full BM text pass.
7. **Finalist polish (by 18 Nov):** Cikgu Silap, Ohm's law, English strings, and the Capacitor Android build (stretch).

## 12. Tests and checks

- **Vitest:**
  - Pendulum T at l = 0.10, 0.50 and 1.00 m (0.634 s, 1.419 s and 2.006 s)
  - Heating Δθ for known P, t, m and c, and the bundled heating pack never passing 95 °C
  - Ohm's law V for known I and R
  - The unlock rule (section 6):
    - T² vs l passes, with and without the largest reaction-time error
    - T vs l fails over both 20-100 cm and 50-100 cm
    - fewer than 5 readings, or readings spanning under 60% of the range, fail
    - heating Δθ vs t passes
  - The pendulum large-angle replay at 30° is about 1.7% longer than T₀
  - The zod schema rejecting bad packs (missing `en`, wrong answer index, unknown variable or mistake id)
- **Playwright:**
  - The full pendulum loop
  - Class mode with 2 default teams, started in 3 taps, with a locked experiment (locks ignored)
  - The whole app with the network set to offline
  - A screenshot of every screen in a 412x915 viewport, an 915x412 viewport and a 1920x1080 projector size
- **Performance:** 30 fps or better with 4x CPU throttle in lite mode; the production build total is reported in the README.
- Every web page shown in the competition video shows a small "DEMO" watermark in a corner (toggle in settings,
  on by default until after the competition).

Start by running the superpowers brainstorming skill on this spec, ask me any questions you have, then write the plan.
