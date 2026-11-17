# Verify + re-time the narration with Whisper (independent ASR). Rewrites words.json / lines.json timings from what is
# actually audible, and FAILS (exit 1) if any scripted word is not heard. Run in the TTS venv.
# Usage: python align.py <voice.wav> <words.json> <lines.json> <report.json>
import json, re, sys, difflib, numpy as np, soundfile as sf
from faster_whisper import WhisperModel
voice, wj, lj, rep = sys.argv[1:5]
HOMOPHONES = {("doe", "dough"), ("doe", "do")}
a, sr = sf.read(voice, dtype="float32")
t_out = np.arange(int(len(a) * 16000 / sr)) / 16000
a16 = np.interp(t_out, np.arange(len(a)) / sr, a).astype(np.float32)
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a16, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
asr = [w for s in segs for w in s.words]
D = json.load(open(wj)); words = D["words"]
n = lambda x: re.sub(r"[^a-z0-9']", "", x.lower())
A, B = [n(w["w"]) for w in words], [n(w.word) for w in asr]
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
matched, deltas, missing = 0, [], []
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1 and all((A[i], B[j]) in HOMOPHONES or A[i] == B[j] for i, j in zip(range(i1, i2), range(j1, j2)))):
        for i, j in zip(range(i1, i2), range(j1, j2)):
            deltas.append(asr[j].start - words[i]["s"]); words[i]["s"], words[i]["e"] = round(asr[j].start, 3), round(asr[j].end, 3); words[i]["asr"] = True; matched += 1
    elif tag in ("delete", "replace"):
        missing += [words[i]["w"] + f"@{words[i]['s']:.2f}" for i in range(i1, i2)]
for i in range(1, len(words)):  # keep monotonic
    words[i]["s"] = max(words[i]["s"], words[i - 1]["e"] - 0.02)
json.dump(D, open(wj, "w"), indent=0)
L = json.load(open(lj))
for l in L:
    ws = [w for w in words if w["line"] == l["line"]]; l["s"], l["e"] = ws[0]["s"], ws[-1]["e"]
json.dump(L, open(lj, "w"), indent=1)
r = {"script_words": len(words), "heard": matched, "missing": missing, "asr_text": " ".join(w.word.strip() for w in asr),
     "timing_shift_s": {"mean": round(float(np.mean(deltas)), 3), "max_abs": round(float(np.max(np.abs(deltas))), 3)}}
json.dump(r, open(rep, "w"), indent=1)
print(json.dumps({k: v for k, v in r.items() if k != "asr_text"}))
sys.exit(1 if missing else 0)
