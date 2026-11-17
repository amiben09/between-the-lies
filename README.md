# Between the Lies — production project
Start here: `CLAUDE.md` (operating rules) → `ENGINE_AUDIT.md` (engine state, gaps) → `docs/` (full manual).

```
CLAUDE.md            operating prompt for Claude Code (manual §18 + project specifics)
ENGINE_AUDIT.md      preflight audit of the engine
docs/                the master engine PDF
engine-base/         untouched upstream clone (mromidev/claude-animated-shorts) — read-only reference
engine/              channel Remotion project (src/, scripts/, audio-lib/)
source/              shared research notes
story/_templates/    copy to story/episodes/<slug>/ for each episode
assets/              character-refs/, environments/, props/
audio/               voice/, music/, sfx/, stems/
work/                timing/, frames/
stills/ captions/ qa/ out/
```
New episode: `cp -r story/_templates story/episodes/<slug>`.
