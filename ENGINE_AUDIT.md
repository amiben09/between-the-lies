# ENGINE_AUDIT — preflight (17 Nov 2026)

## Upstream engine (`engine-base/`, untouched)
- Repo: github.com/mromidev/claude-animated-shorts @ e3b817b6 (single commit cloned, depth 1).
- Licence: MIT for code/docs. `references/` frames are "for style study only" and come from another creator's channel.
- **It is not a runnable project.** It contains source templates of one finished short ("The Bridge That Fell for a Song")
  plus a Claude skill (SKILL.md). No package.json, no Remotion root, no `public/` assets.
- **Stack is Remotion, not "Three.js + Playwright"** as the manual says: three.js runs inside Remotion via @remotion/three;
  Remotion drives its own headless Chromium. Playwright is not needed for rendering.
- Missing assets: `build.ts` loads Kenney CC0 GLB props from `public/` — not included (download from kenney.nl if reused).
- Windows-only path hard-coded in `templates/scripts/bridge-stills.mjs` (Chrome at C:/Program Files/...).

## Conflicts with the Between the Lies manual (do NOT inherit)
| Upstream SKILL.md / STYLE_BIBLE | Between the Lies |
|---|---|
| Bean-head cartoon cards, saturated storybook town, black world ink | Cinematic 2.5D graphic drama, expressive faces/hands |
| Absurd-fact hook, "You see," pivot, deadpan jokes, 3.7 words/s | Emotional-contradiction hook, 175-190 WPM with pauses |
| No captions | Phrase-level captions |
| Music +3 dB / bed ~5-10 dB under voice | Music ~18-24 dB under dense speech, dynamic ducking |
| 2K export 1440x2560 | 1080x1920 |
| Look matched against a private reference channel | Original look; do not imitate any channel (manual §1, §6) |
→ `engine-base/references/` must not be used for this channel.

## What is reusable
- Render plumbing: Remotion + R3F composition pattern, post-processing chain idea (ink → lens blur → bloom → tone map → grade).
- `templates/scripts/short_qa.py` → copied to `engine/scripts/` (frame-by-frame black/white/frozen/pop + loudness + contact sheets). ✅ tested.
- `templates/scripts/sbs_sheet.py` → copied (side-by-side comparison sheets).
- `templates/audio/{dsp,instruments,sfx_gen}.py` → copied to `engine/audio-lib/` (synthesized, rights-clean SFX/music building blocks).
  Not yet adapted: `mix.py`/`timeline.py`/`music.py` are hard-wired to the bridge short (timings, march score, -15 LUFS target).
- `templates/bridge/*.ts` — reference code only (shaders, painted Canvas2D textures, camera keys). Port pieces when needed; do not copy the look.

## Channel engine (`engine/`) — set up and verified
- Node v22.23.4 · npm lockfile committed · versions pinned exactly to the upstream-tested set:
  remotion / @remotion/{cli,bundler,renderer,three} 4.0.290, three 0.175.0, @react-three/fiber 9.1.2,
  @react-three/postprocessing 3.0.4, postprocessing 6.37.2, react 19.1.0, typescript 5.8.3.
- Python 3 + numpy 2.5.3 + scipy 1.18.1 + Pillow 12.3.0. FFmpeg 6.1.1.
- Browser: `remotion.config.ts` uses `/opt/pw-browsers/...` in this cloud container; override with `BTL_BROWSER` elsewhere.
- GL: default `angle` (GPU). This container has no GPU → `BTL_GL=swangle` (software; ~2.2 s/frame at 540x960).
- **Proof scene** `ProofScene` (6 s, original placeholder art — not episode content) rendered:
  `out/proof/proof_preview.mp4` (540x960 preview). QA (`qa/proof/report.md`): 180 frames, no black / white / frozen / pop
  frames, continuous motion. Audio is a silent placeholder track, as expected.
- Gotcha found: `makeDefault` on `<perspectiveCamera>` is a drei prop and silently does nothing in plain R3F —
  drive the default camera via `useThree` (see `CameraRig` in `src/proof/ProofScene.tsx`).

## Licences to note
- Remotion: free for individuals and for-profit companies with up to 3 employees; larger orgs need a company licence
  (see `engine/node_modules/remotion/LICENSE.md`).
- three.js / R3F / postprocessing: MIT.

## Open gaps before episode 1
1. **Narrator voice**: no TTS/voice path in either the manual or upstream. Decide: record yourself, or a TTS service
   (requires approval + cost disclosure + a voice you have rights to).
2. **Timing**: the manual's `timing.py` does not exist. Need forced alignment (e.g. WhisperX / whisper word timestamps)
   → `work/timing/words.json`, hand-corrected.
3. **Captions**: no caption renderer yet (Remotion component driven by words.json + .srt export).
4. **Audio mix**: adapt upstream `mix.py` to channel targets (-14 LUFS, ≤-1 dBTP, music 18-24 dB under speech).
5. **Character rig**: the proof card is a placeholder. Real characters need the cinematic 2.5D design system
   (layered face parts for expressions, hands, blink/breath, walk) — build from the approved character bible.
6. Full-res 1080x1920 renders on CPU will be ~4-5 s/frame (~2.5 h per 65 s episode); a GPU machine is much faster.
