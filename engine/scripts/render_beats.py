# Resumable per-beat renderer: one remotion render per beat (fresh browser, one 3D scene mount per tab).
# usage: python3 scripts/render_beats.py <bundle_dir> <Comp> <beats.json> <outdir> [concurrency=3] [skip_until_frame=0]
import json, os, subprocess, sys, time
bundle, comp, bj, out = sys.argv[1:5]; cc = sys.argv[5] if len(sys.argv) > 5 else "3"; skip = int(sys.argv[6]) if len(sys.argv) > 6 else 0
beats = json.load(open(bj))["beats"]; fr = lambda s: round(s * 30)
segs = []
for b in beats:
    a, e = fr(b["start_s"]), fr(b["end_s"]) - 1
    if e < skip: continue
    segs.append((max(a, skip), e))
for a, e in segs:
    f = f"{out}/c{a:05d}.mp4"
    if os.path.exists(f) and os.path.getsize(f) > 0: continue
    for t in range(4):
        t0 = time.time()
        r = subprocess.run(["npx", "remotion", "render", bundle, comp, f + ".tmp.mp4", f"--frames={a}-{e}", "--codec", "h264", "--crf", "17",
                            f"--concurrency={cc if t < 2 else 1}", "--gl=" + os.environ.get("BTL_GL", "angle"), "--log=error", "--timeout=240000"] + ([f"--props={os.environ['BTL_PROPS']}"] if os.environ.get("BTL_PROPS") else []), capture_output=True, text=True)
        if r.returncode == 0 and os.path.exists(f + ".tmp.mp4"): os.rename(f + ".tmp.mp4", f); print(f"chunk {a}-{e} {time.time() - t0:.0f}s", flush=True); break
        print(f"retry {a}-{e} try {t + 1}: {(r.stderr or r.stdout).strip().splitlines()[:1]}", flush=True); subprocess.run(["pkill", "-f", "chrome-headless"])
    else: print(f"FAILED {a}-{e}", flush=True)
print("DONE", flush=True)
