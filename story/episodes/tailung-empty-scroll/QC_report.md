# QC gate — final.mp4

**RESULT: APPROVED**

| Result | Check | Detail |
|---|---|---|
| PASS | Video 1080x1920 @30 fps | 1080x1920 30/1, 2054 frames |
| PASS | Audio AAC 48 kHz stereo | aac 48000 2ch |
| PASS | Duration 45-75 s | 68.47 s |
| PASS | Integrated loudness -14 ±1 LUFS | -14.2 LUFS |
| PASS | True peak ≤ -1 dBTP | -1.3 dBTP |
| PASS | Final payoff ≥ 4 s after the last spoken word | last word ends 64.27 s, video ends 68.47 s → 4.19 s hold |
| PASS | Captions contain every narrated word, in order, nothing extra | 218 caption words / 218 narration words |
| PASS | Each caption starts with its first word (±50 ms) and stays up until its last word ends | 39 captions; off: [] |
| PASS | Captions never overlap |  |
| PASS | Last caption ends before the video ends | 64.87 s |
| PASS | Whisper hears every scripted word (independent ASR) | 218/218 heard; missing []; timing corrected max 0.291 s |
| PASS | Voice energy inside every word (≥ median − 24 dB) | median word level -27.5 dBFS; weak: [] |
| PASS | Planned dramatic pauses are silent in the voice track | 7 pauses; voiced: [] |
| INFO | Narration pace | 3.70 words/s inside lines; 3.40 overall incl. pauses |
| PASS | Chronology: narrated events in story order | 1 → 2 → 3 → 3 → 4 → 5 → 6 → 7 → 7 → 8 → 8 |
| PASS | Every narration line mapped to sourced claims | 16/16 lines |
| PASS | Every referenced claim exists in canon-timeline.md with label + locator | claims [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; missing [] |
| PASS | Every line carries a canon label | CANON, CANON (paraphrase), CANON (world rule), CANON (world), CANON + SUPPORTED INTERPRETATION, CANON + VISUAL EMBELLISHMENT, CHANNEL JUDGEMENT, SUPPORTED INTERPRETATION |
| PASS | Black frames only inside the planned final fade | black frames: [np.int64(2046), np.int64(2047), np.int64(2048), np.int64(2049), np.int64(2050), np.int64(2051), np.int64(2052), np.int64(2053)] (fade starts 2030) |
| PASS | Picture alive through the final word and 2 s beyond | luma 0.34 / 0.35 |
| PASS | No frozen span ≥ 12 frames (mean |Δ| < 0.0015 at 270x480) | longest near-static run: 4 frames |
| INFO | Slow holds (< 0.0025) for human review | 27.8-28.2s, 37.0-37.5s, 38.0-39.0s, 39.0-39.6s, 55.5-56.5s, 61.3-61.9s |
| PASS | Frame count matches duration | 2054 frames |
