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
raw = [l.strip() for l in open(txt) if l.strip()]
lines, pauses = [], []
for l in raw:
    m = re.search(r"\{([0-9.]+)\}\s*$", l)
    pauses.append(float(m.group(1)) if m else 0.0); lines.append(re.sub(r"\s*\{[0-9.]+\}\s*$", "", l))
audio, words, t0 = [], [], 0.15
audio.append(np.zeros(int(SR * t0), np.float32))
for li, line in enumerate(lines):
    for r in pipe(line, voice=voice, speed=speed, split_pattern=None):
        a = r.audio.numpy() if hasattr(r.audio, "numpy") else np.asarray(r.audio)
        tks = [tk for tk in r.tokens if tk.start_ts is not None and re.search(r"[A-Za-z0-9]", tk.text)]
        # trim Kokoro's own head/tail silence: keep 40 ms before the first word, 120 ms after the last
        # energy-based trim (Kokoro timestamps run early; never cut a word's tail)
        envl = np.convolve(np.abs(a), np.ones(240) / 240, "same"); thr = envl.max() * 0.02
        loud = np.where(envl > thr)[0]
        a0 = max(0, loud[0] - int(0.03 * SR)); a1 = min(len(a), loud[-1] + int(0.15 * SR))
        seg = a[a0:a1].astype(np.float32); seg[:240] *= np.linspace(0, 1, 240); seg[-480:] *= np.linspace(1, 0, 480)
        for tk in tks:
            words.append({"w": tk.text, "s": round(t0 + tk.start_ts - a0 / SR, 3), "e": round(t0 + tk.end_ts - a0 / SR, 3), "line": li})
        audio.append(seg); t0 += len(seg) / SR
    gap = pause + pauses[li]
    audio.append(np.zeros(int(SR * gap), np.float32)); t0 += gap
audio.append(np.zeros(int(SR * 0.3), np.float32)); t0 += 0.3
sf.write(f"{out}/voice.wav", np.concatenate(audio), SR)
json.dump({"duration": round(t0, 3), "words": words}, open(f"{out}/words.json", "w"), indent=0)
speech = words[-1]["e"] - words[0]["s"]
art = sum(max(w["e"] for w in words if w["line"] == li) - min(w["s"] for w in words if w["line"] == li) for li in range(len(lines)))
print(f"articulation (inside lines) = {len(words)/art:.2f} w/s")
json.dump([{"line": li, "s": min(w["s"] for w in words if w["line"] == li), "e": max(w["e"] for w in words if w["line"] == li), "pause_after": pauses[li], "text": lines[li]} for li in range(len(lines))], open(f"{out}/lines.json", "w"), indent=1)
print(f"voice={voice} speed={speed} words={len(words)} speech={speech:.2f}s rate={len(words)/speech:.2f} w/s total={t0:.2f}s")
