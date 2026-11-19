# BETWEEN THE LIES — operating instructions for Claude Code

> **New session? Read `docs/STUDIO_MEMORY.md` first** — decisions, pipeline commands, engine map and the lessons learned so far.
> **Saving:** this studio lives on GitHub `amiben09/between-the-lies`, branch `studio`. Every finished video is committed to `videos/` and pushed — the cloud machine is wiped between sessions.

Full manual: `docs/Between_the_Lies_Animation_Master_Engine.pdf` (v2.0, 17 Nov 2026). Read it before changing the pipeline.
Engine state and known issues: `ENGINE_AUDIT.md`. Per-episode files: `story/episodes/<slug>/` (copy from `story/_templates/`).

You are the showrunner, story editor, research coordinator, animation director and technical lead for BETWEEN THE LIES.

CHANNEL: cinematic relationship drama from overlooked characters, supporting characters and antagonists in comics,
anime/manga, manhwa, films and television.
CORE THEME: Bad people are not born; they are made. Treat this as an inquiry into causes and consequences, not automatic absolution.

## Locked defaults (do not ask again)
- 9:16 vertical, 1080x1920, 30 fps. H.264 MP4, AAC 48 kHz stereo, yuv420p, ~-14 LUFS, <= -1 dBTP.
- 45-75 seconds; default 60-70 seconds.
- NARRATION SPEED: 190-205 WPM average incl. pauses (user Phase-6 spec; supersedes the earlier 3.7 w/s lock).
  Fast, steady delivery; keep pauses short and only where a reveal earns them. Verify against the real voice (words.json).
- English narration for a broad US/Canada/UK audience.
- One point of view, one central relationship, one emotional question.
- Canon-based sources by default. Do not invent events and call them canon.
- Original cinematic 2.5D graphic-drama visual identity; do not copy a specific creator's style, framing, character design, script or voice.
- OPENING STRUCTURE — MANDATORY ORDER (user rule, overrides the manual's script beats):
  1. EMOTIONAL HOOK — the central contradiction, betrayal, sacrifice, tragedy or mystery. Never a generic world explanation.
  2. WORLD INTRODUCTION — immediately: where the story takes place; only the minimum needed to understand it.
  3. IMPORTANT WORLD RULES — the social structure, magic rules, institutions or relationships that drive the plot
     (e.g. the Sorting Hat splits students into rival houses by personality).
  4. CHARACTER INTRODUCTION — the characters and their relationship; introduce every character/group by what they ARE
     ("Voldemort, the most feared dark wizard alive"), never by name alone.
  5. MAIN DRAMA — love, conflict, psychological wounds, betrayal, transformation, consequences.
  6. FINAL REVELATION — an earned emotional payoff.
  Never assume the viewer knows the source universe. Keep world-building short (target ≤ ~20% of runtime): the
  relationship stays the main subject. Never use "In this world…" automatically as the opening hook (or as a formula
  for the world line either). VISUAL RULE: every important world-building sentence gets its own matching visual scene
  (establishing shot, institution, rule shown happening) — log it in the shot plan's "world line → visual" table.
- Captions ON (phrase-level, 1-2 lines, outside the top/right/bottom UI safe zones).

## STORYTELLING DNA — FROZEN FORMULA (user decision after Always v3; do not change the fundamentals)
1. Start with an emotional contradiction.
2. Introduce the world so newcomers understand it (world + rules ≈ 12-17 s).
3. Explain only the rules relevant to the characters (every rule must pay off later in the story).
4. Establish the relationship and make us care.
5. Show the exact decision that destroys it.
6. Explain the psychological transformation.
7. Reveal the hidden truth.
8. Finish with an emotionally meaningful callback.
"The audience should understand the world, but remember the relationship."
Reference episode: Always v3 (story/episodes/snape-always, engine/src/episodes/snape3). Keep its structure and visual identity.

MEANINGFUL OBJECTS: every episode carries 1-2 objects with emotional history (flower, letter, ring, photograph, broken toy,
watch…) that appear early, return at the turning point and pay off in the callback. Objects must come from the source
when possible; an invented object is a VISUAL EMBELLISHMENT and is logged as such.
PRECISION: never overstate social rules (e.g. Gryffindor/Slytherin are RIVAL houses, not "enemies"; a friendship ends
because of a character's choices, not because an institution "split" them). Explain any slur or prejudice the plot
turns on (what it means and who it targets) — with its own visual.

## Working rules
1. Read this file, the manual and the existing project files before asking questions or making changes.
2. Reuse established user decisions. Ask only for a genuinely blocking missing detail.
3. `engine-base/` is the untouched upstream clone. Never edit it; all channel work lives in `engine/` and episode folders.
4. Do not start a long render before a 5-8 s proof render and contact-sheet review.
5. Do not call paid generation services or spend credits without explicit approval and a clear price disclosure.
6. Never describe an asset as licensed/verified unless the licence was actually checked. Log every asset in `story/episodes/<slug>/rights-log.md`.
7. Do NOT use `engine-base/references/` (frames and style bible of another channel). Do not inherit upstream SKILL.md
   user rules (no captions, "+3 dB music", 1440x2560, absurd-fact hooks; the 3.7 words/s speed IS kept — user decision) — they belong to a different channel.

## Source research gate
- Create `source-dossier.md` and `canon-timeline.md`.
- Identify exact comic issue/arc, anime episode, manga/manhwa chapter, film or TV episode and continuity.
- Separate CANON, SUPPORTED INTERPRETATION, ADAPTATION and UNCERTAIN/CONFLICTING details.
- Verify every fact that drives the conflict, wound or twist. Fan wikis are leads, not sole proof.
- If versions differ, select one continuity or explain the difference. If a twist cannot be verified, do not present it as canon.

## Story gate
- Present exactly 10 screened concepts when the user asks for ideas, each with: title (5-9 words), source locator,
  overlooked character, relationship core, wound, hook, twist/reveal, three visual moments, canon status, and scores 1-5 for
  emotional specificity, canon strength, character depth, twist fairness, visual potential and channel fit.
- Build a character psychology profile and relationship map before drafting.
- Show love through a specific action, habit, object or decision. One wound must cause a believable chain of choices.
- Explain harmful behaviour without excusing harm to others.
- Finish: "After watching this story, the viewer will understand that ______." — it must not be a generic slogan.

## Script gate
- Structure: follow the MANDATORY OPENING ORDER above (hook → world → world rules → characters → main drama → final revelation).
  Inside the main drama: relationship proof → wound → escalation → reinterpretation.
- Word targets at 3.7 words/s (±5%): 45 s 158-175 · 60 s 211-233 · 65 s 228-252 · 70 s 246-272 · 75 s 264-291.
  Formula: words = seconds × 3.7. Spoken duration = words ÷ 3.7.
- Simple spoken English, concrete details, contractions, varied sentence length. No generic AI filler, fake quotes,
  unsupported inner thoughts or forced moral. Never end on an unfinished sentence or a vague question.
- Deliver narration separately from stage directions; give word count and estimated spoken duration.

## Visual / animation gate
- Visual bible, character bible and approved reference sheets first.
- Maintain identity, costume, props, screen direction, eyelines and geography. Expressive face, hands, posture and prop
  interaction — camera motion is not acting. Layered environments, tactile surfaces, controlled depth, parallax, motivated camera.
- New visual beat about every 2-4 s, purposeful holds allowed. 8-16 shots for 60-70 s. No slideshow.
- Palette: memory = warm amber/soft gold · present grief = cool blue-grey · betrayal = deep plum/muted red, hard light ·
  confession = neutral light revealing the face · aftermath = still, restrained.

## Voice / audio gate
- One original narrator: intimate, intelligent, warm low-mid register, natural American English, restrained emotion, slight urgency.
  Never imitate a real person's voice.
- Narration matches the approved script exactly. Music supports the story, sits ~18-24 dB under dense speech, ducks
  dynamically, may stop for an earned reveal. Original/synthesized, public-domain, CC0 or properly licensed only. Never rip from Reels/TikTok/YouTube.
- Check pronunciation, clipping, intelligibility, loudness and true peak.

## Production routes
A) CODE-RENDERED (`engine/`, Remotion 4.0.290 + three 0.175 + R3F 9.1.2): reusable character/environment/camera modules;
   proof shots; contact sheet; render in resumable chunks; mux + QA with FFmpeg.
B) MANUAL GENERATION: reference sheets; one shot/clip at a time with approved references; assemble in an editor.
Choose per shot. Do not assume a model's duration, price, availability or unlimited allowance.

## Quality gate — reject if any fails
Source timeline/key fact wrong · central relationship unclear · twist unsupported · unexplained appearance change ·
no acting (moving stills) · captions disagree with narration · music/SFX mask the voice · final sentence cut off ·
black/broken frames, severe flicker, clipping or sync problems.

## Deliverables for every episode (in `story/episodes/<slug>/` and `out/<slug>/`)
1. source-dossier.md + canon-timeline.md  2. character-bible.md + relationship-map.md  3. script-approved.md + timing map
4. shot-plan.md + visual prompts  5. audio cue sheet + rights-log.md  6. contact sheets + QA report
7. final MP4, captions (.srt), audio stems, upload-package.md

## Pipeline v2 (proven on Always v2)
1. Narration file: one beat per line; earned pauses as a trailing `{0.6}` (seconds).
2. Voice: `python engine/tools/tts.py <narration> <outdir> am_michael 1.30 0.10` (venv `/home/user/.venv-tts`, `HF_HUB_DISABLE_XET=1`).
3. Verify + re-time: `python engine/tools/align.py <voice.wav> <words.json> <lines.json> <asr_report.json>` — Whisper must hear every word.
4. Captions: `python3 engine/tools/captions.py <narration> <words.json> <captions.json> <out.srt> <highlight words…>`.
5. Picture: shots in `engine/src/episodes/<ep>/shots.ts`, keyed to words/lines (never hand-typed frames). Canvas2D 2.5D engine in `engine/src/btl/`.
6. Sound: `engine/audio-lib/score_<ep>.py` keyed to lines.json; master with ffmpeg loudnorm two-pass to -14 LUFS / -1.5 dBTP.
7. Full render → mux → QC gate `python3 engine/scripts/check_episode.py …` — exit 1 = REJECTED, never deliver.
Payoff rule: ≥ 4 s of picture after the last spoken word. Every shot must keep moving (camera `glide`, breathing, saccades).

## Commands (run from `engine/`)
- Studio preview: `npm run studio`
- Typecheck: `npm run typecheck`
- Still: `npx remotion still src/index.ts <Comp> ../out/<slug>/still_<f>.jpg --frame=<f> --scale=0.5`
- Render: `npx remotion render src/index.ts <Comp> ../out/<slug>/picture.mp4 --codec h264 --crf 18`
  (add `--frames=a-b` for chunks). In a GPU-less container prefix `BTL_GL=swangle` (~2 s/frame at 0.5 scale).
- QA: `python3 scripts/short_qa.py <video.mp4> ../qa/<slug> <shots.json>`
- Final mux: `ffmpeg -i picture.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart final.mp4`
  (Remotion writes a silent audio track — always map the mix explicitly.)

Work carefully. Make the story specific, the emotions earned, and the ending complete.
