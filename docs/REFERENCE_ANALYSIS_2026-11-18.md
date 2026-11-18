# Reference analysis — "The Pickpocket Who Gave Everything Back" & "What the Grave Bell Really Meant" vs Always v3.1
Tool: `engine/tools/refscan/refscan.py` (Phase 2). Per-video outputs (kept OUT of git — they contain frames of third-party
videos): `references_ext/<ref>/analysis/{reference_report.json, reference_timeline.csv, reference_contact_sheet.jpg, reference_storyboard.md, shots/, sheets/}`.
Labels: **M** = MEASURED · **E** = ESTIMATED (method stated, validated where possible) · **U** = UNKNOWN · **O** = OBSERVED (visual reading by the reviewer).

## 0. How far the measurements can be trusted (validated on our own v3.1, where every cut and word is known)
| Detector | Result vs ground truth | Verdict |
|---|---|---|
| Hard cuts (frame-to-frame) | 34/35 found, 8 extra (2 are real flash frames, rest from dissolve flags) — recall 97 %, precision 81 % | M — good for cut-style edits |
| Windowed cuts (frames i±3) | 32/35, 4 extra | E — robust to 2-6-frame smeared cuts |
| Dissolve flag | over-flags fast camera moves | E — weak |
| **Visual setups** (new composition by drift, no cut needed) | v3.1: 56 setups for 36 coded shots (dissolves/flashes/big moves count) | E — needed for fly-through styles |
| Word count (Whisper) | 233 vs 231 true | E ±1 % |
| WPM overall | 198 vs 197 true | E ±1 % |
| Caption position (OCR) | 0.706 vs 0.70 true | E — good |
| Caption changes / s (OCR) | over-counts when OCR jitters | E — use as relative only |
| Tempo / BPM | 179 BPM reported on a score with no steady pulse → now gated by a reliability check | E/U — unreliable on speech-heavy mixes |
| Voice/music separation | not available (no Demucs) | U |

## 1. Measured comparison
| Metric | Pickpocket | Grave Bell | **Always v3.1** | Label |
|---|---|---|---|---|
| Duration | 58.1 s | 59.6 s | 74.9 s | M |
| Resolution / fps | 720×1280 / 30 | 720×1280 / 30 | 1080×1920 / 30 | M |
| Hard cuts (shots) | 43 detected (≈36 after removing 0.2 s whip-blur fragments) | 15 | 43 (36 coded) | M/E |
| Average shot | 1.35 s (1.57 s excluding <0.4 s fragments) | 3.97 s | 1.74 s | M |
| **New composition every** | **0.74 s** | **0.56 s** | **1.34 s** | E |
| Edit style | hard cuts on words, whip-blur cuts | continuous fly-through camera (through windows, along walls) + dissolves into flashbacks | cuts + a few dissolves | O |
| Shots with camera motion | 100 % | 100 % | 86 % | E |
| Median zoom change per shot | ×1.10 (10 % push) | ×0.99 (moves laterally/through space) | ×1.02 | E |
| Median lateral travel per shot | 123 px (@720 w) | 85 px | 42 px (@1080 w ≈ 28 px @720) | E |
| Subject motion (residual flow, p90) | 16.2 px | 7.1 px | 6.0 px | E |
| Background focus (sharpest ÷ softest third) | 3.0 | 3.3 | **24.6** | E |
| Words | 177 | 220 | 233 | E (ASR) |
| WPM overall (incl. pauses) | 183 | 223 | 198 | E |
| WPM inside speech | 217 | 231 | 236 | E |
| Words per sentence (median) | 6.5 | 15.0 (run-on, conversational) | 8.0 | E |
| Pauses > 0.3 s | 24 (short, 0.3-0.5 s) | 6 | 24 | E |
| Picture after last word | 0.16 s | 0.37 s | 4.31 s | E |
| Caption words on screen | 1-2 | 1 | 5 (phrase) | E (OCR) |
| Caption height (text) | 0.025 H | 0.028 H | 0.023 H | E |
| Caption vertical position | 0.69 H | 0.69 H | 0.71 H | E |
| Integrated loudness | −16.8 LUFS | −14.0 LUFS | −14.3 LUFS | M |
| True peak | −0.4 dBTP | −1.9 dBTP | −1.4 dBTP | M |
| Bed level in speech gaps vs speech | −15 dB | −6.8 dB | −11.5 dB | E |

## 2. Observed production principles (O — read from shots/, sheets/; general techniques, not their content)
1. **Objects carry the exposition, often with legible text on them**: handwritten notes, a chalkboard counter, a headline,
   a certificate, labelled tags on keys. The picture adds information the narration doesn't say.
2. **Explanatory cutaways**: a cross-section of the ground showing the rope from a grave bell down to a coffin — the
   world rule is shown as a diagram-like image, not described.
3. **Time-passing devices**: the same object re-shot with a changing number (counter 100 → 200 → 300).
4. **Fully built 3D sets in focus**: streets, shop fronts, offices, interiors with dense props; depth comes from real
   perspective and light, not from blurring the background (our blur ratio is ~8× theirs).
5. **Camera never parks**: every setup pushes, pulls or travels; inserts (hands, coins, keys, notes) between character beats.
6. **Fly-through transitions** (Grave Bell): the camera pushes through a window into a room, slides along a wall to an object,
   dissolves into a flashback, exits through a window — location changes without a cut.
7. **Time-of-day lighting as structure**: dusk → night (cool blue) → warm interior lamp → sunrise payoff.
8. **One-word captions**, white with a dark outline, lower-middle, a few key words emphasised.
9. **Script shape**: paradox/mystery hook in the first sentence, "You see," pivot to the hidden mechanism, twist that
   re-reads an earlier object (spare keys; the practised bell signal), ending on the last word with no hold.
10. **Characters**: very simple, extremely readable expressions; acting is small but always tied to an object (mailing,
    holding a key, digging, sitting with a shovel).
**Not to copy**: their character design (white round heads, stick limbs), their caption typeface, their sets, scripts, shots.

## 3. What this means for our engine (gap list, ranked)
| # | Gap vs references | Cause in our engine | Fix (implementation step) |
|---|---|---|---|
| 1 | New composition every 1.34 s vs 0.56-0.74 s | shots planned per sentence | beat sheet plans 1 visual beat per 0.6-1.0 s (inserts, cutaways) — step 5 |
| 2 | Backgrounds blurred (24.6 vs ~3) — sets are hidden, not shown | 2.5D painted layers need blur to fake depth | real 3D sets with perspective — **step 4 test now strongly indicated** |
| 3 | No fly-through / through-window / along-wall camera | 2.5D layers can't move the camera through space | 3D camera director (dolly/track/crane/orbit through a set) — steps 2 + 4 |
| 4 | Camera travel ~4× smaller per shot | conservative glide moves | move library with travel targets (still with purpose and stillness budget) — step 2 |
| 5 | Few object inserts with legible text | props drawn as simple shapes | prop library: notes, boards, certificates, tags with real text rendering — step 3/4 |
| 6 | Subject motion ~1/3 of Pickpocket | characters mostly posed, few object actions | acting states: reach/grab/carry/mail/dig/drop with IK — step 3 |
| 7 | No explanatory cutaway shots | not in our shot vocabulary | add "cutaway diagram" shot type (cross-sections, maps) — step 2 |

## 4. Decisions only you can make (they conflict with locked channel rules)
| Topic | References | Our locked rule | Options |
|---|---|---|---|
| Captions | 1 word at a time | phrase captions on a plate | (a) keep phrases (b) switch to 1-2-word captions in **our own** style/typeface |
| Ending | cuts on the last word (0.2-0.4 s) | ≥ 4 s payoff hold after the last word | (a) keep 4 s (b) shorten to ~1-1.5 s |
| Pace | 183-223 WPM overall | 190-205 avg (your new target) | already inside the range — no change needed |
| Loudness | −14 to −17 LUFS | −14 LUFS | keep |
| Look | 3D, bright, detailed sets | 2.5D painted graphic drama | step 4 side-by-side decides, with our own character designs either way |
