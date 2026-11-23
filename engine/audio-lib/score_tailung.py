# "The Scroll That Was Always Empty" (Tai Lung) — original synthesized score, ambience and SFX keyed to beats.json/lines.json.
# All sound generated here (no samples). Usage: python score_tailung.py <voice.wav> <words.json> <lines.json> <outdir> <frames> <beats.json>
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

# ======================= Tai Lung — original synthesized score =======================
# Instruments: guzheng-like pluck (koto KS), dizi-like flute, temple drum (taiko), bells, strings, pads. G major pentatonic.
# THE SCROLL THEME (original): D E G A B A G — rising like a hope, unresolved; its last note returns at the very end.
THEME = [(0, 62), (0.33, 64), (0.66, 67), (1.0, 69), (1.33, 71), (1.66, 69), (2.3, 67)]
def theme(t0, inst="koto", tr=0, step=1.0, n=7, vel=0.8, gain=1.0, pan=-0.1):
    for dt, m in THEME[:n]:
        x = koto(m + tr, 2.4, vel) if inst == "koto" else flute(m + tr, 0.6 * step + 0.35, vel, 0.06, 0.25)
        add(music, x, t0 + dt * step, gain, pan)
def gong(g=0.6, m=40):
    n = int(5 * SR); t = np.arange(n) / SR; f0 = mtof(m); x = np.zeros(n)
    for r_, a_ in ((1, 1), (1.47, 0.6), (2.09, 0.5), (2.56, 0.35), (3.9, 0.2)): x += np.sin(2 * np.pi * f0 * r_ * t * (1 + 0.004 * np.exp(-t))) * a_
    return x * np.exp(-t * 0.7) * env(n, 0.01, 1.0) * g * 0.35
def chains(dur, g=0.4):
    n = int(dur * SR); x = np.zeros(n)
    for t0 in rng.uniform(0, max(0.05, dur - 0.2), int(dur * 3)):
        m = int(0.15 * SR); tt = np.arange(m) / SR; f = rng.uniform(1800, 3200)
        x[ix(t0):ix(t0) + m] += (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.7 * tt)) * np.exp(-tt * 40) * 0.5
    return x * g
D = DUR
# ===== HOOK (B1-B2) =====
add(music, drone([43, 50, 55], bt(3) + 0.3, 1.0, 420), 0, 1); add(sfx, taiko(0.9, 50), 0.03, 1.1)
add(sfx, whoosh(0.35, 700, 3500), bt(1, 14), 0.5); add(sfx, thunk(0.6), bt(1, 30), 1)   # the strike lands, then the salute
add(amb, wind(bt(3), 0.35), 0, 1, -0.2)
for t_, a_ in heartbeat(bt(2) + 0.05, 2, 0.75, 0.8): add(sfx, a_, t_, 1)
add(music, flute(74, 1.4, 0.45, 0.3, 0.6), bt(2) + 0.1, 0.8, 0.1)
cues = [f"0.00 temple drum + low G drone, wind; {bt(1,30):.2f} strike lands", f"{bt(2):.2f} heartbeat + lone dizi note (the gold eye)"]
# ===== WORLD + RULES (B3-B6) =====
for k in range(8): add(music, koto([62, 64, 67, 69, 71, 69, 67, 64][k], 2.0, 0.6), bt(3) + k * 0.28, 0.8, 0.25 - 0.06 * k)
theme(bt(3) + 0.6, "flute", 12, 0.8, 7, 0.45, 0.6, 0.15)
add(music, pad([55, 62, 67, 71], bt(5) - bt(3), 1500, 0.8, 0.8), bt(3), 0.6)
add(amb, birds(bt(5) - bt(3), 8), bt(3), 1, 0.3); add(amb, water(bt(5) - bt(3)), bt(3), 0.4, -0.5)
for k in range(int((bt(5) - bt(4)) / 0.5)): add(sfx, taiko(0.22 if k % 2 else 0.35, 72), bt(4) + 0.2 + k * 0.5, 0.6)   # training rhythm on the summit
add(music, drone([43, 55, 62], bt(7) - bt(5), 1.0, 700), bt(5), 0.7); add(sfx, bell(79, 3.0, 0.35), bt(5) + 0.1, 1)  # the scroll
add(music, shimmer(bt(7) - bt(6) + 0.5, 86), bt(6), 0.9); add(music, strings([55, 59, 62, 67], bt(7) - bt(6) + 0.6, 1800, 1.2, 0.6, 0.5), bt(6), 0.8)
add(sfx, taiko(0.8, 46), bt(6, 50), 1)
cues += [f"{bt(3):.2f} WORLD: guzheng arpeggio, dizi states the Scroll theme, birds, river", f"{bt(4):.2f} training-drum pulse at the palace", f"{bt(5):.2f} temple bell for the scroll", f"{bt(6):.2f} golden shimmer + strings swell (the chosen hero)"]
# ===== RELATIONSHIP (B7-B11) — warm memory =====
add(amb, crickets(bt(9) - bt(7), 0.07), bt(7), 1, 0.3)
add(music, pad([55, 62, 66, 71], bt(12) - bt(7) + 0.5, 1700, 1.0, 1.0), bt(7), 0.75)
theme(bt(7) + 0.3, "koto", 0, 1.0, 7, 0.75, 1.0)
add(sfx, chime(91, 0.35), bt(8, 20), 1)                     # tiny paw grabs a finger
add(sfx, slide(0.6, 0.12), bt(9, 4), 1, 0.2); add(music, chime(86, 0.45), bt(9, 30), 1)   # the wrap is tied: MOTIF CHIME
for k in range(int((bt(11) - bt(10)) / 0.52)): add(sfx, thunk(0.35 + 0.1 * (k % 2)), bt(10) + 0.15 + k * 0.52, 1, 0.2 * ((k % 3) - 1))   # years of kata
theme(bt(10) + 0.2, "flute", 12, 0.7, 7, 0.4, 0.5, 0.2)
add(music, strings([55, 59, 62, 67, 71], bt(12) - bt(11) + 0.3, 2000, 0.5, 0.6), bt(11), 0.9)  # the smile
cues += [f"{bt(7):.2f} RELATIONSHIP: crickets, warm pad, the Scroll theme on guzheng", f"{bt(9,30):.2f} the wrap is tied — motif chime (returns at {bt(31):.0f}s)", f"{bt(10):.2f} kata hits through the years", f"{bt(11):.2f} warm string swell on Shifu's smile"]
# ===== CONFLICT (B12-B19) =====
add(sfx, tap(0.5), bt(12, 10), 1); add(music, drone([43, 46, 50], bt(15) - bt(12), 1.0, 380), bt(12), 1)   # staff tap, music drains
add(music, strings([43, 46, 50, 53], bt(15) - bt(13), 900, 0.6, 0.6), bt(13), 0.9); add(sfx, gong(0.7, 38), bt(13, 30), 1)  # "refused"
add(sfx, breath(0.7, 0.15), bt(14, 20), 1)
add(amb, fire(bt(17) - bt(15)), bt(15), 1.6); add(amb, muffled_shouting(bt(16) - bt(15)), bt(15), 0.35)
for k in range(4): add(sfx, taiko(0.9 - 0.1 * k, 44 + 2 * k), bt(15) + k * 0.6, 1)
add(sfx, impact(1.2), bt(15, 30), 0.5)
for t_, a_ in heartbeat(bt(16) + 0.1, 2, 0.6, 0.8): add(sfx, a_, t_, 1)
add(sfx, tap(0.6), bt(17, 2), 1); add(sfx, gong(0.6, 47), bt(17, 4), 1); add(sfx, thunk(0.9), bt(17, 24), 1)   # Oogway's touch, the fall
add(amb, drips(bt(20) - bt(18), 0.8), bt(18), 1); add(amb, chains(bt(20) - bt(18), 0.35), bt(18), 1, 0.2); add(amb, wind(bt(20) - bt(18), 0.25), bt(18), 1)
add(music, drone([38, 45, 50], bt(20) - bt(18), 1.0, 300), bt(18), 1); add(sfx, breath(0.9, 0.22), bt(19, 6), 1)
cues += [f"{bt(12,10):.2f} staff tap, music drains to a low drone", f"{bt(13,30):.2f} low gong on 'refused'", f"{bt(15):.2f} rampage: fire, shouting, drums", f"{bt(17,4):.2f} Oogway: gong + the fall", f"{bt(18):.2f} prison: drips, chains, cold drone, breath"]
# ===== TRANSFORMATION (B20-B23) =====
add(sfx, impact(1.5), bt(20), 0.8); add(sfx, chains(1.0, 0.8), bt(20), 1, 0.3); add(amb, wind(bt(22) - bt(20), 0.5), bt(20), 1)
for t_, a_ in steps([bt(20) + 0.2 + k * 0.28 for k in range(6)], 0.35, 900): add(sfx, a_, t_, 1)
theme(bt(21) + 0.05, "koto", -12, 0.6, 4, 0.6, 0.8, -0.2)   # the theme, low and broken, at the stairs
add(sfx, taiko(1.0, 42), bt(22, 6), 1.2); add(sfx, impact(1.8), bt(22, 6), 0.9); add(sfx, thunk(1.0), bt(22, 10), 1)
add(music, strings([43, 44, 50, 51], bt(24) - bt(23) + 0.2, 1100, 0.3, 0.3, 0.6), bt(23), 1.0); add(sfx, growl(bt(24) - bt(23), 0.5), bt(23), 0.6)
cues += [f"{bt(20):.2f} chains snap, running steps", f"{bt(21):.2f} the theme, low and broken, at the stairs", f"{bt(22,6):.2f} the blow: drum + impact", f"{bt(23):.2f} dissonant strings under the roar"]
# ===== REVELATION (B24-B30) =====
# music STOPS for Shifu's words; only room tone and a single note
add(amb, wind(bt(26) - bt(24), 0.12), bt(24), 1)
add(music, koto(67, 3.0, 0.5), bt(24) + 1.2, 0.7)
add(music, pad([55, 62, 67, 71], bt(26) - bt(25) + 0.4, 1500, 0.5, 0.6), bt(25), 0.6); theme(bt(25) + 0.1, "koto", 12, 0.5, 5, 0.4, 0.5, 0.2)   # the memory
for t_, a_ in steps([bt(26) + 0.4 + k * 0.45 for k in range(3)], 0.3, 900): add(sfx, a_, t_, 1)
add(sfx, slide(0.9, 0.3), bt(27, 2), 1); add(music, shimmer(bt(28) - bt(27) + 0.4, 88), bt(27), 1.0)
add(music, drone([55, 62], bt(30) - bt(28), 1.0, 900), bt(28), 0.4)   # blank: almost nothing
add(sfx, bell(67, 4.0, 0.25), bt(29) + 0.2, 1)
add(amb, wind(bt(31) - bt(30), 0.3), bt(30), 1); add(amb, creaks(bt(31) - bt(30)), bt(30), 0.4)
add(music, strings([50, 55, 59, 62], bt(31) - bt(30) + 0.5, 1200, 1.0, 0.8), bt(30), 0.7)
cues += [f"{bt(24):.2f} REVELATION: music stops for Shifu's words (room tone, one guzheng note)", f"{bt(25):.2f} the theme as a memory", f"{bt(27):.2f} scroll unrolls: shimmer", f"{bt(28):.2f} blank: near silence; {bt(29)+0.2:.2f} soft bell", f"{bt(30):.2f} aftermath: wind, creaks, restrained strings"]
# ===== PAYOFF (B31) =====
add(music, pad([55, 62, 67, 71, 74], D - bt(31), 1800, 0.8, 1.5), bt(31), 0.8)
theme(bt(31) + 0.3, "koto", 0, 1.15, 7, 0.75, 1.0)
add(music, chime(86, 0.45), bt(31) + 3.1, 1)                    # SAME chime as the tying of the wrap
add(music, flute(79, 2.2, 0.35, 0.5, 1.2), bt(31) + 4.0, 0.6, 0.15)
add(music, bell(55, 4.5, 0.35), bt(31) + 5.0, 1)
cues += [f"{bt(31):.2f} PAYOFF: the full theme on guzheng; {bt(31)+3.1:.2f} the wrap chime returns as Shifu's paw closes; final bell + fade"]
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
open(f"{out}/cues.md", "w").write("# Audio cue sheet — The Scroll That Was Always Empty (Tai Lung)\nAll music, ambience and SFX are synthesized in engine/audio-lib/score_tailung.py (original, no samples). Times in seconds.\n\n" + "\n".join(f"- {c}" for c in cues) + "\n")
db = lambda x: round(20 * np.log10(rms(x[spk]) / v_r), 1)
print("ok", round(N / SR, 2), "s | under speech dB: music", db(music), "ambience", db(amb))

