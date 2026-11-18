# "Next Time" (Itachi) — original synthesized score, ambience and SFX keyed to beats.json/lines.json.
# All sound generated here (no samples). Usage: python score_itachi.py <voice.wav> <words.json> <lines.json> <outdir> <frames> <beats.json>
import json, sys, os
import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000
voice_p, words_p, lines_p, out, frames, beats_p = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5]), sys.argv[6]
os.makedirs(out, exist_ok=True)
v, vsr = sf.read(voice_p, dtype="float32")
if v.ndim > 1: v = v.mean(1)
v = signal.resample_poly(v, SR, vsr).astype(np.float32)
DUR = frames / 30; N = int(DUR * SR)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
W = json.load(open(words_p))["words"]; L = json.load(open(lines_p))
rng = np.random.default_rng(11)
cues = []
def ls(i): return L[i]["s"]
def le(i): return L[i]["e"]
def wt(li, word, n=0):
    m = [w for w in W if w["line"] == li and w["w"].lower().strip(".,?!'") == word.lower()]
    return m[n]["s"]
def ix(t): return int(max(0, t) * SR)
def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus; na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, sus, na) ** 1.5
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e
def lp(x, fc, o=2): b, a = signal.butter(o, min(fc, SR / 2 - 100) / (SR / 2), "low"); return signal.lfilter(b, a, x)
def hp(x, fc, o=2): b, a = signal.butter(o, fc / (SR / 2), "high"); return signal.lfilter(b, a, x)
def bp(x, lo, hi): b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return signal.lfilter(b, a, x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, x, t, gain=1.0, pan=0.0):
    i = ix(t); x = np.asarray(x)[: max(0, N - i)]
    if len(x) == 0: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l * 1.414; buf[i:i + len(x), 1] += x * gain * r * 1.414
def ir(dur, damp=3.0, seed=1):
    n = int(dur * SR); t = np.arange(n) / SR; r_ = np.random.default_rng(seed)
    x = r_.standard_normal(n) * np.exp(-t * damp); return lp(x, 6000) / np.sqrt(np.sum(x ** 2))
def reverb(stereo, dur=2.4, wet=0.3, damp=2.6):
    out_ = stereo.copy()
    for ch, sd in ((0, 3), (1, 4)):
        out_[:, ch] = stereo[:, ch] * (1 - wet) + signal.fftconvolve(stereo[:, ch], ir(dur, damp, sd))[:N] * wet * 0.6
    return out_

# ---------- instruments ----------
def piano(m, dur=3.0, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m); x = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 12000: break
        x += np.sin(2 * np.pi * fk * t) * (0.9 ** k) / k ** 0.6 * np.exp(-t * (1.2 + 0.9 * k) * (0.6 + f / 900))
    return lp(x * env(n, 0.004, 0.5) * vel, 3500 + 3000 * vel) * 0.35
def pad(ms, dur, bright=1200, a=1.5, r=2.0, det=0.004):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for d in (-det, 0, det): x += signal.sawtooth(2 * np.pi * mtof(m) * (1 + d) * t + rng.uniform(0, 6.28)) * 0.3
    return lp(x, bright) * env(n, a, r) / (len(ms) * 3) * 0.9
def strings(ms, dur, bright=1800, a=1.2, r=1.5, swell=0.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t + rng.uniform(0, 6.28)); ph = np.cumsum(2 * np.pi * mtof(m) * vib / SR)
        x += signal.sawtooth(ph) * 0.5 + signal.sawtooth(ph * 1.003) * 0.5
    x = lp(hp(x, 60), bright) * env(n, a, r)
    if swell: x *= np.linspace(1 - swell, 1, n)
    return x / len(ms) * 0.5
def heartbeat(t0, n=2, gap=0.85, gain=1.0, slow=1.0):
    buf = []
    t = t0
    for k in range(n):
        for dt, amp in ((0, 1.0), (0.24, 0.7)):
            m = int(0.35 * SR); tt = np.arange(m) / SR
            buf.append((t + dt, np.sin(2 * np.pi * 52 * tt * (1 - 0.25 * tt)) * np.exp(-tt * 14) * amp * gain))
        t += gap * (slow ** k)
    return buf
def impact(dur=2.5):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 46 * t * (1 - 0.3 * t)) * np.exp(-t * 2.0) + lp(rng.standard_normal(n), 280) * np.exp(-t * 6) * 0.8) * env(n, 0.003, 0.6) * 0.9
def shimmer(dur, base=84):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, m in enumerate([base, base + 7, base + 12, base + 16, base + 19]):
        x += np.sin(2 * np.pi * mtof(m) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + k * 0.7) * t + k)) / (k + 1.5)
    return x * env(n, 1.0, 1.4) * 0.25
def tone(m, dur, a=0.5, r=0.8, g=0.2): n = int(dur * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * mtof(m) * t) * env(n, a, r) * g
def noise(dur, lo, hi, g, a=0.6, r=0.8): n = int(dur * SR); return bp(rng.standard_normal(n), lo, hi) * env(n, a, r) * g
def whoosh(dur=0.8, lo=300, hi=2200):
    n = int(dur * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / dur) ** 2 * 0.3
def drips(dur, rate=0.7):
    n = int(dur * SR); x = np.zeros(n)
    for t0 in np.cumsum(rng.exponential(1 / rate, int(dur * rate * 2))):
        if t0 >= dur - 0.2: break
        m = int(0.12 * SR); tt = np.arange(m) / SR; f0 = rng.uniform(900, 1600)
        x[ix(t0):ix(t0) + m] += np.sin(2 * np.pi * f0 * tt * (1 + 2 * tt)) * np.exp(-tt * 40) * 0.5
    return x * env(n, 0.3, 0.5)
def muffled_shouting(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    syl = (np.sin(2 * np.pi * 3.6 * t) > 0.1) * (np.sin(2 * np.pi * 0.45 * t + 1) > -0.6)
    x = bp(rng.standard_normal(n), 180, 700) * lp(syl.astype(float), 12) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.2 * t))
    x += bp(rng.standard_normal(n), 400, 1100) * lp((np.sin(2 * np.pi * 2.9 * t + 2) > 0.4).astype(float), 10) * 0.5
    return lp(x, 900) * env(n, 0.3, 0.6) * 1.2
def birds(dur, n_=6):
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(n_):
        t0 = rng.uniform(0, dur - 0.6); m = int(0.18 * SR); tt = np.arange(m) / SR; f0 = rng.uniform(2800, 4200)
        for k in range(rng.integers(2, 4)):
            s = ix(t0 + k * 0.13)
            if s + m < n: x[s:s + m] += np.sin(2 * np.pi * (f0 + 900 * np.sin(2 * np.pi * 9 * tt)) * tt) * np.sin(np.pi * tt / 0.18) * 0.12
    return x
def water(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t) ** 2) * env(n, 0.5, 0.8) * 0.5
def crowd(dur, g=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 250, 1800) * (0.6 + 0.4 * lp(rng.standard_normal(n), 3) * 6) * env(n, 0.4, 0.6) * g
def laugh_bursts(dur):
    n = int(dur * SR); x = np.zeros(n)
    for t0 in np.arange(0.1, dur - 0.6, 0.55):
        m = int(rng.uniform(0.3, 0.6) * SR); tt = np.arange(m) / SR
        x[ix(t0):ix(t0) + m] += bp(rng.standard_normal(m), 500, 1600) * (np.sin(2 * np.pi * 7 * tt) > 0) * np.sin(np.pi * tt / tt[-1]) * rng.uniform(0.2, 0.45)
    return lp(x, 2500)
def wind(dur, g=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 150, 900) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * t) * np.sin(2 * np.pi * 0.07 * t + 1)) * env(n, 0.8, 0.8) * g
def fire(dur):
    n = int(dur * SR); x = lp(rng.standard_normal(n), 300) * 0.25
    pops = (rng.random(n) < 0.0009) * rng.uniform(0.2, 1, n); x += hp(signal.lfilter([1], [1, -0.9], pops), 1500) * 0.6
    return x * env(n, 0.4, 0.6) * 0.5
def clock(dur):
    n = int(dur * SR); x = np.zeros(n); m = int(0.03 * SR); tt = np.arange(m) / SR
    for k, t0 in enumerate(np.arange(0.2, dur, 1.0)):
        x[ix(t0):ix(t0) + m] += hp(rng.standard_normal(m), 2500) * np.exp(-tt * 200) * (0.5 if k % 2 else 0.35)
    return x
def bubbles(dur):
    n = int(dur * SR); x = np.zeros(n)
    for t0 in np.cumsum(rng.exponential(0.12, int(dur / 0.12 * 2))):
        if t0 >= dur - 0.1: break
        m = int(0.06 * SR); tt = np.arange(m) / SR; f0 = rng.uniform(250, 600)
        x[ix(t0):ix(t0) + m] += np.sin(2 * np.pi * f0 * tt * (1 + 6 * tt)) * np.exp(-tt * 50) * 0.3
    return lp(x, 2000) * env(n, 0.3, 0.5)
def creaks(dur):
    n = int(dur * SR); x = np.zeros(n)
    for t0 in (0.4, 1.6, 2.4):
        if t0 > dur - 0.6: break
        m = int(0.5 * SR); tt = np.arange(m) / SR
        x[ix(t0):ix(t0) + m] += bp(signal.sawtooth(2 * np.pi * (90 + 30 * np.sin(2 * np.pi * 3 * tt)) * tt), 200, 1200) * np.sin(np.pi * tt / 0.5) * 0.15
    return x
def steps(times, g=0.5, bright=1200):
    out_ = []
    for t0 in times:
        m = int(0.12 * SR); tt = np.arange(m) / SR
        out_.append((t0, lp(rng.standard_normal(m), bright) * np.exp(-tt * 45) * g + np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 30) * g * 0.8))
    return out_
def breath(dur=0.9, g=0.12):
    n = int(dur * SR); t = np.arange(n) / SR; return bp(rng.standard_normal(n), 600, 3000) * np.sin(np.pi * t / dur) ** 1.5 * g

music = np.zeros((N, 2)); amb = np.zeros((N, 2)); sfx = np.zeros((N, 2))

# ======================= Next Time — instruments (original, synthesized) =======================
B = {b["id"]: b["start_s"] for b in json.load(open(beats_p))["beats"]}
def bt(i, frames=0): return B[i] + frames / 30
music = np.zeros((N, 2)); amb = np.zeros((N, 2)); sfx = np.zeros((N, 2))
def koto(m, dur=2.5, vel=0.8):
    # Karplus-Strong plucked string with a bright attack
    f = mtof(m); n = int(dur * SR); p = int(SR / f); buf = rng.uniform(-1, 1, p) * vel; x = np.zeros(n)
    for i in range(n):
        x[i] = buf[i % p]; buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return lp(x, 5000) * env(n, 0.002, 0.4) * 0.5
def flute(m, dur, vel=0.6, a=0.25, r=0.5, bend=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.0 * t) * np.clip(t / 0.6, 0, 1); f = mtof(m) * vib * (1 + bend * np.clip(1 - t / 0.25, 0, 1))
    ph = np.cumsum(2 * np.pi * f / SR); x = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    breath_ = bp(rng.standard_normal(n), mtof(m) * 0.8, mtof(m) * 3) * 0.35
    return (x + breath_) * env(n, a, r) * vel * 0.3
def taiko(g=1.0, pitch=58):
    n = int(1.6 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * pitch * t * (1 - 0.18 * t)) * np.exp(-t * 4.5); skin = lp(rng.standard_normal(n), 900) * np.exp(-t * 22) * 0.6
    return (body + skin) * g * 0.9
def thunk(g=0.6):
    n = int(0.25 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 180 * t) * np.exp(-t * 40) + bp(rng.standard_normal(n), 800, 4000) * np.exp(-t * 60) * 0.7) * g
def tap(g=0.4):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 320 * t) * np.exp(-t * 70) + bp(rng.standard_normal(n), 1500, 5000) * np.exp(-t * 120) * 0.4) * g
def puff(g=0.3):
    n = int(0.35 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 400, 2500) * np.sin(np.pi * t / 0.35) ** 2 * np.exp(-t * 4) * g
def slide(dur=0.8, g=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 1200, 6000) * np.sin(np.pi * t / dur) * g
def rain(dur, g=0.5):
    n = int(dur * SR); x = hp(rng.standard_normal(n), 1800) * 0.25 + lp(rng.standard_normal(n), 500) * 0.3
    for t0 in rng.uniform(0, dur - 0.05, int(dur * 40)):
        m = int(0.02 * SR); tt = np.arange(m) / SR; x[ix(t0):ix(t0) + m] += np.sin(2 * np.pi * rng.uniform(2500, 6000) * tt) * np.exp(-tt * 300) * 0.25
    return x * env(n, 0.4, 0.6) * g
def thunder(g=0.9):
    n = int(3.5 * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 160) * (np.exp(-t * 1.4) + 0.6 * np.exp(-((t - 0.5) ** 2) * 6)) * env(n, 0.01, 1.0) * g * 2.5
def growl(dur, g=0.8):
    n = int(dur * SR); t = np.arange(n) / SR
    return (lp(rng.standard_normal(n), 120) * 2 + signal.sawtooth(2 * np.pi * (38 + 6 * np.sin(2 * np.pi * 0.7 * t)) * t) * 0.3) * env(n, 0.5, 0.8) * g
def crickets(dur, g=0.15):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (np.sin(2 * np.pi * 1.1 * t) > -0.2) * env(n, 0.4, 0.5) * g
def shing(g=0.3):
    n = int(2.2 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for r_, a_ in ((1, 1), (2.41, 0.6), (3.9, 0.4), (5.7, 0.25)): x += np.sin(2 * np.pi * 1180 * r_ * t * (1 + 0.002 * t)) * a_
    return x * np.exp(-t * 2.2) * env(n, 0.01, 0.5) * g * 0.4
def bell(m, dur=3.5, g=0.3):
    n = int(dur * SR); t = np.arange(n) / SR; f0 = mtof(m); x = np.zeros(n)
    for k, (r_, a_) in enumerate([(1, 1), (2.76, 0.5), (5.4, 0.3), (8.9, 0.15)]): x += np.sin(2 * np.pi * f0 * r_ * t) * a_ * np.exp(-t * (1.2 + k))
    return x * env(n, 0.002, 0.5) * g
def chime(m=86, g=0.35): return bell(m, 3.0, g)
def drone(ms, dur, g=1.0, bright=500): return pad(ms, dur, bright, 1.0, 1.5) * g

# hirajoshi-flavoured D minor pentatonic. The "Next Time" theme (koto): A Bb A F E D
THEME = [(0, 69), (0.38, 70), (0.76, 69), (1.14, 65), (1.52, 64), (2.28, 62)]
def theme(t0, inst="koto", tr=0, step=1.0, n=6, vel=0.8, gain=1.0, pan=-0.1):
    for dt, m in THEME[:n]:
        x = koto(m + tr, 2.4, vel) if inst == "koto" else flute(m + tr, 0.6 * step + 0.35, vel, 0.06, 0.25)
        add(music, x, t0 + dt * step, gain, pan)
D = DUR
# ===== HOOK (B1-B3) =====
add(sfx, taiko(1.0, 52), 0.03, 1.2); add(music, drone([38, 45, 50], bt(4) + 0.5, 1.0, 380), 0, 1)
add(amb, wind(bt(4), 0.5), 0, 1, -0.2); add(amb, fire(bt(2)), 0, 0.5, 0.4); add(amb, creaks(bt(2)), 0.3, 0.6, -0.4)
for t_, a_ in heartbeat(bt(2) + 0.1, 2, 0.8, 0.7): add(sfx, a_, t_, 1)
add(music, flute(62, 1.7, 0.45, 0.4, 0.6), bt(2) + 0.1, 0.8, 0.1)
add(sfx, shing(0.6), bt(3, 22), 1, 0.1); add(sfx, taiko(0.8, 46), bt(3, 22), 1)
cues = [f"0.00 taiko hit + low D drone, night wind, burning lantern crackle", f"{bt(2):.2f} heartbeat + lone flute (Sasuke)", f"{bt(3,22):.2f} metallic shing as the red eyes ignite + taiko"]
# ===== WORLD + RULES (B4-B10) =====
for k in range(0, 8): add(music, koto([62, 65, 69, 72][k % 4] + (0 if k < 4 else -5), 2.0, 0.6), bt(4) + k * 0.3, 0.8, 0.2 - 0.05 * k)
theme(bt(4) + 0.5, "flute", 12, 0.75, 6, 0.5, 0.7, 0.15)
add(music, pad([50, 57, 62, 65], bt(8) - bt(4), 1400, 0.8, 0.8), bt(4), 0.6)
for k in range(int((bt(8) - bt(4)) / 0.6)): add(sfx, taiko(0.25 if k % 2 else 0.4, 70), bt(4) + 0.3 + k * 0.6, 0.6)
add(amb, birds(bt(6) - bt(4), 8), bt(4), 1, 0.3); add(amb, water(bt(5) - bt(4)), bt(4), 0.5, 0.6)
add(sfx, whoosh(0.4, 900, 4000), bt(5, 22), 0.6, -0.2); add(sfx, thunk(0.9), bt(5, 38), 1, 0.1)
add(amb, crowd(bt(7) - bt(6), 0.25), bt(6), 1); add(sfx, slide(0.5, 0.15), bt(6, 20), 1, 0.3)
for t_, a_ in steps([bt(6) + 0.3 + k * 0.42 for k in range(6)], 0.25): add(sfx, a_, t_, 1, -0.3)
add(sfx, shing(0.5), bt(7, 14), 1); add(music, drone([38, 39, 45], bt(9) - bt(7) + 0.5, 1.0, 600), bt(7), 1.0)
add(amb, fire(bt(9) - bt(8)), bt(8), 1.6); add(amb, growl(bt(9) - bt(8) + 0.4, 1.0), bt(8), 1.2); add(sfx, taiko(1.0, 44), bt(8), 1.1); add(sfx, taiko(0.8, 48), bt(8) + 0.9, 1)
add(sfx, slide(0.7, 0.35), bt(9, 4), 1, 0.1); add(sfx, tap(0.45), bt(9, 31), 1); add(sfx, tap(0.45), bt(9, 43), 1)
add(music, strings([50, 53, 57], bt(11) - bt(9), 1100, 0.6, 0.6), bt(9), 0.8)
add(amb, fire(bt(11) - bt(10)), bt(10), 0.3, -0.3); add(sfx, thunk(1.0), bt(10, 48), 1); add(sfx, taiko(0.6, 50), bt(10, 48), 1)
cues += [f"{bt(4):.2f} WORLD: koto arpeggio + flute statement of the theme, light taiko pulse, birds, waterfall", f"{bt(5,38):.2f} practice knife thunk", f"{bt(7,14):.2f} shing (eyes) + dark drone", f"{bt(8):.2f} fire, monster growl, taiko", f"{bt(9,4):.2f} file slide + taps; {bt(10,48):.2f} knife stabs the map"]
# ===== RELATIONSHIP (B11-B15) — warm =====
add(music, pad([50, 57, 62, 66], bt(16) - bt(11) + 0.6, 1600, 1.0, 1.0), bt(11), 0.7)
theme(bt(11) + 0.3, "koto", 0, 1.0, 6, 0.8, 1.0)
add(amb, crickets(bt(13) - bt(11), 0.08), bt(11), 1, 0.4); add(amb, birds(bt(16) - bt(13), 5), bt(13), 0.8, -0.3)
for t_, a_ in steps([bt(12) + k * 0.2 for k in range(5)], 0.3, 2000): add(sfx, a_, t_, 1, 0.4)
add(amb, laugh_bursts(1.2), bt(12, 27), 0.25)
add(sfx, tap(0.35), bt(14, 18), 1); add(music, chime(86, 0.5), bt(14, 18), 1)
theme(bt(14) + 0.9, "koto", 12, 0.8, 4, 0.5, 0.6, 0.3)
cues += [f"{bt(11):.2f} RELATIONSHIP: warm pad + the 'Next Time' koto theme", f"{bt(14,18):.2f} forehead tap + chime (motif object #1)"]
# ===== CONFLICT (B16-B21) =====
add(music, drone([38, 41, 45], bt(20) - bt(16), 1.0, 450), bt(16), 1)
add(amb, crickets(bt(17) - bt(16), 0.1), bt(16), 1); add(amb, muffled_shouting(bt(17) - bt(16)), bt(16), 0.3)
for k in range(int((bt(18) - bt(16)) / 0.75)): add(sfx, taiko(0.3, 64), bt(16) + k * 0.75, 0.5)
add(sfx, slide(1.3, 0.3), bt(17, 10), 1, -0.2)
add(music, strings([50, 53, 57, 60], bt(20) - bt(18), 1500, 1.5, 0.8, 0.4), bt(18), 0.9); add(amb, wind(bt(20) - bt(18), 0.5), bt(18), 1)
add(music, flute(69, 1.1, 0.5, 0.2, 0.4, 0.03), bt(19) + 0.4, 0.8); add(music, flute(65, 1.0, 0.45), bt(19) + 1.4, 0.8); add(music, flute(62, 1.6, 0.4), bt(19) + 2.3, 0.8)
add(sfx, breath(0.9, 0.2), bt(19, 64), 1)
for k in range(10): add(sfx, puff(0.25 + 0.03 * k), bt(20) + k * 0.085, 1, -0.8 + 0.16 * k)
add(sfx, chime(74, 0.5), bt(21) + 0.05, 1); add(sfx, taiko(0.7, 40), bt(21) + 0.05, 1)
for t_, a_ in heartbeat(bt(21) + 0.5, 1, 0.8, 0.9): add(sfx, a_, t_, 1)
cues += [f"{bt(16):.2f} CONFLICT: low drone, crickets, muffled meeting, slow taiko", f"{bt(17,10):.2f} sealed scroll slides", f"{bt(19):.2f} lone flute (the tear)", f"{bt(20):.2f} lanterns puff out one by one (music drops away)", f"{bt(21):.2f} 'Except one': low bell + heartbeat in near silence"]
# ===== TRANSFORMATION (B22-B26) =====
add(sfx, shing(0.35), bt(22), 1)
for t_, a_ in heartbeat(bt(22) + 0.2, 3, 0.65, 0.8): add(sfx, a_, t_, 1)
add(music, strings([49, 50, 56], bt(24) - bt(23) + 0.4, 900, 0.3, 0.5), bt(23), 1.0); add(sfx, taiko(0.7, 44), bt(23), 1)
add(amb, rain(bt(27) - bt(24), 0.7), bt(24), 1)
for k in range(41):
    if np.sin(k * 0.75) > 0.2 and np.sin((k - 1) * 0.75) <= 0.2: add(sfx, thunk(0.7), bt(24, k), 1, -0.1)
add(sfx, thunk(1.0), bt(24, 30), 1); add(sfx, slide(0.3, 0.4), bt(24, 30), 1)
add(sfx, slide(0.6, 0.12), bt(25, 10), 1, 0.3); add(sfx, slide(0.6, 0.12), bt(25, 50), 1, 0.3)
theme(bt(26) + 0.3, "koto", -12, 1.3, 5, 0.6, 0.7, -0.2); add(amb, wind(bt(27) - bt(26), 0.35), bt(26), 1)
add(music, pad([45, 52, 57], bt(27) - bt(24), 800, 1.0, 0.5), bt(24), 0.6)
cues += [f"{bt(22):.2f} TRANSFORMATION: blade ring + heartbeats", f"{bt(24):.2f} rain; punches on the post, wood cracks", f"{bt(26):.2f} the theme, low and slow, on an abandoned street"]
# ===== REVELATION (B27-B31) =====
add(amb, rain(bt(31) - bt(27) + 1.0, 0.9), bt(27), 1); add(sfx, thunder(1.0), bt(27, 18), 1); add(sfx, thunder(0.8), bt(28, 52), 1)
add(sfx, taiko(0.9, 46), bt(27), 1); add(music, drone([38, 45, 50], bt(29) - bt(27), 1.0, 500), bt(27), 1)
for k in range(3): add(sfx, breath(0.35, 0.25), bt(28, 20) + k * 0.25, 1)
for t_, a_ in steps([bt(28) + 0.2 + k * 0.7 for k in range(4)], 0.3, 900): add(sfx, a_, t_, 1, 0.2)
add(sfx, tap(0.35), bt(29, 15), 1); add(music, chime(86, 0.5), bt(29, 15), 1)
add(music, strings([50, 57, 62, 65], bt(31) - bt(29) + 0.8, 1300, 0.8, 1.0), bt(29) + 0.6, 0.8)
add(music, strings([46, 53, 58, 62], bt(32) - bt(30) + 1.0, 1200, 0.8, 1.2), bt(30), 0.9)
theme(bt(31) + 0.4, "flute", 0, 1.1, 6, 0.5, 0.9, 0.1); add(amb, wind(bt(32) - bt(31) + 1, 0.4), bt(31), 1); add(amb, crickets(bt(33) - bt(31), 0.07), bt(31), 1)
cues += [f"{bt(27):.2f} REVELATION: storm, thunder, taiko", f"{bt(29,15):.2f} the last forehead tap: SAME chime as {bt(14,18):.2f}", f"{bt(31):.2f} the theme on flute as Sasuke sits at the cliff"]
# ===== PAYOFF (B32-B33) =====
add(music, koto(62, 3.0, 0.6), bt(32) + 0.1, 0.8)
add(music, pad([50, 57, 62, 66, 69], D - bt(33), 1800, 0.6, 1.5), bt(33), 0.8); add(music, shimmer(D - bt(33), 86), bt(33), 0.6)
theme(bt(33) + 0.1, "koto", 0, 0.9, 6, 0.8, 1.0); add(sfx, tap(0.3), bt(33, 15), 1); add(music, chime(86, 0.4), bt(33, 15), 1)
add(amb, laugh_bursts(1.6), bt(33, 28), 0.2); add(amb, birds(D - bt(33), 5), bt(33), 0.7, 0.3)
add(music, bell(62, 4.0, 0.4), bt(33) + 2.6, 1)
cues += [f"{bt(33):.2f} PAYOFF: memory porch — full theme on koto, poke chime, soft laughter, birds; final bell, fade"]

# ---------- reverb, duck, levels ----------
music = reverb(music, 2.8, 0.32, 2.2); amb = reverb(amb, 1.4, 0.18, 4.0); sfx = reverb(sfx, 1.6, 0.2, 3.5)
vact = np.zeros(N)
for w in W: vact[ix(w["s"]):ix(w["e"]) + ix(0.08)] = 1
k = int(0.25 * SR); vact = np.convolve(vact, np.ones(k) / k, "same")
music *= (10 ** (-6 * np.clip(vact, 0, 1) / 20))[:, None]
amb *= (10 ** (-4 * np.clip(vact, 0, 1) / 20))[:, None]
sfx *= (10 ** (-2 * np.clip(vact, 0, 1) / 20))[:, None]
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
spk = vact > 0.5
v_r = rms(v[spk])
music *= v_r / rms(music[spk]) * 10 ** (-19 / 20)
amb *= v_r / rms(amb[spk]) * 10 ** (-25 / 20)
sfx *= v_r / max(rms(sfx), 1e-9) * 10 ** (-17 / 20)
fade = np.ones(N); nf = int(0.8 * SR); fade[-nf:] = np.linspace(1, 0, nf) ** 2
voice = np.stack([v, v], 1)
mix = (voice + music + amb + sfx) * fade[:, None]
peak = np.abs(mix).max() * 1.05
for name, x in [("stem_voice", voice), ("stem_music", music * fade[:, None]), ("stem_ambience", amb * fade[:, None]), ("stem_sfx", sfx * fade[:, None]), ("mix_premaster", mix)]:
    sf.write(f"{out}/{name}.wav", (x / max(1.0, peak)).astype(np.float32), SR, subtype="FLOAT")
open(f"{out}/cues.md", "w").write("# Audio cue sheet — Next Time (Itachi)\nAll music, ambience and SFX are synthesized in engine/audio-lib/score_itachi.py (original, no samples). Times in seconds.\n\n" + "\n".join(f"- {c}" for c in cues) + "\n")
db = lambda x: round(20 * np.log10(rms(x[spk]) / v_r), 1)
print("ok", round(N / SR, 2), "s | under speech dB: music", db(music), "ambience", db(amb))
