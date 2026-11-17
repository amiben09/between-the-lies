# "Always" v2 — original synthesized score, ambience and emotional sound design, keyed to the voice timings.
# All sound generated here (no samples). Usage: python score_snape_v3.py <voice.wav> <words.json> <lines.json> <outdir> <frames>
import json, sys, os
import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000
voice_p, words_p, lines_p, out, frames = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
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
MOTIF = [(0, 76), (0.42, 74), (0.84, 72), (1.26, 67), (2.1, 69), (2.52, 72), (2.94, 71)]
def motif(t0, tr=0, vel=0.75, step=1.0, n=7, gain=1.0):
    for dt, m in MOTIF[:n]: add(music, piano(m + tr, 3.2, vel), t0 + dt * step, gain, -0.15)

T_END = DUR
def bell(m, dur=3.5, g=0.3):
    n = int(dur * SR); t = np.arange(n) / SR; f0 = mtof(m); x = np.zeros(n)
    for k, (r_, a_) in enumerate([(1, 1), (2.76, 0.5), (5.4, 0.3), (8.9, 0.15)]): x += np.sin(2 * np.pi * f0 * r_ * t) * a_ * np.exp(-t * (1.2 + k))
    return x * env(n, 0.002, 0.5) * g
# ===== 1 HOOK =====
t_then = wt(0, "then")
add(amb, water(t_then + 0.3), 0, 0.5, -0.3)
add(music, strings([50, 53, 57], t_then + 0.6, 1200, 0.3, 0.5), 0, 0.6)
add(music, piano(77, 3, 0.55), wt(0, "hurt") - 0.05, 1)
add(amb, noise(ls(1) - t_then, 60, 300, 0.10, 0.2, 0.5), t_then, 1); add(amb, drips(ls(1) - t_then), t_then, 0.8, 0.4)
for t0, x in steps([t_then + 0.1, t_then + 0.45, t_then + 0.8, t_then + 1.12]): add(sfx, x, t0, 0.9, 0.5)
add(music, pad([45, 52], ls(1) - t_then + 0.6, 380, 0.4, 0.8), t_then - 0.1, 0.55)
cues.append(f"0.00 hook: lake water + low minor strings, a single high F on 'hurt'; {t_then:.2f} dungeon drips, four footsteps, dark A pad")
# ===== 2 WORLD =====
t_young = wt(1, "young")
add(music, shimmer(2.2, 86), wt(1, "wizard") - 0.4, 0.8, 0.2)
add(music, pad([57, 64, 69, 72, 76], ls(2) - ls(1) + 1.0, 2600, 0.8, 1.0), ls(1) - 0.1, 0.6)   # wonder
add(amb, wind(ls(2) - t_young + 0.4, 0.25), t_young - 0.2, 1, -0.2)
for k, m in enumerate([69, 72, 76, 81]): add(music, piano(m, 3, 0.45), t_young + 0.1 + k * 0.38, 1, 0.2)
cues.append(f"{ls(1):.2f} world: shimmer on 'wizard', bright A-major 'wonder' pad; {t_young:.2f} castle: night wind + rising piano arpeggio")
# ===== 3 WORLD RULES =====
add(amb, crowd(ls(4) - ls(2) + 0.3, 0.15), ls(2) - 0.1, 1)
add(music, pad([57, 61, 64], ls(3) - ls(2) + 0.6, 1400, 0.5, 0.6), ls(2) - 0.1, 0.5)
add(music, shimmer(1.6, 84), wt(2, "inside") - 0.2, 0.5)
t_g, t_s, t_e = wt(3, "gryffindor"), wt(3, "slytherin"), wt(3, "enemies")
add(music, strings([48, 55, 60, 64], t_s - t_g + 0.3, 2600, 0.15, 0.4), t_g - 0.05, 0.7, -0.5)    # bright C major: the brave
add(music, strings([45, 48, 52, 53], t_e - t_s + 0.3, 1200, 0.15, 0.4), t_s - 0.05, 0.7, 0.5)    # dark A minor: the ambitious
add(sfx, impact(1.5), t_e - 0.05, 0.5)
add(music, strings([36, 43, 44], ls(4) - t_e + 0.2, 900, 0.1, 0.3), t_e, 0.6)
cues.append(f"{ls(2):.2f} sorting hat: hall murmur, shimmer on 'inside'; {t_g:.2f} bright major for Gryffindor; {t_s:.2f} dark minor for Slytherin; {t_e:.2f} hit on 'enemies'")
# ===== 4 CHARACTERS =====
add(amb, birds(ls(5) - ls(4), 8), ls(4), 1.0, 0.3)
add(music, pad([60, 64, 67], ls(5) - ls(4) + 0.8, 1600, 0.6, 0.8), ls(4) - 0.1, 0.7, 0.1)
motif(ls(4) + 0.1, 0, 0.72, 0.85)
add(music, shimmer(2.0, 88), wt(4, "bloom") - 0.2, 0.6, 0.3)
add(amb, crowd(ls(6) - ls(5), 0.15), ls(5), 1)
for dt, m in [(0, 76), (0.9, 74), (1.8, 72), (2.7, 68)]: add(music, piano(m, 3, 0.5), ls(5) + 0.1 + dt, 1, -0.2)
add(music, pad([57, 60, 64], ls(6) - ls(5) + 0.4, 1100, 0.4, 0.5), ls(5), 0.5)
cues.append(f"{ls(4):.2f} playground: birds, 'her theme' motif, shimmer on 'bloom'; {ls(5):.2f} the split: motif slows and sours (G#)")
# ===== 5 MAIN DRAMA =====
add(amb, water(ls(8) - ls(6) + 1), ls(6) - 0.2, 0.8, -0.3)
add(sfx, whoosh(0.7), wt(6, "humiliated") - 0.4, 0.9, 0.3)
add(amb, laugh_bursts(ls(7) - ls(6)), ls(6) + 0.3, 0.7, 0.2)
add(music, strings([38, 45, 50, 51], le(7) - ls(6) + 0.1, 1400, 1.0, 0.2, swell=0.6), ls(6) - 0.1, 0.75)
t_mud = wt(7, "mudblood")
add(sfx, impact(), t_mud - 0.05, 0.75)
add(music, tone(81, le(7) - t_mud + 0.8, 0.05, 0.6, 0.04), t_mud, 1, 0.1)
add(sfx, breath(0.7, 0.10), le(7) + 0.05, 1, -0.2)
cues.append(f"{ls(6):.2f} lake: water, whoosh, laughter, swelling low strings; {t_mud:.2f} impact on 'Mudblood'; strings cut; ring + caught breath in the pause")
t_and = wt(8, "and")
for t0, x in steps(np.arange(ls(8), t_and - 0.1, 0.45), 0.35, 900): add(sfx, x * np.linspace(1, 0.3, len(x)), t0, 0.7, 0.2)
for k in range(5): add(amb, bell(72 + (k % 2) * 4, 3.5, 0.25), t_and + k * 0.55, 0.5, 0.4)
mm = np.zeros((N, 2)); 
for dt, m in MOTIF: add(mm, piano(m + 12, 2.5, 0.5), t_and + 0.2 + dt * 0.7, 1, 0)
mm[:, 0] = lp(mm[:, 0], 1200); mm[:, 1] = lp(mm[:, 1], 1200); music += mm * 0.7
add(amb, crowd(ls(9) - t_and, 0.1), t_and, 1)
cues.append(f"{ls(8):.2f} receding footsteps; {t_and:.2f} wedding: distant bells and her theme muffled (heard from outside)")
add(sfx, impact(3.2), wt(9, "voldemort") - 0.05, 1.0); add(sfx, whoosh(0.9, 80, 600), wt(9, "voldemort") - 0.6, 0.8)
add(music, pad([33, 40], ls(10) - ls(9) + 1.2, 280, 0.2, 1.0), ls(9) - 0.1, 0.9)
cues.append(f"{wt(9, 'voldemort'):.2f} deep impact + drone on 'Voldemort'")
t_lily = wt(10, "lily's")
add(amb, noise(le(11) - ls(10), 40, 160, 0.10, 0.5, 0.8), ls(10), 1)
for t0 in np.arange(ls(10), t_lily - 0.4, 0.5):
    m = int(0.4 * SR); tt = np.arange(m) / SR; add(music, np.sin(2 * np.pi * mtof(38) * tt) * np.exp(-tt * 6) * 0.6, t0, 0.5)
add(music, strings([50, 53, 57], t_lily - ls(10), 1200, 0.8, 0.4), ls(10), 0.55)
for t0, x in heartbeat(t_lily - 0.15, 2, 0.6, 0.9): add(sfx, x, t0, 1.0)
add(music, tone(88, 2.2, 0.15, 1.4, 0.035), t_lily - 0.1, 1)
add(music, shimmer(0.9, 91), wt(10, "baby") - 0.05, 0.35)
cues.append(f"{ls(10):.2f} prophecy ostinato; {t_lily:.2f} heartbeats + ring; shimmer on the baby flash")
add(music, strings([50, 57, 62, 65], le(11) - ls(11) + 0.3, 2200, 1.2, 0.12, swell=0.7), ls(11) - 0.1, 0.75)
add(amb, wind(le(11) - ls(11) + 0.7, 0.5), ls(11) - 0.2, 1, -0.3)
cues.append(f"{ls(11):.2f} hilltop: rising strings + wind")
add(music, piano(45, 5, 0.45), ls(12) + 0.05, 1)
add(amb, clock(ls(13) - ls(12) + 0.5), ls(12) - 0.05, 0.7, 0.4); add(amb, fire(ls(14) - ls(12)), ls(12), 0.6, 0.5)
for t0 in (le(12) + 0.05, le(12) + 0.4): add(sfx, breath(0.33, 0.09), t0, 1, -0.1)
cues.append(f"{ls(12):.2f} 'It wasn't enough': music STOPS; low A, clock, fire, broken breaths")
add(music, pad([48, 55, 60], ls(14) - ls(13), 900, 1.0, 0.8), ls(13), 0.5)
add(music, piano(72, 4, 0.5), ls(13) + 0.1, 1); add(music, piano(67, 4, 0.45), wt(13, "protect"), 1)
add(music, piano(76, 3, 0.55), wt(13, "eyes"), 1, -0.1); add(music, shimmer(1.6, 91), wt(13, "eyes"), 0.35)
motif(ls(14) - 0.1, 0, 0.55, 0.9, 3)
add(music, strings([53, 54, 60], wt(14, "so") - wt(14, "james") + 0.6, 1500, 0.4, 0.5), wt(14, "james") - 0.1, 0.6)
t_so = wt(14, "so")
add(amb, bubbles(ls(16) - t_so + 0.3), t_so - 0.1, 0.8, 0.3); add(amb, noise(ls(16) - t_so, 60, 250, 0.08), t_so, 1)
for t0, x in steps(np.arange(t_so, t_so + 1.0, 0.36), 0.45): add(sfx, x, t0, 0.6, 0.4)
add(music, strings([36, 43, 49], ls(15) - t_so + 0.4, 900, 0.4, 0.4), t_so, 0.7)
add(music, tone(36, le(15) - ls(15) + 0.9, 0.3, 0.7, 0.12), ls(15) - 0.1, 1)
cues.append(f"{ls(13):.2f} promise; E on 'eyes'; {wt(14, 'james'):.2f} sour cluster on James; {t_so:.2f} classroom bubbles, footsteps, cello; {ls(15):.2f} one held low C")
# ===== 6 FINAL REVELATION =====
t_sev = wt(16, "severus")
add(music, shimmer(le(16) - t_sev + 2.2, 84), t_sev - 0.4, 0.9, 0.2)
add(music, pad([57, 64, 69, 72], le(16) - t_sev + 1.8, 2500, 1.0, 1.0), t_sev - 0.3, 0.55)
add(sfx, whoosh(1.3, 800, 5000), t_sev + 0.4, 0.6, 0.4)
add(amb, fire(le(16) - ls(16) + 0.5), ls(16), 0.4, 0.5)
add(music, strings([69, 76], le(17) - ls(17) + L[17]["pause_after"] - 0.1, 3000, 0.3, 0.5), ls(17) - 0.1, 0.35)
add(music, piano(76, 5, 0.6), ls(18) - 0.02, 1); add(music, shimmer(2.0, 88), ls(18), 0.3)
cues.append(f"{t_sev:.2f} doe: shimmer swell, silver whoosh; {ls(17):.2f} thin high strings; {ls(18):.2f} 'Always': single E5, then silence")
t_look = wt(19, "look")
add(amb, creaks(le(19) - ls(19) + 0.6), ls(19) - 0.1, 0.7, -0.2); add(amb, noise(ls(20) - ls(19) + 0.5, 50, 200, 0.07), ls(19), 1)
add(music, pad([45, 52, 57], t_look - ls(19) + 0.4, 600, 0.8, 0.6), ls(19), 0.5)
for t0, x in heartbeat(t_look - 0.05, 3, 0.7, 0.8, 1.35): add(sfx, x, t0, 1.0)
t_her = wt(20, "her")
add(music, pad([60, 64, 67, 71], T_END - ls(20) + 0.2, 1400, 1.2, 1.6), ls(20) - 0.1, 0.7)
motif(ls(20) + 0.1, 0, 0.7, 0.66, 7)
add(music, piano(48, 5, 0.5), ls(20) + 0.1, 1); add(music, piano(60, 4, 0.45), t_her, 1)
motif(L[20]["e"] + 0.4, 12, 0.5, 0.72, 4, 0.7)
add(music, piano(72, 4, 0.5), L[20]["e"] + 2.9, 1)
add(amb, birds(T_END - t_her, 6), t_her, 0.8, 0.3)
cues.append(f"{ls(19):.2f} shack creaks, slowing heartbeats at 'Look at me'; {ls(20):.2f} payoff: her theme complete + octave answer, birds return, fade")

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
open(f"{out}/cues.md", "w").write("# Audio cue sheet — Always v3\nAll music, ambience and SFX are synthesized in engine/audio-lib/score_snape_v3.py (original, no samples). Times in seconds.\n\n" + "\n".join(f"- {c}" for c in cues) + "\n")
db = lambda x: round(20 * np.log10(rms(x[spk]) / v_r), 1)
print("ok", round(N / SR, 2), "s | under speech dB: music", db(music), "ambience", db(amb))
