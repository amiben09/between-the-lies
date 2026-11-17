# QC gate — Always_v2.mp4

**RESULT: APPROVED**

| Result | Check | Detail |
|---|---|---|
| PASS | Video 1080x1920 @30 fps | 1080x1920 30/1, 2086 frames |
| PASS | Audio AAC 48 kHz stereo | aac 48000 2ch |
| PASS | Duration 45-75 s | 69.53 s |
| PASS | Integrated loudness -14 ±1 LUFS | -14.3 LUFS |
| PASS | True peak ≤ -1 dBTP | -1.3 dBTP |
| PASS | Final payoff ≥ 4 s after the last spoken word | last word ends 65.14 s, video ends 69.53 s → 4.39 s hold |
| PASS | Captions contain every narrated word, in order, nothing extra | 229 caption words / 229 narration words |
| PASS | Each caption starts with its first word (±50 ms) and stays up until its last word ends | 45 captions; off: [] |
| PASS | Captions never overlap |  |
| PASS | Last caption ends before the video ends | 65.74 s |
| PASS | Whisper hears every scripted word (independent ASR) | 229/229 heard; missing []; timing corrected max 0.287 s |
| PASS | Voice energy inside every word (≥ median − 24 dB) | median word level -28.0 dBFS; weak: [] |
| PASS | Planned dramatic pauses are silent in the voice track | 7 pauses; voiced: [] |
| INFO | Narration pace | 4.07 words/s inside lines; 3.52 overall incl. pauses |
| PASS | Chronology: narrated events in story order | 1969 → 1969 → 1971 → 1976 → 1976 → 1976 → 1980 → 1980 → 1981 → 1981 → 1991 → 1991 → 1991 → 1997 → 1997 → 1997 → 1998 → 1998 |
| PASS | Every narration line mapped to sourced claims | 19/19 lines |
| PASS | Every referenced claim exists in canon-timeline.md with label + locator | claims [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; missing [] |
| PASS | Every line carries a canon label | ADAPTATION, CANON, CANON + SUPPORTED INTERPRETATION, CHANNEL JUDGEMENT, SUPPORTED INTERPRETATION |
| PASS | Black frames only inside the planned final fade | black frames: [np.int64(2080), np.int64(2081), np.int64(2082), np.int64(2083), np.int64(2084), np.int64(2085)] (fade starts 2062) |
| PASS | Picture alive through the final word and 2 s beyond | luma 0.55 / 0.58 |
| PASS | No frozen span ≥ 12 frames (mean |Δ| < 0.0015 at 270x480) | longest near-static run: 9 frames |
| INFO | Slow holds (< 0.0025) for human review | 2.1-3.3s, 4.0-4.6s, 14.2-14.8s, 17.1-17.7s, 18.6-19.2s, 26.4-27.6s, 31.9-32.7s, 34.8-35.5s, 39.3-39.8s, 42.6-43.1s, 52.2-52.7s, 53.2-53.9s, 63.1-63.7s |
| PASS | Frame count matches duration | 2086 frames |
