# The BETWEEN THE LIES drama formula (60-70 s, 240-260 words at ~4 words/s)

Pace decision (2026-11-17, channel owner): narration at ~4 words/s (3.7-4.2), so scripts are 240-260 words.
Beat word budgets below scale by x1.35 from the original 185-word plan.

The engine's historical formula (hook → setting → "You see," explanation → rule) is NOT used here.

## Beat sheet (word budgets for a 185-word script)
| Beat | Time | Words | Job |
|---|---|---|---|
| 1. HOOK | 0-4 s | 10-16 | The shocking act or contradiction, stated as fact. Never "In this world…", "Once upon a time…", "Meet…" or "This is the story of…". |
| 2. THE LOVE | 4-14 s | 25-35 | Show the bond in ONE concrete moment, and introduce the object. |
| 3. THE CRACK | 14-24 s | 25-35 | Rejection, betrayal, loss or a threat to the bond. Stakes are clear. |
| 4. THE WOUND | 24-36 s | 30-40 | The exact moment of hurt. Plant the twist detail here or earlier. |
| 5. THE TURN | 36-48 s | 30-40 | What they do because of the wound. This is the transformation. The object returns, now charged. |
| 6. REVELATION | 48-58 s | 25-35 | The hidden truth that reframes beats 1-5. It must use a plant. |
| 7. PAYOFF | 58-66 s | 10-20 | Final image, object payoff, name reveal. Short sentences. End on the last word. |

## Rules
- **One POV** for the whole episode (whose eyes are we behind?).
- **The first sentence carries stakes.** Someone must stand to lose someone.
- **Escalation:** each beat raises the cost. Never two calm beats in a row.
- **Earned twist:** write the plant line number(s) in the script header. If removing the plant leaves the twist
  making no sense, the plant is correct. If the twist still works without it, it was never planted.
- **No moral sentence** ("And that's why we should…", "The lesson is…", "Love is…"). `script_lint.py` flags these.
- **No vague closing question** ("Love… or pride?"). End on an image or a name.
- **Identity reveal** at the end only when it adds a reframe ("The city calls him Mr. Freeze."). If the
  audience knows from frame 1, reveal it at the hook instead and spend the twist on the motive.
- **Canon honesty:** only `[CANON]` lines are stated as fact. `[INTERP]` lines get a softener ("maybe",
  "some fans believe", "he never said it, but"). Each script line carries its tag in the source column.
- Sentences of 6-16 words. Contractions. No jargon. One idea per sentence.
- Dialogue: max 4 quoted lines, each 8 words or fewer.
- Silence: mark `[beat]` (0.4-0.8 s) up to 2 times, before the revelation and/or before the last line.

## Core theme check (answer all four before G1)
1. What did they want to be loved for?
2. Who or what took it away?
3. What did they become so they would never feel that again?
4. What is the cost they pay at the end?
