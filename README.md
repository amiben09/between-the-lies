# BETWEEN THE LIES: production system (v0.1, awaiting approval)

Cinematic relationship-drama shorts: "Bad people are not born. They are made."
Animation engine: `../` (mromidev/claude-animated-shorts, MIT). Nothing has been rendered or generated yet.

## Folder structure
```
between-the-lies/
├── SKILL.md                         # between-the-lies-story-director: the pipeline, rules and 4 approval gates
├── references/
│   ├── production_mechanics.md      # general mechanics measured from the reference shorts (no copied content)
│   ├── story_formula.md             # 7-beat drama formula, word budgets, twist and canon rules
│   ├── camera_grammar.md            # camera, lens and light per beat, transitions, sync rules, drama expressions
│   └── engine_changes.md            # what the engine needs: captions, night/interior light, drama score…
├── templates/                       # copied into every new episode
│   ├── 00_brief.md  01_dossier.md  02_timeline.md  03_relationships.md
│   ├── 04_script.md  06_cast.md  07_shotplan.md  08_qc_report.md
├── tools/
│   ├── new_episode.sh               # scaffold episodes/<slug>/
│   ├── script_lint.py               # automatic script + voice-timing checks (exit 1 on FAIL)
│   └── tests/                       # bad_walter.md (fails), good_freeze.md (passes)
└── episodes/<slug>/                 # one folder per episode
    ├── 00_brief.md … 07_shotplan.md
    ├── 05_voice/ (voice.wav, words.json)
    ├── 08_qc/QC_REPORT.md
    └── 09_render/
```

## Gates
G1 Story (dossier + timeline + wound + twist) → G2 Script (lint 0 FAIL) → G3 Look (stills) → G4 Publish (QC all PASS).

## Install as a Claude Code skill
Copy this folder to `~/.claude/skills/between-the-lies-story-director/`, and the engine to
`~/.claude/skills/cartoon-3d-short/`.

## Usage
```bash
tools/new_episode.sh mr-freeze-heart-of-ice
python3 tools/script_lint.py episodes/mr-freeze-heart-of-ice/04_script.md
python3 tools/script_lint.py episodes/mr-freeze-heart-of-ice/04_script.md --words episodes/mr-freeze-heart-of-ice/05_voice/words.json
```
