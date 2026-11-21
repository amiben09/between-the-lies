"""Ink-style post pass for BETWEEN THE LIES frames (prototype).

usage: python3 ink.py <in.png> <out.png> <style: sumi|wash> [seed]
  sumi : black ink on cream paper, cross-hatched shadows, one spot colour (the
         most saturated hue in the frame survives: Jinx's pink/cyan, a flame, a crystal).
  wash : ink lines + hatching over flat, bleeding watercolour washes.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd


def paper(h, w, rng):
    n = nd.gaussian_filter(rng.standard_normal((h, w)), 1.2) * 0.035 + nd.gaussian_filter(rng.standard_normal((h, w)), 18) * 0.06
    base = np.array([0.95, 0.92, 0.84])
    return np.clip(base[None, None] * (1 + n[..., None]), 0, 1)


def hatch(h, w, angle, period, rng):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    wob = nd.gaussian_filter(rng.standard_normal((h, w)), 6) * 2.5
    u = xx * np.cos(angle) + yy * np.sin(angle) + wob
    return np.abs(((u / period) % 1.0) - 0.5) * 2  # 0 at line centre, 1 between lines


def ink(img, style="sumi", seed=7):
    rng = np.random.default_rng(seed)
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255
    h, w, _ = a.shape
    lum = a @ np.array([0.299, 0.587, 0.114])
    # lift dark frames so the shading reads as tone, not as a black slab
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99.7)
    L = np.clip((lum - lo) / max(1e-3, hi - lo), 0, 1)
    # --- ink lines: edges of luminance + colour, slightly thickened and broken
    sm = nd.gaussian_filter(np.sqrt(a), (1.4, 1.4, 0))
    gx = np.stack([nd.sobel(sm[..., c], 1) for c in range(3)], -1)
    gy = np.stack([nd.sobel(sm[..., c], 0) for c in range(3)], -1)
    g = np.sqrt((gx ** 2 + gy ** 2).sum(-1))
    g = g / (np.percentile(g, 99) + 1e-6)
    line = np.clip((g - 0.24) * 3.0, 0, 1)
    line = nd.grey_dilation(line, size=(3, 3)) * 0.6 + line * 0.4
    brk = nd.gaussian_filter(rng.random((h, w)), 3)
    line *= np.clip((brk - 0.35) * 6, 0.35, 1)  # dry-brush breaks
    # --- tone: posterise to 4 ink values, hatch the two darkest
    Ls = nd.gaussian_filter(L, 2.5)
    t = np.digitize(Ls, [0.24, 0.42])  # 0 = solid ink, 1 = hatched, 2 = bare paper
    h1 = hatch(h, w, np.pi / 3.2, 20, rng) < 0.16
    tone = np.ones((h, w), np.float32)
    tone[t == 1] = np.where(h1[t == 1], 0.1, 0.95)
    dry = np.clip((nd.gaussian_filter(rng.random((h, w)), 1.5) - 0.5) * 8 + 0.5, 0, 1)
    tone[t == 0] = (0.04 + 0.1 * dry)[t == 0]  # solid brush with dry speckle
    tone = nd.gaussian_filter(tone, 0.7)
    P = paper(h, w, rng)
    inkc = np.array([0.07, 0.06, 0.08])
    if style == "sumi":
        # spot colour: keep only strongly saturated pixels, flattened
        mx, mn = a.max(-1), a.min(-1)
        sat = (mx - mn) / (mx + 1e-4)
        spot = np.clip((sat - 0.55) * 4, 0, 1) * np.clip((mx - 0.35) * 3, 0, 1)
        spot = nd.gaussian_filter(nd.grey_closing(spot, size=(5, 5)), 1.5)
        col = nd.gaussian_filter(a, (3, 3, 0))
        col = col / (col.max(-1, keepdims=True) + 1e-4) * 0.9
        base = P * tone[..., None]
        base = base * (1 - spot[..., None]) + (col * (0.55 + 0.45 * tone[..., None])) * spot[..., None]
    else:
        # watercolour wash: heavy blur + posterised colour + pigment pooling at edges
        wash = nd.gaussian_filter(a, (6, 6, 0))
        q = 5
        wash = np.round(wash * q) / q
        mx = wash.max(-1, keepdims=True)
        wash = np.clip(wash / (mx + 1e-4) * (0.35 + 0.65 * np.clip(L[..., None] * 1.3, 0, 1)), 0, 1)
        grain = nd.gaussian_filter(rng.standard_normal((h, w)), 2) * 0.08
        pool = np.clip(nd.gaussian_gradient_magnitude(wash.mean(-1), 3) * 6, 0, 0.35)
        wash = wash * (1 - pool[..., None]) * (1 + grain[..., None])
        wash = wash * 0.75 + wash.mean(-1, keepdims=True) * 0.25  # muted pigment
        # shadows stay as a deep pigment of the object's own colour, not flat black
        deep = np.clip(nd.gaussian_filter(a, (2, 2, 0)) * 1.8, 0, 0.45)
        shadow = (t == 0).astype(np.float32); shadow = nd.gaussian_filter(shadow, 1.0)[..., None]
        lit = P * (0.35 + 0.65 * wash) * tone[..., None]
        base = lit * (1 - shadow) + (0.04 + deep * (0.78 + 0.22 * dry[..., None])) * shadow
    # in solid-ink areas edges flip to paper-white rims so dark shapes keep their silhouette
    darkzone = nd.maximum_filter(Ls, 7) < 0.30
    rim = line * darkzone * 0.95
    line = line * (1 - darkzone)
    out = base * (1 - line[..., None]) + inkc * line[..., None]
    out = out * (1 - rim[..., None]) + P * 0.85 * rim[..., None]
    # ink vignette
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    out *= (1 - 0.35 * np.clip(r - 0.75, 0, 1))[..., None]
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


if __name__ == "__main__":
    src, dst, style = sys.argv[1:4]
    seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
    out = ink(Image.open(src), style, seed)
    if len(sys.argv) > 5:  # optional captioned frame: lay its captions back on top untouched
        cap = nd.gaussian_filter(np.asarray(Image.open(sys.argv[5]).convert("RGB")).astype(np.float32), (1.5, 1.5, 0))
        pl = nd.gaussian_filter(np.asarray(Image.open(src).convert("RGB")).astype(np.float32), (1.5, 1.5, 0))
        m = nd.binary_dilation(nd.binary_closing(np.abs(cap - pl).max(-1) > 22, iterations=6), iterations=3)
        cap = np.asarray(Image.open(sys.argv[5]).convert("RGB"))
        o = np.asarray(out).copy(); o[m] = cap[m].astype(np.uint8); out = Image.fromarray(o)
    out.save(dst)
