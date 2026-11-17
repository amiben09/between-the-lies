# BETWEEN THE LIES — Studio audit (Phase 1)
Date: 2026-11-17 · Branch: `studio-upgrade` · Baseline tag: `v3.1-baseline` (main @ f7cb2f5, Always v3.1 approved)
Labels: **MEASURED** (run/inspected here) · **ESTIMATED** (calculated, not measured) · **UNKNOWN**.
Nothing in the studio was modified for this audit.

---
## 1. Architecture report

```
narration_vX.txt ──► tools/tts.py (Kokoro 0.9.4, am_michael) ──► voice.wav + words.json + lines.json (+ exact line segments)
                         │
                         ▼
                 tools/align.py (faster-whisper 1.2.1, small.en, CPU int8) ──► re-timed words.json, asr_report.json
                         │
       ┌─────────────────┼───────────────────────────┐
       ▼                 ▼                           ▼
tools/captions.py   src/episodes/<ep>/shots.ts     audio-lib/score_<ep>.py
(phrase captions,   (shot list as code, keyed       (synth music/ambience/SFX keyed to
 .srt + .json)       to word/line frames)            words/lines → stems + premaster)
       │                 │                           │
       └──────► Remotion 4.0.290 composition ◄───────┘   ffmpeg loudnorm 2-pass → mix.wav
                (CanvasFrame: one 1080x1920 2D canvas      │
                 per frame + DOM caption overlay)          │
                         │                                 │
                         ▼                                 ▼
                 picture.mp4 (H.264) ───────── ffmpeg mux ──► final.mp4
                                                   │
                                                   ▼
                              scripts/check_episode.py (QC gate, exit 1 = rejected)
```

| Component | Implementation | Version / location | Status |
|---|---|---|---|
| Timeline + render | Remotion | 4.0.290 (`engine/package.json`, pinned, lockfile) | MEASURED |
| Browser | Chromium headless | `/opt/pw-browsers/chromium-1243` (container only; `BTL_BROWSER` override) | MEASURED |
| GL backend | `angle` default, `swangle` here | `engine/remotion.config.ts` (`BTL_GL`) | MEASURED |
| **Production renderer** | **Canvas2D 2.5D engine** (not Three.js) | `src/btl/{core,envs,people,kit,CanvasFrame}.ts(x)` | MEASURED |
| Three.js | three 0.175 + R3F 9.1.2 + postprocessing 6.37.2 installed; used **only** by `src/proof/ProofScene.tsx` (6 s proof) | — | MEASURED |
| Episodes | `src/episodes/{snape,snape2,snape3,snape31}` — shot lists as TypeScript, each a copy of the previous | 351 / 484 / 418 / 445 lines | MEASURED |
| Voice | Kokoro TTS (local, Apache-2.0 model card; voice-pack terms not yet verified) | venv `/home/user/.venv-tts` (Python 3.12) | MEASURED |
| ASR / alignment | faster-whisper small.en + energy snapping to TTS line segments | `tools/align.py` | MEASURED |
| Captions | Phrase splitter (≤8 words, function-word rules) → JSON/SRT → DOM overlay with dark plate | `tools/captions.py`, `episodes/*/Episode.tsx` | MEASURED |
| Music/SFX | Procedural synthesis (numpy/scipy): piano, pads, strings, shimmer, bells, impacts, foley; convolution reverb; ducking | `audio-lib/score_snape_v31.py` (+ dsp/instruments/sfx_gen from upstream) | MEASURED |
| Export | ffmpeg 6.1.1: loudnorm 2-pass (-14 LUFS / -1.5 dBTP), mux H.264 CRF 18 + AAC 192k 48 kHz | shell commands in CLAUDE.md | MEASURED |
| QA | `check_episode.py` (gate), `short_qa.py` (per-frame + sheets), `stills.mjs`, `sbs_sheet.py` | `engine/scripts/` | MEASURED |
| Upstream reference engine | MIT 3D templates (three.js in Remotion): ink outline pass, lens blur, grade, sight-line culling, camera key system, 2D cards in 3D world | `engine-base/templates/bridge/` (read-only) | MEASURED (inspected, not run) |

## 2. Current capabilities (proven on Always v1 → v3.1)
**Story/canon:** Storytelling DNA + mandatory order in CLAUDE.md; canon claim table with labels; chronology JSON; QC verifies claims exist and chronology is ordered.
**Voice:** local TTS, per-line earned pauses (`{0.6}`), energy-based trimming, Whisper verification (every scripted word must be heard; caught 3 real defects in this project), word timings re-taken from audio, exact line boundaries from TTS segments.
**Captions:** phrase-level, balanced, no orphan/function-word breaks, non-breaking hyphens, dark plate for contrast on any background, gap smoothing, highlight words; QC proves 100 % word coverage and ±50 ms start sync.
**Characters (2D rig, `people.ts`):** 8 original designs; keyframed brows/eyelids/gaze/mouth, blinks, automatic gaze saccades, breathing, head tilt/nod, shoulder tension/slump, 5 hand shapes, tremble, walk cycle (bob, stride, arm swing, hem sway), kneel, rotation (lying/upside-down), costume overrides, per-character lighting + depth blur, props attached to hands.
**Camera (2.5D):** keyframed pan/zoom/roll with `glide` easing (never fully stops), per-layer parallax depth, foreground layers, rack focus (blur-level crossfade), dissolves.
**Environments:** 14 painted sets (corridor, home, playground, hall, sorting hall, lake, dark hall, hill, ruin, office, classroom, tower, shack, castle, wedding) + foreground layers; cached per tab.
**Audio:** cue sheets keyed to words; silence before reveals; ducking; music −19 dB / ambience −25 dB under speech; −14 LUFS, ≤ −1 dBTP.
**QC gate:** specs, duration, loudness/TP, payoff ≥ 4 s, caption completeness/sync/overlap, ASR, word energy, silent pauses, chronology/labels/claims, black frames, frozen frames (270×480), slow-hold list for review.

## 3. Missing capabilities (vs. the upgrade brief)
| Brief requirement | Status | Note |
|---|---|---|
| Reference-analysis pipeline (Phase 2) | **Missing** | Only contact sheets exist. No scene detection, camera-motion estimation, depth estimate, caption OCR, BPM, separation. **The reference video has still not been received.** |
| True 3D world / camera (orbit, crane, high/low angle, OTS with parallax-correct occlusion) | **Missing** | 2.5D layers can only fake these (scale/translate); no real perspective change. |
| Camera director with shot specs (start/end, look-at, purpose, composition, end frame) | **Partial** | Camera keys exist inline in code; no data schema, no purpose field, no move library, no "stillness budget". |
| Acting: sit/stand transitions, reach/grab/carry/drop, hesitation, contact with furniture, character-to-character contact | **Partial** | Arms are posed by angles, not by targets (no IK) → hands don't truly meet props/other people. Sitting is approximated with kneel + chair layer. No state machine / transitions. |
| Walking without foot sliding | **Missing** | Walk phase isn't tied to ground speed (sliding not measured — UNKNOWN amount). |
| Turning (profile/back continuity) | **Partial** | `facing` −1..1 is a 3/4 shift; no true profile; back view is a separate mode (pops). |
| Storyboard-first beat sheet (15 columns) + styleframes + approval gate | **Missing** | v3 had a "world line → visual" table only. |
| Music phrase alignment / BPM grid | **Missing** | Cues are keyed to words, not to musical bars. |
| Cinematography scorecard + final quality report (shots, ASL, camera/acting analysis) | **Missing** | Gate covers technical checks only. |
| QC for clipping, occlusion, intersections, safe zones, foot sliding | **Missing** | Only luminance/motion checks on pixels. |
| Narration target 190–205 WPM | **Conflict** | CLAUDE.md still locks 3.7 w/s (222 WPM); v3.1 measures 3.69 w/s inside lines, 3.28 overall (197 WPM incl. pauses). Needs one canonical definition. |
| Windows 11 / RX 590 portability | **Partial** | Linux-only defaults (browser path, venv path, `python3`), no chunk/resume script, no memory monitoring. |

## 4. Performance bottlenecks
| Item | Number | Label |
|---|---|---|
| Canvas engine, final 1080×1920, heaviest shot (8 characters) | ~0.1 s/frame after bundling (60 frames ≈ 7 s + ~15 s bundle), concurrency 3 | MEASURED (this container, CPU) |
| Canvas engine, full v3.1 episode (2,248 frames) | ≈ 5-8 min | ESTIMATED from the above |
| Three.js proof scene under **software** GL (swangle), 540×960 | 2.25 s/frame (180 frames in 6 m 45 s) | MEASURED |
| Same under ANGLE/D3D11 on RX 590 | substantially faster; not measurable here | UNKNOWN (must benchmark on the target PC) |
| Remotion bundling per render/still job | ~15 s | MEASURED |
| Layer cache: 55 unique painted layers in v3.1 × 1600×2440 RGBA (15.6 MB) | ≈ 860 MB per browser tab, ×3 tabs ≈ 2.6 GB | ESTIMATED (16 GB target is OK, but no eviction) |
| Per character: full-frame 1080×1920 scratch clear + gradient + composite (60 calls in v3.1) | dominant per-frame cost in crowded shots | ESTIMATED (consistent with the 8-character shot being the slowest) |
| Score synthesis (python, full-length FFT reverb) | 3-6 min per episode | MEASURED |
| Whisper small.en alignment, 75 s voice | ~1-2 min CPU | MEASURED (approx.) |
| Maintainability | 4 copied shot files (~1,700 lines), 4 copied score scripts, 4 copied Episode.tsx | MEASURED |

## 5. Files that must be preserved
- **Identity & rules:** `CLAUDE.md` (Storytelling DNA, opening order, objects, precision, QC rules), `docs/Between_the_Lies_Animation_Master_Engine.pdf`, `ENGINE_AUDIT.md`.
- **Renderer core:** `engine/src/btl/core.ts` (camera keys, glide, post grade, grain, particles), `people.ts` (character designs + rig), `envs.ts` (14 sets + fg layers), `kit.ts` (props, doe, hat, lights, grades), `CanvasFrame.tsx`.
- **Pipeline tools:** `engine/tools/{tts,align,captions}.py`, `engine/scripts/{check_episode.py,short_qa.py,stills.mjs,sbs_sheet.py}`, `engine/audio-lib/*`.
- **Reference episode:** `engine/src/episodes/snape31/*`, `story/episodes/snape-always/*` (canon timeline, chronology_v31.json, shot-plan-v3.md, narration files), `audio/voice/snape-always-v31/*`, `qa/snape-always-v31_QC.md`.
- **Locks:** `engine/package.json` + `package-lock.json` (pinned versions), `remotion.config.ts`.
- `engine-base/` stays untouched (upstream MIT reference; its `references/` folder stays unused).

## 6. Proposed upgrade plan (architecture + order)
Principle: **extend, don't replace.** Every step lands on `studio-upgrade`, keeps v3.1 rendering bit-for-bit (regression check against `v3.1-baseline`), and is proven with rendered frames before the next step.

### Target architecture
```
reference.mp4 ─► tools/refscan/ (Phase 2) ─► reference_report.json · _timeline.csv · _contact_sheet.jpg · _storyboard.md
story + canon ─► beats/<ep>.beats.json (Phase 5: 15-column beat sheet) ─► styleframes (4-6) ─► APPROVAL GATE
voice ─► words/lines/beat anchors (Phase 6) ─┐
                                            ├─► ShotSpec[] (Phase 3: camera director: move library + purpose + composition)
acting states (Phase 4) ────────────────────┘        │
                                                     ▼
                         renderer A: Canvas 2.5D (existing, fast)  |  renderer B: Three.js 3D set + same characters as
                                                                   |  canvas-texture cards (only if the 3D test proves necessary)
                                                     ▼
                         QC v2 (Phase 7: scorecard, safe zones, foot sliding, clipping) ─► final report (Phase 9)
```

### Implementation order
| # | Step | Deliverable / proof | Depends on |
|---|---|---|---|
| 0 | Portability + safety (no behavior change): auto-detect browser (fall back to Remotion's own Chrome on Windows), venv/python paths from `.env`, `preview` (720×1280 = `--scale 0.6667`) and chunked/resumable render scripts, layer-cache LRU cap, memory log | v3.1 frames re-rendered and pixel-diffed against baseline = identical | — |
| 1 | **Reference analyzer** `tools/refscan/`: ffprobe specs (MEASURED); shot boundaries via ffmpeg scene score + histogram diff (MEASURED with thresholds stated); contact sheets; camera motion per shot via optical-flow/phase correlation → pan/tilt/zoom/static + subject vs camera motion (ESTIMATED); depth bands from parallax magnitude (ESTIMATED); caption band detection + OCR if available (ESTIMATED/UNKNOWN); Whisper transcript + word timestamps; optional Demucs voice/music split; librosa BPM + onset events (ESTIMATED) | Validated first on our own `Always_v3.1.mp4` (where ground truth exists: we know every cut and word) → error rates reported. Then run on the reference once received. | 0 |
| 2 | **ShotSpec + camera director** (`src/director/`): typed spec (start/end pose, look-at target, duration, easing, purpose, subject motion, fg/mg/bg, end frame, transition) + move library (establishing drift, dolly in/out, lateral track, follow, OTS, reaction CU, object insert, focus transition, pull-back reveal; orbit/crane flagged as 3D-only) + a "motion budget" lint (no more than one strong movement at a time) | 3 v3.1 shots re-expressed as specs render identically; spec export feeds the scorecard | 0 |
| 3 | **Acting system** (`src/acting/`): state machine (idle, walk, stop, turn, sit, stand, reach, grab, carry, drop, hesitate, look-at, gesture) with blend times; 2-bone IK so hands reach real targets (props, shoulders, chair arms); foot planting tied to travel speed; prop attach/detach; contact points on furniture | Acting test strip (stills + 5 s clip) + foot-slide metric computed from the rig (MEASURED, not eyeballed) | 2 |
| 4 | **3D necessity test**: same 15 s ShotSpec rendered (a) 2.5D, (b) Three.js set with canvas-texture characters (reusing upstream ink/lens/grade passes) | Side-by-side contact sheet + render-time table (container MEASURED; RX 590 must be benchmarked by you — one command) → evidence-based decision whether to adopt renderer B per shot | 2, 3 |
| 5 | **Beat sheet + storyboard gate**: 15-column schema (`beats.json` + rendered `storyboard.md`), structure validator (8 sections, newcomer clarity checklist), 4-6 styleframes rendered from beats; production stops for approval | Beat sheet for the 15 s test, then for the next episode | 2 |
| 6 | **Narration/music sync**: beat anchors from words, phrase/bar grid for music, "fast passage → readable pause" planner, configurable WPM target (190-205 avg, per-scene) | Replaces fixed 3.7 w/s lock after your confirmation | 5 |
| 7 | **QC v2 + scorecard**: caption safe-zone geometry check, foot-slide, camera-clipping (3D), prop-intersection (bbox), identity lint (per-character design fields immutable), cinematography scorecard (ASL, move distribution, stillness ratio, CU/WS mix) | Scorecard on v3.1 as baseline numbers | 2-4 |
| 8 | **15 s test scene** (walk through a detailed town, follow cam, reaction CU, object interaction, environmental reveal) through the full gate | Styleframes → approval → animation test → contact sheet → scorecard → comparison report vs reference | 1-7 |
| 9 | Final quality report generator (per-episode, objective failures separated from creative notes) | Run on v3.1 first | 7 |

### Decisions needed from you
1. **Reference video:** still not received — Phase 2 can be built and validated on our own episode now, but the comparison needs the file.
2. **WPM definition:** 190-205 WPM *average including pauses* (v3.1 already measures ~197) or *inside sentences*? This replaces the 3.7 w/s lock.
3. **3D:** approve the evidence-based route in step 4 (no switch unless the side-by-side proves it), or mandate Three.js now.
4. **Target PC benchmark:** after step 0, one command on your Ryzen 5 5600G / RX 590 to measure real GPU render speed.
