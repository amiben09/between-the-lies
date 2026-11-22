# Review: "Code-Driven Animation with Claude Code Beats Prompt-Only Video" (user-supplied guide, 22 Nov 2026)
Guide claims (benchmarks, star counts, video dates) were NOT independently verified — treat them as leads.
Verdict: the guide's pipeline is the one this studio already runs. Adopt the motion-grammar rules that are missing;
do NOT copy its generic CLAUDE.md (16:9/24 fps options, "Delete qa_frames", generic noir palette) — our locked
defaults win (9:16, 30 fps, CLAUDE.md storytelling DNA, mood palettes).

## Already in place (no action)
| Guide recommendation | Studio equivalent |
|---|---|
| Voice first, word timestamps drive picture | tts.py → align.py (Whisper hears every word) → shots keyed to words/lines.json |
| -14 LUFS loudness | loudnorm two-pass, QC gate checks -14 ±1 LUFS / ≤ -1 dBTP |
| Chunked renders to avoid OOM | render_chunks.sh / render_beats.py (120-frame resumable chunks) |
| Storyboard approval before code | storyboard-first rule: beat sheet + 4-6 styleframes → approval |
| Five-layer stack, grain + vignette | `post()` grade/grain/particles in btl/core.ts; Stage tint/vignette/blur in 3D |
| Idle life / never-static stills | `glide` cameras, breathing, saccades, blinks; QC fails frozen spans ≥ 12 frames |
| No linear motion | `smooth` (quintic) / `glide` / `ramp` easing; no bare `interpolate` in jinx/itachi |
| Frame QA before shipping | proof render + contact sheet; check_episode.py (exit 1 = rejected); short_qa.py |
| Custom characters instead of described ones | own 2D rig (people.ts, IK `reachArm`), character refs/styleframes per episode |
| One idea per 3-6 s | ours is stricter: new visual beat every 2-4 s |

## Gaps worth adopting (added to CLAUDE.md → "Motion grammar")
1. **Multi-property entrances** — overlays/captions/inserts animate 2-3 properties (opacity + travel + scale 0.94→1 or blur→sharp).
   Current caption plate does opacity + 8 px Y only.
2. **Stagger** sibling elements 3-6 frames (e.g. evidence/object insert + its label).
3. **Exits ~30-40 % faster than entrances**; hard cuts only on a story/music hit.
4. **FPS-derived timing** in new code: `Math.round(sec * FPS)` instead of magic frame counts (FPS is already exported by core.ts).
5. **One look file per episode**: palette/light/type constants in one module (kit.ts `L_*` lights and `G` already do this
   for Snape; Jinx/Itachi caption styles are inline) — new episodes put hex values in `<ep>/look.ts`.
6. **Targeted frame inspection**: besides the contact sheet, look at 5-8 chosen frames per 60 s (hook, peak action, densest
   caption, mid-transition, final payoff) at full size, not only thumbnails.

## Considered and not adopted
- Switching engine to HyperFrames/Manim: no reason — Remotion + three is proven over 5 episodes. Manim could serve a
  one-off diagram insert if ever needed.
- Rhubarb lip sync: narrator is off-screen; characters rarely speak on camera. Revisit if a character delivers dialogue.
- OpenCV tracing of generated character sheets: our rig is code-native and would need paid image generation for
  references (needs user approval + price). Possible future upgrade for likeness, not a current gap.
- Public "2D/3D plugin" zips: style saturation risk the guide itself names; conflicts with our original visual identity.
