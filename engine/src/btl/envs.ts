// Between the Lies — painted 2.5D environment layers. Every layer is painted once (cached) at frame size + margin,
// then placed by the shot camera at its parallax depth. Original set designs.
import { Cam, Ctx, H, W, cached, linGrad, radGrad, rng, texture, withLayer } from "./core";

export const M = 260; // margin around each painted layer
const LW = W + 2 * M, LH = H + 2 * M;
type Painter = (g: Ctx, w: number, h: number) => void;

export function layer(g: Ctx, cam: Cam, key: string, depth: number, paint: Painter, blur = 0, alpha = 1) {
  const c = cached(key, LW, LH, (gg, w, h) => { gg.translate(M, M); paint(gg, w - 2 * M, h - 2 * M); texture(gg, w, h, key.length * 13, 0.05); }, blur);
  withLayer(g, cam, depth, () => { g.globalAlpha = alpha; g.drawImage(c, -M, -M); g.globalAlpha = 1; });
}

/** Rack focus: crossfade between two cached blur levels of the same layer (t: 0 = blurA, 1 = blurB). */
export function layerRack(g: Ctx, cam: Cam, key: string, depth: number, paint: Painter, blurA: number, blurB: number, t: number) {
  if (t <= 0.01) return layer(g, cam, key + "_b" + blurA, depth, paint, blurA);
  if (t >= 0.99) return layer(g, cam, key + "_b" + blurB, depth, paint, blurB);
  layer(g, cam, key + "_b" + blurA, depth, paint, blurA);
  layer(g, cam, key + "_b" + blurB, depth, paint, blurB, t);
}

// ---------- shared painting helpers ----------
export function bricks(g: Ctx, x: number, y: number, w: number, h: number, base: string, seed: number, bw = 120, bh = 56) {
  const r = rng(seed);
  g.fillStyle = base; g.fillRect(x, y, w, h);
  for (let yy = y; yy < y + h; yy += bh) {
    const off = ((yy - y) / bh) % 2 ? bw / 2 : 0;
    for (let xx = x - off; xx < x + w; xx += bw) {
      const v = (r() - 0.5) * 26;
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
      g.fillRect(xx + 3, yy + 3, bw - 6, bh - 6);
    }
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x, yy, w, 4);
  }
  for (let yy = y; yy < y + h; yy += bh) { const off = ((yy - y) / bh) % 2 ? bw / 2 : 0; for (let xx = x - off; xx < x + w; xx += bw) { g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(xx, yy, 4, bh); } }
}
export function archWindow(g: Ctx, x: number, y: number, w: number, h: number, glass: string | CanvasGradient, frame = "#1a1418") {
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
  g.fillStyle = glass; g.fill(); g.lineWidth = 14; g.strokeStyle = frame; g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); for (let k = 1; k < 4; k++) { g.moveTo(x, y + w / 2 + (k * (h - w / 2)) / 4); g.lineTo(x + w, y + w / 2 + (k * (h - w / 2)) / 4); } g.stroke();
}
export function tree(g: Ctx, x: number, y: number, s: number, trunk: string, leaf: string, leafHi: string, seed: number) {
  const r = rng(seed);
  g.fillStyle = trunk; g.beginPath(); g.moveTo(x - 30 * s, y); g.quadraticCurveTo(x - 10 * s, y - 250 * s, x - 20 * s, y - 420 * s); g.lineTo(x + 20 * s, y - 420 * s); g.quadraticCurveTo(x + 14 * s, y - 250 * s, x + 34 * s, y); g.fill();
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.283, d = r() * 230 * s;
    g.fillStyle = i % 3 ? leaf : leafHi;
    g.beginPath(); g.ellipse(x + Math.cos(a) * d * 1.2, y - 520 * s + Math.sin(a) * d * 0.7, (90 + r() * 70) * s, (70 + r() * 50) * s, 0, 0, 6.283); g.fill();
  }
}
const sky = (g: Ctx, w: number, h: number, top: string, mid: string, hor: string) => { g.fillStyle = linGrad(g, 0, -M, 0, h * 0.75, [[0, top], [0.6, mid], [1, hor]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M); };
const floor = (g: Ctx, y: number, w: number, h: number, a: string, b: string) => { g.fillStyle = linGrad(g, 0, y, 0, h + M, [[0, a], [1, b]]); g.fillRect(-M, y, w + 2 * M, h + M - y); };

// ---------- sets ----------
/** S1 Hogwarts dungeon corridor: cold stone, torch pools, plum shadows. */
export const corridor = {
  back: (g: Ctx, w: number, h: number) => {
    g.fillStyle = "#14121c"; g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    // vanishing arches
    for (let i = 6; i >= 0; i--) {
      const s = 0.35 + i * 0.12, cx = w * 0.5, top = h * 0.32 - 300 * s;
      g.fillStyle = `rgb(${30 + i * 6},${28 + i * 5},${42 + i * 6})`;
      g.fillRect(cx - 520 * s - 200, top - 200, 300, h);
      g.fillRect(cx + 520 * s - 100, top - 200, 300, h);
      g.beginPath(); g.arc(cx, top + 120 * s, 520 * s, Math.PI, 0); g.lineWidth = 90 * s; g.strokeStyle = `rgb(${34 + i * 6},${30 + i * 5},${46 + i * 6})`; g.stroke();
    }
    g.fillStyle = radGrad(g, w * 0.5, h * 0.42, 0, 420, [[0, "rgba(120,140,190,0.35)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
  },
  walls: (g: Ctx, w: number, h: number) => {
    bricks(g, -M, -M, 300 + M, h + 2 * M, "#2b2733", 3, 140, 70);
    bricks(g, w - 300, -M, 300 + M, h + 2 * M, "#2b2733", 4, 140, 70);
    for (const tx of [130, w - 130]) { // torches
      g.fillStyle = "#16121a"; g.fillRect(tx - 12, h * 0.38, 24, 90);
      g.fillStyle = radGrad(g, tx, h * 0.36, 0, 260, [[0, "rgba(255,170,90,0.75)"], [0.25, "rgba(255,120,60,0.25)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(tx - 300, h * 0.36 - 300, 600, 600);
      g.fillStyle = "#ffd28a"; g.beginPath(); g.ellipse(tx, h * 0.37, 14, 30, 0, 0, 6.283); g.fill();
    }
    floor(g, h * 0.78, w, h, "#24212c", "#0e0c12");
  },
};

/** S2/S3 memory playground (1960s-70s mill town, original design): warm amber afternoon. */
export const playground = {
  sky: (g: Ctx, w: number, h: number) => { sky(g, w, h, "#d99a5a", "#f2c27a", "#ffe2a8"); g.fillStyle = radGrad(g, w * 0.78, h * 0.3, 0, 300, [[0, "rgba(255,248,220,0.95)"], [0.3, "rgba(255,220,150,0.45)"], [1, "rgba(255,200,120,0)"]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M); },
  town: (g: Ctx, w: number, h: number) => {
    const r = rng(5); g.fillStyle = "#a97a5c";
    for (let x = -M; x < w + M; x += 90 + r() * 60) { const bh = 180 + r() * 220; g.fillRect(x, h * 0.55 - bh, 80 + r() * 60, bh + 40); }
    g.fillStyle = "#94654c"; g.fillRect(w * 0.15, h * 0.55 - 640, 46, 640); g.fillRect(w * 0.8, h * 0.55 - 560, 40, 560); // mill chimneys
    g.fillStyle = "#c79a70"; g.fillRect(-M, h * 0.53, w + 2 * M, 60);
  },
  ground: (g: Ctx, w: number, h: number) => {
    floor(g, h * 0.56, w, h, "#b49a4e", "#6e6a2c");
    const r = rng(9); g.strokeStyle = "rgba(90,80,30,0.5)"; g.lineWidth = 3;
    for (let i = 0; i < 400; i++) { const x = r() * (w + 2 * M) - M, y = h * 0.58 + r() * (h * 0.5); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y - 14 - r() * 10); g.stroke(); }
    // swing frame
    g.strokeStyle = "#5a3b2c"; g.lineWidth = 16; g.beginPath(); g.moveTo(w * 0.55, h * 0.62); g.lineTo(w * 0.62, h * 0.38); g.lineTo(w * 0.69, h * 0.62); g.moveTo(w * 0.62, h * 0.38); g.lineTo(w + 120, h * 0.38); g.stroke();
    g.lineWidth = 4; g.strokeStyle = "#3a2a22"; for (const sx of [w * 0.78, w * 0.86]) { g.beginPath(); g.moveTo(sx, h * 0.38); g.lineTo(sx, h * 0.56); g.stroke(); }
    g.fillStyle = "#6b3b2a"; g.fillRect(w * 0.77, h * 0.56, w * 0.1, 14);
  },
  hedge: (g: Ctx, w: number, h: number) => { // foreground bushes he hides behind
    const r = rng(17);
    for (let i = 0; i < 30; i++) { g.fillStyle = i % 3 ? "#4f5a22" : "#6f7a30"; g.beginPath(); g.ellipse(-M + r() * 520, h * 0.8 + r() * 260, 110 + r() * 80, 90 + r() * 60, 0, 0, 6.283); g.fill(); }
  },
  tree: (g: Ctx, w: number, h: number) => { tree(g, w * 0.1, h * 0.95, 1.5, "#4b3324", "#5f6b28", "#8a8f3a", 23); },
};

/** S4 castle hall split: warm red/gold left, cold green right. */
export const hall = {
  back: (g: Ctx, w: number, h: number) => {
    g.fillStyle = linGrad(g, -M, 0, w + M, 0, [[0, "#5a1e1a"], [0.45, "#3a2a2a"], [0.55, "#1d2a26"], [1, "#0f2a20"]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    for (const [x, glass] of [[w * 0.08, "#ffb35a"], [w * 0.72, "#7fc9a0"]] as [number, string][]) archWindow(g, x, h * 0.12, 220, 560, linGrad(g, 0, h * 0.12, 0, h * 0.5, [[0, glass], [1, "#2a2024"]]));
    // house banners
    g.fillStyle = "#9b2a22"; g.fillRect(w * 0.3, -M, 150, h * 0.42 + M); g.fillStyle = "#d8a63a"; g.beginPath(); g.moveTo(w * 0.3 + 75, h * 0.25); g.lineTo(w * 0.3 + 110, h * 0.32); g.lineTo(w * 0.3 + 40, h * 0.32); g.fill();
    g.fillStyle = "#1f5a3a"; g.fillRect(w * 0.58, -M, 150, h * 0.42 + M); g.fillStyle = "#b8bcc0"; g.beginPath(); g.ellipse(w * 0.58 + 75, h * 0.28, 40, 18, 0.4, 0, 6.283); g.fill();
    floor(g, h * 0.7, w, h, "#2a2224", "#100c0e");
    g.strokeStyle = "rgba(0,0,0,0.4)"; g.lineWidth = 4; for (let i = -10; i < 20; i++) { g.beginPath(); g.moveTo(w / 2 + i * 40, h * 0.7); g.lineTo(w / 2 + i * 260, h + M); g.stroke(); }
  },
  candles: (g: Ctx, w: number, h: number) => { const r = rng(4); for (let i = 0; i < 40; i++) { const x = r() * (w + 2 * M) - M, y = r() * h * 0.35; g.fillStyle = "#efe2c8"; g.fillRect(x, y, 10, 40); g.fillStyle = radGrad(g, x + 5, y - 6, 0, 40, [[0, "rgba(255,210,140,0.9)"], [1, "rgba(255,170,90,0)"]]); g.fillRect(x - 40, y - 46, 90, 80); } },
};

/** S5 lake at dusk, betrayal plum with hard light. */
export const lake = {
  sky: (g: Ctx, w: number, h: number) => sky(g, w, h, "#2a1830", "#6a2e44", "#c0564a"),
  far: (g: Ctx, w: number, h: number) => {
    g.fillStyle = "#3a1e30"; g.beginPath(); g.moveTo(-M, h * 0.5); for (let x = -M; x <= w + M; x += 60) g.lineTo(x, h * 0.46 - Math.sin(x * 0.006) * 60 - Math.sin(x * 0.02) * 15); g.lineTo(w + M, h * 0.52); g.closePath(); g.fill();
    g.fillStyle = linGrad(g, 0, h * 0.5, 0, h * 0.62, [[0, "#9a4a52"], [1, "#3a2032"]]); g.fillRect(-M, h * 0.5, w + 2 * M, h * 0.14);
    g.strokeStyle = "rgba(255,180,160,0.35)"; g.lineWidth = 3; for (let i = 0; i < 18; i++) { const y = h * 0.52 + i * 9; g.beginPath(); g.moveTo(w * 0.3 + (i % 3) * 40, y); g.lineTo(w * 0.7 - (i % 4) * 30, y); g.stroke(); }
  },
  ground: (g: Ctx, w: number, h: number) => { floor(g, h * 0.62, w, h, "#4a2a34", "#1a0e16"); tree(g, w * 0.92, h * 0.68, 1.3, "#1e1018", "#2e1828", "#3e2234", 41); },
};

/** S6b/S7 Voldemort's hall: black-green, single hard cold light. */
export const darkHall = {
  back: (g: Ctx, w: number, h: number) => {
    g.fillStyle = "#07090a"; g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    for (const x of [w * 0.12, w * 0.4, w * 0.68, w * 0.96]) { g.fillStyle = linGrad(g, x - 50, 0, x + 50, 0, [[0, "#0c1412"], [0.5, "#18241f"], [1, "#0c1412"]]); g.fillRect(x - 50, -M, 100, h + 2 * M); }
    g.fillStyle = radGrad(g, w * 0.5, h * 0.15, 0, 900, [[0, "rgba(90,200,140,0.35)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    floor(g, h * 0.72, w, h, "#121a17", "#030404");
  },
};

/** S8a windswept hilltop at night. */
export const hill = {
  sky: (g: Ctx, w: number, h: number) => {
    sky(g, w, h, "#06080f", "#151d30", "#2a3550");
    const r = rng(77); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(220,230,255,${r() * 0.7})`; g.fillRect(r() * (w + 2 * M) - M, r() * h * 0.6 - M, 2, 2); }
    g.fillStyle = radGrad(g, w * 0.25, h * 0.18, 0, 200, [[0, "rgba(230,235,255,0.9)"], [0.12, "rgba(200,210,240,0.5)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(-M, -M, w + 2 * M, h);
  },
  ground: (g: Ctx, w: number, h: number) => {
    g.fillStyle = "#0e121c"; g.beginPath(); g.moveTo(-M, h * 0.7); g.quadraticCurveTo(w * 0.5, h * 0.56, w + M, h * 0.72); g.lineTo(w + M, h + M); g.lineTo(-M, h + M); g.fill();
    g.fillStyle = "#1a2030"; g.beginPath(); g.moveTo(w * 0.62, h * 0.66); g.lineTo(w * 0.7, h * 0.52); g.lineTo(w * 0.73, h * 0.53); g.lineTo(w * 0.75, h * 0.67); g.fill(); // bare tree stump
  },
};

/** S8b ruined cottage, night: grief blue-grey. */
export const ruin = {
  back: (g: Ctx, w: number, h: number) => {
    sky(g, w, h, "#0c1018", "#1c2534", "#2e3a4c");
    g.fillStyle = "#1a2028"; g.beginPath(); g.moveTo(-M, h * 0.62); g.lineTo(w * 0.1, h * 0.2); g.lineTo(w * 0.35, h * 0.08); g.lineTo(w * 0.42, h * 0.22); g.lineTo(w * 0.5, h * 0.18); g.lineTo(w * 0.62, h * 0.4); g.lineTo(w + M, h * 0.35); g.lineTo(w + M, h * 0.7); g.lineTo(-M, h * 0.7); g.fill();
    archWindow(g, w * 0.66, h * 0.4, 170, 260, "#0a0d12", "#2b323e");
    g.fillStyle = "#2a3240"; g.fillRect(w * 0.2, h * 0.36, 30, 260); g.fillRect(w * 0.48, h * 0.3, 26, 320); // broken beams
    floor(g, h * 0.7, w, h, "#232a36", "#0a0c10");
  },
  rubble: (g: Ctx, w: number, h: number) => { const r = rng(55); for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? "#151a22" : "#262d38"; g.beginPath(); g.ellipse(r() * (w + 2 * M) - M, h * 0.9 + r() * 300, 60 + r() * 120, 30 + r() * 50, r(), 0, 6.283); g.fill(); } },
};

/** S9/S12 headmaster's tower office: candles, shelves, curved walls. */
export const office = {
  back: (g: Ctx, w: number, h: number) => {
    g.fillStyle = linGrad(g, 0, 0, 0, h, [[0, "#1b1622"], [1, "#2a2030"]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    const r = rng(8);
    for (let sy = h * 0.08; sy < h * 0.68; sy += 150) { // shelves of books
      g.fillStyle = "#3a2a22"; g.fillRect(-M, sy + 120, w + 2 * M, 18);
      for (let x = -M; x < w + M; x += 18 + r() * 14) { g.fillStyle = ["#5a2a2a", "#2a3a5a", "#4a4a2a", "#3a2a4a", "#6a5030"][Math.floor(r() * 5)]; const bh = 70 + r() * 45; g.fillRect(x, sy + 120 - bh, 14 + r() * 10, bh); }
    }
    archWindow(g, w * 0.36, h * 0.1, 300, 520, linGrad(g, 0, h * 0.1, 0, h * 0.4, [[0, "#26355a"], [1, "#101826"]]));
    floor(g, h * 0.72, w, h, "#3a2626", "#140c0e");
  },
  desk: (g: Ctx, w: number, h: number) => {
    g.fillStyle = "#3b2418"; g.fillRect(w * 0.55, h * 0.66, w * 0.6, 60); g.fillStyle = "#26160f"; g.fillRect(w * 0.6, h * 0.69, 40, 220); g.fillRect(w * 1.05, h * 0.69, 40, 220);
    for (const cx of [w * 0.62, w * 0.9]) { g.fillStyle = "#efe2c8"; g.fillRect(cx, h * 0.6, 16, 60); g.fillStyle = radGrad(g, cx + 8, h * 0.595, 0, 160, [[0, "rgba(255,200,130,0.85)"], [1, "rgba(255,150,80,0)"]]); g.fillRect(cx - 160, h * 0.6 - 160, 330, 320); }
  },
};

/** S10 potions dungeon classroom. */
export const classroom = {
  back: (g: Ctx, w: number, h: number) => {
    bricks(g, -M, -M, w + 2 * M, h * 0.75 + M, "#26282a", 12, 150, 72);
    g.fillStyle = "#1a1c1e"; for (let x = 40; x < w; x += 260) { g.fillRect(x, h * 0.15, 200, 26); for (let k = 0; k < 6; k++) { g.fillStyle = ["#3a6a4a", "#6a5a2a", "#4a3a6a"][k % 3]; g.fillRect(x + 10 + k * 32, h * 0.15 - 60, 22, 60); } g.fillStyle = "#1a1c1e"; }
    floor(g, h * 0.72, w, h, "#2a2826", "#0e0d0c");
  },
  desks: (g: Ctx, w: number, h: number) => {
    for (const [dx, dy] of [[w * 0.05, h * 0.8], [w * 0.55, h * 0.8]]) {
      g.fillStyle = "#3a2a1e"; g.fillRect(dx, dy, w * 0.42, 40); g.fillStyle = "#24180f"; g.fillRect(dx + 20, dy + 40, 30, 200); g.fillRect(dx + w * 0.42 - 50, dy + 40, 30, 200);
      g.fillStyle = "#1a1a1e"; g.beginPath(); g.ellipse(dx + w * 0.21, dy - 30, 90, 70, 0, 0, Math.PI); g.fill(); g.fillRect(dx + w * 0.21 - 95, dy - 40, 190, 14);
      g.fillStyle = "#5a8a4a"; g.beginPath(); g.ellipse(dx + w * 0.21, dy - 36, 85, 12, 0, 0, 6.283); g.fill();
    }
  },
};

/** S11 tall window, night castle grounds. */
export const tower = {
  view: (g: Ctx, w: number, h: number) => {
    sky(g, w, h, "#05070c", "#101828", "#1c2840");
    g.fillStyle = "#0a0e16"; g.fillRect(-M, h * 0.62, w + 2 * M, h);
    g.fillStyle = "#121a26"; g.beginPath(); g.moveTo(-M, h * 0.62); g.quadraticCurveTo(w * 0.5, h * 0.55, w + M, h * 0.6); g.lineTo(w + M, h * 0.62); g.fill();
  },
  frame: (g: Ctx, w: number, h: number) => {
    g.fillStyle = "#151219"; g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    g.globalCompositeOperation = "destination-out";
    g.beginPath(); g.moveTo(w * 0.15, h * 0.85); g.lineTo(w * 0.15, h * 0.3); g.arc(w * 0.5, h * 0.3, w * 0.35, Math.PI, 0); g.lineTo(w * 0.85, h * 0.85); g.closePath(); g.fill();
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = "#0a080c"; g.lineWidth = 16; g.beginPath(); g.moveTo(w * 0.5, h * 0.3 - w * 0.35); g.lineTo(w * 0.5, h * 0.85); g.moveTo(w * 0.15, h * 0.5); g.lineTo(w * 0.85, h * 0.5); g.stroke();
  },
};

/** S13 derelict shack: splintered planks, dust shafts. */
export const shack = {
  back: (g: Ctx, w: number, h: number) => {
    const r = rng(31);
    for (let x = -M; x < w + M; x += 90) { g.fillStyle = `rgb(${40 + r() * 14},${30 + r() * 10},${28 + r() * 8})`; g.fillRect(x, -M, 86, h + M); g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(x + 86, -M, 4, h + M); }
    g.fillStyle = "#0c0a0a"; g.fillRect(w * 0.6, h * 0.25, 160, 50); g.fillRect(w * 0.2, h * 0.5, 40, 120); // gaps
    g.fillStyle = linGrad(g, w * 0.6, h * 0.25, w * 0.3, h * 0.8, [[0, "rgba(180,200,220,0.25)"], [1, "rgba(180,200,220,0)"]]);
    g.beginPath(); g.moveTo(w * 0.6, h * 0.25); g.lineTo(w * 0.76, h * 0.27); g.lineTo(w * 0.5, h * 0.9); g.lineTo(w * 0.15, h * 0.9); g.fill();
    floor(g, h * 0.74, w, h, "#2e2420", "#0e0a0a");
  },
};

// ---------- v2 additions ----------
/** Spinner's End-style childhood home (original design): bare kitchen, one bulb, cold window. */
export const home = {
  back: (g: Ctx, w: number, h: number) => {
    g.fillStyle = linGrad(g, 0, 0, 0, h, [[0, "#2a2422"], [1, "#1a1514"]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    // peeling wallpaper stripes
    g.fillStyle = "rgba(90,70,60,0.25)"; for (let x = -M; x < w + M; x += 70) g.fillRect(x, -M, 30, h * 0.72 + M);
    archWindow(g, w * 0.62, h * 0.18, 260, 380, linGrad(g, 0, h * 0.18, 0, h * 0.4, [[0, "#3a4a66"], [1, "#1a2230"]]), "#120e0d");
    g.fillStyle = "#3a2c24"; g.fillRect(-M, h * 0.62, w * 0.55 + M, 30); g.fillStyle = "#2a1f1a"; g.fillRect(w * 0.05, h * 0.62 + 30, 30, 220); g.fillRect(w * 0.45, h * 0.62 + 30, 30, 220); // table
    floor(g, h * 0.74, w, h, "#2a2220", "#0c0908");
    g.fillStyle = radGrad(g, w * 0.3, h * 0.12, 0, 700, [[0, "rgba(255,200,120,0.35)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    g.strokeStyle = "#0e0a09"; g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.3, -M); g.lineTo(w * 0.3, h * 0.1); g.stroke();
    g.fillStyle = "#ffe0a0"; g.beginPath(); g.arc(w * 0.3, h * 0.11, 18, 0, 6.283); g.fill();
  },
};

/** Foreground framing layers (depth > 1: they pass the lens faster than the subject = strong parallax). */
export const fg = {
  pillar: (g: Ctx, w: number, h: number) => { g.fillStyle = linGrad(g, w * 0.86, 0, w * 1.1, 0, [[0, "#120f16"], [0.4, "#1e1a24"], [1, "#0a080c"]]); g.fillRect(w * 0.86, -M, 300, h + 2 * M); },
  reeds: (g: Ctx, w: number, h: number) => { const r = rng(61); g.strokeStyle = "#140a12"; for (let i = 0; i < 70; i++) { const x = -M + r() * 420, y0 = h + M; g.lineWidth = 6 + r() * 8; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + 30, h * 0.75, x + 10 + r() * 60, h * (0.55 + r() * 0.2)); g.stroke(); } },
  shelf: (g: Ctx, w: number, h: number) => { g.fillStyle = "#1a110e"; g.fillRect(-M, -M, M + 150, h + 2 * M); const r = rng(71); for (let y = 0; y < h; y += 150) { g.fillStyle = "#2a1a14"; g.fillRect(-M, y + 120, M + 150, 16); for (let x = -M; x < 140; x += 22) { g.fillStyle = ["#4a2020", "#20304a", "#3a3a1a"][Math.floor(r() * 3)]; g.fillRect(x, y + 50 + r() * 20, 18, 70); } } },
  cauldron: (g: Ctx, w: number, h: number) => { g.fillStyle = "#0e0e10"; g.beginPath(); g.ellipse(w * 0.85, h * 1.02, 300, 220, 0, 0, 6.283); g.fill(); g.fillStyle = "#3f6a3a"; g.beginPath(); g.ellipse(w * 0.85, h * 0.92, 250, 40, 0, 0, 6.283); g.fill(); },
  chair: (g: Ctx, w: number, h: number) => {
    g.fillStyle = "#2a1a16"; g.strokeStyle = "#0e0808"; g.lineWidth = 6;
    g.beginPath(); g.roundRect(w * 0.26, h * 0.42, w * 0.3, h * 0.3, 24); g.fill(); g.stroke(); // back
    g.beginPath(); g.roundRect(w * 0.22, h * 0.68, w * 0.38, 50, 12); g.fill(); g.stroke(); // seat
    g.fillRect(w * 0.24, h * 0.7, 26, 200); g.fillRect(w * 0.56, h * 0.7, 26, 200);
  },
};

/** Office extras for the grief beat: dying fire glow and a wall clock. */
export const officeNight = {
  back: (g: Ctx, w: number, h: number) => { office.back(g, w, h); g.fillStyle = "rgba(10,12,30,0.45)"; g.fillRect(-M, -M, w + 2 * M, h + 2 * M);
    g.fillStyle = "#2a2018"; g.beginPath(); g.arc(w * 0.82, h * 0.2, 70, 0, 6.283); g.fill(); g.strokeStyle = "#c9a95a"; g.lineWidth = 6; g.stroke(); },
};
