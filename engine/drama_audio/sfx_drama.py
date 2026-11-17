#!/usr/bin/env python3
"""Drama sound effects for BETWEEN THE LIES, synthesized here (owned outright, no licences).

Library (every function returns a stereo float array (2, n) at 48 kHz):
  rain_bed(dur, heavy)    window_rain(dur)     thunder(dist)        heartbeat(dur, bpm)
  clock_tick(dur)         breath(kind)         door_knock(n)        door_close()
  footsteps(dur, rate)    city_night(dur)      ice_crackle(dur)     glass_set()
  paper(dur)              candle_flicker(dur)  whoosh(dur)          tinnitus(dur)

CLI renders an event table to a stem:
  sfx_drama.py events.json -o sfx.wav
  events.json: {"duration": 63, "events": [{"t": 0.0, "fx": "rain_bed", "args": {"dur": 14}, "gain_db": -6, "pan": 0}]}
  sfx_drama.py --demo -o sfx_demo.wav     (every effect in sequence, for listening)
"""
from __future__ import annotations

import argparse
import inspect
import json
import logging
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "templates", "audio"))
from dsp import (SR, TAU, bp, colored, dbg, fades, hp, integrated, lp, modal, ns, pan, place, resbank,  # noqa: E402
                 rng, smooth_noise, true_peak, tt, widen, write_wav)
import sfx_gen as G  # noqa: E402  (engine library: whoosh, clink, creak)

log = logging.getLogger("sfx_drama")


def _drops(n: int, r, rate: float, lo: float, hi: float, amp: float = 1.0) -> np.ndarray:
    """sparse droplet impacts: short decaying resonant pings at random times"""
    y = np.zeros(n)
    k = r.poisson(rate * n / SR)
    for _ in range(k):
        i = r.integers(0, max(1, n - 2000))
        f = np.exp(r.uniform(np.log(lo), np.log(hi)))
        L = ns(0.03)
        t = np.arange(L) / SR
        y[i:i + L] += amp * r.uniform(0.2, 1) * np.sin(TAU * f * t * (1 + 0.4 * np.exp(-t / 0.004))) * np.exp(-t / 0.006)
    return y


def rain_bed(dur: float, heavy: float = 0.6, r=None) -> np.ndarray:
    r = r or rng(101)
    n = ns(dur)
    out = []
    for _ in range(2):
        hiss = bp(colored(n, r, 0.6), 400, 9000, 1) * (0.25 + 0.25 * heavy)
        hiss *= 1 + 0.15 * smooth_noise(n, r, 0.3)
        out.append(hiss + _drops(n, r, 60 + 300 * heavy, 1500, 6000, 0.35))
    return fades(np.stack(out), 0.8, 0.8)


def window_rain(dur: float, r=None) -> np.ndarray:
    """rain heard from inside: darker, with taps on the glass"""
    r = r or rng(102)
    n = ns(dur)
    bed = lp(rain_bed(dur, 0.5, r), 1800, 2) * 0.8
    taps = _drops(n, r, 25, 2500, 4500, 0.5)
    return fades(bed + pan(taps, 0.4) * 0.6, 0.8, 0.8)


def thunder(dist: float = 0.6, r=None) -> np.ndarray:
    """dist 0 = close crack, 1 = distant rumble"""
    r = r or rng(103)
    dur = 4.5 + 2 * dist
    n = ns(dur)
    t = tt(dur)
    rumble = lp(colored(n, r, 2.0), 180 + 400 * (1 - dist), 2)
    env = (1 - np.exp(-t / (0.02 + 0.3 * dist))) * np.exp(-t / (1.2 + dist))
    env *= 1 + 0.6 * np.abs(smooth_noise(n, r, 3.0))
    crack = hp(r.standard_normal(n), 1200) * np.exp(-t / 0.05) * (1 - dist) * 0.8
    return fades(widen(rumble * env + crack, r, 17, 0.8) * 0.9, 0.005, 0.5)


def heartbeat(dur: float, bpm: float = 62, r=None) -> np.ndarray:
    r = r or rng(104)
    n = ns(dur)
    y = np.zeros(n)
    period = 60.0 / bpm
    for k in range(int(dur / period) + 1):
        for off, a in ((0.0, 1.0), (0.28 * period, 0.6)):
            t0 = k * period + off
            if t0 >= dur:
                continue
            L = ns(0.18)
            t = np.arange(L) / SR
            f = 48 + 25 * np.exp(-t / 0.03)
            beat = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.06) * a
            i = ns(t0)
            y[i:i + L] += beat[: max(0, min(L, n - i))]
    return np.stack([y, y]) * 0.9


def clock_tick(dur: float, r=None) -> np.ndarray:
    r = r or rng(105)
    n = ns(dur)
    y = np.zeros(n)
    for k in range(int(dur)):
        tick = modal(0.05, [(3100 if k % 2 else 2700, 1.0, 0.004), (5200, 0.4, 0.002), (900, 0.3, 0.008)], r)
        i = ns(k + 0.02)
        y[i:i + len(tick)] += tick[: max(0, min(len(tick), n - i))]
    return pan(y * 0.35, 0.25)


def breath(kind: str = "shaky", r=None) -> np.ndarray:
    """kind: in | out | shaky | sob"""
    r = r or rng(106)
    if kind not in ("in", "out", "shaky", "sob"):
        raise ValueError("breath kind must be in|out|shaky|sob")
    dur = {"in": 1.1, "out": 1.3, "shaky": 2.2, "sob": 1.6}[kind]
    n = ns(dur)
    u = np.linspace(0, 1, n)
    env = np.sin(np.pi * u) ** 1.5
    if kind == "shaky":
        env *= 0.65 + 0.35 * np.abs(np.sin(TAU * 7 * u * dur / 2))
    if kind == "sob":
        env = np.concatenate([np.sin(np.pi * np.linspace(0, 1, n // 3)) ** 2] * 3)[:n]
        env = np.pad(env, (0, n - len(env)))
    z = r.standard_normal(n)
    lo, hi = (900, 3500) if kind in ("in", "sob") else (500, 2500)
    y = bp(z, lo, hi, 2) + 0.4 * bp(z, 2500, 6000, 1)
    return pan(fades(y * env * 0.25, 0.05, 0.1), 0.0)


def door_knock(count: int = 3, r=None) -> np.ndarray:
    r = r or rng(107)
    gap = 0.32
    n = ns(count * gap + 0.6)
    y = np.zeros(n)
    for k in range(count):
        hit = modal(0.35, [(165, 1.0, 0.07), (420, 0.5, 0.03), (980, 0.25, 0.012)], r)
        hit += lp(r.standard_normal(len(hit)), 2500) * np.exp(-np.arange(len(hit)) / SR / 0.004) * 0.6
        i = ns(k * gap + r.uniform(-0.015, 0.015) + 0.02)
        y[i:i + len(hit)] += hit[: max(0, min(len(hit), n - i))] * (1.0 if k < count - 1 else 1.15)
    return pan(y * 0.7, -0.2)


def door_close(r=None) -> np.ndarray:
    r = r or rng(108)
    cr = G.creak(0.7, r, 90, 140) * 0.25
    slam = modal(0.8, [(95, 1.0, 0.18), (240, 0.6, 0.08), (610, 0.3, 0.03)], r)
    slam += lp(r.standard_normal(len(slam)), 1500) * np.exp(-tt(0.8) / 0.01) * 0.5
    y = np.zeros(ns(1.6))
    y[: len(cr)] += cr
    i = ns(0.72)
    y[i:i + len(slam)] += slam[: len(y) - i]
    return pan(y * 0.8, 0.1)


def footsteps(dur: float, rate: float = 1.7, r=None, surface: str = "wood") -> np.ndarray:
    r = r or rng(109)
    n = ns(dur)
    y = np.zeros(n)
    modes = [(140, 1.0, 0.04), (380, 0.4, 0.015)] if surface == "wood" else [(90, 1.0, 0.02), (900, 0.2, 0.006)]
    k = 0
    while (t0 := k / rate + r.uniform(-0.02, 0.02)) < dur - 0.3:
        step = modal(0.25, modes, r) + bp(r.standard_normal(ns(0.25)), 800, 4000, 1) * np.exp(-tt(0.25) / 0.02) * 0.3
        i = ns(max(0, t0))
        y[i:i + len(step)] += step[: max(0, min(len(step), n - i))] * (0.8 + 0.2 * (k % 2))
        k += 1
    return pan(y * 0.5, 0.0)


def city_night(dur: float, r=None) -> np.ndarray:
    """distant city hum, far traffic swells, one far siren pass"""
    r = r or rng(110)
    n = ns(dur)
    hum = lp(colored(n, r, 1.6), 400, 2) * 0.25
    traffic = bp(colored(n, r, 1.0), 200, 1200, 1) * (0.1 + 0.08 * smooth_noise(n, r, 0.1))
    t = tt(dur)
    siren = np.zeros(n)
    if dur > 6:
        a = ns(dur * 0.4)
        ts = t[a:] - t[a]
        f = 700 + 250 * np.sin(TAU * 0.35 * ts)
        siren[a:] = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-((ts - 3) / 2.2) ** 2) * 0.03
    return fades(widen(hum + traffic + siren, r, 23, 0.9), 1.0, 1.0)


def ice_crackle(dur: float = 1.5, r=None) -> np.ndarray:
    r = r or rng(111)
    n = ns(dur)
    y = np.zeros(n)
    for _ in range(int(40 * dur)):
        c = G.clink(r, r.uniform(2500, 7000), 0.06, 0.6) * r.uniform(0.1, 0.5)
        i = r.integers(0, max(1, n - len(c)))
        y[i:i + len(c)] += c
    y += hp(colored(n, r, 0.3), 3000) * 0.04 * np.linspace(0.3, 1, n)
    return widen(fades(y * 0.6, 0.01, 0.2), r, 9, 0.7)


def glass_set(r=None) -> np.ndarray:
    r = r or rng(112)
    y = modal(1.2, [(1850, 1.0, 0.35), (4100, 0.5, 0.2), (6900, 0.25, 0.1)], r)
    y += lp(r.standard_normal(len(y)), 3000) * np.exp(-tt(1.2) / 0.003) * 0.4
    return pan(y * 0.35, 0.2)


def paper(dur: float = 0.8, r=None) -> np.ndarray:
    r = r or rng(113)
    n = ns(dur)
    env = np.abs(smooth_noise(n, r, 12)) ** 2
    return pan(bp(r.standard_normal(n), 1200, 8000, 1) * env * 0.4, -0.1)


def candle_flicker(dur: float, r=None) -> np.ndarray:
    r = r or rng(114)
    n = ns(dur)
    y = lp(colored(n, r, 1.0), 300, 2) * 0.06 * (1 + smooth_noise(n, r, 2.0))
    pops = np.zeros(n)
    for _ in range(int(dur * 0.8)):
        i = r.integers(0, max(1, n - 400))
        pops[i:i + 400] += hp(r.standard_normal(400), 2000) * np.exp(-np.arange(400) / 60) * 0.15
    return pan(y + pops, 0.0)


def whoosh(dur: float = 0.8, r=None) -> np.ndarray:
    r = r or rng(115)
    return np.asarray(G.whoosh(dur, r))


def tinnitus(dur: float = 3.0, f: float = 6200.0) -> np.ndarray:
    """shock ring after a hit; fades in fast, out slowly"""
    t = tt(dur)
    env = (1 - np.exp(-t / 0.05)) * np.exp(-t / (dur * 0.45))
    return pan(np.sin(TAU * f * t) * env * 0.03, 0.0)


LIBRARY = {name: fn for name, fn in globals().items()
           if callable(fn) and not name.startswith("_") and fn.__module__ == __name__ and name not in ("main", "render_events")}


def _stereo(x: np.ndarray) -> np.ndarray:
    x = np.asarray(x, float)
    return np.stack([x, x]) if x.ndim == 1 else x


def render_events(spec: dict) -> np.ndarray:
    dur = float(spec["duration"])
    buf = np.zeros((2, ns(dur)))
    for k, ev in enumerate(spec.get("events", [])):
        name = ev.get("fx")
        if name not in LIBRARY:
            raise ValueError(f"event {k}: unknown fx '{name}' (have: {', '.join(sorted(LIBRARY))})")
        args = dict(ev.get("args", {}))
        params = inspect.signature(LIBRARY[name]).parameters
        bad = [a for a in args if a not in params]
        if bad:
            raise ValueError(f"event {k}: {name} has no argument(s) {bad}")
        x = _stereo(LIBRARY[name](**args))
        p = float(ev.get("pan", 0.0))
        if p:
            x = pan(x.mean(axis=0), p)
        place(buf, x, float(ev["t"]), dbg(float(ev.get("gain_db", 0.0))))
        log.info("%6.2f s  %-15s %s", float(ev["t"]), name, args)
    return buf


def demo_spec() -> dict:
    seq = [("rain_bed", {"dur": 4}), ("window_rain", {"dur": 4}), ("thunder", {"dist": 0.3}), ("heartbeat", {"dur": 4}),
           ("clock_tick", {"dur": 4}), ("breath", {"kind": "shaky"}), ("breath", {"kind": "sob"}), ("door_knock", {"count": 3}),
           ("door_close", {}), ("footsteps", {"dur": 3}), ("city_night", {"dur": 6}), ("ice_crackle", {"dur": 2}),
           ("glass_set", {}), ("paper", {}), ("candle_flicker", {"dur": 3}), ("whoosh", {}), ("tinnitus", {"dur": 2})]
    t, events = 0.2, []
    for name, args in seq:
        events.append({"t": t, "fx": name, "args": args})
        t += {"thunder": 5.5, "city_night": 6.2}.get(name, float(args.get("dur", 2.0)) + 0.6)
    return {"duration": t + 1, "events": events}


def main() -> int:
    ap = argparse.ArgumentParser(description="Render BETWEEN THE LIES drama SFX from an event table.")
    ap.add_argument("events", nargs="?", help="events JSON")
    ap.add_argument("-o", "--out", default="sfx.wav")
    ap.add_argument("--demo", action="store_true", help="render every effect in sequence")
    ap.add_argument("--list", action="store_true", help="list available effects")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING, format="%(name)s: %(message)s")
    if args.list:
        for name, fn in sorted(LIBRARY.items()):
            print(f"{name}{inspect.signature(fn)}")
        return 0
    try:
        if args.demo:
            spec = demo_spec()
        elif args.events:
            with open(args.events, encoding="utf-8") as fh:
                spec = json.load(fh)
        else:
            ap.error("give an events JSON, --demo or --list")
        buf = render_events(spec)
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    tp = true_peak(buf)
    if tp > -1.0:
        buf *= dbg(-1.0 - tp)
    write_wav(args.out, buf)
    print(f"wrote {args.out}: {buf.shape[1] / SR:.1f} s, {integrated(buf):.1f} LUFS, true peak {true_peak(buf):.1f} dBTP")
    return 0


if __name__ == "__main__":
    sys.exit(main())
