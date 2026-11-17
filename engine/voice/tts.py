#!/usr/bin/env python3
"""BETWEEN THE LIES narrator: 04_script.md -> voice.wav (48 kHz) + words.json (word timestamps).

Engine: Kokoro-82M (Apache-2.0, runs on CPU, free, commercial use allowed). Stock voices only, never a clone of a real
narrator. Word timings come from whisper.cpp (`whisper-cli`) and are aligned back to the script words, so the captions
always show the script's spelling.

Pauses: 0.18 s between lines, 0.35 s between beats (HOOK -> LOVE ...), 0.6 s for each [beat] mark.

Run with the TTS environment's Python:
  /root/.cache/btl-tts/bin/python tts.py episodes/<slug>/04_script.md -o episodes/<slug>/05_voice
Options: --voice am_michael (default) | am_onyx | am_fenrir | bm_george | ...  --speed 0.95
         --whisper-model ~/.claude-video-vision/models/ggml-base.bin
Setup (once): see engine/voice/README.md
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
from difflib import SequenceMatcher

import numpy as np

LINE_RE = re.compile(r"^L(\d+)\s*\[(\w+)\]\s*\[(\w+)\]\s*(.*)$")
WORD_RE = re.compile(r"[A-Za-z0-9]+(?:['’][A-Za-z]+)?")
OUT_SR = 48000
log = logging.getLogger("tts")


def parse(path: str) -> list[dict]:
    items: list[dict] = []
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            s = raw.strip()
            if re.fullmatch(r"\[beat\]", s, re.I):
                items.append({"pause": 0.6})
                continue
            m = LINE_RE.match(s)
            if not m:
                continue
            text = m.group(4)
            parts = re.split(r"\[beat\]", text, flags=re.I)
            for k, part in enumerate(parts):
                if part.strip():
                    items.append({"line": int(m.group(1)), "beat": m.group(2).upper(), "text": part.strip()})
                if k < len(parts) - 1:
                    items.append({"pause": 0.6})
    if not any("text" in i for i in items):
        raise ValueError(f"no script lines in {path} (format: L1 [HOOK] [CANON] text)")
    return items


def synth(items: list[dict], voice: str, speed: float) -> tuple[np.ndarray, list[dict]]:
    os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
    from kokoro import KPipeline  # imported late so --help works without the TTS environment
    pipe = KPipeline(lang_code="b" if voice.startswith("b") else "a", repo_id="hexgrad/Kokoro-82M")
    sr = 24000
    chunks, spans, t, prev_beat = [], [], 0.0, None
    for it in items:
        if "pause" in it:
            chunks.append(np.zeros(int(it["pause"] * sr)))
            t += it["pause"]
            continue
        gap = 0.0 if prev_beat is None else (0.35 if it["beat"] != prev_beat else 0.18)
        prev_beat = it["beat"]
        if gap:
            chunks.append(np.zeros(int(gap * sr)))
            t += gap
        spoken = it["text"].replace("*", "")
        audio = np.concatenate([np.asarray(a, dtype=np.float32) for _, _, a in pipe(spoken, voice=voice, speed=speed)])
        # trim leading/trailing near-silence so the pauses stay exact
        nz = np.nonzero(np.abs(audio) > 0.01)[0]
        if len(nz):
            audio = audio[max(0, nz[0] - 240): nz[-1] + 1200]
        spans.append({"line": it["line"], "beat": it["beat"], "start": round(t, 3), "end": round(t + len(audio) / sr, 3), "text": it["text"]})
        chunks.append(audio)
        t += len(audio) / sr
        log.info("L%-3d %5.2f s  %s", it["line"], len(audio) / sr, it["text"][:60])
    lead = np.zeros(int(0.08 * sr))  # voice starts at 0.08 s (rule: <= 0.15 s)
    y = np.concatenate([lead] + chunks + [np.zeros(int(0.3 * sr))])
    for s in spans:
        s["start"] += 0.08
        s["end"] += 0.08
    from scipy.signal import resample_poly
    y = resample_poly(y, 2, 1).astype(np.float64)
    peak = np.abs(y).max()
    if peak > 0:
        y *= 0.89 / peak
    return y, spans


def write_wav(path: str, y: np.ndarray) -> None:
    import soundfile as sf
    sf.write(path, y, OUT_SR, subtype="PCM_24")


def whisper_words(wav: str, model: str) -> list[dict]:
    exe = shutil.which("whisper-cli")
    if not exe:
        raise RuntimeError("whisper-cli not found on PATH")
    if not os.path.isfile(model):
        raise RuntimeError(f"whisper model not found: {model}")
    with tempfile.TemporaryDirectory() as td:
        w16 = os.path.join(td, "v16.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ar", "16000", "-ac", "1", w16], check=True)
        base = os.path.join(td, "out")
        subprocess.run([exe, "-m", model, "-f", w16, "-ml", "1", "-sow", "-ojf", "-of", base, "-np", "-l", "en"],
                       check=True, capture_output=True)
        data = json.load(open(base + ".json", encoding="utf-8"))
    words = []
    for seg in data.get("transcription", []):
        txt = seg.get("text", "").strip()
        if not txt or not WORD_RE.search(txt):
            continue
        words.append({"word": txt, "start": seg["offsets"]["from"] / 1000, "end": seg["offsets"]["to"] / 1000})
    return words


def script_tokens(items: list[dict]) -> list[tuple[str, int, bool]]:
    """display tokens (with their punctuation, for caption grouping), line number, accent flag (*word* in the script)"""
    out = []
    for it in items:
        if "text" not in it:
            continue
        for tok in it["text"].split():
            if WORD_RE.search(tok):
                out.append((tok.replace("*", ""), it["line"], "*" in tok))
    return out


def align(script_words: list[tuple[str, int, bool]], heard: list[dict], spans: list[dict]) -> list[dict]:
    """map every script word to a time: matched words take whisper times, the rest are interpolated inside their line span"""
    norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
    a = [norm(w) for w, _, _ in script_words]
    b = [norm(h["word"]) for h in heard]
    times: list[tuple[float, float] | None] = [None] * len(a)
    for blk in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            times[blk.a + k] = (h["start"], h["end"])
    out = []
    by_line = {s["line"]: s for s in spans}
    matched = [t is not None for t in times]
    for i, (w, line, acc) in enumerate(script_words):
        if times[i] is None:
            s = by_line[line]
            idx = [j for j, (_, l2, _) in enumerate(script_words) if l2 == line]
            k = idx.index(i)
            dt = (s["end"] - s["start"]) / len(idx)
            times[i] = (s["start"] + k * dt, s["start"] + (k + 1) * dt)
        st, en = times[i]
        out.append({"word": w, "start": round(st, 3), "end": round(max(en, st + 0.05), 3), "line": line,
                    "matched": matched[i], **({"accent": True} if acc else {})})
    for i in range(1, len(out)):  # keep monotonic
        if out[i]["start"] < out[i - 1]["start"]:
            out[i]["start"] = out[i - 1]["end"]
            out[i]["end"] = max(out[i]["end"], out[i]["start"] + 0.05)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Script -> narrator voice.wav + words.json")
    ap.add_argument("script")
    ap.add_argument("-o", "--outdir", default=".")
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--whisper-model", default=os.path.expanduser("~/.claude-video-vision/models/ggml-base.bin"))
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()
    logging.basicConfig(level=logging.INFO if a.verbose else logging.WARNING, format="%(name)s: %(message)s")
    if not 0.7 <= a.speed <= 1.3:
        print("error: --speed must be 0.7-1.3", file=sys.stderr)
        return 2
    try:
        items = parse(a.script)
        os.makedirs(a.outdir, exist_ok=True)
        y, spans = synth(items, a.voice, a.speed)
        wav = os.path.join(a.outdir, "voice.wav")
        write_wav(wav, y)
        heard = whisper_words(wav, a.whisper_model)
        sw = script_tokens(items)
        words = align(sw, heard, spans)
        matched = sum(1 for w in words if w["matched"])
        with open(os.path.join(a.outdir, "words.json"), "w", encoding="utf-8") as fh:
            json.dump(words, fh, indent=1)
        with open(os.path.join(a.outdir, "lines.json"), "w", encoding="utf-8") as fh:
            json.dump(spans, fh, indent=1)
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError, ImportError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    dur = len(y) / OUT_SR
    print(f"wrote {wav}: {dur:.2f} s, voice {a.voice} x{a.speed}; words.json {len(words)} words "
          f"({matched} timed by whisper, {len(words) - matched} interpolated); {len(words) / dur:.2f} words/s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
