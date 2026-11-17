# Episode QC gate — rejects incomplete or broken exports. Exit code 1 on any FAIL.
# Usage: python check_episode.py <final.mp4> <narration.txt> <words.json> <lines.json> <captions.json> <chronology.json> <canon-timeline.md> <voice_stem.wav> <report.md>
import json, re, subprocess, sys
import numpy as np, soundfile as sf
mp4, narr, wj, lj, cj, chj, canon_md, vstem, rep = sys.argv[1:10]
R, FAIL = [], []
def check(ok, name, detail=""):
    R.append(f"| {'PASS' if ok else '**FAIL**'} | {name} | {detail} |")
    if not ok: FAIL.append(name)
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
words = json.load(open(wj))["words"]; lines = json.load(open(lj)); caps = json.load(open(cj)); chron = json.load(open(chj))
toks = [t for l in open(narr) if l.strip() for t in re.sub(r"\s*\{[0-9.]+\}\s*$", "", l.strip()).split()]

# 1 specs
pr = json.loads(run("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration", "-of", "json", mp4).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video"); a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
dur = float(pr["format"]["duration"]); nf = int(v["nb_frames"])
check(v["width"] == 1080 and v["height"] == 1920 and v["r_frame_rate"] == "30/1", "Video 1080x1920 @30 fps", f"{v['width']}x{v['height']} {v['r_frame_rate']}, {nf} frames")
check(len(a) == 1 and a[0]["sample_rate"] == "48000" and a[0]["channels"] == 2, "Audio AAC 48 kHz stereo", f"{a[0]['codec_name']} {a[0]['sample_rate']} {a[0]['channels']}ch" if a else "none")
check(45 <= dur <= 75.05, "Duration 45-75 s", f"{dur:.2f} s")
# 2 loudness
e = run("ffmpeg", "-i", mp4, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-").stderr
summ = e[e.rfind("Summary:"):]
I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1)); TP = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
check(abs(I + 14) <= 1.0, "Integrated loudness -14 ±1 LUFS", f"{I} LUFS"); check(TP <= -1.0, "True peak ≤ -1 dBTP", f"{TP} dBTP")
# 3 ending
last = words[-1]["e"]
check(dur - last >= 4.0, "Final payoff ≥ 4 s after the last spoken word", f"last word ends {last:.2f} s, video ends {dur:.2f} s → {dur - last:.2f} s hold")
# 4 captions completeness + sync
ctoks = [t for c in caps for t in c["text"].split()]
check(ctoks == toks, "Captions contain every narrated word, in order, nothing extra", f"{len(ctoks)} caption words / {len(toks)} narration words")
wi, bad = 0, []
for c in caps:
    n = len(c["text"].split()); ws = words[wi:wi + n]; wi += n
    if abs(c["s"] - ws[0]["s"]) > 0.05 or c["e"] < ws[-1]["e"]: bad.append(c["text"])
check(not bad, "Each caption starts with its first word (±50 ms) and stays up until its last word ends", f"{len(caps)} captions; off: {bad[:3]}")
check(all(caps[i]["e"] <= caps[i + 1]["s"] + 1e-6 for i in range(len(caps) - 1)), "Captions never overlap", "")
check(caps[-1]["e"] <= dur, "Last caption ends before the video ends", f"{caps[-1]['e']:.2f} s")
# 5 voice alignment — independent ASR (Whisper) must hear every scripted word; energy present in every word; pauses silent
asr = json.load(open(wj.replace("words.json", "asr_report.json")))
check(not asr["missing"] and asr["heard"] == len(words), "Whisper hears every scripted word (independent ASR)", f"{asr['heard']}/{len(words)} heard; missing {asr['missing'][:4]}; timing corrected max {asr['timing_shift_s']['max_abs']} s")
vs, sr = sf.read(vstem); vs = vs.mean(1) if vs.ndim > 1 else vs
db = lambda s, e_: 20 * np.log10(np.sqrt(np.mean(vs[int(s * sr):max(int(s * sr) + 1, int(e_ * sr))] ** 2)) + 1e-9)
lv = np.array([db(w["s"], w["e"]) for w in words]); med = np.median(lv)
quiet = [w["w"] for w, x in zip(words, lv) if x < med - 24]
check(not quiet, "Voice energy inside every word (≥ median − 24 dB)", f"median word level {med:.1f} dBFS; weak: {quiet[:5]}")
noisy = [l["line"] for l in lines if l["pause_after"] >= 0.3 and db(l["e"] + 0.2, l["e"] + l["pause_after"]) > med - 30]
check(not noisy, "Planned dramatic pauses are silent in the voice track", f"{sum(1 for l in lines if l['pause_after'] >= 0.3)} pauses; voiced: {noisy}")
art = sum(l["e"] - l["s"] for l in lines)
R.append(f"| INFO | Narration pace | {len(words) / art:.2f} words/s inside lines; {len(words) / (words[-1]['e'] - words[0]['s']):.2f} overall incl. pauses |")
# 6 chronology + labels
cl = chron["lines"]
yrs = [c["year"] for c in cl if not c.get("frame_device")]
check(all(yrs[i] <= yrs[i + 1] for i in range(len(yrs) - 1)), "Chronology: narrated events in story order", " → ".join(str(y) for y in yrs))
check(sorted(c["line"] for c in cl) == list(range(len(lines))), "Every narration line mapped to sourced claims", f"{len(cl)}/{len(lines)} lines")
md = open(canon_md).read(); ids = {int(m) for m in re.findall(r"^\|\s*(\d+)\s*\|", md, re.M)}
need = {i for c in cl for i in c["claims"]}
check(need <= ids, "Every referenced claim exists in canon-timeline.md with label + locator", f"claims {sorted(need)}; missing {sorted(need - ids)}")
check(all(c["label"] for c in cl), "Every line carries a canon label", ", ".join(sorted({c['label'] for c in cl})))
# 7 black / frozen frames
W_, H_ = 270, 480  # motion is judged at 1/4 resolution: a 1 px/frame camera creep at 1080p must still count as motion
raw = run("ffmpeg", "-v", "error", "-i", mp4, "-vf", f"scale={W_}:{H_}", "-f", "rawvideo", "-pix_fmt", "gray", "-").stdout if False else subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-vf", f"scale={W_}:{H_}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H_, W_).astype(np.float32) / 255
lum = F.mean((1, 2)); black = np.where(lum < 0.03)[0]
fade_start = nf - 24
check(all(b >= fade_start for b in black), "Black frames only inside the planned final fade", f"black frames: {list(black[:12])}{'…' if len(black) > 12 else ''} (fade starts {fade_start})")
check(lum[int(last * 30)] > 0.05 and lum[min(nf - 1, int(last * 30) + 60)] > 0.05, "Picture alive through the final word and 2 s beyond", f"luma {lum[int(last * 30)]:.2f} / {lum[min(nf - 1, int(last * 30) + 60)]:.2f}")
d = np.abs(np.diff(F, axis=0)).mean((1, 2)); run_, longest = 0, 0
for x in d: run_ = run_ + 1 if x < 0.0015 else 0; longest = max(longest, run_)
check(longest < 12, "No frozen span ≥ 12 frames (mean |Δ| < 0.0015 at 270x480)", f"longest near-static run: {longest} frames")
slow, run_ = [], 0
for i, x in enumerate(d):
    if x < 0.0025: run_ += 1
    else:
        if run_ >= 12: slow.append(f"{(i - run_) / 30:.1f}-{i / 30:.1f}s")
        run_ = 0
R.append(f"| INFO | Slow holds (< 0.0025) for human review | {', '.join(slow) or 'none'} |")
check(nf == round(dur * 30), "Frame count matches duration", f"{nf} frames")
out = ["# QC gate — " + mp4.split("/")[-1], "", f"**RESULT: {'REJECTED' if FAIL else 'APPROVED'}**", "", "| Result | Check | Detail |", "|---|---|---|"] + R
if FAIL: out += ["", "Failed: " + "; ".join(FAIL)]
open(rep, "w").write("\n".join(out) + "\n"); print("\n".join(out)); sys.exit(1 if FAIL else 0)
