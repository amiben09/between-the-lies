# "Always" — original synthesized score + SFX + mix. All sound is generated here (no samples): rights-clean.
# Usage: python score_snape.py <voice.wav> <words.json> <outdir>
# Writes stem_voice.wav, stem_music.wav, stem_sfx.wav, mix_premaster.wav (48 kHz stereo) and cues.md.
import json, sys, os
import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000
voice_p, words_p, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
v, vsr = sf.read(voice_p, dtype="float32")
if v.ndim > 1: v = v.mean(1)
v = signal.resample_poly(v, SR, vsr).astype(np.float32)
DUR = 1660 / 30
N = int(DUR * SR)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
words = json.load(open(words_p))["words"]
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR
cues = []

def ix(t): return int(t * SR)
def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, sus, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def lp(x, fc, order=2): b, a = signal.butter(order, fc / (SR / 2), "low"); return signal.lfilter(b, a, x)
def hp(x, fc, order=2): b, a = signal.butter(order, fc / (SR / 2), "high"); return signal.lfilter(b, a, x)
def bp(x, lo, hi): b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return signal.lfilter(b, a, x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, x, t, gain=1.0, pan=0.0):
    i = ix(t); x = x[: max(0, N - i)]
    if len(x) == 0: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l * 1.414; buf[i:i + len(x), 1] += x * gain * r * 1.414

# ---------- instruments ----------
def piano(m, dur=3.0, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m); x = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 12000: break
        x += np.sin(2 * np.pi * fk * t) * (0.9 ** k) / k ** 0.6 * np.exp(-t * (1.2 + 0.9 * k) * (0.6 + f / 900))
    x *= env(n, 0.004, 0.4)
    return lp(x * vel, 3500 + 3000 * vel) * 0.35
def pad(ms, dur, bright=1200, a=1.5, r=2.0, det=0.004):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for d in (-det, 0, det):
            ph = 2 * np.pi * mtof(m) * (1 + d) * t + rng.uniform(0, 6.28)
            x += signal.sawtooth(ph) * 0.3
    x = lp(x, bright, 2) * env(n, a, r)
    return x / (len(ms) * 3) * 0.9
def strings(ms, dur, bright=1800, a=1.2, r=1.5):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t + rng.uniform(0, 6.28))
        ph = np.cumsum(2 * np.pi * mtof(m) * vib / SR)
        x += signal.sawtooth(ph) * 0.5 + signal.sawtooth(ph * 1.003) * 0.5
    x = lp(hp(x, 60), bright, 2) * env(n, a, r)
    return x / len(ms) * 0.5
def sub_pulse(times, m=33, dur=0.9):
    out_ = []
    for t0 in times:
        n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
        out_.append((t0, np.sin(2 * np.pi * f * t * (1 - 0.15 * t)) * np.exp(-t * 4.5) * env(n, 0.01, 0.2) * 0.9))
    return out_
def impact(dur=2.5):
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 48 * t * (1 - 0.3 * t)) * np.exp(-t * 2.2)
    nz = lp(rng.standard_normal(n), 300) * np.exp(-t * 6) * 0.8
    return (body + nz) * env(n, 0.003, 0.6) * 0.9
def shimmer(dur, base=84):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, m in enumerate([base, base + 7, base + 12, base + 16, base + 19]):
        x += np.sin(2 * np.pi * mtof(m) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + k * 0.7) * t + k)) / (k + 1.5)
    return x * env(n, 1.2, 1.5) * 0.25
def noise_bed(dur, lo, hi, gain, a=0.5, r=0.8):
    n = int(dur * SR); return bp(rng.standard_normal(n), lo, hi) * env(n, a, r) * gain
def rain(dur):
    n = int(dur * SR); x = hp(rng.standard_normal(n), 2500) * 0.25
    drops = (rng.random(n) < 0.0008) * rng.uniform(0.2, 1, n)
    x += lp(signal.lfilter([1], [1, -0.97], drops), 5000) * 0.5
    return x * env(n, 0.3, 0.3) * 0.35
def whoosh(dur=0.8):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 300, 2200) * np.sin(np.pi * t / dur) ** 2
    return x * 0.25

music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

# ---------- score (the motif: E5 D5 C5 G4 / A4 C5 B4 - "her theme") ----------
MOTIF = [(0, 76), (0.42, 74), (0.84, 72), (1.26, 67), (2.1, 69), (2.52, 72), (2.94, 71)]
def motif(t0, transpose=0, vel=0.8, step=1.0, n=7):
    for dt, m in MOTIF[:n]: add(music, piano(m + transpose, 3.2, vel), t0 + dt * step, 1.0, -0.15)

# 0-4.6 hook: near-silence, low heartbeat pulse
for t0, x in sub_pulse([0.2, 1.25, 2.3, 3.35]): add(music, x, t0, 0.55)
add(music, pad([45, 52], 5.2, 400, 1.0, 1.0), 0.0, 0.5); cues.append("0.0 hook: low heartbeat pulse + dark A pad")
# 4.6-13.3 memory: warm piano + pad
add(music, pad([60, 64, 67], 9.0, 1600, 1.2, 1.8), 4.6, 0.7, 0.1)
motif(5.0, 0, 0.75); motif(8.6, 0, 0.6, 1.0, 4)
add(music, piano(48, 4, 0.5), 4.9, 1, 0.2); add(music, piano(43, 4, 0.5), 8.5, 1, 0.2)
cues.append("4.6 memory: 'her theme' piano motif, warm C major pad")
# 13.3-17.9 sorted apart: pad turns minor, motif slower and incomplete
add(music, pad([57, 60, 64], 5.0, 1300, 0.8, 1.2), 13.3, 0.7)
for dt, m in [(0, 76), (0.9, 74), (1.8, 72), (3.2, 68)]: add(music, piano(m, 3, 0.55), 13.5 + dt, 1, -0.2)
cues.append("13.3 sorted apart: motif slows, ends on G#(dissonant), A minor pad")
# 17.9-22.4 betrayal: low strings, rising cluster; impact on 'word' (20.6)
add(music, strings([38, 45, 50, 51], 5.0, 1400, 1.0, 0.6), 17.9, 0.8)
add(sfx, impact(), 20.55, 0.9); cues.append("17.9 betrayal: low string cluster; 20.55 low impact on 'the one word'")
# 22.4-24.9 she walks away / he chose Voldemort: drop to drone; boom on 'Voldemort' (23.7)
add(music, pad([33, 40], 3.0, 300, 0.2, 1.0), 22.4, 0.9)
add(sfx, impact(3.0), 23.65, 1.0); add(sfx, whoosh(0.7), 23.35, 0.8)
cues.append("22.4 drone; 23.65 deep impact on 'Voldemort'")
# 24.9-29.4 prophecy: quicker pulse ostinato in D minor
for t0, x in sub_pulse(np.arange(24.9, 29.3, 0.55), 38, 0.5): add(music, x, t0, 0.45)
add(music, strings([50, 53, 57], 4.6, 1200, 0.8, 0.6), 24.9, 0.55)
add(music, strings([62, 63], 1.6, 2400, 0.3, 0.8), 27.8, 0.5); cues.append("24.9 prophecy ostinato; 27.8 high minor-second sting under 'Lily's son'")
# 29.4-32.3 begging: rising strings
add(music, strings([50, 57, 62, 65], 3.0, 2200, 1.5, 0.15), 29.4, 0.75)
add(sfx, noise_bed(3.0, 200, 900, 0.35), 29.4, 1.0); cues.append("29.4 begging: rising strings + hilltop wind")
# 32.3 'It wasn't enough': music STOPS. rain only.
add(sfx, rain(1.6), 32.25, 1.0); cues.append("32.3 music stops; rain only")
# 33.7-36.7 promise: sparse piano, two notes of the motif
add(music, piano(72, 4, 0.5), 33.8, 1); add(music, piano(67, 4, 0.45), 34.9, 1); add(music, pad([48, 55, 60], 3.2, 900, 1.0, 1.0), 33.7, 0.5)
cues.append("33.7 promise: two motif notes, soft pad")
# 36.7-42 cruelty: low dissonant cello drone
add(music, strings([36, 43, 49], 5.4, 900, 0.6, 0.8), 36.7, 0.75); cues.append("36.7 cruelty: low dissonant drone")
# 42-43.8 kept the promise: motif fragment
motif(42.15, -12, 0.55, 1.1, 3); cues.append("42.1 motif fragment, low register")
# 43.8-47.8 doe: silver shimmer swelling
add(music, shimmer(4.2, 84), 43.8, 0.9, 0.2); add(music, pad([57, 64, 69, 72], 4.0, 2500, 1.5, 0.5), 43.8, 0.55)
add(sfx, whoosh(1.2), 44.3, 0.6, 0.3); cues.append("43.8 doe Patronus: shimmer + bright pad")
# 47.8 'Always': silence, one piano note
add(music, piano(76, 5, 0.6), 47.85, 1); add(music, shimmer(2.0, 88), 47.9, 0.35); cues.append("47.85 'Always': single E5 + faint shimmer")
# 49.3-52.3 dying: low pad, dust
add(music, pad([45, 52, 57], 3.2, 600, 1.0, 1.0), 49.3, 0.55); cues.append("49.3 dying: low pad")
# 52.3-end: the motif returns, complete, warm — resolves to C and rings out
add(music, pad([60, 64, 67, 71], 3.4, 1400, 1.0, 2.2), 52.3, 0.7)
motif(52.4, 0, 0.7, 0.62, 7); add(music, piano(48, 4, 0.5), 52.4, 1); add(music, piano(60, 3, 0.45), 54.2, 1)
cues.append("52.3 payoff: her theme returns complete, resolves to C major, rings into the fade")

# ---------- foley ----------
add(sfx, noise_bed(4.6, 80, 400, 0.08), 0, 1); cues.append("0.0 dungeon room tone")
add(sfx, noise_bed(8.5, 2000, 6000, 0.03), 4.8, 1, 0.3); cues.append("4.8 playground air (soft)")
add(sfx, rain(3.0), 29.3, 0.8)
add(sfx, noise_bed(2.8, 60, 300, 0.12), 49.3, 1); cues.append("49.3 shack room tone")

# ---------- duck music under the voice, set levels ----------
vact = np.zeros(N)
for w in words: vact[ix(w["s"]):ix(w["e"]) + ix(0.08)] = 1
k = int(0.25 * SR); vact = np.convolve(vact, np.ones(k) / k, "same")
duck = 10 ** (-6 * np.clip(vact, 0, 1) / 20)
music *= duck[:, None]; sfx *= (10 ** (-3 * np.clip(vact, 0, 1) / 20))[:, None]
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
speech = v[vact > 0.5]
v_r = rms(speech); m_r = rms(music[vact > 0.5]); s_r = rms(sfx)
music *= v_r / m_r * 10 ** (-19 / 20)  # music ~19 dB under speech while it speaks (after ducking)
voice = np.stack([v, v], 1)
mix = voice + music + sfx * (v_r / max(s_r, 1e-9)) * 10 ** (-22 / 20)
for name, x in [("stem_voice", voice), ("stem_music", music), ("stem_sfx", mix - voice - music), ("mix_premaster", mix)]:
    sf.write(f"{out}/{name}.wav", (x / max(1.0, np.abs(mix).max() * 1.05)).astype(np.float32), SR, subtype="FLOAT")
open(f"{out}/cues.md", "w").write("# Audio cue sheet — Always\nAll music and SFX synthesized in engine/audio-lib/score_snape.py (original, no samples).\n\n" + "\n".join(f"- {c}" for c in cues) + "\n")
print("ok", N / SR, "s; music under speech dB:", round(20 * np.log10(rms(music[vact > 0.5]) / v_r), 1))
