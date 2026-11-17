#!/usr/bin/env python3
"""Camera rhythm planner for BETWEEN THE LIES (reference-channel camera grammar, adapted).

Reads the shot list (07_shots.json) and the narration word timings (words.json) and writes per-shot camera keys:
  - a new framing every ~1.1-1.6 s, landing ON a word (clause starts and *accent* words preferred), so the picture
    changes with the voice instead of drifting;
  - each key is an ease-out burst (fast at the start, settles in ~9 frames), then a creeping push-in hold;
  - accent words get a punch-in (tighter framing, faster creep);
  - transitions: whip pans between shots (alternating direction), hard cuts where the shot has "cut": true,
    and a short white flash after the hook (first shot change).

Framing = {s: scale >= 1, fx, fy: focus point 0..1 of the frame}. The editor (studio/src/EpisodeCut.tsx) zooms around
the focus point, so the source clip is cropped, never letterboxed.

Usage: camera_plan.py 07_shots.json words.json -o 07_shots.json [--every 1.25] [--seed 3]
"""
from __future__ import annotations

import argparse
import json
import random
import sys

# framing palette: wide establishing -> medium -> close (focus biased to the upper-middle, where faces are)
WIDE = [(1.00, 0.50, 0.50), (1.06, 0.50, 0.45)]
MEDIUM = [(1.18, 0.42, 0.42), (1.18, 0.58, 0.42), (1.22, 0.50, 0.38), (1.16, 0.50, 0.58)]
CLOSE = [(1.38, 0.45, 0.36), (1.38, 0.55, 0.36), (1.45, 0.50, 0.40)]
PUNCH = 1.12  # extra scale on accent words (multiplies)


def pick_times(words: list[dict], a: float, b: float, every: float) -> list[tuple[float, bool]]:
    """key times inside [a, b): the shot start, then word starts spaced >= every*0.85, preferring clause starts / accents"""
    keys: list[tuple[float, bool]] = [(a, False)]
    inside = [w for w in words if a + 0.35 <= w["start"] < b - 0.45]
    last = a
    for i, w in enumerate(inside):
        gap = w["start"] - last
        prev = inside[i - 1]["word"] if i else ""
        clause = prev.endswith((",", ".", "?", "!", ";", ":"))
        accent = bool(w.get("accent"))
        if (gap >= every * 0.85 and (clause or accent)) or gap >= every * 1.35 or (accent and gap >= 0.6):
            keys.append((round(w["start"] - 0.03, 3), accent))  # land 1 frame before the word
            last = w["start"]
    return keys


def plan(shots: list[dict], words: list[dict], every: float, seed: int) -> list[dict]:
    rnd = random.Random(seed)
    out = []
    for i, s in enumerate(shots):
        times = pick_times(words, s["start"], s["end"], every)
        keys = []
        for k, (t, accent) in enumerate(times):
            if k == 0:
                sc, fx, fy = rnd.choice(WIDE if i % 3 == 0 else MEDIUM)
            else:
                pool = CLOSE if (k % 2 == 1 or accent) else MEDIUM
                sc, fx, fy = rnd.choice(pool)
                if keys and abs(sc - keys[-1]["s"]) < 0.05 and abs(fx - keys[-1]["fx"]) < 0.05:  # always a visible change
                    sc, fx, fy = rnd.choice([p for p in CLOSE + MEDIUM if p[1] != fx] or CLOSE)
            if accent:
                sc *= PUNCH
            keys.append({"t": round(t - s["start"], 3), "s": round(sc, 3), "fx": fx, "fy": fy, "punch": accent})
        s = dict(s)
        s["keys"] = keys
        s["whip"] = 0 if s.get("cut") or i == 0 else (1 if i % 2 else -1)
        out.append(s)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("shots")
    ap.add_argument("words")
    ap.add_argument("-o", "--out")
    ap.add_argument("--every", type=float, default=1.25, help="target seconds between reframes (default 1.25)")
    ap.add_argument("--seed", type=int, default=3)
    a = ap.parse_args()
    try:
        data = json.load(open(a.shots, encoding="utf-8"))
        words = json.load(open(a.words, encoding="utf-8"))
        if not data.get("shots"):
            raise ValueError("no shots in shot list")
        if not 0.6 <= a.every <= 4:
            raise ValueError("--every must be 0.6-4 s")
        data["shots"] = plan(data["shots"], words, a.every, a.seed)
        data["flashAfterHook"] = True
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    json.dump(data, open(a.out or a.shots, "w", encoding="utf-8"), indent=1)
    n = sum(len(s["keys"]) for s in data["shots"])
    dur = data["shots"][-1]["end"]
    print(f"{len(data['shots'])} shots, {n} framings -> one change every {dur / n:.2f} s; "
          f"{sum(1 for s in data['shots'] if s['whip'])} whip transitions, {sum(1 for s in data['shots'] for k in s['keys'] if k['punch'])} punch-ins")
    return 0


if __name__ == "__main__":
    sys.exit(main())
