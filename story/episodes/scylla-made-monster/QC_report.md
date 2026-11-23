# QC gate — final.mp4

**RESULT: APPROVED**

| Result | Check | Detail |
|---|---|---|
| PASS | Video 1080x1920 @30 fps | 1080x1920 30/1, 2065 frames |
| PASS | Audio AAC 48 kHz stereo | aac 48000 2ch |
| PASS | Duration 45-75 s | 68.83 s |
| PASS | Integrated loudness -14 ±1 LUFS | -14.2 LUFS |
| PASS | True peak ≤ -1 dBTP | -1.0 dBTP |
| PASS | Final payoff ≥ 4 s after the last spoken word | last word ends 64.63 s, video ends 68.83 s → 4.21 s hold |
| PASS | Captions contain every narrated word, in order, nothing extra | 218 caption words / 218 narration words |
| PASS | Each caption starts with its first word (±50 ms) and stays up until its last word ends | 41 captions; off: [] |
| PASS | Captions never overlap |  |
| PASS | Last caption ends before the video ends | 65.23 s |
| PASS | Whisper hears every scripted word (independent ASR) | 218/218 heard; missing []; timing corrected max 0.336 s |
| PASS | Voice energy inside every word (≥ median − 24 dB) | median word level -27.9 dBFS; weak: [] |
| PASS | Planned dramatic pauses are silent in the voice track | 6 pauses; voiced: [] |
| INFO | Narration pace | 3.67 words/s inside lines; 3.38 overall incl. pauses |
| PASS | Chronology: narrated events in story order | 1 → 2 → 3 → 3 → 4 → 4 → 4 → 5 → 6 → 7 → 7 |
| PASS | Every narration line mapped to sourced claims | 16/16 lines |
| PASS | Every referenced claim exists in canon-timeline.md with label + locator | claims [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; missing [] |
| PASS | Every line carries a canon label | CANON, CANON (world rule), CANON (world), CANON + CHANNEL JUDGEMENT, CANON + SUPPORTED INTERPRETATION, CHANNEL JUDGEMENT |
| PASS | Black frames only inside the planned final fade | black frames: [np.int64(2058), np.int64(2059), np.int64(2060), np.int64(2061), np.int64(2062), np.int64(2063), np.int64(2064)] (fade starts 2041) |
| PASS | Picture alive through the final word and 2 s beyond | luma 0.42 / 0.42 |
| PASS | No frozen span ≥ 12 frames (mean |Δ| < 0.0015 at 270x480) | longest near-static run: 7 frames |
| INFO | Slow holds (< 0.0025) for human review | 9.8-10.3s, 10.7-12.4s, 12.7-13.3s, 13.9-15.0s, 63.1-63.6s |
| PASS | Frame count matches duration | 2065 frames |
