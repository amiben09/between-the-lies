# BETWEEN THE LIES — reference analysis pipeline (Phase 2).
# Usage (TTS venv, needs cv2/scipy/soundfile/faster-whisper + ffmpeg + tesseract):
#   python refscan.py <video.mp4> <outdir> [--truth truth.json]
# Outputs: reference_report.json · reference_timeline.csv · reference_contact_sheet.jpg · reference_storyboard.md · shots/*.jpg · sheets/*.jpg
# Every value carries a label: MEASURED (computed directly from the file), ESTIMATED (heuristic / model inference with
# stated method), UNKNOWN (not determinable with this pipeline). truth.json = [[a,b],...] shot ranges to score the detector.
import json, os, re, subprocess, sys, csv, math
import numpy as np, cv2, soundfile as sf
from scipy import signal

vid, out = sys.argv[1], sys.argv[2]
truth = json.load(open(sys.argv[sys.argv.index("--truth") + 1])) if "--truth" in sys.argv else None
os.makedirs(f"{out}/shots", exist_ok=True); os.makedirs(f"{out}/sheets", exist_ok=True)
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
M = lambda v, how: {"value": v, "label": "MEASURED", "method": how}
E = lambda v, how: {"value": v, "label": "ESTIMATED", "method": how}
U = lambda why: {"value": None, "label": "UNKNOWN", "method": why}
R = {"file": os.path.basename(vid)}

# ---------- A. specs ----------
pr = json.loads(run("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration", "-of", "json", vid).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video"); a = next((s for s in pr["streams"] if s["codec_type"] == "audio"), None)
W0, H0 = int(v["width"]), int(v["height"]); fps = eval(v["r_frame_rate"]); dur = float(pr["format"]["duration"])
R["specs"] = {"duration_s": M(round(dur, 3), "ffprobe"), "resolution": M(f"{W0}x{H0}", "ffprobe"), "fps": M(fps, "ffprobe r_frame_rate"),
              "video_codec": M(v["codec_name"], "ffprobe"), "audio": M(f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']}ch" if a else None, "ffprobe")}

# ---------- B. decode ----------
w, h = 180, 320
def frames(fmt, ww, hh, ch):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vid, "-vf", f"scale={ww}:{hh}:flags=area", "-f", "rawvideo", "-pix_fmt", fmt, "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, hh, ww, ch) if ch > 1 else np.frombuffer(raw, np.uint8).reshape(-1, hh, ww)
G = frames("gray", w, h, 1); C = frames("rgb24", 90, 160, 3)
N = len(G); R["specs"]["frames"] = M(N, "decoded frame count")

# ---------- C. shot boundaries ----------
def hist(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    hh = cv2.calcHist([hsv], [0, 1, 2], None, [16, 8, 8], [0, 180, 0, 256, 0, 256]); return cv2.normalize(hh, hh).flatten()
H_ = [hist(c) for c in C]
hd = np.array([0.0] + [cv2.compareHist(H_[i - 1], H_[i], cv2.HISTCMP_BHATTACHARYYA) for i in range(1, N)])
pd = np.array([0.0] + [np.abs(G[i].astype(np.int16) - G[i - 1]).mean() / 255 for i in range(1, N)])
score = hd * 0.6 + pd * 2.0
med = signal.medfilt(score, 31)
cuts = [0]
for i in range(1, N):
    if score[i] > max(0.18, med[i] * 4) and i - cuts[-1] >= 6: cuts.append(i)
# dissolves: sustained moderate change whose endpoints differ strongly (no single hard cut inside)
dissolves, fades = [], []
i = 1
while i < N - 8:
    if 0.04 < score[i] < 0.18 and all(0.035 < score[j] < 0.18 for j in range(i, i + 6)):
        j = i
        while j < N - 1 and 0.03 < score[j] < 0.18: j += 1
        prog = [cv2.compareHist(H_[max(0, i - 1)], H_[k], cv2.HISTCMP_BHATTACHARYYA) for k in range(i, min(N, j + 1))]
        mono = sum(1 for q in range(1, len(prog)) if prog[q] >= prog[q - 1] - 0.01) / max(1, len(prog) - 1)
        fade = min(G[k].mean() for k in range(i, min(N, j + 1))) < 10
        if fade: fades.append((i, j))
        elif 6 <= j - i <= 40 and prog and prog[-1] > 0.35 and mono > 0.85 and not any(i <= c <= j for c in cuts):
            dissolves.append((i, j)); cuts.append((i + j) // 2)
        i = j
    i += 1
cuts = sorted(set(cuts)); bounds = [(cuts[k], cuts[k + 1] if k + 1 < len(cuts) else N) for k in range(len(cuts))]
flashes = [int(i) for i in range(1, N - 1) if G[i].mean() > G[i - 1].mean() + 60 and G[i].mean() > G[i + 1].mean() + 40]

# ---------- D. global camera motion per frame (similarity transform from LK feature tracking) ----------
S = W0 / w
tx, ty, sc, rot, resid, inl = (np.zeros(N) for _ in range(6)); sc[:] = 1
for i in range(1, N):
    if i in cuts: continue
    p0 = cv2.goodFeaturesToTrack(G[i - 1], 300, 0.01, 6)
    if p0 is None or len(p0) < 12: continue
    p1, st, _ = cv2.calcOpticalFlowPyrLK(G[i - 1], G[i], p0, None, winSize=(15, 15), maxLevel=3)
    good = st.ravel() == 1
    if good.sum() < 12: continue
    A_, msk = cv2.estimateAffinePartial2D(p0[good], p1[good], method=cv2.RANSAC, ransacReprojThreshold=1.0)
    if A_ is None: continue
    s_ = math.hypot(A_[0, 0], A_[1, 0]); sc[i] = s_; rot[i] = math.degrees(math.atan2(A_[1, 0], A_[0, 0]))
    tx[i], ty[i] = A_[0, 2] * S, A_[1, 2] * S
    pred = (p0[good].reshape(-1, 2) @ A_[:, :2].T) + A_[:, 2]
    res = np.linalg.norm(p1[good].reshape(-1, 2) - pred, axis=1) * S
    resid[i] = float(np.percentile(res, 90)); inl[i] = float(msk.mean()) if msk is not None else 0

# ---------- E/F. per-shot analysis ----------
def bands_sharp(img):
    lap = cv2.Laplacian(img, cv2.CV_64F); t = img.shape[0] // 3
    return [float(lap[k * t:(k + 1) * t].var()) for k in range(3)]
def classify(b0, b1):
    seg = slice(b0 + 1, b1); n = max(1, b1 - b0 - 1)
    ztot = float(np.prod(sc[seg])) if b1 - b0 > 1 else 1.0
    px, py = float(tx[seg].sum()), float(ty[seg].sum())
    rtot = float(rot[seg].sum()); spd = np.hypot(tx[seg], ty[seg])
    jit = float(np.std(np.diff(tx[seg], 2))) if n > 4 else 0
    moves = []
    if ztot > 1.025: moves.append("push-in")
    if ztot < 0.975: moves.append("pull-out")
    if abs(px) > 0.06 * W0: moves.append("track/pan " + ("left" if px > 0 else "right"))   # content moving right = camera moving left
    if abs(py) > 0.04 * H0: moves.append("tilt/crane " + ("up" if py > 0 else "down"))
    if abs(rtot) > 2: moves.append("roll")
    if jit > 1.5: moves.append("shake/handheld")
    if not moves: moves.append("static/creep")
    thirds = [float(np.mean(spd[k * n // 3:(k + 1) * n // 3])) if n >= 3 else 0 for k in range(3)]
    ease = "ease-in-out" if thirds[1] > 1.4 * max(thirds[0], thirds[2], 1e-3) else ("constant" if n >= 3 and max(thirds) < 1.3 * min(thirds) + 0.05 else "irregular")
    return {"moves": moves, "zoom_total": round(ztot, 4), "pan_px": round(px, 1), "tilt_px": round(py, 1), "roll_deg": round(rtot, 2),
            "speed_px_per_frame_thirds": [round(x, 2) for x in thirds], "speed_profile": ease, "jitter": round(jit, 2),
            "subject_motion_p90_px": round(float(np.mean(resid[seg])) if n else 0, 2)}
shots = []
for k, (b0, b1) in enumerate(bounds):
    mid = (b0 + b1) // 2
    cam = classify(b0, b1)
    sh = bands_sharp(G[mid]); full = cv2.resize(frames_one := None or G[mid], (w, h)) if False else None
    shots.append({"id": k + 1, "start_f": b0, "end_f": b1 - 1, "start_s": round(b0 / fps, 3), "end_s": round(b1 / fps, 3), "dur_s": round((b1 - b0) / fps, 3),
                  "transition_in": "dissolve" if any(abs((x + y) // 2 - b0) <= 2 for x, y in dissolves) else ("cut" if k else "start"),
                  "camera": cam, "sharpness_top_mid_bottom": [round(x) for x in sh], "mean_luma": round(float(G[b0:b1].mean()) / 255, 3)})

# ---------- G. representative frames, contact sheet, 1 fps sheets ----------
def grab(f, path, width=360):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{f / fps:.3f}", "-i", vid, "-frames:v", "1", "-vf", f"scale={width}:-2", path])
for s_ in shots: grab((s_["start_f"] + s_["end_f"]) // 2, f"{out}/shots/{s_['id']:03d}.jpg")
from PIL import Image, ImageDraw
cols, tw = 6, 180; th = int(tw * H0 / W0); rows = math.ceil(len(shots) / cols)
sheet = Image.new("RGB", (cols * tw, rows * (th + 30)), "black"); d = ImageDraw.Draw(sheet)
for i, s_ in enumerate(shots):
    im = Image.open(f"{out}/shots/{s_['id']:03d}.jpg").resize((tw, th)); x, y = (i % cols) * tw, (i // cols) * (th + 30)
    sheet.paste(im, (x, y)); d.text((x + 4, y + th + 2), f"#{s_['id']} {s_['start_s']:.1f}s {s_['dur_s']:.1f}s", fill="yellow"); d.text((x + 4, y + th + 15), s_["camera"]["moves"][0][:24], fill="white")
sheet.save(f"{out}/reference_contact_sheet.jpg", quality=88)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-vf", "fps=1,scale=180:-2,tile=6x2", f"{out}/sheets/sec_%02d.jpg"])

# ---------- H. captions via OCR ----------
os.environ["OMP_THREAD_LIMIT"] = "1"
def ocr_frame(f, band=None):
    p = f"{out}/_ocr.png"; crop = f",crop=iw:ih*{band[1] - band[0]:.3f}:0:ih*{band[0]:.3f}" if band else ""
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{f / fps:.3f}", "-i", vid, "-frames:v", "1", "-vf", f"scale=1080:-2{crop},format=gray,lut=y='if(gt(val,200),0,255)'", p])
    t = run("tesseract", p, "-", "--psm", "11", "tsv").stdout.splitlines()[1:]
    words = []
    for line in t:
        c = line.split("\t")
        if len(c) == 12 and c[11].strip() and float(c[10]) >= 60 and re.search(r"[A-Za-z]{2,}", c[11]) and int(c[9]) > 1920 * 0.018:
            y = int(c[7]) / 1920 + (band[0] if band else 0)
            words.append({"t": c[11].strip(), "y": round(y, 4), "x": int(c[6]) / 1080, "hgt": int(c[9]) / 1920})
    return words
# pass 1: 24 full frames to locate the caption band; pass 2: only that band (fast)
probe = [w_ for f in np.linspace(0, N - 1, 24).astype(int) for w_ in ocr_frame(int(f))] if "--no-ocr" not in sys.argv else []
band = (max(0.0, float(np.percentile([w_["y"] for w_ in probe], 10)) - 0.06), min(1.0, float(np.percentile([w_["y"] for w_ in probe], 90)) + 0.08)) if probe else None
R["captions_band_scanned"] = E([round(b, 3) for b in band] if band else "full frame", "pass 1: 24 evenly spaced full-frame OCR samples")
ocr = [{"f": f, "s": round(f / fps, 2), "words": ocr_frame(f, band)} for f in range(0, N, 6)] if "--no-ocr" not in sys.argv else []
if os.path.exists(f"{out}/_ocr.png"): os.remove(f"{out}/_ocr.png")
cap_frames = [o for o in ocr if o["words"]]
ys = [w_["y"] for o in cap_frames for w_ in o["words"]]; hs = [w_["hgt"] for o in cap_frames for w_ in o["words"]]
texts = [" ".join(w_["t"] for w_ in o["words"]) for o in ocr]
def _jac(a_, b_):
    A_, B_ = set(a_.lower().split()), set(b_.lower().split()); return len(A_ & B_) / max(1, len(A_ | B_))
stable = [t_ for t_ in texts]
changes, last = 0, ""
for t_ in texts:  # count a caption change only when the text is substantially new (OCR jitter ignored)
    if t_ and (not last or _jac(t_, last) < 0.34): changes += 1; last = t_
    elif t_: last = t_
wpc = [len(o["words"]) for o in cap_frames]
upper = sum(1 for o in cap_frames for w_ in o["words"] if w_["t"].isupper()) / max(1, sum(len(o["words"]) for o in cap_frames))
R["captions"] = {
    "present_fraction_of_samples": M(round(len(cap_frames) / max(1, len(ocr)), 3), "tesseract psm11 on bright-text mask, every 6th frame, conf≥60"),
    "vertical_position_median": E(round(float(np.median(ys)), 3) if ys else None, "OCR word box top / frame height (0=top)"),
    "vertical_range_p10_p90": E([round(float(np.percentile(ys, 10)), 3), round(float(np.percentile(ys, 90)), 3)] if ys else None, "OCR boxes"),
    "text_height_frac_median": E(round(float(np.median(hs)), 4) if hs else None, "OCR box height / frame height"),
    "words_on_screen_median": E(int(np.median(wpc)) if wpc else 0, "OCR words per sampled frame (OCR misses lower this)"),
    "caption_changes_per_s": E(round(changes / dur, 2), "new caption text (Jaccard < 0.34 vs previous) per second; validated on our v3.1 (truth 0.62/s)"),
    "uppercase_ratio": E(round(upper, 2), "share of OCR words fully uppercase"),
    "style": U("font family/outline/colour need visual reading; see contact sheets")}
R["captions_samples"] = [{"s": o["s"], "text": " ".join(w_["t"] for w_ in o["words"])} for o in ocr if o["words"]][:400]

# ---------- I. audio: transcript, pace, loudness, music, events ----------
wav = f"{out}/_a.wav"; subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-ac", "1", "-ar", "16000", wav])
au, sr = sf.read(wav, dtype="float32")
from faster_whisper import WhisperModel
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(au, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
WW = [{"w": x.word.strip(), "s": round(x.start, 3), "e": round(x.end, 3), "p": round(x.probability, 3)} for sg in segs for x in sg.words]
if not WW:  # silent clip (e.g. render tests): narration metrics unknown
    gaps, R["narration"] = [], {"transcript": U("no speech detected"), "word_count": M(0, "ASR found no words")}
else:
    gaps = [(WW[i]["e"], WW[i + 1]["s"]) for i in range(len(WW) - 1) if WW[i + 1]["s"] - WW[i]["e"] > 0.3]
    speech_span = WW[-1]["e"] - WW[0]["s"] if WW else 0
    inside = speech_span - sum(b - a_ for a_, b in gaps)
    text = " ".join(x["w"] for x in WW); sents = [s_ for s_ in re.split(r"(?<=[.!?])\s+", text) if s_.strip()]
    R["narration"] = {
        "transcript": E(text, "faster-whisper small.en (ASR — may contain recognition errors)"),
        "word_count": E(len(WW), "ASR words"),
        "first_word_s": E(WW[0]["s"] if WW else None, "ASR"), "last_word_end_s": E(WW[-1]["e"] if WW else None, "ASR"),
        "wpm_overall": E(round(len(WW) / speech_span * 60, 1) if speech_span else None, "words / (last end - first start)"),
        "wpm_inside_speech": E(round(len(WW) / inside * 60, 1) if inside else None, "excluding gaps > 0.3 s"),
        "pauses_over_0_3s": E([[round(a_, 2), round(b - a_, 2)] for a_, b in gaps], "start, length (s)"),
        "sentences": E(len(sents), "ASR punctuation"), "words_per_sentence_median": E(float(np.median([len(s_.split()) for s_ in sents])) if sents else None, "ASR punctuation"),
        "tail_after_last_word_s": E(round(dur - WW[-1]["e"], 2) if WW else None, "duration - last word end")}
eb = run("ffmpeg", "-i", vid, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-").stderr; tail = eb[eb.rfind("Summary:"):]
num = lambda pat: float(re.search(pat, tail).group(1)) if re.search(pat, tail) else None
R["audio"] = {"integrated_lufs": M(num(r"I:\s+(-?[\d.]+) LUFS"), "ffmpeg ebur128"), "lra_lu": M(num(r"LRA:\s+(-?[\d.]+) LU"), "ffmpeg ebur128"), "true_peak_dbtp": M(num(r"Peak:\s+(-?[\d.]+) dBFS"), "ffmpeg ebur128 true peak")}
speech_mask = np.zeros(len(au), bool)
for x in WW: speech_mask[int(x["s"] * sr):int(x["e"] * sr)] = True
gap_lvls = []
for a_, b in gaps:
    seg = au[int((a_ + 0.08) * sr):int((b - 0.05) * sr)]
    if len(seg) > sr * 0.1: gap_lvls.append(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9))
sp_lvl = 20 * np.log10(np.sqrt(np.mean(au[speech_mask] ** 2)) + 1e-9) if speech_mask.any() else None
R["audio"]["bed_under_pauses_db_rel_speech"] = E(round(float(np.median(gap_lvls) - sp_lvl), 1) if gap_lvls and sp_lvl is not None else None, "RMS in speech gaps vs RMS in speech (music/ambience bed level)")
f_, t_, Z = signal.stft(au, sr, nperseg=1024, noverlap=768); mag = np.abs(Z)
flux = np.maximum(0, np.diff(mag, axis=1)).sum(0); flux = (flux - flux.mean()) / (flux.std() + 1e-9)
fr_rate = sr / 256
ac = np.correlate(flux, flux, "full")[len(flux) - 1:]; lags = np.arange(len(ac)) / fr_rate
rng_ = (lags > 60 / 180) & (lags < 60 / 60); best = lags[rng_][np.argmax(ac[rng_])] if rng_.any() else None
conf = float(ac[rng_].max() / (ac[1:int(fr_rate * 2)].mean() + 1e-9)) if rng_.any() else 0
R["audio"]["tempo_bpm"] = (E(round(60 / best, 1), f"spectral-flux autocorrelation, peak/mean ratio {conf:.2f}") if best and conf >= 2.0 else U(f"no reliable periodic beat (autocorrelation peak/mean {conf:.2f} < 2.0)"))
lv = np.array([20 * np.log10(np.sqrt(np.mean(au[i:i + int(sr * 0.1)] ** 2)) + 1e-9) for i in range(0, len(au) - int(sr * 0.1), int(sr * 0.1))])
pk, _ = signal.find_peaks(flux, height=4.0, distance=int(fr_rate * 0.4))
events = [round(float(p / fr_rate), 2) for p in pk if not any(x["s"] - 0.05 <= p / fr_rate <= x["s"] + 0.12 for x in WW)]
R["audio"]["sound_events_not_on_word_onsets_s"] = E(events[:60], "spectral-flux peaks (z>4) not within a word onset: candidate SFX/hits")
R["audio"]["voice_music_separation"] = U("Demucs not installed (heavy model download); bed level estimated from speech gaps instead")
os.remove(wav)

# ---------- J. shot-level text alignment ----------
for s_ in shots:
    ws = [x["w"] for x in WW if s_["start_s"] <= (x["s"] + x["e"]) / 2 < s_["end_s"]]
    s_["narration"] = " ".join(ws); s_["words"] = len(ws)
    oc = [" ".join(w_["t"] for w_ in o["words"]) for o in ocr if s_["start_s"] <= o["s"] < s_["end_s"] and o["words"]]
    s_["caption_ocr_first"] = oc[0] if oc else ""
durs = np.array([s_["dur_s"] for s_ in shots]); allmoves = [m for s_ in shots for m in s_["camera"]["moves"]]
R["shots_summary"] = {
    "count": M(len(shots), "histogram+pixel-difference cut detector (+ dissolve detector)"),
    "avg_shot_s": M(round(float(durs.mean()), 2), "detected shots"), "median_shot_s": M(round(float(np.median(durs)), 2), "detected shots"),
    "min_max_shot_s": M([round(float(durs.min()), 2), round(float(durs.max()), 2)], "detected shots"),
    "cuts_per_minute": M(round(len(shots) / dur * 60, 1), "detected shots"),
    "dissolves": E(len(dissolves), "sustained, monotonic change toward a dissimilar end frame (validated: see detector_validation)"), "fades_to_black": M([[round(a_ / fps, 2), round(b / fps, 2)] for a_, b in fades], "luma < 4 % inside a gradual change"), "white_flash_frames": M(flashes, "luma spike"),
    "camera_move_distribution": E({m: allmoves.count(m) for m in sorted(set(allmoves))}, "similarity-transform fit per frame (2.5D parallax makes push vs dolly indistinguishable)"),
    "share_of_shots_with_camera_motion": E(round(sum(1 for s_ in shots if s_["camera"]["moves"] != ["static/creep"]) / len(shots), 2), "as above"),
    "depth_layering": E("see sharpness_top_mid_bottom per shot: unequal band sharpness implies DOF/blurred layers", "Laplacian variance per horizontal third"),
    "character_actions_expressions": U("not measurable automatically here — read from shots/*.jpg and sheets/*.jpg (OBSERVED by reviewer)")}
# visual setups: a new composition when the image drifts far from the current anchor (catches fly-through camera moves
# that never cut). Windowed transitions: histogram distance between frames i-3 and i+3 (catches 2-6 frame whip/smear cuts).
a_, setup_starts = 0, [0]
for i in range(1, N):
    if cv2.compareHist(H_[a_], H_[i], cv2.HISTCMP_BHATTACHARYYA) > 0.45: a_ = i; setup_starts.append(i)
dg = np.zeros(N)
for i in range(3, N - 3): dg[i] = cv2.compareHist(H_[i - 3], H_[i + 3], cv2.HISTCMP_BHATTACHARYYA)
pkw, _ = signal.find_peaks(dg, height=np.maximum(0.30, signal.medfilt(dg, 61) * 3), distance=8)
R["shots_summary"]["visual_setups"] = E(len(setup_starts), "new composition when HSV-histogram drift from anchor > 0.45 (validated on v3.1: 56 setups for 36 coded shots)")
R["shots_summary"]["seconds_per_new_composition"] = E(round(dur / len(setup_starts), 2), "duration / visual setups")
R["shots_summary"]["windowed_transitions"] = E(int(len(pkw)), "peaks of hist distance(i-3, i+3); validated on v3.1: 32/35 cuts, 4 false")
R["shots_summary"]["setup_start_times_s"] = E([round(x / fps, 2) for x in setup_starts], "as above")
R["shots"] = shots

# ---------- K. detector validation against truth ----------
if truth:
    tc = [t0 for t0, _ in truth][1:]; dc = [s_["start_f"] for s_ in shots][1:]
    hit = sum(1 for c in tc if any(abs(c - x) <= 2 for x in dc)); fp = sum(1 for x in dc if not any(abs(c - x) <= 2 for c in tc))
    R["detector_validation"] = M({"true_cuts": len(tc), "detected": len(dc), "matched_within_2f": hit, "missed": len(tc) - hit, "false_positives": fp,
                                  "recall": round(hit / max(1, len(tc)), 3), "precision": round(hit / max(1, len(dc)), 3)}, "compared with known shot list")

# ---------- outputs ----------
json.dump(R, open(f"{out}/reference_report.json", "w"), indent=1)
with open(f"{out}/reference_timeline.csv", "w", newline="") as fh:
    wr = csv.writer(fh); wr.writerow(["shot", "start_s", "end_s", "dur_s", "transition_in", "camera_moves", "zoom_total", "pan_px", "tilt_px", "speed_profile", "subject_motion_p90_px", "sharp_top", "sharp_mid", "sharp_bottom", "words", "narration", "caption_ocr"])
    for s_ in shots:
        c = s_["camera"]; wr.writerow([s_["id"], s_["start_s"], s_["end_s"], s_["dur_s"], s_["transition_in"], "+".join(c["moves"]), c["zoom_total"], c["pan_px"], c["tilt_px"], c["speed_profile"], c["subject_motion_p90_px"], *s_["sharpness_top_mid_bottom"], s_["words"], s_["narration"], s_["caption_ocr_first"]])
with open(f"{out}/reference_storyboard.md", "w") as fh:
    fh.write(f"# Reference storyboard — {R['file']}\nAuto-generated by refscan.py. Camera labels are ESTIMATED (2D similarity fit); narration is ASR (ESTIMATED).\n\n")
    fh.write("| # | Time | Dur | In | Frame | Camera (est.) | Subject motion | Narration (ASR) |\n|---|---|---|---|---|---|---|---|\n")
    for s_ in shots:
        fh.write(f"| {s_['id']} | {s_['start_s']:.2f}-{s_['end_s']:.2f} | {s_['dur_s']:.2f} | {s_['transition_in']} | ![](shots/{s_['id']:03d}.jpg) | {' + '.join(s_['camera']['moves'])} (zoom ×{s_['camera']['zoom_total']}, {s_['camera']['speed_profile']}) | {s_['camera']['subject_motion_p90_px']} px | {s_['narration']} |\n")
print(json.dumps({k: R[k] for k in ("specs", "shots_summary")}, indent=0)[:3000])
if truth: print(json.dumps(R["detector_validation"]))
