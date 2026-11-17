# Camera grammar for relationship drama (adapted from the engine's measured grammar)

## Channel rule (2026-11-17): reference-channel rhythm, ALWAYS
Run `engine/edit/camera_plan.py 07_shots.json words.json --every 1.0` before every render. It gives:
- a **new framing every ~1.3 s**, landing 1 frame before a word (clause starts and *accent* words first);
- **ease-out bursts**: fastest on the first frame, settled in 9 frames; holds keep **creeping in** (0.25 %/f, 0.6 %/f on punches);
- **punch-in** on accent words; framing cycles wide → medium → close;
- **whip pans** with motion blur between shots (6 f out + 6 f in, alternating direction), hard cuts only where marked;
- a **4-frame white flash** after the hook.
Slow drifts and soft crossfades (editor v1) are retired.

Engine baseline (keep these): smootherstep glides of 18-40 f, every hold creeps 0.15-0.35 %/f,
impact kicks that flip sign each frame and decay over 7 f, foreground props in about 1/3 of shots, DOF focused on the eyes.

## Drama adaptations
| Story beat | Camera | Lens / DOF (cInf px @1080) | Light state |
|---|---|---|---|
| HOOK | Slow push-in on the act or object, low angle | 14-16 (object sharp) | Night / cold |
| THE LOVE | Gentle side track, two characters in one frame, warm foreground (curtain, table edge) | 10-12 | Warm interior (candle / golden) |
| THE CRACK | Camera drifts BETWEEN the two characters, which creates distance in frame | 10-12 | Mixed: warm + cold window light |
| THE WOUND | Hold on the reaction close-up, push 0.6 %/f on the key word, 3-4° dutch roll | 12-14 | Cold / single source |
| THE TURN | Follow-the-object travel to the new world (a match cut through the object) | 7-10 | New colour state |
| REVELATION | Pull back to reframe (show what the viewer missed) | 0-5 (all sharp: "truth") | Neutral / dawn |
| PAYOFF | Slow push to the object, end on a still-creeping frame | 14-16 | Final state (sunrise or blackout) |

## Transitions (in order of preference)
1. **Object travel:** the camera follows the recurring object from one scene to the next.
2. **Gaze travel:** a character looks, and the camera travels along the eyeline.
3. **Window / door fly-through** into a new place or time.
4. **6-8 f crossfade** for time jumps (flashbacks get a +warm, -saturation grade).
5. **Hard cut:** only for shock (max 3 per episode), always on a word.

## Sync rules
- A visual reaction lands 0-3 frames BEFORE its word in words.json.
- A camera move starts on the stressed syllable of the clause's key word.
- During `[beat]` silences, nothing moves except the creep and one small action (a blink, a candle flicker).

## Characters (drama additions to the engine's expression set)
Needed expressions: `grief`, `tears`, `restrained_anger`, `longing`, `cold`, `forced_smile`, `hollow`, `pleading`.
Body language: shoulders drop 4-8 % on grief, hands to the chest on longing, turn away from the camera on rejection.
