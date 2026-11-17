# Kokoro TTS -> voice.wav (24 kHz) + words.json (word timings from Kokoro's own token timestamps).
# Usage: python tts.py <narration.txt> <outdir> [voice] [speed] [pause_s]
import json, sys, re, numpy as np, soundfile as sf
from kokoro import KPipeline
txt, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
pause = float(sys.argv[5]) if len(sys.argv) > 5 else 0.12
SR = 24000
pipe = KPipeline(lang_code="a")
lines = [l.strip() for l in open(txt) if l.strip()]
audio, words, t0 = [], [], 0.15
audio.append(np.zeros(int(SR * t0), np.float32))
for li, line in enumerate(lines):
    for r in pipe(line, voice=voice, speed=speed, split_pattern=None):
        a = r.audio.numpy() if hasattr(r.audio, "numpy") else np.asarray(r.audio)
        for tk in r.tokens:
            if tk.start_ts is None or not re.search(r"[A-Za-z0-9]", tk.text): continue
            words.append({"w": tk.text, "s": round(t0 + tk.start_ts, 3), "e": round(t0 + tk.end_ts, 3), "line": li})
        audio.append(a.astype(np.float32)); t0 += len(a) / SR
    gap = pause * (2.5 if line.endswith(("Always.", "Look at me.")) else 1)
    audio.append(np.zeros(int(SR * gap), np.float32)); t0 += gap
audio.append(np.zeros(int(SR * 0.6), np.float32)); t0 += 0.6
sf.write(f"{out}/voice.wav", np.concatenate(audio), SR)
json.dump({"duration": round(t0, 3), "words": words}, open(f"{out}/words.json", "w"), indent=0)
speech = words[-1]["e"] - words[0]["s"]
print(f"voice={voice} speed={speed} words={len(words)} speech={speech:.2f}s rate={len(words)/speech:.2f} w/s total={t0:.2f}s")
