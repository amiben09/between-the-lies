# QC report: <TITLE>   (each line PASS / FAIL + evidence)
## Story
- [ ] Every narrated fact is [CANON] with a citation; [INTERP] lines are softened in the voice-over
- [ ] Timeline arithmetic checked (02_timeline.md)
- [ ] Twist plant present at L__ and the twist breaks without it
- [ ] No moral sentence, no vague closing question, the last line is the payoff
- [ ] tools/script_lint.py: 0 FAIL
## Character and picture
- [ ] Each character's outfit, colours and build are identical in every shot (contact sheet checked)
- [ ] Every scene matches its narration line (shot plan vs render, line by line)
- [ ] The object appears >= 3 times
- [ ] No official art, logos or traced designs
## Timing and audio
- [ ] Speech pace 2.8-3.3 words/s; total 60-70 s; voice starts <= 0.15 s
- [ ] Captions within ±2 f of words.json; no caption over the UI-safe zones
- [ ] -14 LUFS ±1, true peak <= -1 dBTP, the voice is clear over the music (no masking on the key words)
- [ ] short_qa.py: no black, white, frozen or pop frames outside planned ones
## Verdict
