"""Drama instruments for BETWEEN THE LIES, all synthesized here (numpy/scipy, no samples, no third-party audio).

piano      - additive felt piano: inharmonic partials, two-stage decay, hammer thump, slight unison detune
strings    - string ensemble: 6 detuned saw voices per note, delayed vibrato, bowing noise, slow attack
cello_pulse- short bowed low-string pulse for tension ostinatos
sub_swell  - sine sub with a rising envelope (pre-hit lift)
braam_hit  - low cinematic impact: sub drop + filtered noise body + long tail
riser      - filtered-noise riser that sweeps up into a hit
"""
from __future__ import annotations

import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "templates", "audio"))
from dsp import SR, TAU, bp, fades, hp, lp, ns, phase, ramp, rng, shape, tt  # noqa: E402


def m2f(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12.0)


def piano(f: float, vel: float = 0.6, dur: float = 3.0, r=None, felt: float = 0.6) -> np.ndarray:
    """Felt piano note (mono). felt 0..1 darkens the tone and softens the attack."""
    r = r or rng(int(f * 10))
    t = tt(dur)
    B = 3.5e-4 * (f / 260.0) ** 0.6                # inharmonicity
    K = max(2, int(min(24, 6500 / f)))
    bright = 1.0 - 0.7 * felt
    y = np.zeros_like(t)
    for k in range(1, K + 1):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 16000:
            break
        amp = (1.0 / k ** (1.15 + 0.9 * felt)) * (0.55 + 0.45 * vel) ** (k * 0.35 / bright)
        t1 = 0.35 * (220 / f) ** 0.5 / (1 + 0.25 * k)        # fast prompt decay
        t2 = 2.8 * (220 / f) ** 0.55 / (1 + 0.12 * k)         # long after-sound
        env = 0.65 * np.exp(-t / t1) + 0.35 * np.exp(-t / t2)
        for det in (-0.6, 0.6):                               # two strings, beating
            fd = fk * 2 ** (det / 1200)
            y += 0.5 * amp * env * np.sin(TAU * fd * t + r.uniform(0, TAU))
    thump = lp(r.standard_normal(len(t)), 300 + 900 * bright) * np.exp(-t / 0.012) * 0.08
    y = (y + thump) * vel
    att = 0.002 + 0.006 * felt
    y *= 1 - np.exp(-t / att)
    return fades(y, 0.0005, 0.15)


def strings(freqs: list[float], dur: float, vel: float = 0.5, att: float = 1.2, rel: float = 1.5,
            r=None, warm: float = 2400.0, vib_delay: float = 0.6) -> np.ndarray:
    """Sustained string ensemble chord (stereo)."""
    r = r or rng(len(freqs) * 7 + int(dur * 13))
    n = ns(dur + rel)
    t = np.arange(n) / SR
    env = np.ones(n)
    a = ns(att)
    env[:a] = ramp(a) ** 1.4
    d = ns(dur)
    env[d:] *= ramp(n - d)[::-1] ** 1.2
    vib_env = np.clip((t - vib_delay) / 0.8, 0, 1)
    out = np.zeros((2, n))
    for f in freqs:
        for v in range(6):
            cents = r.uniform(-9, 9) + 9 * vib_env * np.sin(TAU * r.uniform(4.8, 5.8) * t + r.uniform(0, TAU))
            ph = phase(f * 2 ** (cents / 1200))
            K = max(1, int(min(40, 9000 / f)))
            y = np.zeros(n)
            for k in range(1, K + 1):
                y += (1 / k) / (1 + (k * f / warm) ** 2) * np.sin(k * ph)
            p = (v / 5.0) * 2 - 1
            th = (p * 0.8 + 1) * np.pi / 4
            out[0] += y * np.cos(th)
            out[1] += y * np.sin(th)
    bow = bp(r.standard_normal(n), 1500, 5000, 1) * 0.012 * env
    out += bow[None, :]
    out = lp(out, warm * 2.2, 2)
    return out * env[None, :] * vel / np.sqrt(len(freqs) * 6)


def cello_pulse(f: float, dur: float = 0.45, vel: float = 0.6, r=None) -> np.ndarray:
    """Short bowed low note with a fast swell and decay (mono), for tension ostinatos."""
    r = r or rng(int(f))
    n = ns(dur + 0.25)
    t = np.arange(n) / SR
    env = (1 - np.exp(-t / 0.03)) * np.exp(-np.maximum(t - dur * 0.5, 0) / (dur * 0.5))
    ph = phase(f * 2 ** (3 * np.sin(TAU * 5 * t) / 1200))
    y = np.zeros(n)
    for k in range(1, int(min(30, 5000 / f)) + 1):
        y += (1 / k) / (1 + (k * f / 1400) ** 2) * np.sin(k * ph)
    y += bp(r.standard_normal(n), 800, 3000, 1) * 0.03
    return fades(y * env * vel, 0.002, 0.05)


def sub_swell(f: float, dur: float, vel: float = 0.5) -> np.ndarray:
    t = tt(dur)
    env = (t / dur) ** 2.2
    return fades(np.sin(TAU * f * t) * env * vel, 0.01, 0.02)


def braam_hit(vel: float = 0.8, r=None, tail: float = 4.0) -> np.ndarray:
    """Low cinematic impact (stereo): sub pitch drop + dark noise body + long dark tail."""
    r = r or rng(91)
    t = tt(tail)
    f = 62 * np.exp(-t / 0.35) + 38
    sub = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 1.6)
    body = lp(r.standard_normal(len(t)), 420, 2) * np.exp(-t / 0.5) * 0.55
    crack = hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.01) * 0.2
    L = sub + body + crack
    R = sub + lp(r.standard_normal(len(t)), 420, 2) * np.exp(-t / 0.5) * 0.55 + crack
    return fades(np.stack([L, R]) * vel / 1.4, 0.0005, 0.5)


def riser(dur: float, vel: float = 0.5, r=None) -> np.ndarray:
    """Filtered noise rising into a hit (stereo): the cutoff sweeps 300 Hz -> 7.5 kHz."""
    r = r or rng(17)
    n = ns(dur)
    u = np.linspace(0, 1, n)

    def gain(T, F):
        fc = 300 * 25 ** np.clip(T / dur, 0, 1)
        return np.exp(-(F[:, None] / fc[None, :]) ** 2) * (F[:, None] > 120)

    out = np.stack([shape(r.standard_normal(n), gain) for _ in range(2)])
    return fades(out * (u ** 2.5)[None, :] * vel, 0.01, 0.005)
