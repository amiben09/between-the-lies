# "Next Time" (Itachi Uchiha) — storyboard package for approval
Status: **STOPPED FOR APPROVAL** (studio rule: no full animation before the storyboard is approved).

| Deliverable | File | State |
|---|---|---|
| Source dossier (19 claims, labels, locators) | source-dossier.md | ✅ (1 locator to confirm in print: childhood "next time" line — narration paraphrases) |
| Script (231 words) | narration.txt (+ lexicon.json pronunciations) | ✅ |
| Voiceover | audio/voice/itachi-next-time/voice.wav | ✅ Whisper heard 231/231 words; names fixed with a phoneme lexicon |
| Pace | — | 205 WPM overall · 225 inside lines · 71.8 s with a 4.2 s payoff hold |
| Beat sheet (33 beats, 15 columns + purpose + renderer) | beats.json, storyboard.md | ✅ structure PASS (8 sections in order, every world line has its own scene) |
| Character references | character_refs.jpg | ✅ original designs; headband = recurring object (plain → slashed) |
| Styleframes (6) | styleframes.jpg | ✅ beats 1, 4, 10, 14, 21, 29 |

Structure timing: hook 0-5.7 · world 6.1-10.7 · rules 10.9-21.5 (world-building 15.5 s = 21.6 %) · relationship 21.6-30.2 ·
conflict 30.5-44.5 · transformation 44.6-54.2 · revelation 54.8-65 · payoff 65-71.8.
Recurring objects: the forehead poke (beats 14 → 29 → 33, same framing), the headband (plain → slashed), lanterns (lit → going out).
Renderer split: 24 beats 3D sets (camera through space), 9 beats 2.5D close-ups (faces, the poke).

## Open decisions (yours)
1. Captions: phrase captions on a plate (current) or 1-2 words at a time?
2. Ending hold: 4.2 s (current) or shorter?
3. Render estimate in this CPU-only container: ≈ 2-2.5 h for the full episode at 1080×1920 (3D beats ~4-5 s/frame under software GL). On your RX 590: unknown until benchmarked.
