# Backrooms / dreamcore music bed (original, fully synthesized, no samples).
# Replaces the music stem of an episode and re-mixes it with the existing voice / ambience / sfx stems.
# usage: python3 score_dreamcore.py <audio_dir with stem_*.wav> <beats.json> <out_dir>
# Palette: fluorescent-light hum, a slowed detuned music-box lullaby with tape wow/flutter, a muffled
# "empty mall" electric-piano through a wall, reversed swells, vinyl/tape hiss, huge washed reverb.
import json, os, sys
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
adir, beats_p, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
voice, _ = sf.read(f"{adir}/stem_voice.wav", dtype="float32")
amb, _ = sf.read(f"{adir}/stem_ambience.wav", dtype="float32")
sfx, _ = sf.read(f"{adir}/stem_sfx.wav", dtype="float32")
N = len(voice); D = N / SR
rng = np.random.default_rng(23)
B = {b["id"]: (b["start_s"], b["end_s"]) for b in json.load(open(beats_p))["beats"]}
def bt(i): return B[i][0]
def ix(t): return int(max(0, t) * SR)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, fc, o=2): b, a = signal.butter(o, min(fc, SR / 2 - 100) / (SR / 2), "low"); return signal.lfilter(b, a, x, axis=0)
def hp(x, fc, o=2): b, a = signal.butter(o, fc / (SR / 2), "high"); return signal.lfilter(b, a, x, axis=0)
def bp(x, lo, hi): b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return signal.lfilter(b, a, x, axis=0)
def env(n, a, r):
    e = np.ones(n); na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e
music = np.zeros((N, 2))
def add(x, t, g=1.0, pan=0.0):
    i = ix(t); x = np.asarray(x)[: max(0, N - i)]
    if len(x) == 0: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    music[i:i + len(x), 0] += x * g * l * 1.414; music[i:i + len(x), 1] += x * g * r * 1.414

# ---------- instruments ----------
def wow(n, depth=0.004, seed=0):
    """tape wow + flutter as a pitch multiplier"""
    t = np.arange(n) / SR; r_ = np.random.default_rng(seed)
    return 1 + depth * np.sin(2 * np.pi * 0.55 * t + r_.uniform(0, 6)) + depth * 0.3 * np.sin(2 * np.pi * 6.3 * t + r_.uniform(0, 6))
def musicbox(m, dur=2.6, vel=0.7, slow=1.0, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m) * slow * wow(n, 0.006, seed)
    ph = np.cumsum(2 * np.pi * f / SR)
    x = np.sin(ph) * np.exp(-t * 2.2) + 0.45 * np.sin(2.76 * ph) * np.exp(-t * 6) + 0.2 * np.sin(5.4 * ph) * np.exp(-t * 11)
    return lp(x * env(n, 0.003, 0.6) * vel, 4200) * 0.35
def epiano(ms, dur, vel=0.6, seed=0):
    """muffled 80s mall electric piano, as if from another room"""
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n); w = wow(n, 0.003, seed)
    for m in ms:
        ph = np.cumsum(2 * np.pi * mtof(m) * w / SR)
        x += (np.sin(ph + 1.2 * np.sin(ph) * np.exp(-t * 3)) * np.exp(-t * 0.9)) * 0.5
    return lp(x * env(n, 0.01, 1.2) * vel, 900, 3) * 0.45
def pad(ms, dur, bright=700, a=2.5, r=3.0, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n); w = wow(n, 0.004, seed)
    for m in ms:
        for d in (-0.006, 0, 0.007):
            x += signal.sawtooth(np.cumsum(2 * np.pi * mtof(m) * (1 + d) * w / SR) + rng.uniform(0, 6)) * 0.3
    return lp(x, bright, 3) * env(n, a, r) / (len(ms) * 3)
def hum(dur, g=1.0):
    """fluorescent ballast hum: 120 Hz + odd harmonics, with flicker dropouts"""
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * 120 * k * t) / k ** 1.3 for k in (1, 2, 3, 5, 7)) + bp(rng.standard_normal(n), 2500, 7000) * 0.08
    flick = np.ones(n)
    for t0 in rng.uniform(0, dur, int(dur / 3)):
        a = ix(t0); flick[a:a + int(rng.uniform(0.03, 0.12) * SR)] *= 0.25
    flick = lp(flick, 60)
    return x * flick * env(n, 1.0, 1.0) * 0.05 * g
def swell(dur=2.0, m=64):
    """reversed music-box note: rises out of nothing"""
    return musicbox(m, dur, 0.9, 1.0, seed=m)[::-1] * np.linspace(0, 1, int(dur * SR)) ** 2
def hiss(dur):
    n = int(dur * SR); x = hp(rng.standard_normal(n), 3000) * 0.012
    for t0 in rng.uniform(0, dur, int(dur * 6)):
        a = ix(t0); x[a:a + 40] += rng.uniform(-1, 1) * 0.15 * np.exp(-np.arange(min(40, n - a)) / 8)
    return x
def thump(dur, bpm=72, g=1.0):
    """four-on-the-floor heard through a wall"""
    n = int(dur * SR); x = np.zeros(n); k = int(0.4 * SR); tk = np.arange(k) / SR
    kick = np.sin(2 * np.pi * (55 + 60 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 9)
    for t0 in np.arange(0, dur, 60 / bpm):
        a = ix(t0); seg = kick[: max(0, n - a)]; x[a:a + len(seg)] += seg
    return lp(x, 160) * g * 0.5

# Powder's lullaby (same melody as the main score, slowed and warped)
THEME = [(0, 76), (0.32, 79), (0.64, 83), (0.96, 81), (1.28, 79), (1.6, 78), (1.92, 76), (2.56, 71)]
def lullaby(t0, step=1.6, slow=1.0, vel=0.6, g=1.0, tr=0, n=8, pan=0.25):
    for k, (dt, m) in enumerate(THEME[:n]): add(musicbox(m + tr, 3.0, vel, slow, seed=k), t0 + dt * step, g, pan)
CH = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [52, 55, 59, 62]]  # Cmaj7 Am7 Fmaj7 Em7 (mall loop)
def mall(t0, t1, g=1.0, bar=2.6):
    k = 0; t = t0
    while t < t1 - 0.5:
        add(epiano(CH[k % 4], min(bar + 1.2, t1 - t + 1.0), 0.6, seed=k), t, g, -0.15); t += bar; k += 1

# ---------- arrangement by section ----------
add(hum(D), 0, 1.0)                                   # the hum never leaves: you're always in the backrooms
add(hiss(D), 0, 1.0)
add(swell(2.2, 64), 0.0, 0.8)                         # HOOK: the lullaby rises backwards out of silence
lullaby(bt(1) + 1.2, step=1.9, slow=0.97, vel=0.5, g=0.8, n=6)
add(pad([48, 55, 64], bt(3) - bt(2) + 2, 600, 1.0, 2.0), bt(2), 0.9)
add(pad([60, 64, 67, 71, 74], bt(6) - bt(3) + 2, 1100, 2.0, 2.5, seed=3), bt(3), 0.9)   # WORLD: hazy major-7 glow
add(pad([36, 43, 48], bt(8) - bt(4) + 1, 400, 2.0, 2.0, seed=4), bt(4), 1.0)              # down into Zaun: lower, darker
mall(bt(8), bt(13), 1.0)                              # RELATIONSHIP: the "mall music from another room" loop
lullaby(bt(8) + 0.6, step=1.6, slow=1.0, vel=0.55, g=0.7)
lullaby(bt(11) + 0.3, step=1.5, slow=0.985, vel=0.45, g=0.6, tr=12, n=6, pan=-0.3)
add(pad([45, 52, 60, 63], bt(17) - bt(13) + 1, 500, 1.5, 0.3, seed=5), bt(13), 1.0)     # CONFLICT: minor, sinking
for k, t in enumerate(np.arange(bt(14), bt(17) - 0.5, 2.4)): add(swell(2.4, 64 - k), t, 0.7, (-1) ** k * 0.4)
lullaby(bt(15) + 0.2, step=1.3, slow=0.94, vel=0.5, g=0.6, n=6)                         # the theme detunes as she follows
# blast (bt 17): music cut to hum only, then a single warped note in the ash
add(musicbox(71, 4.0, 0.5, 0.9, seed=9), bt(18) + 0.3, 0.8)
add(pad([40, 47, 55], bt(21) - bt(19) + 1, 450, 2.0, 1.5, seed=6), bt(19), 0.9)
add(pad([45, 52, 57, 64], bt(24) - bt(21) + 1, 800, 2.0, 1.0, seed=7), bt(21), 0.9)     # TRANSFORMATION: Silco's embrace
add(thump(bt(27) - bt(23), 72, 1.0), bt(23), 1.0)                                       # a party through the wall
mall(bt(24), bt(27), 0.6, 2.0)
lullaby(bt(24) + 0.1, step=1.1, slow=0.9, vel=0.55, g=0.6, tr=-12, n=8)
add(pad([45, 48, 52], bt(30) - bt(27) + 1, 450, 1.5, 1.5, seed=8), bt(27), 0.9)        # REVELATION: hum, one low pad
lullaby(bt(28) + 0.4, step=2.0, slow=0.96, vel=0.4, g=0.55, n=5)
# PAYOFF: the full lullaby, then a tape-stop as the candles go out
lullaby(bt(30) + 0.1, step=1.7, slow=1.0, vel=0.55, g=0.85)
add(pad([60, 64, 67, 71, 74], D - bt(30), 900, 1.5, 3.0, seed=9), bt(30), 0.8)

# ---------- tape: wow on the whole bed, reverb wash, tape-stop at the end ----------
def tape_stop(x, t0, length):
    a = ix(t0); n = len(x) - a; L_ = int(length * SR)
    if n <= 0: return x
    rate = np.clip(1 - np.arange(n) / L_, 0.0, 1)  # playback speed falls to zero
    pos = a + np.cumsum(rate); pos = np.clip(pos, 0, len(x) - 1)
    y = x.copy()
    for c in range(x.shape[1]): y[a:, c] = np.interp(pos, np.arange(len(x)), x[:, c])
    return y
def ir(dur, damp, seed):
    n = int(dur * SR); t = np.arange(n) / SR; r_ = np.random.default_rng(seed)
    x = r_.standard_normal(n) * np.exp(-t * damp); return lp(x, 3500) / np.sqrt(np.sum(x ** 2))
for c, sd in ((0, 31), (1, 32)):
    music[:, c] = music[:, c] * 0.45 + signal.fftconvolve(music[:, c], ir(6.0, 0.9, sd))[:N] * 0.75   # cathedral-size wash
music = lp(music, 5500)
music = tape_stop(music, D - 3.2, 2.6)

# ---------- duck under the voice, level, mix ----------
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
vm = np.abs(voice if voice.ndim == 1 else voice.mean(1))
vact = lp(vm, 4) ; vact = np.clip(vact / (np.percentile(vact, 95) + 1e-9), 0, 1)
music *= (10 ** (-5 * vact / 20))[:, None]
spk = vm > np.percentile(vm, 60)
v2 = voice if voice.ndim == 2 else np.stack([voice, voice], 1)
music *= rms(v2[spk]) / rms(music[spk]) * 10 ** (-16 / 20)   # music sits 16 dB under the voice (louder than v1's -19: it is the point here)
fade = np.ones(N); nf = int(0.8 * SR); fade[-nf:] = np.linspace(1, 0, nf)
mix = (v2 + music + amb * 0.8 + sfx) * fade[:, None]
peak = np.abs(mix).max() * 1.05
sf.write(f"{out}/stem_music_dreamcore.wav", (music / max(1, peak)).astype(np.float32), SR, subtype="FLOAT")
sf.write(f"{out}/mix_dreamcore_premaster.wav", (mix / max(1, peak)).astype(np.float32), SR, subtype="FLOAT")
print("ok", round(D, 2), "s")
