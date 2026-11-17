// Between the Lies — 2D/2.5D canvas engine core: math, cached painted layers, camera with parallax, post (grade, vignette, grain).
export const W = 1080, H = 1920, FPS = 30;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const ramp = (f: number, a: number, b: number) => smooth((f - a) / Math.max(1, b - a));
export const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!];
}

/** Paint once per tab, reuse every frame. */
const cache = new Map<string, HTMLCanvasElement>();
export function cached(key: string, w: number, h: number, paint: (g: Ctx, w: number, h: number) => void, blurPx = 0) {
  let c = cache.get(key);
  if (!c) {
    const [a, ga] = makeCanvas(w, h);
    paint(ga, w, h);
    if (blurPx > 0) {
      const [b, gb] = makeCanvas(w, h);
      gb.filter = `blur(${blurPx}px)`;
      gb.drawImage(a, 0, 0);
      c = b;
    } else c = a;
    cache.set(key, c);
  }
  return c;
}

/** Tactile paper/paint texture laid over a painted layer. */
export function texture(g: Ctx, w: number, h: number, seed = 1, amt = 0.06) {
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 900; i++) {
    const x = r() * w, y = r() * h, s = 2 + r() * 10;
    g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${amt * r()})` : `rgba(0,0,0,${amt * 1.4 * r()})`;
    g.fillRect(x, y, s, s * (0.3 + r()));
  }
}

export const linGrad = (g: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
};
export const radGrad = (g: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]) => {
  const gr = g.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
};

/** Camera: zoom about a focus point, pan in px. Layers apply it scaled by their depth (0 = infinitely far, 1 = subject plane). */
export type Cam = { x: number; y: number; zoom: number; roll?: number };
export function withLayer(g: Ctx, cam: Cam, depth: number, draw: () => void) {
  g.save();
  const z = 1 + (cam.zoom - 1) * depth;
  g.translate(W / 2, H / 2);
  if (cam.roll) g.rotate((cam.roll * Math.PI / 180) * depth);
  g.scale(z, z);
  g.translate(-W / 2 - cam.x * depth, -H / 2 - cam.y * depth);
  draw();
  g.restore();
}

/** Interpolate camera keys {f, cam} with smootherstep between keys. */
export function camAt(keys: { f: number; c: Cam }[], f: number): Cam {
  if (f <= keys[0].f) return keys[0].c;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) {
      const t = smooth((f - a.f) / (b.f - a.f));
      return { x: lerp(a.c.x, b.c.x, t), y: lerp(a.c.y, b.c.y, t), zoom: lerp(a.c.zoom, b.c.zoom, t), roll: lerp(a.c.roll ?? 0, b.c.roll ?? 0, t) };
    }
  }
  return keys[keys.length - 1].c;
}

// ---------------- post ----------------
let grainTiles: HTMLCanvasElement[] | null = null;
function grain() {
  if (!grainTiles) {
    grainTiles = [0, 1, 2, 3].map((k) => {
      const [c, g] = makeCanvas(256, 256);
      const img = g.createImageData(256, 256), r = rng(99 + k * 31);
      for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      return c;
    });
  }
  return grainTiles;
}

export type Grade = { tint: string; tintAlpha: number; vignette: number; lift?: string; glow?: { x: number; y: number; r: number; color: string; a: number } };

export function post(g: Ctx, f: number, gr: Grade) {
  g.save();
  // colour grade: soft-light tint
  g.globalCompositeOperation = "soft-light";
  g.globalAlpha = gr.tintAlpha;
  g.fillStyle = gr.tint; g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
  // motivated light bloom
  if (gr.glow) {
    g.globalCompositeOperation = "screen";
    g.globalAlpha = gr.glow.a;
    g.fillStyle = radGrad(g, gr.glow.x, gr.glow.y, 0, gr.glow.r, [[0, gr.glow.color], [1, "rgba(0,0,0,0)"]]);
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
  }
  // shadow lift (no crushed blacks)
  if (gr.lift) { g.globalCompositeOperation = "lighten"; g.fillStyle = gr.lift; g.fillRect(0, 0, W, H); }
  // vignette
  g.globalCompositeOperation = "multiply";
  g.fillStyle = radGrad(g, W / 2, H * 0.47, H * 0.28, H * 0.78, [[0, "rgba(255,255,255,1)"], [1, `rgba(${Math.round(255 * (1 - gr.vignette))},${Math.round(255 * (1 - gr.vignette))},${Math.round(255 * (1 - gr.vignette * 0.9))},1)`]]);
  g.fillRect(0, 0, W, H);
  // film grain (subtle, changes every frame)
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = 0.07;
  const t = grain()[f % 4];
  const r = rng(f * 7 + 3);
  g.translate(-r() * 256, -r() * 256);
  g.fillStyle = g.createPattern(t, "repeat")!;
  g.fillRect(0, 0, W + 256, H + 256);
  g.restore();
}

/** Floating particles: dust, embers, rain, snow-like motes. */
export function particles(g: Ctx, f: number, kind: "dust" | "rain" | "sparks", seed: number, n: number, color: string, depth = 1) {
  const r = rng(seed);
  g.save();
  if (kind === "rain") {
    g.strokeStyle = color; g.lineWidth = 2 * depth; g.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const x0 = r() * (W + 200) - 100, sp = 38 + r() * 20, y = ((r() * H + f * sp) % (H + 200)) - 100, x = x0 - (y / H) * 60;
      g.globalAlpha = 0.25 + r() * 0.35;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 46 * depth); g.stroke();
    }
  } else {
    for (let i = 0; i < n; i++) {
      const x0 = r() * W, y0 = r() * H, ph = r() * 6.28, sp = 0.3 + r() * 0.8, s = (1.5 + r() * 4) * depth;
      const x = x0 + Math.sin(f * 0.02 * sp + ph) * 30, y = kind === "sparks" ? (y0 - f * sp * 3) % H : y0 + Math.cos(f * 0.015 * sp + ph) * 20 - f * 0.2 * sp;
      g.globalAlpha = (0.25 + 0.5 * Math.abs(Math.sin(f * 0.03 + ph))) * (kind === "sparks" ? 1 : 0.6);
      g.fillStyle = color;
      g.beginPath(); g.arc(x, (y + H) % H, s, 0, 6.283); g.fill();
    }
  }
  g.restore();
}
