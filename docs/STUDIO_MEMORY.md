# BETWEEN THE LIES — STUDIO MEMORY (read this first in every new session)
Last updated: 2026-11-18 · Branch: `studio-upgrade` (main = Always v3.1 baseline, tag `v3.1-baseline`)
This file is the session-to-session memory: what we built, what the user decided, what failed and why, and how to
continue. `CLAUDE.md` holds the rules; this file holds the history and the hard-won lessons.

## 1. The user and the channel
- Channel: **Between the Lies** — vertical 9:16 animated shorts about the hidden side of villains/overlooked characters
  from comics, anime, manga, manhwa, films, TV. Core theme: "bad people are not born; they are made" (explain, never excuse).
- The user writes in short, all-caps bursts; give clear progress + honest numbers; they value a "studio" feel, rich detail.
- Reference videos they aim for (style principles only, never copy): "The Pickpocket Who Gave Everything Back" and
  "What the Grave Bell Really Meant" (3D detailed sets, object storytelling, constant motivated camera, 1-word captions,
  twist endings). Local copies (git-ignored): `references_ext/`. Analysis: `docs/REFERENCE_ANALYSIS_2026-11-18.md`.

## 2. Locked decisions (do not re-ask)
| Topic | Decision | Source |
|---|---|---|
| Format | 1080×1920, 30 fps, H.264 + AAC 48 kHz, −14 LUFS, ≤ −1 dBTP | manual + user |
| Length | 45-75 s (default 60-70) | manual |
| Pace | **190-205 WPM average incl. pauses** (earlier 3.7 w/s lock is superseded); earned pauses at reveals | user (Phase 6 spec) |
| Story structure | HOOK → WORLD → WORLD RULES → RELATIONSHIP → CONFLICT → TRANSFORMATION → REVELATION → PAYOFF; newcomer must understand everything; world-building ≈ 12-17 s | user |
| Storytelling DNA | 8 steps in CLAUDE.md ("understand the world, remember the relationship") | user, frozen after Always v3 |
| Objects | 1-2 meaningful recurring objects per episode (Always: flower; Itachi: forehead poke + headband) | user |
| Precision | never overstate rules (rival ≠ enemies); explain slurs/prejudice with a visual | user |
| Canon | every claim labelled CANON / SUPPORTED INTERPRETATION / ADAPTATION / CHANNEL JUDGEMENT / VISUAL EMBELLISHMENT with locator | manual + user |
| Production | **storyboard-first**: beat sheet + 4-6 styleframes → user approval → full animation | user (Phase 5) |
| Renderer | **hybrid**: Three.js 3D sets + camera for most beats; our 2D character rig as camera-facing cards; 2.5D canvas for close-ups/inserts | step-4 evidence + user "3" |
| Captions | phrase captions on a dark plate (user has not chosen 1-2-word yet — still open) | current default |
| Ending hold | ≥ 4 s after last word (user has not chosen shorter — still open) | current default |
| Never | imitate a creator's character design / captions font / shots; use `engine-base/references/`; gore | rules |

## 3. Episodes produced
| Episode | State | Key lessons |
|---|---|---|
| Always (Snape) v1 | 2.5D test | cramped story; film-only image (Snape holding Lily) wrongly used as book canon |
| Always v2 | QC-approved | added psychology, Whisper alignment, QC gate, captions plate, camera glide |
| Always v3 | QC-approved (user 8.8/10) | world-first after hook → newcomers understand; "houses are enemies" was a canon overstatement |
| **Always v3.1** | QC-approved, reference episode | rival houses, Mudblood explained with a scene, world 9.5 s, flower object (`engine/src/episodes/snape31`) |
| Necessity test | done | 3D: 65 % frames with parallax vs 2.5D 2 %; 3D 2.2 s/frame vs 2.5D 0.05 s/frame on CPU (`docs/NECESSITY_TEST_2026-11-18.md`) |
| **Next Time (Itachi, Naruto)** | **DONE, QC 21/21** — full production: 13 dressed 3D sets, 33 beats, original koto/flute/taiko score | `engine/src/episodes/itachi/` (Episode.tsx, sets.tsx, stage.tsx), score `engine/audio-lib/score_itachi.py` |

## 4. Pipeline (commands; run from repo root unless noted)
1. Research → `story/episodes/<ep>/source-dossier.md` (claims table `| # | ... |` — the QC gate parses claim ids).
2. Narration `narration.txt` (one beat per line, earned pauses `{0.5}`) + optional `lexicon.json` `{"Name": "phonemes"}`.
3. Voice: `VIRTUAL_ENV=/home/user/.venv-tts PATH=/home/user/.venv-tts/bin:$PATH HF_HUB_DISABLE_XET=1 python engine/tools/tts.py <narration> <voice_dir> am_michael 1.30 0.0`
4. Verify/re-time: `python engine/tools/align.py <voice.wav> <words.json> <lines.json> <asr_report.json>` (must hear every word).
5. Captions: `python3 engine/tools/captions.py <narration> <words.json> <captions.json> <out.srt> <highlight words…>`
6. Beat sheet: `python3 engine/tools/beatsheet.py <beats_src.json> <words.json> <captions.json> <outdir> 4.2` → beats.json + storyboard.md (structure validator).
7. Styleframes → approval. 8. Episode code in `engine/src/episodes/<ep>/`. 9. Score `engine/audio-lib/score_<ep>.py` → ffmpeg loudnorm two-pass.
10. Render (from `engine/`): `npx remotion render src/index.ts <Comp> ../out/<ep>/picture.mp4 --codec h264 --crf 17 --concurrency 3 --gl=swangle` (GPU PC: `--gl=angle`).
11. Mux with `-map 0:v:0 -map 1:a:0`. 12. QC gate `python3 -I engine/scripts/check_episode.py …` (exit 1 = rejected; never deliver).
13. Reference analysis: `python engine/tools/refscan/refscan.py <video.mp4> <outdir> [--truth truth.json] [--no-ocr]` (TTS venv).

## 5. Engine map
- `engine/src/btl/` 2.5D canvas engine: `core.ts` (camera keys, `glide`, `K` keyframes, post grade/grain/particles),
  `people.ts` (character rig: 10 designs incl. Itachi/Sasuke, expressions, saccades, blinks, breathing, hands, tremble, walk,
  kneel, costume overrides, `eyesRed`, `headband`, **`reachArm()` 2-bone IK**), `envs.ts` (painted sets + `layerRack`), `kit.ts`.
- `engine/src/three/` 3D: `kit3d.tsx` (toon + ink outlines, geometry `intern`, `CameraRig`, `CardCanvas`, `CardActor`), `village.tsx` (village kit),
  `props.tsx` (barrels, crates, stone lanterns, noren, banners, laundry, bamboo, rocks, instanced grass, trees, fences, motes, rain, light shafts, mist, flames+smoke).
- Episode stage pattern: `engine/src/episodes/itachi/stage.tsx` (`Stage` = canvas + camera + per-mood lights/fog + tint/vignette/blur) and one component per beat keyed to beats.json.
- `engine/src/tests/` necessity test (Street3D / Street25D); `engine/src/episodes/` (snape, snape2, snape3, snape31, itachi).
- Tools: `engine/tools/{tts,align,captions,beatsheet}.py`, `engine/tools/refscan/refscan.py`, `engine/scripts/{check_episode.py,short_qa.py,stills.mjs}`.

## 6. Hard-won lessons (bugs we hit — don't repeat)
- **TTS**: Kokoro timestamps run early → trim lines by *energy*, never by timestamp (clipped "excuse it"). Use a 1 % energy
  threshold + 150 ms tail (2 % / 100 ms clipped "enemies"). Speed > 1.30 slurs words (Whisper lost 4-13 words at 1.34-1.42).
- **Names**: Kokoro mispronounces anime names ("tachi", "uchha") → per-episode `lexicon.json` with phonemes fixed it 100 %.
- **Alignment**: Whisper boundary times drift up to 0.3-0.5 s → snap line starts/ends to the TTS segment audio (`seg_s/seg_e`).
  Whisper writes numbers as digits and splits hyphens → normalise; proper names → fuzzy match, reported.
- **Captions**: balanced phrase split; never end on a function word; non-breaking hyphens; plate for contrast.
- **QC**: judge frozen frames at 270×480 (90×160 hides 1 px/frame creeps). Cameras must never fully stop (`glide`).
  Payoff ≥ 4 s; total ≤ 75 s → shorten the script, never speed the voice.
- **3D framing**: vertical 9:16 → horizontal FOV is only ~25° at fov 44: aim the camera close to the subject or it leaves frame.
- **Toon point lights** make hard circles on walls → keep them weak/close or use emissive planes.
- **Cards** can't open doors: put the actor in front of an emissive "open doorway" plane. Back views of cards are crude.
- **Arms**: never guess angles for contact → `reachArm()`; stage so the arm enters from the side (don't cross faces).
- **R3F**: `makeDefault` is drei-only (drive the camera via `useThree`). R3F clamps dpr ≥ 1, so `--scale` doesn't cut 3D cost.
- **Rendering here**: no GPU; `BTL_GL=swangle` (stills script) / `--gl=swangle` (render). Remotion bundling costs ~15 s per job.
- **refscan**: hard-cut detector 97 % recall on v3.1; "visual setups" metric needed for fly-through styles; BPM unreliable.
- Canon traps: film-only scenes in book continuity; unverifiable quotes → paraphrase and label.
- **3D render memory/speed (Itachi)**: sets built `new THREE.XGeometry()` inline each frame → ~20 s/frame + leaks.
  Fix: `intern()` in `Inked` (kit3d) reuses one geometry per shape → ~4-5 s/frame at 1080x1920 (swangle, 3 tabs).
  Uncached per-house canvas textures (100+ per street, re-created on every beat mount) crashed Chromium ("Page crashed!")
  → `houseTex` cache + toon-material cache keyed by map + CardCanvas disposes its canvas/texture on unmount.
  Render in 120-frame resumable chunks with retries: `engine/scripts/render_chunks.sh <Comp> <dir> <frames> 120 3`.
- **House kit bug**: `House` face 0 had w/d swapped (box z-extent = w) → characters hid inside walls. Fixed in village.tsx.
- **Two-shots in 3D**: draw both characters into ONE card (`CardCanvas`, 2D coords, ground at y=1880, `ppm`) so
  `reachArm` contact (forehead poke, piggyback) is exact. Separate cards can't touch.
- **Depth-of-field close-ups**: `Stage blur={px}` renders the 3D set blurred; full-res 2D rig drawn on an overlay canvas
  (no `post()` on overlays: its soft-light fill would paint over the 3D background).
- Forehead target for Sasuke drawn at (x,y,s), facing ~0.45: `[x + 38s, y − H·s + 38s]` (H = 640 child / 880 teen).

## 7. Where things are saved (user rule, 19 Nov: "put the videos there for next sessions")
- **GitHub: `amiben09/between-the-lies`, branch `studio`** = this whole studio (code, stories, docs, memory) + `videos/`.
  `main` on that repo belongs to an earlier, different session's project — never overwrite it.
- **Every finished video goes into `videos/` and is committed + pushed** (`videos/between-the-lies/<Episode>.mp4`).
  The cloud machine is wiped between sessions; `out/` is git-ignored scratch. Keep files < 95 MB (GitHub limit 100 MB).
- The repo is PUBLIC: commit author must be the GitHub no-reply identity, never the user's email.
- Lost (only on old session machines): umbrella_fast_tiktok_30, longway_p1/p2, Iceman video.

## 8. Next Time (Itachi) — DONE 19 Nov
- Final: `videos/between-the-lies/Next_Time_Itachi.mp4` (71.8 s, QC gate 21/21 PASS, -14.3 LUFS / -1.3 dBTP).
  QC report + final contact sheet + audio cues in `story/episodes/itachi-next-time/`.
- Lessons from finishing: (1) stream-copy concat of chunks keeps frames but leaves timestamp gaps → A/V drift; `finish_episode.sh`
  now re-times with `setpts=N/(30*TB)` (never use `-shortest`, it silently cut 54 frames). (2) Dolly-OUT shots lose pixel motion as
  they pull back → use an accelerating move (`0.35p + 0.65p²`) or the frozen-frame gate fails. (3) Small 2D dust is invisible at
  the gate's 270x480 → use `sparks` (rising) at depth ≥ 2 for motion in dark wide shots. (4) `render_beats.py` arg 6 = first
  frame to render; passing 0 re-renders beat 2 overlapping chunk c00000 — move stale/overlapping chunks to `chunks_old/`.

## 8b. Next episodes in the pipeline (storyboard-first; waiting for the user's GO)
- **Snow Globe (Mr. Freeze, BTAS "Heart of Ice")** — `story/episodes/freeze-heart-of-ice/` (voice, 33 beats, 6 styleframes) — user asked
  for other options instead; kept ready.
- **Perfect (Jinx, Arcane S1)** — `story/episodes/jinx-perfect/` — chosen by the user (#5 of 10 concepts). Voice 234/234 heard,
  31 beats, 6 styleframes; sets `engine/src/episodes/jinx/sets.tsx` (VerticalCity, ZaunStreet, Hideout, TableHall, SilcoOffice,
  RocketRoof, BlastSite, MonkeyBomb). Next: user approval → Episode.tsx (copy the itachi pattern) → score → render → QC.
- Tooling added: align.py merges split names ("van der" → Vander) + name homophones; tts.py merges possessive tokens;
  city kit `engine/src/three/city.tsx` (towers with glowing windows or daylight facades, NightSky, Neon, Searchlight, Gargoyle).
- Lesson: night fog (Stage look "night") hides a whole city beyond 70 m → pass `fogScale={3-4}` for skyline shots.

## 9. Open items
- RX 590 benchmark (Test3D) on the user's Windows PC.
- Captions style + ending-hold length decisions.
- Acting system beyond IK (state machine, foot planting, 8-direction views), camera-director spec layer, QC v2 scorecard.


## 8c. Perfect (Jinx) DONE — 2026-11-20
- videos/between-the-lies/Perfect_Jinx.mp4 (73.63 s, 2209 f, QC APPROVED). Code: engine/src/episodes/jinx/, story/episodes/jinx-perfect/.
- Lessons: the "candle" look is too dark for QC (black < 0.03 luma) — add ambientLight 1.2-1.6 + a warm pointLight; never let a scene end dark before the final 24-frame fade (QC checks luma > 0.05 two seconds after the last word); blast scenes need a constant crystal light so the pre-flash frames aren't black. Teen Jinx with nod>0 draws her bangs as a black bar over the eyes — keep nod 0.

- **Ink + Wash / Dreamcore version** (user picked style "3" = Ink + Wash, and asked for backrooms/dreamcore background music): videos/between-the-lies/Perfect_Jinx_InkWash_Dreamcore.mp4 (QC APPROVED).
  Pipeline: render caption-less plates (`BTL_PROPS='{"plate":true}'` with render_beats.py; Episode hides <Captions/> when inputProps.plate) →
  `engine/tools/ink_episode.py plates.mp4 captioned_final.mp4 out.mp4 wash 4` (ink.py per frame; captions copied back untouched from the captioned render) →
  `engine/audio-lib/score_dreamcore.py <audio_dir> <beats.json> <out>` (fluorescent hum, slowed detuned music-box lullaby with tape wow, muffled mall e-piano, party-through-the-wall thump, 6 s reverb wash, tape-stop ending; music -16 dB under voice) → finish_episode.sh → QC.
  ink.py lessons: edges on sqrt(image) so dark-on-dark coats get outlines; shadows keep a deep tint of their own colour (not flat black); white rim lines in solid-ink zones.
