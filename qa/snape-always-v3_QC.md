# QC gate — Always_v3.mp4

**RESULT: APPROVED**

| Result | Check | Detail |
|---|---|---|
| PASS | Video 1080x1920 @30 fps | 1080x1920 30/1, 2249 frames |
| PASS | Audio AAC 48 kHz stereo | aac 48000 2ch |
| PASS | Duration 45-75 s | 74.97 s |
| PASS | Integrated loudness -14 ±1 LUFS | -14.3 LUFS |
| PASS | True peak ≤ -1 dBTP | -1.2 dBTP |
| PASS | Final payoff ≥ 4 s after the last spoken word | last word ends 70.88 s, video ends 74.97 s → 4.09 s hold |
| PASS | Captions contain every narrated word, in order, nothing extra | 234 caption words / 234 narration words |
| PASS | Each caption starts with its first word (±50 ms) and stays up until its last word ends | 45 captions; off: [] |
| PASS | Captions never overlap |  |
| PASS | Last caption ends before the video ends | 71.48 s |
| PASS | Whisper hears every scripted word (independent ASR) | 234/234 heard; missing []; timing corrected max 0.331 s |
| PASS | Voice energy inside every word (≥ median − 24 dB) | median word level -27.6 dBFS; weak: [] |
| PASS | Planned dramatic pauses are silent in the voice track | 7 pauses; voiced: [] |
| INFO | Narration pace | 3.74 words/s inside lines; 3.31 overall incl. pauses |
| PASS | Chronology: narrated events in story order | 1969 → 1971 → 1976 → 1976 → 1978 → 1979 → 1980 → 1980 → 1981 → 1981 → 1991 → 1991 → 1997 → 1997 → 1997 → 1998 → 1998 |
| PASS | Every narration line mapped to sourced claims | 21/21 lines |
| PASS | Every referenced claim exists in canon-timeline.md with label + locator | claims [3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]; missing [] |
| PASS | Every line carries a canon label | ADAPTATION, CANON, CANON + SUPPORTED INTERPRETATION, CHANNEL JUDGEMENT, SUPPORTED INTERPRETATION |
| PASS | Black frames only inside the planned final fade | black frames: [np.int64(2244), np.int64(2245), np.int64(2246), np.int64(2247), np.int64(2248)] (fade starts 2225) |
| PASS | Picture alive through the final word and 2 s beyond | luma 0.57 / 0.58 |
| PASS | No frozen span ≥ 12 frames (mean |Δ| < 0.0015 at 270x480) | longest near-static run: 10 frames |
| INFO | Slow holds (< 0.0025) for human review | 9.2-9.7s, 9.8-10.5s, 13.3-14.6s, 15.0-16.2s, 22.3-23.1s, 36.8-37.4s, 39.1-39.8s, 41.7-42.4s, 54.9-55.4s, 68.8-69.3s |
| PASS | Frame count matches duration | 2249 frames |
