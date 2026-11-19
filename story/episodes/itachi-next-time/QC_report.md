# QC gate — final.mp4

**RESULT: APPROVED**

| Result | Check | Detail |
|---|---|---|
| PASS | Video 1080x1920 @30 fps | 1080x1920 30/1, 2155 frames |
| PASS | Audio AAC 48 kHz stereo | aac 48000 2ch |
| PASS | Duration 45-75 s | 71.83 s |
| PASS | Integrated loudness -14 ±1 LUFS | -14.3 LUFS |
| PASS | True peak ≤ -1 dBTP | -1.3 dBTP |
| PASS | Final payoff ≥ 4 s after the last spoken word | last word ends 67.64 s, video ends 71.83 s → 4.19 s hold |
| PASS | Captions contain every narrated word, in order, nothing extra | 231 caption words / 231 narration words |
| PASS | Each caption starts with its first word (±50 ms) and stays up until its last word ends | 45 captions; off: [] |
| PASS | Captions never overlap |  |
| PASS | Last caption ends before the video ends | 68.24 s |
| PASS | Whisper hears every scripted word (independent ASR) | 231/231 heard; missing []; timing corrected max 0.223 s |
| PASS | Voice energy inside every word (≥ median − 24 dB) | median word level -27.5 dBFS; weak: [] |
| PASS | Planned dramatic pauses are silent in the voice track | 6 pauses; voiced: [] |
| INFO | Narration pace | 3.75 words/s inside lines; 3.42 overall incl. pauses |
| PASS | Chronology: narrated events in story order | 8 → 8 → 12 → 13 → 13 → 13 → 13 → 21 → 21 → 21 → 21 |
| PASS | Every narration line mapped to sourced claims | 16/16 lines |
| PASS | Every referenced claim exists in canon-timeline.md with label + locator | claims [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]; missing [] |
| PASS | Every line carries a canon label | ADAPTATION, CANON, CANON (gesture); wording paraphrased, CANON + SUPPORTED INTERPRETATION, CHANNEL JUDGEMENT, SUPPORTED INTERPRETATION, SUPPORTED INTERPRETATION + CANON |
| PASS | Black frames only inside the planned final fade | black frames: [np.int64(2147), np.int64(2148), np.int64(2149), np.int64(2150), np.int64(2151), np.int64(2152), np.int64(2153), np.int64(2154)] (fade starts 2131) |
| PASS | Picture alive through the final word and 2 s beyond | luma 0.30 / 0.30 |
| PASS | No frozen span ≥ 12 frames (mean |Δ| < 0.0015 at 270x480) | longest near-static run: 10 frames |
| INFO | Slow holds (< 0.0025) for human review | 4.7-6.0s, 39.0-40.0s, 40.6-41.0s, 68.8-69.3s |
| PASS | Frame count matches duration | 2155 frames |
