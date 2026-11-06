# Entry form answers (draft, task B6)

Character counts are checked with `node -e` (see the bottom). BM wording still needs a native-speaker read.

- **Category:** IPT
- **Title (max 80 characters):**
  - BM: MakmalPop: Buku Makmal Pop-up 3D Luar Talian untuk Fizik KSSM
  - EN: MakmalPop: An Offline 3D Pop-up Lab Book for KSSM Physics
- **Problem (max 600 characters):** see `research/problem-statement.md`
- **Solution and technology (max 600 characters):**

  BM:

  > MakmalPop ialah buku makmal pop-up 3D untuk Fizik KSSM Tingkatan 4 dan 5. Radas timbul dari halaman dan murid menjalankan eksperimen seperti bandul ringkas dan muatan haba tentu melalui permainan: misi kampung, pemboleh ubah, ramalan dengan taruhan, graf dan penemuan formula. Mod Kelas membolehkan guru menjalankan pertandingan pasukan dengan satu telefon dan projektor. Aplikasi web progresif (React, Three.js) ini berfungsi sepenuhnya tanpa internet selepas muat turun kurang 1 MB, pada telefon Android murah. Fizik ditulis dalam kod yang diuji; kandungan dalam pek JSON yang disemak guru.

  EN:

  > MakmalPop is a 3D pop-up lab book for KSSM Physics Form 4 and 5. Apparatus rises out of the page and students run experiments such as the simple pendulum and specific heat capacity as a game: a kampung mission, variables, a prediction with a points bet, graphs and discovering the formula. Class Mode lets a teacher run a team contest with one phone and a projector. This progressive web app (React, Three.js) works fully offline after a download of under 1 MB, on low-cost Android phones. Physics is in tested code; content is in teacher-checked JSON packs.

- **Video link (max 5 min, "Anyone with the link"):** TBD (script in `video/script.md`)

## Check the lengths
```bash
node -e "const s=require('fs').readFileSync('submission/form-answers.md','utf8');for(const m of s.matchAll(/^  > (.*)$/gm))console.log(m[1].length);for(const m of s.matchAll(/^  - (BM|EN): (.*)$/gm))console.log(m[1],m[2].length)"
```
