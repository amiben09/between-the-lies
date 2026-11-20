# QC gate — final.mp4

**RESULT: APPROVED**

| Result | Check | Detail |
|---|---|---|
| PASS | Video 1080x1920 @30 fps | 1080x1920 30/1, 2209 frames |
| PASS | Audio AAC 48 kHz stereo | aac 48000 2ch |
| PASS | Duration 45-75 s | 73.63 s |
| PASS | Integrated loudness -14 ±1 LUFS | -14.2 LUFS |
| PASS | True peak ≤ -1 dBTP | -1.2 dBTP |
| PASS | Final payoff ≥ 4 s after the last spoken word | last word ends 69.43 s, video ends 73.63 s → 4.20 s hold |
| PASS | Captions contain every narrated word, in order, nothing extra | 234 caption words / 234 narration words |
| PASS | Each caption starts with its first word (±50 ms) and stays up until its last word ends | 46 captions; off: [] |
| PASS | Captions never overlap |  |
| PASS | Last caption ends before the video ends | 70.03 s |
| PASS | Whisper hears every scripted word (independent ASR) | 234/234 heard; missing []; timing corrected max 0.36 s |
| PASS | Voice energy inside every word (≥ median − 24 dB) | median word level -27.8 dBFS; weak: [] |
| PASS | Planned dramatic pauses are silent in the voice track | 7 pauses; voiced: [] |
| INFO | Narration pace | 3.68 words/s inside lines; 3.38 overall incl. pauses |
| PASS | Chronology: narrated events in story order | 8 → 8 → 8 → 9 → 9 → 9 → 9 → 9 → 12 → 18 → 18 |
| PASS | Every narration line mapped to sourced claims | 16/16 lines |
| PASS | Every referenced claim exists in canon-timeline.md with label + locator | claims [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; missing [] |
| PASS | Every line carries a canon label | CANON, CANON (world), CANON + SUPPORTED INTERPRETATION, CHANNEL JUDGEMENT |
| PASS | Black frames only inside the planned final fade | black frames: [np.int64(2194), np.int64(2195), np.int64(2196), np.int64(2197), np.int64(2198), np.int64(2199), np.int64(2200), np.int64(2201), np.int64(2202), np.int64(2203), np.int64(2204), np.int64(2205)]… (fade starts 2185) |
| PASS | Picture alive through the final word and 2 s beyond | luma 0.17 / 0.08 |
| PASS | No frozen span ≥ 12 frames (mean |Δ| < 0.0015 at 270x480) | longest near-static run: 9 frames |
| INFO | Slow holds (< 0.0025) for human review | 2.5-4.1s, 18.7-19.5s, 20.5-21.3s, 23.0-23.4s, 38.2-38.7s, 48.9-49.6s, 49.7-50.2s, 51.4-53.2s, 57.7-58.2s, 72.3-72.8s |
| PASS | Frame count matches duration | 2209 frames |
