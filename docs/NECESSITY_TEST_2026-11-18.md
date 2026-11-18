# Step 4 — 3D necessity test (same shot spec, two renderers)
Spec: `engine/src/tests/streetSpec.ts` — 6 s, 720×1280 preview: FOLLOW her down a dusk street → OVER-THE-SHOULDER as she stops
at a lit window → PUSH THROUGH THE WINDOW into the room → OBJECT INSERT on the handwritten letter.
Renderers: **3D** = `tests/Street3D.tsx` (Three.js set, toon shading + ink outlines, our 2D characters as camera-facing cards) ·
**2.5D** = `tests/Street25D.tsx` (existing canvas engine, painted one-point perspective, layer zoom/pan, crossfade into a painted room).
Clips: `out/test3d/test3d.mp4`, `out/test25d/test25d.mp4`; side-by-side: `docs/necessity_test_side_by_side.jpg`;
raw numbers: `docs/necessity_test_metrics.json`, `docs/parallax_comparison.json`. Labels: M measured · E estimated · O observed · U unknown.

## 1. Objective measurements
| Metric | 3D | 2.5D | References (Pickpocket / Grave Bell) | Label |
|---|---|---|---|---|
| Frames with strong parallax (residual > 1.5 px @720 after removing one global 2D transform) | **64.7 %** | **2.2 %** | 34.0 % / 56.8 % | E (LK flow + similarity fit; method validated as consistent across all 5 clips) |
| Parallax residual, 90th percentile | 4.76 px | 0.65 px | 10.9 / 9.0 px | E |
| Perspective change (homography gain over similarity) | 0.23 | 0.013 | 0.04 / 0.12 | E |
| "Through window" beat: parallax / perspective | **16.1 px / 4.6** | **0.18 px / 0.0** (crossfade, no spatial move) | — | E |
| Background sharpness ratio (sharpest ÷ softest third), follow beat | 4.0 | 8.6 | 3.0 / 3.3 | E |
| Render time per frame, this container (CPU, no GPU, software GL) | **2.2 s** (402 s / 180 f) | **0.05 s** (24 s / 180 f incl. bundling) | — | M |
| Projected full 75 s episode, this container, 1080×1920 | ≈ 3 h (pixels ×2.25) | ≈ 3-6 min | — | E |
| Same on Ryzen 5 5600G + RX 590 (ANGLE/D3D11) | ? | ? | — | **U — needs your benchmark (§4)** |

## 2. Cinematography scorecard (1-5; O = reviewer reading of the rendered frames, not a measurement)
| Criterion | 3D | 2.5D | Note |
|---|---|---|---|
| Spatial readability of the street (depth, where she is) | 4 | 3 | 2.5D painting reads well as a still — honest finding |
| Camera movement with purpose (follow / OTS / through) | 4 | 2 | 2.5D "follow" = zoom on a fixed painting; OTS is a pan |
| Location change without a cut (through-window) | 4 | 1 | 2.5D must crossfade to a different painting |
| Object insert legibility (the letter) | 4 | 4 | both legible; 3D has true perspective on the table |
| Character quality | 2 | 2.5 | same 2D rig; as a 3D card her back view is flat/large, arms read as tubes; foot contact OK |
| Set richness / prop density vs references | 2.5 | 2 | both below the references (they have dense dressed sets) |
| Text on surfaces (signs) | 4 | 2 | 2.5D painted text doesn't follow perspective (had to cap a giant "BA" sign) |
| Render cost | 2 | 5 | 44× slower here; GPU number unknown |
| **Total (of 40)** | **26.5** | **21.5** | |

## 3. Visual glitches found in the rendered test (to fix before any production use)
3D: character card is a flat 2D back-view (no turn possible); 0.2-s dark frame-edge as the camera crosses the window frame (f≈140);
facade textures plain (stripes) — far from reference density; tablecloth texture slightly aliased at grazing angles.
2.5D: walker shrinks without parallax against the facades; room entry is a crossfade (no geometry); sign text not in perspective.

## 4. Benchmark on your PC (Ryzen 5 5600G · RX 590 · Windows 11) — one command
After pulling the `studio-upgrade` branch (the project must be pushed to GitHub first):
```
cd BetweenTheLies\engine
npm ci
powershell -Command "Measure-Command { npx remotion render src/index.ts Test3D ..\out\test3d_pc.mp4 --gl=angle --concurrency 3 }"
```
Send me the TotalSeconds. Rule of thumb for the decision: ≤ 0.5 s/frame (≤ 90 s total) → full 3D episodes are practical on your PC.

## 5. Recommendation
**Adopt 3D for sets and camera** (evidence: parallax 65 % vs 2 %, true through-space moves, in-focus sets like the references),
**keep the 2D character rig as camera-facing cards for now** (identity + facial acting already proven), and keep the
2.5D canvas engine for cutaways, inserts and stylised flashbacks where it is 44× cheaper. Final call on full-3D
episodes waits for the RX 590 benchmark. Next implementation steps (from the audit): step 2 camera director
(shot specs + move library driving the 3D camera), step 3 acting system (turning cards → 8-direction character views,
IK reach/grab, planted feet), then set dressing to reach reference prop density.
