---
name: between-the-lies-story-director
description: Run the BETWEEN THE LIES production pipeline. It makes 60-70 s vertical cinematic relationship-drama shorts about side characters, villains and original stories, built on the theme "bad people are not born, they are made". Use it when the user asks for a new BETWEEN THE LIES episode, a villain or side-character backstory short, a story dossier, a script for the channel, a shot plan, or a QC pass on an episode. The pipeline covers research, the source dossier, script, voice, shot plan, animation with the cartoon-3d-short engine, captions, sound and QC. Each stage has an approval gate.
---

# BETWEEN THE LIES: Story Director

A cinematic relationship-drama storytelling channel. Every episode investigates how love, rejection,
abandonment, betrayal, trauma, jealousy, sacrifice, obsession or regret **made** a person into who they became.

Animation engine: the `cartoon-3d-short` skill (repo `mromidev/claude-animated-shorts`, MIT). This skill
decides **what** to tell and **how it should feel**. The engine decides **how it is rendered**. Engine changes
this channel needs are listed in `references/engine_changes.md`.

## Hard rules
1. **Never copy** Ricks Clips (or any channel's) scripts, characters, shots or narrator voice. We only use the
   general mechanics in `references/production_mechanics.md`.
2. **Never present invented canon as fact.** Every story claim carries a tag in the dossier: `[CANON]`,
   `[INTERP]` (reasonable interpretation) or `[ORIGINAL]` (our addition). Narration may only state `[CANON]`
   as fact. `[INTERP]` must be voiced as interpretation ("maybe", "he never said it, but…"). `[ORIGINAL]` is
   only allowed in original stories, or when clearly framed as a theory.
3. **Original character designs.** We draw our own bean-head cards that hint at an archetype (cold blue suit,
   snow globe). We never trace official art, logos, costumes or panels. Names appear only as a final reveal
   line in the voice-over and captions. No logos and no official title cards.
4. **Captions ON.** This overrides the engine's default "no captions" rule (see `references/engine_changes.md`).
5. **No historical "You see," explainer formula.** We use the drama formula in `references/story_formula.md`.
6. English narration for a US audience. 60-70 s at ~4 words/s (3.7-4.2): 240-260 spoken words.
7. Nothing is rendered or generated until its gate is approved by the user.

## Pipeline and gates
Every episode lives in `episodes/<slug>/`. Create it with `tools/new_episode.sh <slug>`.

| # | Stage | Output (in `episodes/<slug>/`) | Gate |
|---|---|---|---|
| 1 | Brief | `00_brief.md` | — |
| 2 | Source research | `01_dossier.md` | — |
| 3 | Chronology | `02_timeline.md` | — |
| 4 | Relationship and motive map | `03_relationships.md` | **G1 Story approval** (dossier + timeline + wound + twist) |
| 5 | Script | `04_script.md`, then `tools/script_lint.py` passes | **G2 Script approval** |
| 6 | Voice and word timings | `05_voice/voice.wav`, `05_voice/words.json` (hand-fixed) | — |
| 7 | Cast and world bible | `06_cast.md` | — |
| 8 | Shot plan | `07_shotplan.md`, then engine `story.ts` + `shots.json` | **G3 Look approval** (stills at 0.5 scale) |
| 9 | Render, captions, sound | `09_render/` | — |
| 10 | Final QC | `08_qc/QC_REPORT.md` (all checks PASS) | **G4 Publish approval** |

### 1. Brief (`templates/00_brief.md`)
Subject, source medium, the one-line emotional question ("Why did a scientist choose ice over the world?"),
the theme from the list above, and the target viewer feeling at the last word.

### 2. Source research → dossier (`templates/01_dossier.md`)
1. Identify the original source and its **version**. Comic continuities, anime and manga differences, and
   film-versus-comic versions are separate canons. Pick ONE and name it.
2. Locate the exact issue, chapter, episode or film (title, number, year, creators).
3. Use primary sources first. Use secondary sources (official wikis, publisher pages, interviews) only to locate primary ones.
   Every fact line gets a citation. If a fact can't be located, mark it `[UNVERIFIED]`. It can't be used as fact.
4. Tag every claim `[CANON]` / `[INTERP]` / `[ORIGINAL]`.

### 3. Chronology (`templates/02_timeline.md`)
Every event with its source and an absolute or relative date. Ages, years elapsed and "how long since" must add
up. (Lesson from the "Old Walter" video: 9 years versus 30 years broke the story.)

### 4. Relationship and motive map (`templates/03_relationships.md`)
- Who loved whom, who rejected whom, what each person wanted, and what each one lost.
- **The wound:** the exact moment of hurt, in one sentence.
- **The turn:** the single event that changes the character. It must come after the wound.
- **The object:** one physical object that appears at least 3 times (introduce, charge, pay off).
- **The twist:** it must be supported by at least one planted fact earlier in the script. Write that plant down.

### 5. Script (`templates/04_script.md`, rules in `references/story_formula.md`)
Then run `python3 tools/script_lint.py episodes/<slug>/04_script.md`. It must report 0 FAIL before G2.

### 6. Voice
- Record the voice yourself or use a TTS voice the channel owns or licenses. Never clone or imitate an existing narrator.
- Make `words.json` with whisper word timestamps (`whisper-cli -ojf` or WhisperX), then hand-fix it.
- After the voice is locked, run `tools/script_lint.py --words words.json` to check pace and gaps.

### 7–8. Cast, world and shot plan
Fill `templates/06_cast.md` and `templates/07_shotplan.md`, using the camera grammar in
`references/camera_grammar.md`. Then implement it in the engine (`story.ts`: SHOTS, XFADE, CAMS, KICKS, DOF,
FOREGROUND). Every visual reaction lands 0-3 frames before its word. Render stills for G3.

### 9. Render, captions, sound
Camera rhythm first: `python3 engine/edit/camera_plan.py episodes/<slug>/07_shots.json episodes/<slug>/05_voice/words.json --every 1.0`,
then render `EpisodeCut` with `--props=episodes/<slug>/07_shots.json`.
Follow the engine pipeline, steps 9-10, plus the caption layer and the drama score in
`references/engine_changes.md`.

### 10. QC
Fill `templates/08_qc_report.md` and run `templates/scripts/short_qa.py` on the final mp4. Any FAIL blocks G4.

## Writing voice (what BETWEEN THE LIES sounds like)
- Close third person, present tense for the story and past tense for backstory flashes. One point of view per episode.
- Conversational and specific: objects, numbers, times of day, small physical actions.
- Dialogue as short quoted lines. At most 4 lines per episode.
- Never explain the feeling. Show the action and let the viewer feel it.
- End on the image or the reveal. **No moral sentence.** The last line lands the twist or names the person.
