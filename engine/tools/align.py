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
NUM = {"1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten", "11": "eleven", "12": "twelve", "17": "seventeen", "20": "twenty"}
# hyphenated words: Whisper may split "non-magical" into "non" + "-magical" → compare without hyphens/spaces by merging
asr_m = []
for w in asr:
    t = NUM.get(n(w.word), n(w.word))
    if asr_m and w.word.startswith("-"): asr_m[-1] = (asr_m[-1][0] + t, asr_m[-1][1], w); continue
    asr_m.append((t, w, w))
class _W:  # merged word: start of first piece, end of last
    def __init__(self, t, a_, b_): self.word, self.start, self.end = t, a_.start, b_.end
asr = [_W(t, a_, b_) for t, a_, b_ in asr_m]
A, B = [n(w["w"]) for w in words], [n(w.word) for w in asr]
sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
matched, deltas, missing = 0, [], []
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1 and all((A[i], B[j]) in HOMOPHONES or A[i] == B[j] for i, j in zip(range(i1, i2), range(j1, j2)))):
        for i, j in zip(range(i1, i2), range(j1, j2)):
            deltas.append(asr[j].start - words[i]["s"]); words[i]["s"], words[i]["e"] = round(asr[j].start, 3), round(asr[j].end, 3); words[i]["asr"] = True; matched += 1
    elif tag in ("delete", "replace"):
        missing += [words[i]["w"] + f"@{words[i]['s']:.2f}" for i in range(i1, i2)]
# Snap every line's first/last word to the real audio onset/offset (Whisper boundary times drift by up to ~0.3 s),
# then guarantee a minimum duration per word.
env_ = np.convolve(np.abs(a), np.ones(int(0.01 * sr)) / int(0.01 * sr), "same"); thr = env_.max() * 0.01
def onset(t0, t1):
    i0, i1 = int(max(0, t0) * sr), int(t1 * sr); idx = np.where(env_[i0:i1] > thr)[0]; return None if len(idx) == 0 else (i0 + idx[0]) / sr
def offset(t0, t1):
    i0, i1 = int(max(0, t0) * sr), int(t1 * sr); idx = np.where(env_[i0:i1] > thr)[0]; return None if len(idx) == 0 else (i0 + idx[-1]) / sr
L0 = json.load(open(lj)); SEG = {l["line"]: (l["seg_s"], l["seg_e"]) for l in L0}  # exact line segments from tts.py
snaps = []
for li, (s0, s1) in SEG.items():
    ws = [w for w in words if w["line"] == li]
    on, off = onset(s0, s1), offset(s0, s1)
    if on is not None: snaps.append(round(on - ws[0]["s"], 3)); ws[0]["s"] = round(on, 3)
    if off is not None: snaps.append(round(off - ws[-1]["e"], 3)); ws[-1]["e"] = round(off, 3)
    for w in ws:  # no word may leave its own line's audio
        w["s"] = round(min(max(w["s"], ws[0]["s"]), ws[-1]["e"] - 0.02), 3); w["e"] = round(min(max(w["e"], w["s"] + 0.02), ws[-1]["e"]), 3)
for i in range(1, len(words)):  # keep monotonic
    words[i]["s"] = max(words[i]["s"], words[i - 1]["e"] - 0.02)
for i, w in enumerate(words):  # minimum 80 ms per word
    if w["e"] - w["s"] < 0.08:
        w["e"] = round(w["s"] + 0.08, 3)
        if i + 1 < len(words) and words[i + 1]["s"] < w["e"]: words[i + 1]["s"] = w["e"]
json.dump(D, open(wj, "w"), indent=0)
L = L0
for l in L:
    ws = [w for w in words if w["line"] == l["line"]]; l["s"], l["e"] = ws[0]["s"], ws[-1]["e"]
json.dump(L, open(lj, "w"), indent=1)
r = {"script_words": len(words), "heard": matched, "missing": missing, "asr_text": " ".join(w.word.strip() for w in asr),
     "timing_shift_s": {"mean": round(float(np.mean(deltas)), 3), "max_abs": round(float(np.max(np.abs(deltas))), 3)},
     "line_snap_s": {"max_abs": round(float(np.max(np.abs(snaps))), 3) if snaps else 0}}
json.dump(r, open(rep, "w"), indent=1)
print(json.dumps({k: v for k, v in r.items() if k != "asr_text"}))
sys.exit(1 if missing else 0)
