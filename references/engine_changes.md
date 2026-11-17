# Engine changes BETWEEN THE LIES needs (cartoon-3d-short → drama)

Status: DESIGN ONLY. Nothing is implemented until the system is approved.

## Prerequisites the repo does NOT include
- A Remotion 4 project with `@remotion/three`, three, `@react-three/fiber` and `@react-three/postprocessing`
  (versions are listed in `references/reports/CONTEXT.md`).
- The Kenney CC0 asset kits under `public/` (~1.3 GB), which `build.ts` loads.
- A voice source (see SKILL.md step 6) and whisper word timings.
- Render time: 2K renders run at ~4 fps (~10 min per 67 s) on a desktop GPU. Much slower on a CPU-only cloud box.

## Changes, ranked
| # | Change | Files | Why |
|---|---|---|---|
| 1 | **Caption layer:** 1-2 words from words.json, white bold sans with a dark outline, centred at 68 % height, hard swap per word, 1 accent-coloured key word per sentence, safe from UI overlays (bottom 18 % and right 12 % stay clear) | new `Captions.tsx`, read in `Bridge.tsx` | The channel rule is captions ON |
| 2 | **Generalise story.ts:** remove the bridge physics (`amp`, `stomp`, `deckY`…) and keep SHOTS / XFADE / CAMS / KICKS / DOF / FOREGROUND as a reusable timeline | `story.ts` → `timeline.ts` + per-episode `story.ts` | Reusable across episodes |
| 3 | **Light presets:** `night`, `rain_night`, `candle_interior`, `dawn`, `flashback` (warm, -25 % saturation) | `lights.ts`, `grade.ts`, `world.ts` | Drama lives at night and indoors. Only day/golden exist now. |
| 4 | **Drama expressions + body poses** (camera_grammar.md list), plus tears and breath fx cards | `toon.ts`, `cast.ts` | The comedy face set can't carry grief |
| 5 | **Interior kit:** rooms, windows with rain, tables, beds, doors, labs, rooftops | `build.ts`, `paint.ts` | The current world is a town and a bridge |
| 6 | **Drama score:** piano, strings and pads in minor keys, swells on beats 4 and 6, drop to silence on `[beat]` | `music.py`, `instruments.py` | The march score is comedic |
| 7 | **Drama SFX:** rain, heartbeat, clock tick, breath, door, glass, distant city | `sfx_gen.py`, `sfx.py` | |
| 8 | **Caption QC:** check that each caption's on-time is within ±2 frames of its words.json start | `short_qa.py` (extend) | QC requirement |
| 9 | Remove the rules "No captions", "Jokes are researched facts" and the historical beat formula from the copied SKILL.md | engine SKILL.md (our fork) | They conflict with this channel |

## Mix standard (keep the engine's, adjusted)
Voice unchanged, music +3 dB → **0 dB** (drama scores sit lower), SFX -6 dB, -14 LUFS integrated, true peak ≤ -1 dBTP.
