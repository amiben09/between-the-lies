# QA — Always_test_v1.mp4
- Specs: 1080x1920, 30 fps CFR, 1660 frames, 55.33 s, H.264 yuv420p, AAC 48 kHz stereo — PASS
- Loudness: -14.2 LUFS integrated, -1.4 dBFS sample peak / -1.5 dBTP master — PASS
- Narration: 199 words in 53.97 s speech = 3.69 words/s — PASS (locked 3.7)
- Music under speech: -19 dB (target 18-24) — PASS
- Black frames 1652-1659: planned fade-out after the final word (ends f1631) — PASS
- Frame-diff "pops" at 69,138,529,595,794,928,971,1144,1198,1255,1307,1531: all are caption changes — PASS
- Frozen spans ≥12 f: none — PASS
- Captions: 37 phrase captions, text identical to narration, aligned to word timings — PASS
## Known weaknesses (test build)
- Characters are simple vector cards: limited body acting (no walk cycles, hands are mitten shapes).
- S15 (ruin): Lily's pose reads but floats slightly; S23 (shack): Harry's kneel reads as standing.
- TTS voice: listen for pronunciation of "Severus", "Voldemort", "Slytherin" before publishing.
