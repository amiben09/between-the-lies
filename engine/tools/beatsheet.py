# Beat sheet tool (Phase 5). Resolves word-anchored beats against the REAL voice timings, fills narration + captions,
# validates the channel structure, and writes beats.json + storyboard.md.
# Usage: python beatsheet.py <beats_src.json> <words.json> <captions.json> <outdir> [tail_s]
import json, re, sys
src, wj, cj, out = sys.argv[1:5]
tail = float(sys.argv[5]) if len(sys.argv) > 5 else 4.2
B = json.load(open(src)); W = json.load(open(wj))["words"]; C = json.load(open(cj))
norm = lambda x: re.sub(r"[^a-z']", "", x.lower())
def at(a):
    if a == "end": return round(W[-1]["e"] + tail, 2)
    m = [w for w in W if w["line"] == a["line"] and norm(w["w"]) == norm(a["word"])]
    if len(m) <= a.get("n", 0): raise SystemExit(f"anchor not found: {a}")
    return round(m[a.get("n", 0)]["s"] - a.get("lead", 0.08), 2)
ORDER = ["HOOK", "WORLD", "WORLD RULES", "RELATIONSHIP", "CONFLICT", "TRANSFORMATION", "REVELATION", "PAYOFF"]
beats, errs = [], []
starts = [0.0 if i == 0 else at(b["start"]) for i, b in enumerate(B["beats"])] + [at("end")]
for i, b in enumerate(B["beats"]):
    s, e = starts[i], starts[i + 1]
    words = " ".join(w["w"] for w in W if s <= (w["s"] + w["e"]) / 2 < e)
    caps = [c["text"] for c in C if c["s"] < e and c["e"] > s]
    beats.append({"id": i + 1, "section": b["section"], "start_s": s, "end_s": e, "dur_s": round(e - s, 2), "narration": words, "caption": " / ".join(caps), **{k: v for k, v in b.items() if k not in ("start",)}})
    if e - s <= 0: errs.append(f"beat {i + 1}: non-positive duration")
    if e - s > 4.5 and b.get("hold_ok") is not True: errs.append(f"beat {i + 1}: {e - s:.1f}s long without an approved hold")
    for col in ("character", "action", "environment", "camera_position", "camera_move", "purpose", "lighting", "fg", "mg", "bg", "music", "sfx", "transition", "renderer"):
        if not b.get(col): errs.append(f"beat {i + 1}: missing '{col}'")
secs = [b["section"] for b in beats]
seen = [x for k, x in enumerate(secs) if k == 0 or x != secs[k - 1]]
if [x for x in seen if x in ORDER] != [x for x in ORDER if x in seen] or set(seen) - set(ORDER): errs.append(f"section order {seen} does not follow {ORDER}")
missing = [x for x in ORDER if x not in seen]
if missing: errs.append(f"missing sections: {missing}")
world = [b for b in beats if b["section"] in ("WORLD", "WORLD RULES")]
if any(not b.get("world_visual") for b in world): errs.append("a WORLD/WORLD RULES beat has no 'world_visual' (every world sentence needs its own scene)")
ws = sum(b["dur_s"] for b in world); total = starts[-1]
stats = {"beats": len(beats), "total_s": total, "avg_beat_s": round(total / len(beats), 2), "world_building_s": round(ws, 2), "world_share": round(ws / total, 3),
         "renderers": {r: sum(1 for b in beats if b["renderer"] == r) for r in sorted({b["renderer"] for b in beats})}}
json.dump({"episode": B["episode"], "stats": stats, "errors": errs, "beats": beats}, open(f"{out}/beats.json", "w"), indent=1)
cols = [("Time", lambda b: f"{b['start_s']:.1f}-{b['end_s']:.1f}"), ("Narration", lambda b: b["narration"]), ("Character", lambda b: b["character"]), ("Action", lambda b: b["action"]),
        ("Environment", lambda b: b["environment"]), ("Camera position", lambda b: b["camera_position"]), ("Camera move (purpose)", lambda b: f"{b['camera_move']} — *{b['purpose']}*"),
        ("Lighting", lambda b: b["lighting"]), ("FG", lambda b: b["fg"]), ("MG", lambda b: b["mg"]), ("BG", lambda b: b["bg"]), ("Caption", lambda b: b["caption"]),
        ("Music", lambda b: b["music"]), ("SFX", lambda b: b["sfx"]), ("Transition", lambda b: b["transition"]), ("Render", lambda b: b["renderer"])]
with open(f"{out}/storyboard.md", "w") as fh:
    fh.write(f"# Storyboard / beat sheet — {B['episode']}\nTimes come from the real voiceover (Whisper-verified). Structure check: **{'PASS' if not errs else 'FAIL'}**\n\n")
    fh.write(f"Beats {stats['beats']} · total {total:.1f} s · average beat {stats['avg_beat_s']} s · world-building {ws:.1f} s ({stats['world_share']:.0%}) · renderers {stats['renderers']}\n\n")
    if errs: fh.write("**Errors:**\n" + "\n".join(f"- {e}" for e in errs) + "\n\n")
    for sec in ORDER:
        bs = [b for b in beats if b["section"] == sec]
        if not bs: continue
        fh.write(f"## {sec}\n| # | " + " | ".join(c for c, _ in cols) + " |\n|" + "---|" * (len(cols) + 1) + "\n")
        for b in bs: fh.write(f"| {b['id']} | " + " | ".join(str(fn(b)).replace("|", "/") for _, fn in cols) + " |\n")
        wv = [b for b in bs if b.get("world_visual")]
        if wv: fh.write("\nWorld line → visual: " + " · ".join(f"#{b['id']} {b['world_visual']}" for b in wv) + "\n")
        fh.write("\n")
print(json.dumps(stats), "\nERRORS:" if errs else "\nstructure PASS", *errs, sep="\n")
