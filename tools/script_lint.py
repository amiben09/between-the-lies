#!/usr/bin/env python3
"""BETWEEN THE LIES script linter.

Checks a 04_script.md against the channel rules in references/story_formula.md and, optionally,
the recorded voice timings (words.json). Exit code 0 = no FAIL, 1 = at least one FAIL, 2 = usage/input error.

Script line format:  L<n> [<BEAT>] [<TAG>] sentence text
  BEAT: HOOK LOVE CRACK WOUND TURN REVELATION PAYOFF
  TAG:  CANON INTERP ORIGINAL UNVERIFIED
  A line containing only "[beat]" (or a sentence containing "[beat]") marks a 0.4-0.8 s silence.
Header fields: POV:, OBJECT:, PLANTS: L3, L5   TWIST: L12

words.json formats accepted: [{"word","start","end"}], WhisperX {"segments":[{"words":[...]}]},
whisper.cpp -ojf {"transcription":[{"tokens":[{"text","offsets":{"from","to"}}]}]} (ms).
"""
from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

BEATS = ["HOOK", "LOVE", "CRACK", "WOUND", "TURN", "REVELATION", "PAYOFF"]
TAGS = {"CANON", "INTERP", "ORIGINAL", "UNVERIFIED"}
BANNED_OPENERS = [r"^in this world", r"^once upon a time", r"^meet\b", r"^this is the story", r"^have you ever",
                  r"^imagine\b", r"^long ago", r"^there was once"]
MORAL_PATTERNS = [r"\bthe lesson\b", r"\bthat'?s why (we|you) should\b", r"\bremember,", r"\bmoral\b",
                  r"\blove is\b", r"\bnever forget\b", r"\bwe should all\b", r"\bin the end, love\b"]
SOFTENERS = [r"\bmaybe\b", r"\bperhaps\b", r"\bsome (fans|say|believe)\b", r"\bnever said\b", r"\bmight\b",
             r"\bcould have\b", r"\bpossibly\b", r"\bit'?s said\b", r"\btheory\b", r"\bwe'?ll never know\b"]
LINE_RE = re.compile(r"^L(\d+)\s*\[(\w+)\]\s*\[(\w+)\]\s*(.*)$")

log = logging.getLogger("script_lint")


@dataclass
class Line:
    n: int
    beat: str
    tag: str
    text: str


@dataclass
class Report:
    rows: list[tuple[str, str, str]] = field(default_factory=list)

    def add(self, level: str, check: str, msg: str) -> None:
        self.rows.append((level, check, msg))

    @property
    def fails(self) -> int:
        return sum(1 for r in self.rows if r[0] == "FAIL")

    def print(self) -> None:
        width = max((len(c) for _, c, _ in self.rows), default=10)
        for level, check, msg in self.rows:
            print(f"{level:<5} {check:<{width}}  {msg}")
        warns = sum(1 for r in self.rows if r[0] == "WARN")
        print(f"\nRESULT: {self.fails} FAIL, {warns} WARN, {len(self.rows) - self.fails - warns} PASS")


def words_of(text: str) -> list[str]:
    clean = re.sub(r"\[beat\]", " ", text, flags=re.I)
    return re.findall(r"[A-Za-z0-9]+(?:['’][A-Za-z]+)?", clean)


def parse_script(path: Path) -> tuple[dict[str, str], list[Line], int]:
    header: dict[str, str] = {}
    lines: list[Line] = []
    beats = 0
    for raw in path.read_text(encoding="utf-8").splitlines():
        s = raw.strip()
        if not s or s.startswith(("#", "<!--")):
            continue
        m = re.match(r"^(POV|OBJECT|PLANTS|TWIST)\s*:\s*(.*)$", s, re.I)
        if m:
            header[m.group(1).upper()] = m.group(2).strip()
            continue
        if re.fullmatch(r"\[beat\]", s, re.I):
            beats += 1
            continue
        m = LINE_RE.match(s)
        if m:
            text = m.group(4).strip()
            beats += len(re.findall(r"\[beat\]", text, re.I))
            lines.append(Line(int(m.group(1)), m.group(2).upper(), m.group(3).upper(), text))
        else:
            log.debug("ignored line: %s", s)
    return header, lines, beats


def load_words(path: Path) -> list[tuple[str, float, float]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    out: list[tuple[str, float, float]] = []
    if isinstance(data, list):
        for w in data:
            out.append((str(w["word"]), float(w["start"]), float(w["end"])))
    elif "segments" in data:
        for seg in data["segments"]:
            for w in seg.get("words", []):
                if "start" in w and "end" in w:
                    out.append((str(w["word"]), float(w["start"]), float(w["end"])))
    elif "transcription" in data:
        for seg in data["transcription"]:
            for t in seg.get("tokens", []):
                txt = t.get("text", "").strip()
                if not txt or txt.startswith("[_"):
                    continue
                out.append((txt, t["offsets"]["from"] / 1000, t["offsets"]["to"] / 1000))
    else:
        raise ValueError("unrecognised words.json format")
    if not out:
        raise ValueError("words.json contains no timed words")
    return out


def line_refs(value: str) -> list[int]:
    return [int(x) for x in re.findall(r"L(\d+)", value or "")]


def lint(header: dict[str, str], lines: list[Line], beats: int, args: argparse.Namespace) -> Report:
    r = Report()
    if not lines:
        r.add("FAIL", "parse", "no script lines found (format: L1 [HOOK] [CANON] text)")
        return r

    # tags and beats
    bad = [f"L{l.n}" for l in lines if l.beat not in BEATS or l.tag not in TAGS]
    r.add("FAIL" if bad else "PASS", "tags", f"unknown beat/tag on {', '.join(bad)}" if bad else "all lines tagged")
    unver = [f"L{l.n}" for l in lines if l.tag == "UNVERIFIED"]
    r.add("FAIL" if unver else "PASS", "unverified", f"[UNVERIFIED] facts narrated: {', '.join(unver)}" if unver else "none")
    for l in lines:
        if l.tag in ("INTERP", "ORIGINAL") and not args.original:
            if not any(re.search(p, l.text, re.I) for p in SOFTENERS):
                r.add("WARN", "canon-honesty", f"L{l.n} [{l.tag}] is stated as fact (add a softener or reframe)")
    present = [b for b in BEATS if any(l.beat == b for l in lines)]
    missing = [b for b in BEATS if b not in present]
    r.add("FAIL" if missing else "PASS", "beats", f"missing: {', '.join(missing)}" if missing else "all 7 beats present")
    order = [BEATS.index(l.beat) for l in lines if l.beat in BEATS]
    r.add("PASS" if order == sorted(order) else "WARN", "beat-order",
          "in order" if order == sorted(order) else "beats out of formula order (OK only if intentional)")

    # length
    n_words = sum(len(words_of(l.text)) for l in lines)
    lvl = "PASS" if args.min_words <= n_words <= args.max_words else ("WARN" if 160 <= n_words <= 210 else "FAIL")
    r.add(lvl, "word-count", f"{n_words} words (target {args.min_words}-{args.max_words})")
    est = n_words / args.wps + beats * 0.6
    r.add("PASS" if 60 <= est <= 70 else "WARN", "est-duration", f"~{est:.1f} s at {args.wps} words/s + {beats} beat(s)")
    r.add("PASS" if beats <= 2 else "FAIL", "silences", f"{beats} [beat] mark(s) (max 2)")

    # hook
    first = lines[0].text.lower().lstrip("\"'“ ")
    hit = next((p for p in BANNED_OPENERS if re.search(p, first)), None)
    r.add("FAIL" if hit else "PASS", "hook-opener", f"banned opener: {hit}" if hit else "opener OK")
    hw = len(words_of(lines[0].text))
    r.add("PASS" if 6 <= hw <= 18 else "WARN", "hook-length", f"{hw} words (6-18)")

    # sentences and dialogue
    for l in lines:
        for sent in re.split(r"(?<=[.!?])\s+", l.text):
            k = len(words_of(sent))
            if k > args.max_sentence:
                r.add("WARN", "sentence-length", f"L{l.n}: {k} words > {args.max_sentence}: \"{sent[:60]}…\"")
    quotes = re.findall(r"[\"“]([^\"”]+)[\"”]", "\n".join(l.text for l in lines))
    r.add("PASS" if len(quotes) <= 4 else "FAIL", "dialogue-count", f"{len(quotes)} quoted line(s) (max 4)")
    for q in quotes:
        if len(words_of(q)) > 8:
            r.add("WARN", "dialogue-length", f"\"{q[:50]}\" has {len(words_of(q))} words (max 8)")

    # ending
    tail = " ".join(l.text for l in lines[-2:])
    moral = [p for p in MORAL_PATTERNS if re.search(p, tail, re.I)]
    r.add("FAIL" if moral else "PASS", "no-moral", f"moral-like phrase in the ending: {moral}" if moral else "no moral sentence")
    last = lines[-1].text.strip()
    r.add("FAIL" if last.endswith("?") else "PASS", "ending", "ends on a question" if last.endswith("?") else "ends on a statement")
    r.add("PASS" if lines[-1].beat == "PAYOFF" else "FAIL", "last-beat", f"last line beat = {lines[-1].beat}")

    # object and twist
    obj = header.get("OBJECT", "").strip().lower()
    if not obj:
        r.add("FAIL", "object", "OBJECT: header is empty")
    else:
        key = obj.split()[-1].rstrip("s")
        hits = [l.n for l in lines if re.search(rf"\b{re.escape(key)}", l.text, re.I)]
        r.add("PASS" if len(hits) >= 3 else "FAIL", "object", f"'{key}' appears in {len(hits)} line(s) {hits} (min 3)")
    plants, twist = line_refs(header.get("PLANTS", "")), line_refs(header.get("TWIST", ""))
    if not plants or not twist:
        r.add("FAIL", "twist-plant", "PLANTS: and TWIST: headers must name lines (e.g. PLANTS: L3  TWIST: L14)")
    else:
        ok = all(p < min(twist) for p in plants)
        r.add("PASS" if ok else "FAIL", "twist-plant", f"plants {plants} {'before' if ok else 'NOT before'} twist {twist}")
    r.add("PASS" if header.get("POV") else "FAIL", "pov", f"POV = {header.get('POV') or 'missing'}")
    return r


def lint_words(r: Report, words: list[tuple[str, float, float]], n_script_words: int) -> None:
    start, end = words[0][1], words[-1][2]
    dur = end
    r.add("PASS" if start <= 0.15 else "WARN", "voice-start", f"first word at {start:.2f} s (<= 0.15)")
    r.add("PASS" if 60 <= dur <= 70 else "FAIL", "voice-duration", f"{dur:.1f} s (60-70)")
    wps = len(words) / max(end - start, 0.01)
    r.add("PASS" if 2.8 <= wps <= 3.4 else "WARN", "pace", f"{wps:.2f} words/s (2.8-3.4)")
    gaps = [(words[i][0], words[i + 1][1] - words[i][2]) for i in range(len(words) - 1)]
    long_gaps = [(w, g) for w, g in gaps if g > 0.9]
    r.add("PASS" if not long_gaps else "WARN", "gaps", "no gap > 0.9 s" if not long_gaps else
          "; ".join(f"after '{w}': {g:.2f} s" for w, g in long_gaps[:5]))
    diff = abs(len(words) - n_script_words)
    r.add("PASS" if diff <= 3 else "WARN", "words-vs-script", f"{len(words)} timed words vs {n_script_words} script words")


def main() -> int:
    ap = argparse.ArgumentParser(description="Lint a BETWEEN THE LIES script (and optional voice timings).")
    ap.add_argument("script", type=Path, help="path to 04_script.md")
    ap.add_argument("--words", type=Path, help="words.json with word timestamps")
    ap.add_argument("--min-words", type=int, default=175)
    ap.add_argument("--max-words", type=int, default=195)
    ap.add_argument("--wps", type=float, default=3.0, help="words/s used for the duration estimate (default 3.0)")
    ap.add_argument("--max-sentence", type=int, default=16)
    ap.add_argument("--original", action="store_true", help="original story: [ORIGINAL]/[INTERP] need no softener")
    ap.add_argument("--json", action="store_true", help="print the report as JSON")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.WARNING, format="%(levelname)s %(message)s")

    if not args.script.is_file():
        print(f"error: script not found: {args.script}", file=sys.stderr)
        return 2
    try:
        header, lines, beats = parse_script(args.script)
        report = lint(header, lines, beats, args)
        if args.words:
            lint_words(report, load_words(args.words), sum(len(words_of(l.text)) for l in lines))
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    if args.json:
        print(json.dumps([{"level": a, "check": b, "msg": c} for a, b, c in report.rows], indent=2))
    else:
        report.print()
    return 1 if report.fails else 0


if __name__ == "__main__":
    sys.exit(main())
