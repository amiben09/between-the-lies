#!/usr/bin/env python3
"""Final mix for BETWEEN THE LIES: voice + music + sfx -> mix.wav (48 kHz, 24-bit).

- Voice is cleaned (80 Hz high-pass, gentle presence lift, de-harsh) and stays the loudest element.
- Music and SFX are ducked under the voice with a smooth sidechain envelope (attack 60 ms, release 400 ms).
- The music sits at 0 dB relative trim and the SFX at -6 dB (channel standard). The master is normalized to -14 LUFS integrated
  with true peak <= -1 dBTP.

Usage: mix_drama.py --voice voice.wav --music music.wav [--sfx sfx.wav] -o mix.wav [--duck 9] [--music-db 0] [--sfx-db -6]
"""
from __future__ import annotations

import argparse
import logging
import os
import sys

import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "templates", "audio"))
from dsp import SR, dbg, hp, integrated, peq, read_wav, st, true_peak, write_wav  # noqa: E402

log = logging.getLogger("mix_drama")


def load(path: str, n: int | None = None) -> np.ndarray:
    x, sr = read_wav(path)
    if sr != SR:
        g = np.gcd(sr, SR)
        x = signal.resample_poly(x, SR // g, sr // g, axis=-1)
    x = st(x)
    if n is not None:
        x = x[:, :n] if x.shape[1] >= n else np.pad(x, ((0, 0), (0, n - x.shape[1])))
    return x


def envelope(x: np.ndarray, att: float = 0.06, rel: float = 0.4) -> np.ndarray:
    """voice activity envelope 0..1 (RMS, smoothed with separate attack/release)"""
    mono = np.abs(x).mean(axis=0)
    hop = 240
    frames = np.sqrt(np.add.reduceat(mono ** 2, np.arange(0, len(mono), hop)) / hop)
    thr = np.percentile(frames[frames > 0], 30) if np.any(frames > 0) else 1.0
    gate = np.clip(frames / (thr * 3 + 1e-9), 0, 1)
    a, r = np.exp(-hop / (SR * att)), np.exp(-hop / (SR * rel))
    out = np.zeros_like(gate)
    s = 0.0
    for i, g in enumerate(gate):
        s = a * s + (1 - a) * g if g > s else r * s + (1 - r) * g
        out[i] = s
    return np.interp(np.arange(len(mono)), np.arange(len(out)) * hop, out)


def limiter(x: np.ndarray, ceiling_db: float = -1.5, look: float = 0.005, release: float = 0.08) -> np.ndarray:
    """lookahead brick-wall peak limiter (stereo-linked, 4x-oversampled peak detection)"""
    c = dbg(ceiling_db)
    up = signal.resample_poly(x, 4, 1, axis=-1)
    pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    pk = np.pad(pk, (0, x.shape[1] - len(pk)), constant_values=0)
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    L = max(1, int(look * SR))
    # lookahead: each sample takes the minimum gain of the next L samples
    padded = np.pad(need, (0, L), constant_values=1.0)
    from numpy.lib.stride_tricks import sliding_window_view
    g_min = sliding_window_view(padded, L + 1).min(axis=1)[: len(need)]
    rel = np.exp(-1.0 / (release * SR))
    g = np.empty_like(g_min)
    cur = 1.0
    for i, v in enumerate(g_min):
        cur = v if v < cur else rel * cur + (1 - rel) * v
        g[i] = cur
    return x * g[None, :]


def clean_voice(v: np.ndarray) -> np.ndarray:
    v = hp(v, 80, 2)
    v = peq(v, 3200, 2.0, 0.9)     # presence
    v = peq(v, 6500, -2.0, 2.0)    # de-harsh
    v = peq(v, 250, -1.5, 1.0)     # de-mud
    return v


def main() -> int:
    ap = argparse.ArgumentParser(description="Mix voice, music and SFX for a BETWEEN THE LIES episode.")
    ap.add_argument("--voice", required=True)
    ap.add_argument("--music", required=True)
    ap.add_argument("--sfx")
    ap.add_argument("-o", "--out", default="mix.wav")
    ap.add_argument("--duck", type=float, default=9.0, help="dB of ducking under speech (default 9)")
    ap.add_argument("--music-db", type=float, default=0.0)
    ap.add_argument("--sfx-db", type=float, default=-6.0)
    ap.add_argument("--target", type=float, default=-14.0, help="integrated LUFS (default -14)")
    ap.add_argument("--stems", help="also write ducked stems into this folder")
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()
    logging.basicConfig(level=logging.INFO if a.verbose else logging.WARNING, format="%(name)s: %(message)s")
    try:
        voice = clean_voice(load(a.voice))
        n = max(voice.shape[1], load(a.music).shape[1])  # let the music tail ring out after the last word
        voice = np.pad(voice, ((0, 0), (0, n - voice.shape[1])))
        music = load(a.music, n)
        sfx = load(a.sfx, n) if a.sfx else np.zeros_like(voice)
    except (OSError, ValueError, EOFError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    if integrated(voice) < -60:
        print("error: voice track is silent", file=sys.stderr)
        return 2
    # level the voice to a reference, then set the beds relative to it
    voice *= dbg(-16.0 - integrated(voice))
    env = envelope(voice)
    duck = dbg(-a.duck * env)[None, :]
    music_d = music * dbg(a.music_db) * duck * dbg(-23.0 - integrated(music) if integrated(music) > -70 else 0)
    sfx_d = sfx * dbg(a.sfx_db) * (0.5 + 0.5 * duck)
    if a.sfx and integrated(sfx) > -70:
        sfx_d *= dbg(-20.0 - integrated(sfx))
    mix = voice + music_d + sfx_d
    for it in range(4):  # loudness-normalize, limit, re-measure
        mix *= dbg(a.target - integrated(mix))
        mix = limiter(mix, -1.5)
        log.info("pass %d: %.2f LUFS, true peak %.2f dBTP", it + 1, integrated(mix), true_peak(mix))
        if abs(integrated(mix) - a.target) < 0.3:
            break
    tp = true_peak(mix)
    if tp > -1.0:
        mix *= dbg(-1.0 - tp)
    write_wav(a.out, mix)
    if a.stems:
        os.makedirs(a.stems, exist_ok=True)
        k = dbg(a.target - integrated(voice + music_d + sfx_d))
        for name, x in (("voice", voice), ("music", music_d), ("sfx", sfx_d)):
            write_wav(os.path.join(a.stems, f"{name}.wav"), x * k)
    print(f"wrote {a.out}: {n / SR:.2f} s, {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP, duck {a.duck} dB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
