#!/usr/bin/env python3
"""Original drama score generator for BETWEEN THE LIES.

Renders a full-length cue from a JSON cue sheet that follows the story beats. Everything is synthesized here,
so the music is 100 % owned by the channel (no licensing, no Content ID claims).

Cue sheet (JSON):
{
  "duration": 63.0,             # seconds, must equal the picture length
  "key": 62,                    # tonic MIDI note (62 = D); the score is in the natural minor of this tonic
  "bpm": 66,
  "seed": 7,
  "sections": [                 # contiguous, in order
    {"start": 0.0,  "end": 4.0,  "mood": "hook"},
    {"start": 4.0,  "end": 14.0, "mood": "tender"},
    {"start": 14.0, "end": 24.0, "mood": "tension"},
    {"start": 24.0, "end": 36.0, "mood": "grief"},
    {"start": 36.0, "end": 48.0, "mood": "rise"},
    {"start": 48.0, "end": 58.0, "mood": "silence"},
    {"start": 58.0, "end": 63.0, "mood": "resolve"}
  ],
  "hits": [36.0],               # impact hits (seconds), each gets a riser into it
  "out": "music.wav"
}
moods: hook | tender | tension | grief | rise | silence | resolve
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "templates", "audio"))
import drama_instruments as I  # noqa: E402
from dsp import SR, convolve_st, dbg, hp, integrated, make_ir, ns, pan, place, rng, true_peak, write_wav  # noqa: E402

log = logging.getLogger("score")
MOODS = {"hook", "tender", "tension", "grief", "rise", "silence", "resolve"}
# natural minor scale degrees (semitones from the tonic)
MINOR = [0, 2, 3, 5, 7, 8, 10]
# progressions as scale-degree roots (0 = i); each chord = root, third, fifth from the scale
PROG = {
    "hook": [0],
    "tender": [5, 2, 6, 3],        # VI - III - VII - iv  (warm, bittersweet)
    "tension": [0, 0, 5, 4],       # i - i - VI - v
    "grief": [0, 3, 5, 4],         # i - iv - VI - v
    "rise": [5, 6, 0, 0],          # VI - VII - i - i
    "resolve": [5, 0],             # VI - i
}


def chord(key: int, degree: int, octave: int = 0) -> list[int]:
    notes = []
    for step in (0, 2, 4):
        i = degree + step
        notes.append(key + MINOR[i % 7] + 12 * (i // 7) + 12 * octave)
    return notes


def validate(cue: dict) -> None:
    for k in ("duration", "key", "bpm", "sections"):
        if k not in cue:
            raise ValueError(f"cue sheet missing '{k}'")
    if not 10 <= float(cue["duration"]) <= 180:
        raise ValueError("duration must be 10-180 s")
    prev = 0.0
    for s in cue["sections"]:
        if s["mood"] not in MOODS:
            raise ValueError(f"unknown mood '{s['mood']}' (use {sorted(MOODS)})")
        if abs(s["start"] - prev) > 1e-6 or s["end"] <= s["start"]:
            raise ValueError(f"sections must be contiguous and increasing (at {s['start']})")
        prev = s["end"]
    if abs(prev - float(cue["duration"])) > 1e-6:
        raise ValueError("sections must end exactly at duration")


def render(cue: dict) -> np.ndarray:
    validate(cue)
    dur, key, bpm = float(cue["duration"]), int(cue["key"]), float(cue["bpm"])
    r = rng(int(cue.get("seed", 7)))
    beat = 60.0 / bpm
    bar = 4 * beat
    dry = np.zeros((2, ns(dur + 6)))
    pads = np.zeros_like(dry)

    for s in cue["sections"]:
        a, b, mood = float(s["start"]), float(s["end"]), s["mood"]
        inten = float(s.get("intensity", 0.6))
        log.info("section %5.1f-%5.1f %s", a, b, mood)
        if mood == "silence":
            continue
        prog = PROG[mood]
        t, i = a, 0
        while t < b - 0.05:
            deg = prog[i % len(prog)]
            ch = chord(key, deg)
            span = min(bar, b - t)
            if mood == "hook":
                place(dry, I.piano(I.m2f(key - 12), 0.75, 4.0, r), t, 0.9)
                place(dry, I.piano(I.m2f(key), 0.5, 4.0, r), t + 0.02, 0.6)
                place(pads, I.strings([I.m2f(key - 12), I.m2f(key - 5)], span, 0.35, att=0.4), t, 0.8)
                place(dry, I.sub_swell(I.m2f(key - 24), span, 0.35), t)
            elif mood == "tender":
                # broken-chord piano, one note per beat, plus a soft string bed
                arp = [ch[0], ch[1], ch[2], ch[1] + 12]
                for k, m in enumerate(arp):
                    tk = t + k * beat
                    if tk < b:
                        place(dry, pan(I.piano(I.m2f(m), 0.42 + 0.08 * r.uniform(), 3.0, r), -0.2 + 0.13 * k), tk)
                place(dry, I.piano(I.m2f(ch[0] - 12), 0.4, 4.0, r), t, 0.7)
                place(pads, I.strings([I.m2f(n) for n in ch], span, 0.22 * (0.6 + inten), att=1.0), t)
            elif mood == "tension":
                # low pulse on every half-beat, a single high piano note per bar
                for k in range(int(span / (beat / 2))):
                    tk = t + k * beat / 2
                    m = ch[0] - 24 + (1 if (k % 8) == 7 else 0)
                    place(dry, pan(I.cello_pulse(I.m2f(m), beat * 0.45, 0.45 + 0.15 * inten, r), -0.3), tk)
                place(dry, pan(I.piano(I.m2f(ch[2] + 12), 0.35, 3.0, r, felt=0.8), 0.3), t + beat)
                place(pads, I.strings([I.m2f(ch[0] - 12), I.m2f(ch[0] - 11)], span, 0.12 + 0.1 * inten, att=1.5), t)
            elif mood == "grief":
                place(dry, I.piano(I.m2f(ch[0] - 12), 0.5, 4.5, r), t, 0.8)
                for k, m in enumerate(ch):
                    place(dry, I.piano(I.m2f(m), 0.38, 4.5, r), t + 0.03 * k, 0.75)
                mel = ch[2] + 12 if i % 2 == 0 else ch[1] + 12
                place(dry, pan(I.piano(I.m2f(mel), 0.45, 3.5, r, felt=0.5), 0.15), t + 2 * beat)
                place(pads, I.strings([I.m2f(n - 12) for n in ch] + [I.m2f(ch[0])], span, 0.3 * (0.6 + inten), att=1.6), t)
            elif mood == "rise":
                u = (t - a) / max(b - a, 1e-6)
                for k in range(int(span / (beat / 2))):
                    tk = t + k * beat / 2
                    place(dry, pan(I.cello_pulse(I.m2f(ch[0] - 24), beat * 0.4, 0.4 + 0.4 * u, r), -0.3), tk)
                    place(dry, pan(I.cello_pulse(I.m2f(ch[0] - 12), beat * 0.4, 0.25 + 0.35 * u, r), 0.3), tk + beat / 4)
                place(pads, I.strings([I.m2f(n) for n in ch] + [I.m2f(ch[0] + 12)], span, 0.2 + 0.35 * u, att=0.8), t)
            elif mood == "resolve":
                place(dry, I.piano(I.m2f(ch[0] - 12), 0.4, 5.0, r), t, 0.7)
                for k, m in enumerate(ch):
                    place(dry, I.piano(I.m2f(m + 12), 0.3, 5.0, r, felt=0.8), t + 0.4 * k)
                place(pads, I.strings([I.m2f(n) for n in ch], span, 0.18, att=1.2, rel=2.5), t)
            t += span
            i += 1

    for h in cue.get("hits", []):
        h = float(h)
        if not 0 <= h < dur:
            raise ValueError(f"hit at {h} s is outside the cue")
        rl = min(2.0, h)
        if rl > 0.3:
            place(dry, I.riser(rl, 0.25, r), h - rl)
        place(dry, I.braam_hit(0.9, r), h)

    ir = make_ir(2.6, 5, hf=1.3, density_lp=9000)
    wet = convolve_st(dry, ir) * 0.32 + convolve_st(pads, ir) * 0.45
    mix = dry + pads * 0.9 + wet
    n = ns(dur)
    mix = hp(mix[:, :n], 35, 2)  # clean sub rumble below the musical range
    end_fade = ns(1.5)
    mix[:, -end_fade:] *= np.linspace(1, 0, end_fade) ** 2
    return mix


def main() -> int:
    ap = argparse.ArgumentParser(description="Render an original drama score from a cue sheet.")
    ap.add_argument("cue", help="cue sheet JSON")
    ap.add_argument("-o", "--out", help="output wav (overrides the cue's 'out')")
    ap.add_argument("--lufs", type=float, default=-20.0, help="integrated loudness of the music stem (default -20)")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING, format="%(name)s: %(message)s")
    try:
        with open(args.cue, encoding="utf-8") as fh:
            cue = json.load(fh)
        mix = render(cue)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    cur = integrated(mix)
    mix *= dbg(args.lufs - cur)
    tp = true_peak(mix)
    if tp > -1.0:
        mix *= dbg(-1.0 - tp)
    out = args.out or cue.get("out", "music.wav")
    write_wav(out, mix)
    print(f"wrote {out}: {mix.shape[1] / SR:.2f} s, {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP")
    return 0


if __name__ == "__main__":
    sys.exit(main())
