#!/usr/bin/env python3
"""Build a score cue sheet from the voice's lines.json (made by engine/voice/tts.py).

Beat -> mood: HOOK hook | LOVE tender | CRACK tension | WOUND grief | TURN rise | REVELATION tension | PAYOFF resolve.
Gaps of >= 0.5 s between lines (the [beat] marks) become 'silence' sections. A hit lands on the first word of TURN and
of PAYOFF. Section edges sit 0.25 s before each beat's first word so the music turns with the voice.
Usage: auto_cue.py lines.json -o cue.json [--key 62] [--bpm 66] [--tail 1.2]
"""
import argparse, json, sys

MOOD = {"HOOK": "hook", "LOVE": "tender", "CRACK": "tension", "WOUND": "grief", "TURN": "rise",
        "REVELATION": "tension", "PAYOFF": "resolve"}
INTENSITY = {"HOOK": 0.6, "LOVE": 0.5, "CRACK": 0.6, "WOUND": 0.75, "TURN": 0.85, "REVELATION": 0.7, "PAYOFF": 0.5}


def build(spans, key, bpm, tail):
    if not spans:
        raise ValueError("lines.json is empty")
    for s in spans:
        if s.get("beat") not in MOOD:
            raise ValueError(f"line {s.get('line')}: beat '{s.get('beat')}' missing or unknown (re-run tts.py)")
    dur = round(spans[-1]["end"] + tail, 3)
    secs, hits = [], []
    cur = None
    for i, s in enumerate(spans):
        if i and s["start"] - spans[i - 1]["end"] >= 0.5:  # a [beat]: insert a silence
            a = round(spans[i - 1]["end"] + 0.1, 3)
            b = round(max(a + 0.2, s["start"] - 0.25), 3)
            secs.append({"start": a, "end": b, "mood": "silence"})
            cur = None
        if s["beat"] != cur:
            start = 0.0 if not secs else round(max(secs[-1]["start"] + 0.2, s["start"] - 0.25), 3)
            if s["beat"] in ("TURN", "PAYOFF") and s["start"] > 1:
                hits.append(round(s["start"] - 0.05, 3))
            secs.append({"start": start, "end": None, "mood": MOOD[s["beat"]], "intensity": INTENSITY[s["beat"]]})
            cur = s["beat"]
    for i in range(len(secs) - 1):
        secs[i]["end"] = secs[i + 1]["start"]
    secs[-1]["end"] = dur
    secs = [s for s in secs if s["end"] - s["start"] > 0.05]
    for i in range(1, len(secs)):
        secs[i]["start"] = secs[i - 1]["end"]
    return {"duration": dur, "key": key, "bpm": bpm, "seed": 7, "sections": secs, "hits": hits}


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("lines")
    ap.add_argument("-o", "--out", default="cue.json")
    ap.add_argument("--key", type=int, default=62)
    ap.add_argument("--bpm", type=float, default=66)
    ap.add_argument("--tail", type=float, default=1.2, help="music after the last word (s)")
    a = ap.parse_args()
    try:
        cue = build(json.load(open(a.lines, encoding="utf-8")), a.key, a.bpm, a.tail)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    json.dump(cue, open(a.out, "w"), indent=1)
    print(f"wrote {a.out}: {cue['duration']} s, {len(cue['sections'])} sections, hits at {cue['hits']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
