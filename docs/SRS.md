# MakmalPop: Software Requirements Specification (SRS)

Snapshot of the live doc, 6 Nov 2026, updated the same day after a review (formula unlock rule, locks, class
rounds, lite mode, Cikgu Silap scope). This file is now ahead of the live version and needs syncing back:
https://claude.ai/artifact/HGxwiLBFUtTcWjQxe6EXt9

## 1. Introduction

MakmalPop is an offline-first 3D pop-up virtual lab book that lets rural secondary students run KSSM Physics experiments their school cannot run, using one teacher's phone or a low-end Android device.

### 1.1 Purpose

This SRS defines what the MakmalPop MVP must do for the Festival Idea Putrajaya 2026 Innovation Challenge (submission closes 9 Nov 2026, 11.59 pm). It is the reference for the team's build, testing and video demo.

### 1.2 Scope

- **In scope (MVP):** Form 4 and Form 5 KSSM Physics, 3 experiments, the game loop (mission, variables, predict, run, explain, discover the formula, plus Cikgu Silap as a bonus step), class battle mode, offline use, Bahasa Melayu with English.
- **Out of scope (roadmap):** other subjects, the AI-assisted content pipeline, teacher accounts, cloud sync, inter-school leaderboards.

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| Experiment page | One pop-up book spread: explanation on the left, interactive 3D experiment on the right |
| Content pack | A versioned JSON bundle of experiment pages, shared offline |
| Template | A reusable 3D experiment engine (pendulum, heating, circuit) whose physics is fixed in code |
| Class mode | Projector layout where one device runs a team game for the whole class |
| POE | Predict, observe, explain: the core learning loop |
| Cikgu Silap | A mini-game where students spot mistakes in a virtual student's experiment |
| PWA | Progressive web app: a web app that installs and runs offline |

### 1.4 References

- Festival Idea Putrajaya 2026 Innovation Challenge rules and rubric (organiser site)
- KSSM Fizik Tingkatan 4 and Tingkatan 5 textbooks (to be checked for experiment names and procedures)
- MakmalPop Software Design Specification (SDS), companion doc (docs/SDS.md)

## 2. Overall description

MakmalPop is a standalone, installable app that complements (not replaces) physical labs: it lets students understand and rehearse experiments when their school has no lab or equipment.

### 2.1 Product perspective

- Problem: many rural schools, especially in Sabah and Sarawak, lack proper science labs, so students learn experiments only from the textbook.
- Existing tools (PhET, Labster, OLabs, Pandai, Pelangi Makmal Sains Maya) either need internet and good devices, are not KSSM-aligned, or are not built for a whole class on one device.
- MakmalPop's position: KSSM experiments, fully offline after one download, playable by a whole class from one teacher's phone.

### 2.2 User classes

| User | Who | Main needs |
| --- | --- | --- |
| Student | Form 4 and Form 5 students, rural secondary schools | Run experiments, understand concepts, have fun, track progress |
| Teacher | Physics teachers, often non-option or overloaded | Start a class activity in under 30 seconds, project it, run team battles |
| Content reviewer (roadmap) | Physics teacher or trained university volunteer | Check experiment pages before release |

### 2.3 Operating environment

- Low-end Android phones (Android 9+, 2–3 GB RAM) in Chrome, or as a wrapped Android app
- Teacher laptop or phone connected to a projector or TV
- No internet after the first download

### 2.4 Constraints

- 4-day build by a small team working in two parallel lanes (docs/workplan.md)
- Physics must be correct: equations are fixed in code, not generated at run time
- Bahasa Melayu is the primary language; English is secondary (DLP schools)
- No real personal data stored or shown (competition and privacy rule)

### 2.5 Assumptions

- At least one device (usually the teacher's phone) is available per class
- The school has electricity for a projector, or the class can gather around one screen
- Experiments chosen follow the KSSM Physics textbook; names and procedures are verified against the actual books before release

## 3. Functional requirements

Priority: **M** = must have for the competition video, **S** = should have, **C** = could have if time allows.

### 3.1 Book and navigation

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | The app opens as a pop-up book with a cover, a chapter list for Form 4 and Form 5, and page-turn navigation | M |
| FR-02 | Each experiment page shows a short concept explanation (left) and an interactive 3D experiment (right) | M |
| FR-03 | The user can switch language between Bahasa Melayu and English at any time | S |
| FR-04 | Locked pages show what must be completed to unlock them. Locks apply to student mode only: class mode ignores them, and a settings switch unlocks all pages for demos | S |

### 3.2 Experiments (MVP set)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-10 | Simple pendulum (Form 4, Measurement): vary length, time oscillations with a virtual stopwatch, record the period | M |
| FR-11 | Heating / specific heat capacity (Form 4, Heat): vary the heating time (manipulated), with mass, heater power and material kept constant, and read the temperature rise; to be checked against the textbook's 4.2 experiment | M |
| FR-12 | Ohm's law (Form 5, Electricity): vary current with a rheostat, read voltage across a constantan wire, find R from the V-I graph | S |
| FR-12a | Optional challenge on the Ohm's law page: compare series and parallel bulbs (bulbs treated as fixed resistors, stated in the UI) | C |
| FR-13 | Each experiment lets the user rotate and zoom the 3D scene and replay the run; long runs fast-forward and can be skipped to the reading | M |
| FR-14 | Results are recorded in a data table and plotted on a graph inside the page | M |

### 3.3 Game mechanics

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-20 | Kampung mission: every experiment opens with a local story problem the student must solve | M |
| FR-21 | Variable setup: the student assigns manipulated, responding and constant variables before the experiment can run; a wrong setup shows a "not a fair test" hint | M |
| FR-22 | Predict: the student commits a prediction (multiple choice) before running; sketching a graph is roadmap | M |
| FR-23 | Confidence bet: the student stakes 1–3 points on the prediction; correct wins the stake, wrong loses it | M |
| FR-24 | Explain: after the run, one short "why" question | M |
| FR-25 | Discover the formula: the formula card unlocks only when the student picks the graph that their readings show is a straight line through the origin (at least 5 readings spread over at least 60% of the range; rule in SDS 6.2) | M |
| FR-26 | Cikgu Silap: the student spots deliberate mistakes (parallax, zero error, too few oscillations) in a replayed experiment. A bonus step, not needed for the sticker | S |
| FR-28 | Two ways to start every experiment: "Uji terus" (apparatus ready) or "Susun sendiri", where the student picks the right apparatus from a shelf with distractors and places each piece by drag-and-drop (or tap), in a sensible order, with hints | M |
| FR-27 | Progress: completing an experiment (mission to formula) earns a sticker on the book page and unlocks the next experiment page | S |

### 3.4 Class battle mode

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-30 | The teacher starts class mode in at most 3 taps after the app opens: Mod Kelas, pick experiment, start. Two teams are ready by default | M |
| FR-31 | Class mode shows a projector layout: large 3D scene, large text, team scoreboard | M |
| FR-32 | The teacher can have 2–4 teams and enters each team's prediction with one tap (plus an optional stake tap; default stake 1) | M |
| FR-33 | Each of the 3 rounds asks a different prediction question; the scoreboard updates after each run and declares a winner at the end | M |

### 3.5 Offline, sharing and storage

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-40 | After the first load, every MVP feature works with no internet connection | M |
| FR-41 | The app is installable from the browser (PWA) | M |
| FR-42 | Student progress and scores are stored on the device | M |
| FR-43 | The app is packaged as an Android APK that can be shared by Bluetooth, USB or SD card | C |
| FR-44 | New content packs can be imported from a file, without internet | C |

## 4. Non-functional requirements

The hardest targets are size and speed on a cheap phone: they decide whether the rural claim holds.

| ID | Category | Requirement | How it is checked |
| --- | --- | --- | --- |
| NFR-01 | Offline | 100% of MVP features run in airplane mode after first load | Airplane-mode test on camera |
| NFR-02 | Size | First download at most 15 MB; each later content pack at most 2 MB | Build output size |
| NFR-03 | Performance | First page interactive within 5 s and 3D at 30 fps or more on a 2–3 GB RAM Android phone | Test on a borrowed low-end phone |
| NFR-04 | Low-spec fallback | A lite mode that keeps the 3D scene but drops postprocessing, antialias, the high pixel ratio, idle drift and page curl; it turns on automatically on low-memory or slow devices and can be toggled | Manual test + 30 fps with 4x CPU throttle |
| NFR-05 | Accuracy | Physics results match the textbook equations within rounding; every page is checked by a physics teacher before release | Unit tests on physics models + reviewer sign-off |
| NFR-06 | Usability | A teacher starts class mode in under 30 s with no training | Timed test with one teacher |
| NFR-07 | Readability | Class mode text readable from the back of a classroom: at least 32 px body text on projector layout | Projector test |
| NFR-08 | Language | All student-facing text in Bahasa Melayu; English available | Content review |
| NFR-09 | Accessibility | Touch targets at least 48 px; colour is never the only signal | Manual review |
| NFR-10 | Privacy | No login, no personal data collected; progress stays on the device | Code review |
| NFR-11 | Maintainability | New pages on an existing template (pendulum, heating, circuit) are added as content packs, without app code changes; a new kind of experiment needs a new template in code | Add a test pack |
| NFR-12 | Competition rule | Any web app shown in the video carries a visible DEMO watermark (good practice, required in the Agentic AI track) | Visual check |

## 5. Scope and acceptance

The MVP is done when the pendulum experiment runs the full game loop offline on a low-end phone and in class mode; heating and Ohm's law follow in that order.

### 5.1 Release phases

1. **MVP (competition, by 9 Nov):** pendulum with the full loop (hero demo), heating, class mode, offline PWA, Bahasa Melayu.
2. **Finalist polish (by 18 Nov):** Ohm's law, Cikgu Silap, English, APK packaging, feedback from 1–2 teachers.
3. **Roadmap (after the competition):** full Form 4 and Form 5 coverage, AI-assisted content pipeline with teacher review, other subjects (Chemistry, Biology), pilot in rural Sabah and Sarawak schools.

### 5.2 Acceptance checklist for the competition video

- [ ] Pendulum: mission, variable setup, predict with confidence bet, run, explain, graph, formula unlock all work
- [ ] Formula unlocks on T² vs l and not on T vs l (unit tests pass)
- [ ] Heating experiment runs, plots temperature against time, and unlocks on temperature rise against time
- [ ] Class mode: started in 3 taps, 2 teams, 3 different rounds, predictions entered, scoreboard updates
- [ ] Whole demo filmed in airplane mode
- [ ] Runs on one low-end Android phone at acceptable speed
- [ ] Physics values checked against the Form 4 textbook by at least one person with a physics background
- [ ] All student-facing text in Bahasa Melayu

### 5.3 Open questions

- Do the chosen experiments match the textbook's listed experiments and their exact names?
- Can the team reach one rural science teacher for a short interview before Sunday?
- Does Pandai's virtual lab work offline? (affects the positioning in the pitch)
- Does the textbook's 4.2 experiment manipulate heating time or mass? (FR-11 assumes time)
- Does the textbook time 10 or 20 oscillations for the pendulum? (the build assumes 20)
