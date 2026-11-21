"""Ink every frame of an episode.
usage: python3 ink_episode.py <plates.mp4 (no captions)> <captioned.mp4> <out.mp4> <style> [workers=3]
Captions are taken untouched from the captioned render (pixels that differ from the plate)."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
from scipy import ndimage as nd
from ink import ink

W, H = 1080, 1920
STYLE = sys.argv[4] if len(sys.argv) > 4 else "wash"


def frames(path):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield b


def job(args):
    pb, cb = args
    pl = np.frombuffer(pb, np.uint8).reshape(H, W, 3)
    cap = np.frombuffer(cb, np.uint8).reshape(H, W, 3)
    o = np.asarray(ink(Image.fromarray(pl), STYLE, 7)).copy()
    a = nd.gaussian_filter(cap.astype(np.float32), (1.5, 1.5, 0)); b = nd.gaussian_filter(pl.astype(np.float32), (1.5, 1.5, 0))
    m = nd.binary_dilation(nd.binary_closing(np.abs(a - b).max(-1) > 22, iterations=6), iterations=3)
    o[m] = cap[m]
    return o.tobytes()


if __name__ == "__main__":
    plates, capd, out = sys.argv[1:4]; wk = int(sys.argv[5]) if len(sys.argv) > 5 else 3
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                            "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    src, i = zip(frames(plates), frames(capd)), 0
    with ProcessPoolExecutor(wk) as ex:  # bounded batches: Executor.map would read every frame into memory up front
        while True:
            batch = [x for _, x in zip(range(wk * 4), src)]
            if not batch: break
            for fb in ex.map(job, batch): enc.stdin.write(fb)
            i += len(batch); print("frame", i, flush=True)
    enc.stdin.close(); enc.wait(); print("DONE", flush=True)
