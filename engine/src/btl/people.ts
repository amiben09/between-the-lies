// Between the Lies — original graphic-drama characters drawn with Canvas2D.
// Local units: feet at (0,0), adult height 1000, +y down. Each character is drawn to a scratch canvas, lit
// (key/shade gradient, source-atop), optionally depth-blurred, then composited — so lighting never touches the set.
import { Cam, Ctx, H, W, makeCanvas, radGrad } from "./core";

export type Kind = "snape" | "lily" | "harry" | "james" | "neville" | "dumbledore" | "voldemort" | "bully" | "itachi" | "sasuke" | "victor" | "freeze" | "nora" | "boyle" | "batman" | "jinx" | "vi" | "vander" | "mylo" | "silco" | "tailung" | "shifu" | "oogway";
/** anthropomorphic animal characters (original channel designs): fur = skin, markings = hair */
export const BEAST = (k: Kind) => k === "tailung" || k === "shifu" || k === "oogway";
export type Age = "child" | "teen" | "adult";
export type Arm = [number, number]; // [shoulder deg from straight down, + = toward screen-right; elbow bend deg]
export type Pose = {
  x: number; y: number; s: number;          // screen-plane position (feet) and scale
  facing?: number;                           // -1 (3/4 to screen-left) .. 0 (front) .. 1 (3/4 right)
  back?: boolean;                            // seen from behind
  look?: [number, number];                   // gaze -1..1
  brow?: number;                             // -1 angry/scowl .. 0 .. 1 grief (inner brows up)
  eye?: number;                              // lid openness 0..1.2 (1.2 = wide in shock)
  mouth?: number;                            // -1 frown .. 1 smile
  open?: number;                             // mouth open 0..1
  armL?: Arm; armR?: Arm;
  kneel?: number;                            // 0..1
  lean?: number;                             // deg
  rot?: number;                              // whole-body rotation deg (lying)
  breathe?: number;                          // frame number for breathing
  blink?: boolean;
  tear?: number;                             // 0..1
  prop?: (g: Ctx, hand: "L" | "R", x: number, y: number) => void;
  headOnly?: boolean;                        // draw head + shoulders only (close-ups)
  tilt?: number;                             // head tilt deg (+ = toward screen-right)
  nod?: number;                              // head drop (+) / lift (-), in head-heights
  shoulders?: number;                        // -1 tense shrug .. 0 .. 1 grief slump
  handL?: Hand; handR?: Hand;                // hand shapes
  tremble?: number;                          // 0..1 shaking hands/head
  walk?: number;                             // walk-cycle phase (radians); undefined = standing
  still?: boolean;                           // disable automatic micro-motion (gaze saccades, sway)
  coat?: string; coatHi?: string;            // costume override (e.g. school robes on children, a wedding dress)
  trim?: string | null;                      // house colour override (null = none)
  robe?: boolean;                            // floor-length override
  eyesRed?: number;                          // 0..1 the red-eye power (original ring design)
  headband?: "plain" | "scratched";          // cloth band with a plain metal plate (original; no village emblem)
  mask?: boolean;                            // white spy mask (original design: red cheek marks, eye slits)
};
export type Hand = "mitt" | "open" | "fist" | "point" | "grip";
export type Light = { x: number; y: number; r: number; key: string; shade: string; keyA?: number; shadeA?: number };

type Look = { skin: string; skinSh: string; hair: string; hairHi: string; iris: string; coat: string; coatHi: string; trim?: string; legs: string; H: number; hh: number; sw: number; robe: boolean };
const INK = "#1c121c";

function look(kind: Kind, age: Age): Look {
  const sz = age === "child" ? { H: 640, hh: 168, sw: 150 } : age === "teen" ? { H: 880, hh: 158, sw: 210 } : { H: 1000, hh: 150, sw: 250 };
  switch (kind) {
    case "snape": return { ...sz, skin: "#d8c3a8", skinSh: "#a88f78", hair: "#141017", hairHi: "#3a3240", iris: "#1a1214",
      coat: age === "child" ? "#5b5348" : "#16131a", coatHi: age === "child" ? "#756b5c" : "#2c2733", trim: age === "teen" ? "#2f6b48" : undefined, legs: "#2b2a30", robe: age !== "child" };
    case "lily": return { ...sz, skin: "#f1d2bd", skinSh: "#c99d88", hair: "#8e2f1f", hairHi: "#c4552f", iris: "#1fae63",
      coat: age === "child" ? "#d9b65e" : age === "adult" ? "#6f7f9e" : "#1d1a22", coatHi: age === "child" ? "#efd27e" : age === "adult" ? "#93a3c0" : "#2f2a36", trim: age === "teen" ? "#a8322b" : undefined, legs: "#e8d0b4", robe: age !== "child" };
    case "harry": return { ...sz, skin: "#ecccb0", skinSh: "#c19c83", hair: "#120f12", hairHi: "#2d2830", iris: "#1fae63",
      coat: age === "adult" ? "#3a3f4a" : "#1d1a22", coatHi: "#343040", trim: "#a8322b", legs: "#2d3140", robe: age === "child" };
    case "itachi": return { ...sz, skin: "#ead2bc", skinSh: "#bf9f8a", hair: "#14111a", hairHi: "#2e2a3a", iris: "#2a1f24",
      coat: age === "adult" ? "#1c1a22" : "#2c3240", coatHi: age === "adult" ? "#34303e" : "#424a5e", legs: "#262a34", robe: age === "adult" };
    case "sasuke": return { ...sz, skin: "#efd4bf", skinSh: "#c8a48c", hair: "#141220", hairHi: "#30304a", iris: "#2a2430",
      coat: age === "child" ? "#2f5f9a" : "#d8d8d0", coatHi: age === "child" ? "#4a7ab8" : "#f0f0e8", legs: age === "child" ? "#e8e4dc" : "#3a3550", robe: false };
    case "james": return { ...sz, skin: "#e9c8aa", skinSh: "#be987e", hair: "#120f12", hairHi: "#2d2830", iris: "#8a6a3a",
      coat: "#1d1a22", coatHi: "#343040", trim: "#a8322b", legs: "#2d3140", robe: true };
    case "neville": return { ...sz, skin: "#efd0b5", skinSh: "#c79f86", hair: "#5a3b26", hairHi: "#7c5638", iris: "#5a4a3a",
      coat: "#1d1a22", coatHi: "#343040", trim: "#a8322b", legs: "#2d3140", robe: true };
    case "dumbledore": return { ...sz, H: 1060, skin: "#e6cdb6", skinSh: "#b8987f", hair: "#d9d6d2", hairHi: "#ffffff", iris: "#5b8fc9",
      coat: "#3f2a5c", coatHi: "#5d4385", legs: "#2d2140", robe: true };
    case "voldemort": return { ...sz, H: 1060, skin: "#d7d9d6", skinSh: "#9da3a2", hair: "#0c0b0e", hairHi: "#1d1b22", iris: "#c0202a",
      coat: "#0f0d12", coatHi: "#211d27", legs: "#0f0d12", robe: true };
    case "bully": return { ...sz, skin: "#e2c4a8", skinSh: "#b5967e", hair: "#2a1f1a", hairHi: "#463630", iris: "#3a2a20",
      coat: "#1d1a22", coatHi: "#343040", trim: "#a8322b", legs: "#2d3140", robe: true };
    // ---- "Snow Globe" (Mr. Freeze) — original channel renditions, not copied model sheets ----
    case "victor": return { ...sz, skin: "#e6d0bc", skinSh: "#b89c88", hair: "#1e1a1c", hairHi: "#3a3438", iris: "#3a4a5a",
      coat: "#e4e8ea", coatHi: "#ffffff", legs: "#2c2f38", robe: true };
    case "freeze": return { ...sz, H: 1060, sw: 290, skin: "#c4dcea", skinSh: "#8eaec4", hair: "#c4dcea", hairHi: "#dcecf6", iris: "#7fe4ff",
      coat: "#3e4c5c", coatHi: "#6e8296", legs: "#34404e", robe: false };
    case "nora": return { ...sz, skin: "#f3e2d6", skinSh: "#cdb0a2", hair: "#ece2c8", hairHi: "#fff8e4", iris: "#5a7ab0",
      coat: "#a9a3c9", coatHi: "#cbc6e6", legs: "#e8dcd0", robe: true };
    case "boyle": return { ...sz, skin: "#ecc8a8", skinSh: "#c09a7e", hair: "#a8803e", hairHi: "#d0a858", iris: "#4a6a8a",
      coat: "#232a40", coatHi: "#3a4462", trim: "#a8222a", legs: "#232a40", robe: false };
    // ---- "Perfect" (Jinx) — original channel renditions (not Fortiche model sheets) ----
    case "jinx": return { ...sz, skin: "#f2ddd0", skinSh: "#c8a898", hair: "#2a5ad8", hairHi: "#3a6ae8", iris: age === "child" ? "#4a7ad8" : "#c84ac8",
      coat: age === "child" ? "#e8d8e8" : "#2a2230", coatHi: age === "child" ? "#ffffff" : "#4a3a50", trim: age === "child" ? undefined : "#e84a9a", legs: age === "child" ? "#5a4a6a" : "#3a2a4a", robe: false };
    case "vi": return { ...sz, skin: "#ecc8b0", skinSh: "#c09c84", hair: "#d8506a", hairHi: "#ff7a90", iris: "#5a7ab0",
      coat: "#a8282e", coatHi: "#d0424a", legs: "#3a3440", robe: false };
    case "vander": return { ...sz, H: 1060, sw: 310, skin: "#d8b494", skinSh: "#a8866a", hair: "#7a7470", hairHi: "#a8a29c", iris: "#5a4a3a",
      coat: "#5a4030", coatHi: "#7a5a44", legs: "#3a3028", robe: false };
    case "mylo": return { ...sz, skin: "#e4c4a8", skinSh: "#b89a80", hair: "#3a2a22", hairHi: "#5a4436", iris: "#4a3a2a",
      coat: "#4a5a3a", coatHi: "#6a7a54", legs: "#3a3430", robe: false };
    case "silco": return { ...sz, skin: "#e2cfc0", skinSh: "#b0998a", hair: "#2a2228", hairHi: "#4a3e48", iris: "#3a2a24",
      coat: "#2a3a30", coatHi: "#3e5446", trim: "#7a1a20", legs: "#22261e", robe: true };
    case "batman": return { ...sz, H: 1040, sw: 280, skin: "#e2c0a2", skinSh: "#b8967a", hair: "#2a2c36", hairHi: "#3c404c", iris: "#f4f4f4",
      coat: "#4a4f5c", coatHi: "#6a7080", legs: "#3a3e4a", robe: false };
    // ---- Kung Fu valley (original designs; no studio model sheets) ----
    case "tailung": return age === "child" ? { ...sz, H: 520, hh: 190, sw: 150, skin: "#e2e0da", skinSh: "#aeaaa6", hair: "#3a3842", hairHi: "#5a5862", iris: "#e8a42c",
      coat: "#d8d6d0", coatHi: "#f0eee8", legs: "#4a4450", robe: false }
      : { ...sz, H: age === "teen" ? 960 : 1100, hh: age === "teen" ? 230 : 245, sw: age === "teen" ? 270 : 340, skin: "#dcdad4", skinSh: "#a4a09c", hair: "#34323c", hairHi: "#56545e", iris: "#e8a42c",
      coat: "#cfccc6", coatHi: "#eeebe6", legs: "#3a3440", robe: false }; // bare furred torso + arms, dark trousers
    case "shifu": return { ...sz, H: 600, hh: 175, sw: 165, skin: "#c45a2a", skinSh: "#86381a", hair: age === "adult" ? "#e8e2d8" : "#f6efe2", hairHi: "#ffffff", iris: "#2a1a14",
      coat: "#7a6440", coatHi: "#a08858", legs: "#3a2a22", robe: true };
    case "oogway": return { ...sz, H: 760, hh: 200, sw: 270, skin: "#93a27e", skinSh: "#5e6c4e", hair: "#5e6c4e", hairHi: "#b4c2a0", iris: "#3a3020",
      coat: "#7a6a48", coatHi: "#9a8a62", legs: "#5e6c4e", robe: true };
  }
}

/** drawn height (px at s = 1) of a character — used to size cards in metres */
export const figH = (kind: Kind, age: Age) => look(kind, age).H;

let scratch: [HTMLCanvasElement, Ctx] | null = null;
const sc = () => (scratch ??= makeCanvas(W, H));

/** Draw a lit character into the frame. depth = parallax depth used by the shot's camera; blur = DOF px. */
export function person(g: Ctx, cam: Cam, depth: number, kind: Kind, age: Age, p: Pose, light: Light, blur = 0) {
  const [c, s] = sc();
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.clearRect(0, 0, W, H);
  s.save();
  const z = 1 + (cam.zoom - 1) * depth;
  s.translate(W / 2, H / 2);
  if (cam.roll) s.rotate((cam.roll * Math.PI / 180) * depth);
  s.scale(z, z);
  s.translate(-W / 2 - cam.x * depth, -H / 2 - cam.y * depth);
  s.translate(p.x, p.y);
  s.scale(p.s, p.s);
  if (p.rot) s.rotate(p.rot * Math.PI / 180);
  drawFigure(s, kind, age, p);
  s.restore();
  // light: key near the light source, shade away from it (only on the character's pixels)
  s.save();
  s.globalCompositeOperation = "source-atop";
  s.fillStyle = radGrad(s, light.x, light.y, 0, light.r, [[0, hexA(light.key, light.keyA ?? 0.32)], [0.45, hexA(light.key, 0)], [1, hexA(light.shade, light.shadeA ?? 0.55)]]);
  s.fillRect(0, 0, W, H);
  s.restore();
  g.save();
  if (blur > 0) g.filter = `blur(${blur}px)`;
  g.drawImage(c, 0, 0);
  g.restore();
}

export function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function inked(g: Ctx, fill: string | CanvasGradient, lw = 5) {
  g.fillStyle = fill; g.fill();
  g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = "round"; g.lineCap = "round"; g.stroke();
}

function drawFigure(g: Ctx, kind: Kind, age: Age, p: Pose) {
  const L0 = look(kind, age);
  const L: Look = { ...L0, ...(p.coat ? { coat: p.coat, coatHi: p.coatHi ?? p.coat } : {}), ...(p.robe !== undefined ? { robe: p.robe } : {}), ...(p.trim !== undefined ? { trim: p.trim ?? undefined } : {}) };
  const kneel = p.kneel ?? 0;
  const fr = p.breathe ?? 0;
  const br = p.breathe !== undefined ? Math.sin(fr / 30 * Math.PI * 0.55) : 0;
  const sh = p.shoulders ?? 0;
  const tr = p.tremble ?? 0;
  const walking = p.walk !== undefined, ws = walking ? Math.sin(p.walk!) : 0;
  const Hh = L.H * (1 - kneel * 0.3);
  const shY = -Hh + L.hh * 1.12 + br * 3 + (sh > 0 ? sh * L.hh * 0.16 : sh * L.hh * 0.09);
  const sw = L.sw * (1 + br * 0.008) * (1 - Math.max(0, sh) * 0.05);
  g.save();
  if (p.lean) { g.rotate(p.lean * Math.PI / 180); }
  if (walking) g.translate(0, -Math.abs(Math.cos(p.walk!)) * L.H * 0.014);

  // contact shadow
  if (!p.rot && !p.headOnly) { g.save(); g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(0, 0, sw * 0.75, 14, 0, 0, 6.283); g.fill(); g.restore(); }

  if (!p.headOnly) {
    // legs (not for floor-length robes)
    const hemY = L.robe ? -4 : -Hh * 0.36;
    if (!L.robe) {
      g.save();
      for (const sx of [-1, 1]) {
        const lift = walking ? Math.max(0, sx * ws) * 26 : 0, stride = walking ? sx * ws * sw * 0.12 : 0;
        if (BEAST(kind)) { // loose kung-fu trousers gathered at the ankle + furred paws
          const lx = sx * sw * 0.2 + stride * 0.5, top = hemY - 24, bot = -26 - lift;
          g.beginPath(); g.moveTo(lx - sw * 0.17, top); g.lineTo(lx + sw * 0.17, top); g.quadraticCurveTo(lx + sw * 0.2, (top + bot) / 2, lx + sw * 0.1, bot); g.lineTo(lx - sw * 0.1, bot); g.quadraticCurveTo(lx - sw * 0.2, (top + bot) / 2, lx - sw * 0.17, top); g.closePath(); inked(g, L.legs, 4);
          g.beginPath(); g.roundRect(lx - sw * 0.11, bot - 6, sw * 0.22, 16, 6); inked(g, "#2a2028", 3);
          g.beginPath(); g.ellipse(sx * sw * 0.2 + (p.facing ?? 0) * 12 + stride, -8 - lift, sw * 0.15, 14, 0, 0, 6.283); inked(g, L.skin, 4);
        } else {
        g.beginPath(); g.roundRect(sx * sw * 0.16 - sw * 0.1 + stride * 0.5, hemY - 20, sw * 0.2, -hemY + 6 - lift, 6);
        inked(g, L.legs, 4);
        g.beginPath(); g.ellipse(sx * sw * 0.16 + (p.facing ?? 0) * 10 + stride, -6 - lift, sw * 0.15, 12, 0, 0, 6.283); inked(g, "#1d1719", 4); }
      }
      g.restore();
    }
    // back hair falls behind the coat for long hair
    if (kind === "lily" || kind === "dumbledore" || kind === "nora") backHair(g, L, kind === "nora" ? "lily" : kind, shY - L.hh * 0.6, p);
    if (kind === "jinx" && age !== "child") { // two very long braids falling behind (original design)
      for (const sg of [-1, 1]) { const bx = sg * sw * 0.28, sway = Math.sin(fr * 0.06 + sg) * 8;
        g.beginPath(); g.moveTo(bx - 14, shY - L.hh * 0.5); g.quadraticCurveTo(bx + sg * 40 + sway, -Hh * 0.45, bx + sg * 20 + sway * 2, -Hh * 0.05);
        g.lineTo(bx + sg * 20 + sway * 2 + 12, -Hh * 0.05); g.quadraticCurveTo(bx + sg * 52 + sway, -Hh * 0.45, bx + 14, shY - L.hh * 0.5); g.closePath(); inked(g, L.hair, 4);
        g.strokeStyle = L.hairHi; g.lineWidth = 3; for (let k = 1; k < 9; k++) { const t = k / 9, yy = shY - L.hh * 0.5 + t * (-Hh * 0.05 - shY + L.hh * 0.5); g.beginPath(); g.moveTo(bx + sg * 30 * t - 10 + sway * t, yy); g.lineTo(bx + sg * 30 * t + 10 + sway * t, yy + 10); g.stroke(); } }
    }
    if (kind === "batman") { // cape: wide, scalloped hem, sways with breath/walk
      const cs = Math.sin(fr * 0.07) * 10 + (walking ? ws * 18 : 0);
      g.beginPath(); g.moveTo(-sw * 0.42, shY - 8);
      g.quadraticCurveTo(-sw * 1.05 + cs, -Hh * 0.45, -sw * 0.95 + cs, -14);
      for (let k = 0; k < 5; k++) { const x0 = -sw * 0.95 + cs + k * (sw * 1.9 / 5), x1 = x0 + sw * 1.9 / 5; g.quadraticCurveTo((x0 + x1) / 2, -44, x1, -14); }
      g.quadraticCurveTo(sw * 1.05 + cs, -Hh * 0.45, sw * 0.42, shY - 8); g.closePath(); inked(g, "#1c1e28", 5);
    }
    if (kind === "tailung" || kind === "shifu") { // tail: thick (leopard, dark tip) / ringed (red panda); sways with breath
      const ts = Math.sin(fr * 0.045) * 0.25 + (walking ? ws * 0.3 : 0), tl = L.H * (kind === "shifu" ? 0.6 : 0.62), tw = kind === "shifu" ? sw * 0.2 : sw * 0.085;
      g.save(); g.translate((p.facing ?? 0) * -sw * 0.2 - sw * 0.25, -Hh * 0.36);
      const n = 26, pts: [number, number, number][] = [];
      for (let k = 0; k <= n; k++) { const t = k / n; // hangs from the hip behind the legs, then curls up and out (stays inside the card)
        const px = -Math.sin(t * 2.4) * tl * 0.32 - ts * t * tl * 0.12, py = Math.sin(t * Math.PI * 0.85) * tl * 0.55 - t * t * tl * 0.55;
        pts.push([px, py, tw * (1.05 - t * 0.45)]); }
      g.lineCap = "round"; g.lineJoin = "round";
      for (const pass of [0, 1]) for (let k = 0; k < n; k++) { const [x0, y0, w0] = pts[k], [x1, y1] = pts[k + 1];
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
        g.strokeStyle = pass === 0 ? INK : kind === "shifu" ? (Math.floor(k / 3) % 2 ? "#ead9bf" : L.skin) : (k > n - 4 ? L.hair : L.skin);
        g.lineWidth = pass === 0 ? w0 * 2 + 8 : w0 * 2; g.stroke(); }
      if (kind === "tailung") { g.fillStyle = L.hair; for (let k = 3; k < n - 4; k += 4) { const [x, y, w] = pts[k]; g.beginPath(); g.ellipse(x, y - w * 0.3, w * 0.35, w * 0.25, 0, 0, 6.283); g.fill(); } }
      g.restore();
    }
    if (kind === "oogway") { // shell behind the robe: domed, plated
      g.beginPath(); g.ellipse(0, shY + (-Hh * 0.36 - shY) * 0.45, sw * 0.72, (-Hh * 0.36 - shY) * 0.75 + 40, 0, 0, 6.283); inked(g, "#6a5a3a", 5);
      g.strokeStyle = "rgba(30,20,10,0.45)"; g.lineWidth = 4; for (const dx of [-0.4, 0, 0.4]) { g.beginPath(); g.moveTo(sw * dx, shY - 30); g.lineTo(sw * dx * 1.3, -Hh * 0.2); g.stroke(); }
    }
    // torso / robe
    const flare = L.robe ? 1.3 : kind === "tailung" ? 0.74 : 1.12;
    g.beginPath();
    g.moveTo(-sw / 2, shY + 18);
    g.quadraticCurveTo(-sw / 2 - 6, shY - 6, -sw * 0.18, shY - 12);
    g.lineTo(sw * 0.18, shY - 12);
    g.quadraticCurveTo(sw / 2 + 6, shY - 6, sw / 2, shY + 18);
    const sway = (walking ? ws * 14 : 0) + Math.sin(fr * 0.05) * 2;
    g.lineTo(sw / 2 * flare + sway, hemY);
    g.quadraticCurveTo(sway, hemY + 10, -sw / 2 * flare + sway, hemY);
    g.closePath();
    const cg = g.createLinearGradient(-sw, 0, sw, 0);
    cg.addColorStop(0, L.coatHi); cg.addColorStop(0.55, L.coat); cg.addColorStop(1, L.coat);
    inked(g, cg, 5);
    // costume details
    g.save();
    if (p.back) { g.restore(); } else {
    g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 3;
    if (kind === "snape" && age === "adult") { // high buttoned frock coat
      g.fillStyle = "#3a3440";
      for (let by = shY + 20; by < -Hh * 0.45; by += 22) { g.beginPath(); g.arc((p.facing ?? 0) * 18, by, 3.5, 0, 6.283); g.fill(); }
      g.beginPath(); g.moveTo(-14, shY - 10); g.lineTo(0, shY + 8); g.lineTo(14, shY - 10); g.fillStyle = "#ece6dc"; g.fill();
    }
    if (L.trim) { // house tie / lining stripe
      g.fillStyle = L.trim; g.beginPath(); g.moveTo(-8, shY - 6); g.lineTo(8, shY - 6); g.lineTo(5, shY + 90); g.lineTo(0, shY + 102); g.lineTo(-5, shY + 90); g.closePath(); g.fill();
      g.strokeStyle = "rgba(255,230,160,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, shY + 30); g.lineTo(6, shY + 24); g.moveTo(-6, shY + 60); g.lineTo(6, shY + 54); g.stroke();
    }
    if (kind === "snape" && age === "child") { // oversized coat: big lapels, turned-up hem
      g.beginPath(); g.moveTo(-sw * 0.2, shY - 8); g.lineTo(-sw * 0.05, shY + 120); g.lineTo(-sw * 0.3, shY + 40); g.closePath(); g.fillStyle = L.coatHi; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(sw * 0.2, shY - 8); g.lineTo(sw * 0.05, shY + 120); g.lineTo(sw * 0.3, shY + 40); g.closePath(); g.fill(); g.stroke();
    }
    if (kind === "itachi" && age === "adult") { // high collar, red lining
      g.fillStyle = "#8a1f26"; g.beginPath(); g.moveTo(-sw * 0.3, shY - 30); g.lineTo(-sw * 0.06, shY + 40); g.lineTo(-sw * 0.36, shY + 10); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(sw * 0.3, shY - 30); g.lineTo(sw * 0.06, shY + 40); g.lineTo(sw * 0.36, shY + 10); g.closePath(); g.fill();
    }
    if (kind === "lily" && age === "child") { g.fillStyle = "#f6e7b8"; g.beginPath(); g.ellipse(0, shY + 2, sw * 0.22, 14, 0, 0, Math.PI); g.fill(); }
    if (kind === "victor") { // lab coat: open lapels over a dark shirt + tie, pocket with pens
      g.fillStyle = "#3a4250"; g.beginPath(); g.moveTo(-sw * 0.16, shY - 8); g.lineTo(0, shY + 150); g.lineTo(sw * 0.16, shY - 8); g.closePath(); g.fill();
      g.fillStyle = "#6a2a30"; g.beginPath(); g.moveTo(-6, shY); g.lineTo(6, shY); g.lineTo(4, shY + 110); g.lineTo(0, shY + 120); g.lineTo(-4, shY + 110); g.closePath(); g.fill();
      g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 3; g.beginPath(); g.moveTo(-sw * 0.16, shY - 8); g.lineTo(-sw * 0.05, shY + 160); g.moveTo(sw * 0.16, shY - 8); g.lineTo(sw * 0.05, shY + 160); g.stroke();
      g.strokeRect(sw * 0.14, shY + 70, sw * 0.16, 34); g.fillStyle = "#2a5a9a"; g.fillRect(sw * 0.17, shY + 58, 5, 20); g.fillStyle = "#1a1a1a"; g.fillRect(sw * 0.22, shY + 61, 5, 17);
    }
    if (kind === "boyle") { // white shirt V under the suit jacket, lapels, pocket square
      g.fillStyle = "#f2f0ea"; g.beginPath(); g.moveTo(-sw * 0.14, shY - 8); g.lineTo(0, shY + 120); g.lineTo(sw * 0.14, shY - 8); g.closePath(); g.fill();
      g.fillStyle = L.trim ?? "#a8222a"; g.beginPath(); g.moveTo(-7, shY - 2); g.lineTo(7, shY - 2); g.lineTo(5, shY + 100); g.lineTo(0, shY + 112); g.lineTo(-5, shY + 100); g.closePath(); g.fill();
      g.fillStyle = "#e8e0d0"; g.beginPath(); g.moveTo(-sw * 0.36, shY + 50); g.lineTo(-sw * 0.24, shY + 44); g.lineTo(-sw * 0.22, shY + 56); g.closePath(); g.fill();
    }
    if (kind === "freeze") { // armored cold-suit: chest unit with glowing coolant core, ribbed plates, collar ring
      g.beginPath(); g.roundRect(-sw * 0.22, shY + 30, sw * 0.44, 110, 14); inked(g, "#2a3440", 4);
      g.fillStyle = "#7fe4ff"; g.shadowColor = "#7fe4ff"; g.shadowBlur = 18; g.beginPath(); g.arc(0, shY + 85, 20, 0, 6.283); g.fill(); g.shadowBlur = 0;
      g.strokeStyle = "rgba(160,220,255,0.6)"; g.lineWidth = 3; for (const yy of [shY + 160, shY + 190, shY + 220]) { g.beginPath(); g.moveTo(-sw * 0.38, yy); g.lineTo(sw * 0.38, yy); g.stroke(); }
      g.beginPath(); g.ellipse(0, shY - 4, sw * 0.32, 22, 0, 0, 6.283); inked(g, "#5a6e82", 4);
    }
    if (kind === "jinx" && age !== "child") { // original pink cloud motif across the shoulder + crossed straps
      g.strokeStyle = "#e84a9a"; g.lineWidth = 5; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-sw * 0.28 + k * 18, shY + 40 + k * 6, 10, Math.PI, 0); g.stroke(); }
      g.strokeStyle = "#1a1418"; g.lineWidth = 8; g.beginPath(); g.moveTo(-sw * 0.4, shY + 10); g.lineTo(sw * 0.35, -Hh * 0.45); g.stroke();
    }
    if (kind === "vi") { g.fillStyle = "#e8e0d8"; g.beginPath(); g.moveTo(-sw * 0.14, shY - 8); g.lineTo(0, shY + 90); g.lineTo(sw * 0.14, shY - 8); g.closePath(); g.fill(); }
    if (kind === "vander") { g.fillStyle = "#3a2a20"; g.beginPath(); g.roundRect(-sw * 0.42, -Hh * 0.46, sw * 0.84, 24, 6); g.fill(); g.fillStyle = "#c8a050"; g.fillRect(-14, -Hh * 0.46 + 2, 28, 20); }
    if (kind === "silco") { // high collar, red lining, buttons
      g.fillStyle = L.trim ?? "#7a1a20"; g.beginPath(); g.moveTo(-sw * 0.28, shY - 34); g.lineTo(-sw * 0.05, shY + 30); g.lineTo(-sw * 0.36, shY + 8); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(sw * 0.28, shY - 34); g.lineTo(sw * 0.05, shY + 30); g.lineTo(sw * 0.36, shY + 8); g.closePath(); g.fill();
      g.fillStyle = "#c8b070"; for (let by = shY + 40; by < -Hh * 0.4; by += 30) { g.beginPath(); g.arc((p.facing ?? 0) * 14, by, 3.5, 0, 6.283); g.fill(); }
    }
    if (kind === "tailung") { // rosettes on the shoulders + a dark cloth sash at the waist (original)
      g.fillStyle = L0.hair; for (const [x, y] of [[-0.3, 0.06], [0.28, 0.1], [-0.1, 0.2], [0.12, 0.32], [-0.33, 0.36]]) { g.beginPath(); g.ellipse(sw * x, shY + (-Hh * 0.36 - shY) * y + 30, sw * 0.04, sw * 0.03, 0, 0, 6.283); g.fill(); }
      g.beginPath(); g.roundRect(-sw * 0.5, -Hh * 0.38 - 30, sw, 34, 8); inked(g, "#5a2a3a", 4);
    }
    if (kind === "batman") { // utility belt (no chest emblem — original rendition)
      g.beginPath(); g.roundRect(-sw * 0.4, -Hh * 0.47, sw * 0.8, 26, 6); inked(g, "#c8a23a", 4);
      g.fillStyle = "#8a6a20"; for (let k = -2; k <= 2; k++) { g.beginPath(); g.roundRect(k * sw * 0.15 - 10, -Hh * 0.47 + 4, 20, 18, 3); g.fill(); }
    }
    if (L.robe) { g.beginPath(); g.moveTo((p.facing ?? 0) * 20, shY + 10); g.lineTo((p.facing ?? 0) * 26, hemY - 6); g.strokeStyle = "rgba(0,0,0,0.28)"; g.lineWidth = 4; g.stroke(); }
    g.restore(); }
    // arms
    const armLen = L.H * 0.17, foreLen = L.H * 0.16, aw = sw * 0.22;
    for (const side of ["L", "R"] as const) {
      const a0 = (side === "L" ? p.armL : p.armR) ?? (side === "L" ? [8, 6] : [-8, -6]);
      const swing = walking ? (side === "L" ? -1 : 1) * ws * 14 : 0;
      const shake = tr * Math.sin(fr * 2.3 + (side === "L" ? 0 : 1.7)) * 3;
      const a: Arm = [a0[0] + swing + shake, a0[1] + shake * 0.6 + Math.sin(fr * 0.04 + (side === "L" ? 0 : 2)) * 1.5];
      const sx = (side === "L" ? -1 : 1) * sw * 0.44, sy = shY + 14;
      const r1 = a[0] * Math.PI / 180, r2 = (a[0] + a[1]) * Math.PI / 180;
      const ex = sx + Math.sin(r1) * armLen, ey = sy + Math.cos(r1) * armLen;
      const hx = ex + Math.sin(r2) * foreLen, hy = ey + Math.cos(r2) * foreLen;
      g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy);
      g.strokeStyle = INK; g.lineWidth = aw + 10; g.stroke();
      g.strokeStyle = L.coat; g.lineWidth = aw; g.stroke();
      g.strokeStyle = L.coatHi; g.lineWidth = aw * 0.35; g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(ex - 4, ey); g.stroke();
      // hand (child Snape's sleeves swallow half the hand)
      const hr = L.H * (age === "child" ? 0.03 : 0.027);
      const hx2 = hx + Math.sin(r2) * hr * (kind === "snape" && age === "child" ? 0.2 : 0.8), hy2 = hy + Math.cos(r2) * hr * (kind === "snape" && age === "child" ? 0.2 : 0.8);
      if (!p.back) drawHand(g, hx2, hy2, r2, (side === "L" ? p.handL : p.handR) ?? "mitt", L.skin, hr, side === "L" ? -1 : 1);
      if (p.prop) p.prop(g, side, hx2, hy2);
    }
  }
  const neckY = shY - 6;
  const micro = p.still ? 0 : Math.sin(fr * 0.031) * 1.2 + Math.sin(fr * 0.017 + 1) * 0.8;
  const tilt = (p.tilt ?? 0) + micro + tr * Math.sin(fr * 1.9) * 1.2 + (walking ? ws * 1.5 : 0);
  g.save();
  g.translate(0, neckY);
  g.rotate(tilt * Math.PI / 180);
  g.translate(0, -neckY + ((p.nod ?? 0) + Math.max(0, sh) * 0.22) * L.hh);
  head(g, L, kind, age, p.still ? p : { ...p, look: saccade(p.look ?? [0, 0], fr, kind.length * 7 + age.length) }, 0, shY - L.hh * 0.62 + br * 1.5);
  g.restore();
  g.restore();
}

/** Small automatic eye movements: a new fixation every ~0.4-0.9 s, so gaze is never dead. */
function saccade(look: [number, number], f: number, seed: number): [number, number] {
  const k = Math.floor((f + seed * 3) / 19);
  const r = (n: number) => { const x = Math.sin((k * 12.9898 + n * 78.233 + seed) * 43758.5453); return x - Math.floor(x) - 0.5; };
  return [look[0] + r(1) * 0.16, look[1] + r(2) * 0.12];
}

/** Hand shapes, oriented along the forearm (angle r from straight down). */
function drawHand(g: Ctx, x: number, y: number, r: number, shape: Hand, skin: string, hr: number, side: number) {
  g.save(); g.translate(x, y); g.rotate(-r);
  const fing = (dx: number, len: number, w: number, ang: number) => { g.save(); g.translate(dx, hr * 0.55); g.rotate(ang); g.beginPath(); g.roundRect(-w / 2, 0, w, len, w / 2); inked(g, skin, 3.5); g.restore(); };
  if (shape === "open" || shape === "grip") {
    const len = shape === "open" ? hr * 0.95 : hr * 0.5;
    for (let i = 0; i < 4; i++) fing((i - 1.5) * hr * 0.36, len, hr * 0.32, (i - 1.5) * (shape === "open" ? 0.16 : 0.05));
    g.beginPath(); g.ellipse(0, 0, hr * 0.85, hr * 0.8, 0, 0, 6.283); inked(g, skin, 4);
    fing(side * hr * 0.75, hr * 0.7, hr * 0.34, -side * (shape === "open" ? 0.9 : 0.5));
  } else if (shape === "fist" || shape === "point") {
    g.beginPath(); g.ellipse(0, hr * 0.15, hr * 0.78, hr * 0.82, 0, 0, 6.283); inked(g, skin, 4);
    g.strokeStyle = "rgba(28,18,28,0.6)"; g.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo((i - 1) * hr * 0.3, hr * 0.55); g.lineTo((i - 1) * hr * 0.3, hr * 0.8); g.stroke(); }
    if (shape === "point") fing(-side * hr * 0.2, hr * 1.2, hr * 0.32, 0);
  } else {
    g.beginPath(); g.ellipse(0, 0, hr * 0.85, hr * 1.1, 0, 0, 6.283); inked(g, skin, 4);
    g.strokeStyle = "rgba(28,18,28,0.45)"; g.lineWidth = 2; g.beginPath(); g.moveTo(side * hr * 0.5, -hr * 0.2); g.quadraticCurveTo(side * hr * 0.75, hr * 0.3, side * hr * 0.35, hr * 0.6); g.stroke();
  }
  g.restore();
}

function backHair(g: Ctx, L: Look, kind: Kind, hy: number, p: Pose) {
  const hh = L.hh, fx = (p.facing ?? 0) * hh * 0.08;
  g.beginPath();
  if (kind === "lily") {
    g.moveTo(-hh * 0.48 + fx, hy - hh * 0.1);
    g.bezierCurveTo(-hh * 0.7, hy + hh * 0.8, -hh * 0.62, hy + hh * 1.5, -hh * 0.35, hy + hh * 1.75);
    g.lineTo(hh * 0.35, hy + hh * 1.75);
    g.bezierCurveTo(hh * 0.62, hy + hh * 1.5, hh * 0.7, hy + hh * 0.8, hh * 0.48 + fx, hy - hh * 0.1);
  } else { // dumbledore long silver hair
    g.moveTo(-hh * 0.45, hy - hh * 0.2);
    g.bezierCurveTo(-hh * 0.6, hy + hh, -hh * 0.5, hy + hh * 1.6, -hh * 0.3, hy + hh * 2.0);
    g.lineTo(hh * 0.3, hy + hh * 2.0);
    g.bezierCurveTo(hh * 0.5, hy + hh * 1.6, hh * 0.6, hy + hh, hh * 0.45, hy - hh * 0.2);
  }
  g.closePath();
  const gr = g.createLinearGradient(0, hy, 0, hy + hh * 1.8);
  gr.addColorStop(0, L.hair); gr.addColorStop(1, L.hairHi);
  inked(g, gr, 5);
}

function head(g: Ctx, L: Look, kind: Kind, age: Age, p: Pose, cx: number, cy: number) {
  const hh = L.hh, rx = hh * 0.37, ry = hh * 0.5;
  const f = p.facing ?? 0, fo = f * rx * 0.28;
  const lk = p.look ?? [0, 0];
  const eye = p.blink ? 0.05 : (p.eye ?? 1);
  const brow = p.brow ?? 0, mouth = p.mouth ?? 0, open = p.open ?? 0;
  const hood = kind === "voldemort";
  if (BEAST(kind)) { beastHead(g, L, kind, age, p, cx, cy); return; }

  // neck
  g.beginPath(); g.roundRect(cx - rx * 0.38 + fo * 0.3, cy + ry * 0.55, rx * 0.76, hh * 0.4, 8); inked(g, L.skinSh, 4);

  if (hood) { // hood back
    g.beginPath(); g.ellipse(cx + fo * 0.3, cy - ry * 0.05, rx * 1.55, ry * 1.4, 0, 0, 6.283); inked(g, L.coat, 5);
  }
  // back hair (Snape's long curtains / Harry mop) behind face
  if (kind === "snape") {
    g.beginPath();
    g.moveTo(cx - rx * 1.12 + fo, cy - ry * 0.5);
    g.quadraticCurveTo(cx - rx * 1.25, cy + ry * 0.6, cx - rx * 1.05, cy + ry * (age === "child" ? 0.95 : 1.25));
    g.lineTo(cx + rx * 1.05, cy + ry * (age === "child" ? 0.95 : 1.25));
    g.quadraticCurveTo(cx + rx * 1.25, cy + ry * 0.6, cx + rx * 1.12 + fo, cy - ry * 0.5);
    g.closePath(); inked(g, L.hair, 5);
  }
  if (kind === "sasuke") { // spiky crown at the back
    g.beginPath(); g.moveTo(cx - rx * 1.0, cy - ry * 0.2);
    const sp_ = [[-1.25, -0.9], [-0.8, -1.05], [-0.95, -1.45], [-0.35, -1.2], [-0.2, -1.6], [0.25, -1.25], [0.55, -1.55], [0.75, -1.05], [1.25, -1.0], [1.0, -0.4]];
    sp_.forEach(([x, y]) => g.lineTo(cx + x * rx, cy + y * ry * 0.85)); g.lineTo(cx + rx * 1.0, cy - ry * 0.1); g.closePath(); inked(g, L.hair, 5);
  }
  if (kind === "itachi") { // long dark hair falling behind the face to the shoulders
    g.beginPath(); g.moveTo(cx - rx * 1.06 + fo, cy - ry * 0.4); g.quadraticCurveTo(cx - rx * 1.12, cy + ry * 0.3, cx - rx * 0.9, cy + ry * 0.7);
    g.lineTo(cx + rx * 0.9, cy + ry * 0.7); g.quadraticCurveTo(cx + rx * 1.12, cy + ry * 0.3, cx + rx * 1.06 + fo, cy - ry * 0.4); g.closePath(); inked(g, L.hair, 5);
  }
  if (p.back) {
    g.beginPath(); g.ellipse(cx, cy, rx * 1.1, ry * 1.02, 0, 0, 6.283);
    inked(g, L.hair, 5);
    g.save(); g.strokeStyle = L.hairHi; g.lineWidth = 3;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * rx * 0.2, cy - ry * 0.9); g.quadraticCurveTo(cx + i * rx * 0.3, cy, cx + i * rx * 0.25, cy + ry); g.stroke(); }
    g.restore();
    return;
  }
  // face shape: rounded top, narrower jaw
  g.beginPath();
  const chin = kind === "snape" || kind === "voldemort" ? 0.42 : kind === "neville" ? 0.7 : 0.55;
  g.moveTo(cx - rx, cy - ry * 0.1);
  g.bezierCurveTo(cx - rx, cy - ry * 1.15, cx + rx, cy - ry * 1.15, cx + rx, cy - ry * 0.1);
  g.bezierCurveTo(cx + rx, cy + ry * 0.55, cx + rx * chin + fo, cy + ry * 0.98, cx + fo * 0.6, cy + ry);
  g.bezierCurveTo(cx - rx * chin + fo, cy + ry * 0.98, cx - rx, cy + ry * 0.55, cx - rx, cy - ry * 0.1);
  g.closePath();
  const sk = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 2, cx, cy, ry * 1.2);
  sk.addColorStop(0, L.skin); sk.addColorStop(0.75, L.skin); sk.addColorStop(1, L.skinSh);
  inked(g, sk, 5);
  if (kind === "snape" && age === "adult") { // sallow under-eye shadows, hollow cheeks
    g.save(); g.clip();
    g.fillStyle = "rgba(90,70,80,0.18)";
    g.beginPath(); g.ellipse(cx - rx * 0.55 + fo, cy + ry * 0.35, rx * 0.25, ry * 0.25, 0, 0, 6.283); g.fill();
    g.beginPath(); g.ellipse(cx + rx * 0.55 + fo, cy + ry * 0.35, rx * 0.25, ry * 0.25, 0, 0, 6.283); g.fill();
    g.restore();
  }

  // eyes
  const ey = cy - ry * 0.02, sp = rx * 0.45;
  for (const sgn of [-1, 1]) {
    const far = f * sgn < 0 ? 1 - Math.abs(f) * 0.3 : 1;
    const ex = cx + fo + sgn * sp * (1 - Math.abs(f) * 0.12);
    const ew = rx * 0.27 * far, eh = rx * 0.17 * Math.min(1.25, eye);
    g.save();
    g.beginPath(); g.ellipse(ex, ey, ew, Math.max(0.5, eh), 0, 0, 6.283);
    g.fillStyle = hood ? "#2a0e12" : "#f4efe8"; g.fill();
    g.clip();
    if (eye > 0.1) {
      const ir = rx * 0.13;
      if (kind === "batman") { g.restore(); continue; } // blank white lenses
      g.beginPath(); g.arc(ex + lk[0] * ew * 0.45, ey + lk[1] * eh * 0.4, ir, 0, 6.283); g.fillStyle = L.iris; g.fill();
      if (p.eyesRed && p.eyesRed > 0) { // red iris with a dark ring (original design)
        const ix = ex + lk[0] * ew * 0.45, iy = ey + lk[1] * eh * 0.4;
        g.globalAlpha = p.eyesRed; g.beginPath(); g.arc(ix, iy, ir * 1.05, 0, 6.283); g.fillStyle = "#c8141e"; g.fill();
        g.strokeStyle = "#2a0408"; g.lineWidth = ir * 0.16; g.beginPath(); g.arc(ix, iy, ir * 0.62, 0, 6.283); g.stroke();
        g.fillStyle = "rgba(255,120,120,0.6)"; g.beginPath(); g.arc(ix - ir * 0.3, iy - ir * 0.35, ir * 0.16, 0, 6.283); g.fill(); g.globalAlpha = 1;
      }
      g.beginPath(); g.arc(ex + lk[0] * ew * 0.45, ey + lk[1] * eh * 0.4, ir * (hood ? 0.25 : 0.5), 0, 6.283); g.fillStyle = "#0a0708"; g.fill();
      if (!hood) { g.beginPath(); g.arc(ex + lk[0] * ew * 0.45 - ir * 0.35, ey + lk[1] * eh * 0.4 - ir * 0.35, ir * 0.22, 0, 6.283); g.fillStyle = "rgba(255,255,255,0.85)"; g.fill(); }
    }
    g.restore();
    // upper lid (heavy line)
    g.beginPath(); g.ellipse(ex, ey, ew * 1.05, Math.max(1, eh), 0, Math.PI * 1.05, Math.PI * 1.95);
    g.strokeStyle = INK; g.lineWidth = kind === "snape" ? 6 : 4.5; g.stroke();
    if (kind === "snape" && age === "adult" && eye < 1.1) { // heavy hooded lids
      g.beginPath(); g.ellipse(ex, ey - eh * 0.2, ew * 1.08, eh * 0.65, 0, Math.PI, 0); g.fillStyle = L.skinSh; g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
    }
    // brows
    if (!hood) {
      const by = ey - rx * 0.33 - (eye > 1.05 ? rx * 0.08 : 0);
      const inner = by + brow * -rx * 0.14 + (brow < 0 ? -brow * rx * 0.2 : 0);
      const outer = by + (brow > 0 ? rx * 0.06 * brow : -rx * 0.02);
      g.beginPath(); g.moveTo(ex - sgn * ew * 0.9, sgn > 0 ? inner : inner); g.quadraticCurveTo(ex, Math.min(inner, outer) - 6, ex + sgn * ew * 1.05, outer);
      g.strokeStyle = kind === "dumbledore" ? "#cfcac4" : L.hair; g.lineWidth = rx * 0.09; g.lineCap = "round"; g.stroke();
    }
  }
  if (kind === "itachi") { // the long creases under his eyes
    g.save(); g.strokeStyle = "rgba(60,40,48,0.7)"; g.lineWidth = rx * 0.045; g.lineCap = "round";
    for (const sgn of [-1, 1]) { const ex = cx + fo + sgn * sp; g.beginPath(); g.moveTo(ex - sgn * rx * 0.13, ey + rx * 0.16); g.quadraticCurveTo(ex - sgn * rx * 0.2, ey + rx * 0.32, ex - sgn * rx * 0.16, ey + rx * 0.44); g.stroke(); }
    g.restore();
  }
  // tears
  if (p.tear && p.tear > 0) {
    g.save(); g.globalAlpha = 0.75 * p.tear; g.strokeStyle = "#cfe4ff"; g.lineWidth = 3;
    for (const sgn of [-1, 1]) { const ex = cx + fo + sgn * sp; g.beginPath(); g.moveTo(ex, ey + rx * 0.15); g.quadraticCurveTo(ex + sgn * 4, ey + rx * 0.5 * p.tear, ex + sgn * 2, ey + rx * 0.9 * p.tear); g.stroke(); }
    g.restore();
  }
  // nose
  g.beginPath();
  const nx = cx + fo * 1.25, ny = ey + rx * 0.12;
  if (kind === "snape") { // hooked
    const d = f >= 0 ? 1 : -1;
    g.moveTo(nx - d * rx * 0.04, ny - rx * 0.25);
    g.quadraticCurveTo(nx + d * rx * 0.2, ny + rx * 0.05, nx + d * rx * 0.12, ny + rx * 0.38);
    g.quadraticCurveTo(nx, ny + rx * 0.42, nx - d * rx * 0.1, ny + rx * 0.33);
  } else if (kind === "voldemort") {
    g.moveTo(nx - 6, ny + rx * 0.2); g.lineTo(nx - 3, ny + rx * 0.32); g.moveTo(nx + 6, ny + rx * 0.2); g.lineTo(nx + 3, ny + rx * 0.32);
  } else {
    g.moveTo(nx, ny); g.quadraticCurveTo(nx + rx * 0.08 * (f >= 0 ? 1 : -1), ny + rx * 0.22, nx - rx * 0.03, ny + rx * 0.26);
  }
  g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
  // mouth
  const my = cy + ry * 0.55, mw = rx * (0.32 + open * 0.05);
  g.beginPath();
  g.moveTo(cx + fo - mw, my - mouth * rx * 0.06);
  g.quadraticCurveTo(cx + fo, my + mouth * rx * 0.14 + open * rx * 0.25, cx + fo + mw, my - mouth * rx * 0.06);
  if (open > 0.05) { g.quadraticCurveTo(cx + fo, my + mouth * rx * 0.05 - open * rx * 0.02, cx + fo - mw, my - mouth * rx * 0.06); g.fillStyle = "#3a1a20"; g.fill(); }
  g.strokeStyle = INK; g.lineWidth = 4.5; g.stroke();

  // facial hair / glasses / hair fronts
  if (kind === "dumbledore") {
    g.beginPath(); g.moveTo(cx - rx * 0.9, cy + ry * 0.25);
    g.quadraticCurveTo(cx - rx * 0.8, cy + ry * 2.4, cx + fo, cy + ry * 3.3);
    g.quadraticCurveTo(cx + rx * 0.8, cy + ry * 2.4, cx + rx * 0.9, cy + ry * 0.25);
    g.quadraticCurveTo(cx + fo, cy + ry * 0.75, cx - rx * 0.9, cy + ry * 0.25);
    const bg = g.createLinearGradient(0, cy, 0, cy + ry * 3); bg.addColorStop(0, "#f2f0ec"); bg.addColorStop(1, "#bdb8b2");
    inked(g, bg, 4);
    // half-moon spectacles
    g.strokeStyle = "#c9a95a"; g.lineWidth = 3;
    for (const sgn of [-1, 1]) { g.beginPath(); g.arc(cx + fo + sgn * sp, ey + rx * 0.02, rx * 0.24, 0, Math.PI); g.stroke(); }
  }
  if (kind === "harry" || kind === "james") {
    g.strokeStyle = "#2a2226"; g.lineWidth = 4.5;
    for (const sgn of [-1, 1]) { g.beginPath(); g.arc(cx + fo + sgn * sp, ey, rx * 0.3, 0, 6.283); g.stroke(); }
    g.beginPath(); g.moveTo(cx + fo - sp + rx * 0.3, ey); g.lineTo(cx + fo + sp - rx * 0.3, ey); g.stroke();
  }
  if (kind === "silco") { // scarred, discoloured left eye (original take: a single vertical scar + pale iris ring)
    const ex = cx + fo - sp; g.save(); g.strokeStyle = "#8a4a50"; g.lineWidth = rx * 0.06; g.lineCap = "round";
    g.beginPath(); g.moveTo(ex - rx * 0.05, ey - rx * 0.5); g.lineTo(ex + rx * 0.05, ey + rx * 0.45); g.stroke();
    g.fillStyle = "rgba(200,60,60,0.35)"; g.beginPath(); g.ellipse(ex, ey, rx * 0.3, rx * 0.22, 0, 0, 6.283); g.fill(); g.restore();
  }
  if (kind === "vander") { // short grey beard + moustache
    g.beginPath(); g.moveTo(cx - rx * 0.92, cy + ry * 0.1); g.quadraticCurveTo(cx - rx * 0.85, cy + ry * 1.1, cx + fo, cy + ry * 1.18); g.quadraticCurveTo(cx + rx * 0.85, cy + ry * 1.1, cx + rx * 0.92, cy + ry * 0.1);
    g.quadraticCurveTo(cx + rx * 0.5, cy + ry * 0.5, cx + fo, cy + ry * 0.42); g.quadraticCurveTo(cx - rx * 0.5, cy + ry * 0.5, cx - rx * 0.92, cy + ry * 0.1); inked(g, L.hair, 4);
    g.beginPath(); g.ellipse(cx + fo, cy + ry * 0.62, rx * 0.22, ry * 0.08, 0, 0, 6.283); g.fillStyle = "#3a1a20"; g.fill();
  }
  if (kind === "victor" || kind === "boyle") { // glasses (Victor: round wire frames)
    if (kind === "victor") { g.strokeStyle = "#3a3a44"; g.lineWidth = 3.5; for (const sgn of [-1, 1]) { g.beginPath(); g.arc(cx + fo + sgn * sp, ey, rx * 0.27, 0, 6.283); g.stroke(); } g.beginPath(); g.moveTo(cx + fo - sp + rx * 0.27, ey); g.lineTo(cx + fo + sp - rx * 0.27, ey); g.stroke(); }
  }
  HB.current = p.headband; frontHair(g, L, kind, age, cx, cy, rx, ry, fo); HB.current = undefined;
  if (kind === "freeze") { // cyan goggles + glass dome helmet with a collar ring (original design)
    g.save(); g.shadowColor = "#7fe4ff"; g.shadowBlur = 14;
    for (const sgn of [-1, 1]) { g.beginPath(); g.ellipse(cx + fo + sgn * sp, ey, rx * 0.3, rx * 0.2, 0, 0, 6.283); inked(g, "rgba(120,230,255,0.85)", 4); }
    g.restore(); g.beginPath(); g.moveTo(cx + fo - sp + rx * 0.3, ey); g.lineTo(cx + fo + sp - rx * 0.3, ey); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
    g.save(); const dg = g.createRadialGradient(cx - rx * 0.4, cy - ry * 0.6, 4, cx, cy, ry * 1.5);
    dg.addColorStop(0, "rgba(255,255,255,0.35)"); dg.addColorStop(0.5, "rgba(180,230,255,0.10)"); dg.addColorStop(1, "rgba(140,200,240,0.25)");
    g.beginPath(); g.ellipse(cx + fo * 0.5, cy - ry * 0.05, rx * 1.45, ry * 1.38, 0, 0, 6.283); g.fillStyle = dg; g.fill(); g.strokeStyle = "rgba(200,240,255,0.8)"; g.lineWidth = 4; g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 6; g.beginPath(); g.arc(cx + fo * 0.5, cy - ry * 0.05, rx * 1.2, Math.PI * 1.1, Math.PI * 1.45); g.stroke(); g.restore();
  }
  if (p.mask) {
    g.beginPath(); g.ellipse(cx + fo * 0.8, cy + ry * 0.1, rx * 0.88, ry * 0.86, 0, 0, 6.283); inked(g, "#f2efe8", 4);
    g.fillStyle = "#1a1218"; for (const sgn of [-1, 1]) { g.beginPath(); g.ellipse(cx + fo + sgn * sp, ey, rx * 0.2, rx * 0.07, sgn * 0.15, 0, 6.283); g.fill(); }
    g.strokeStyle = "#b8141e"; g.lineWidth = rx * 0.07; g.lineCap = "round";
    for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(cx + fo + sgn * rx * 0.5, cy + ry * 0.2); g.lineTo(cx + fo + sgn * rx * 0.3, cy + ry * 0.45); g.stroke(); }
    g.beginPath(); g.moveTo(cx + fo, cy - ry * 0.55); g.lineTo(cx + fo, cy - ry * 0.25); g.stroke();
  }
}

const HB: { current: Pose["headband"] } = { current: undefined };
function frontHair(g: Ctx, L: Look, kind: Kind, age: Age, cx: number, cy: number, rx: number, ry: number, fo: number) {
  g.beginPath();
  if (kind === "snape") { // centre part, lank curtains framing the face
    g.moveTo(cx + fo * 0.5, cy - ry * 1.02);
    g.bezierCurveTo(cx - rx * 0.6, cy - ry * 1.05, cx - rx * 1.05, cy - ry * 0.7, cx - rx * 1.02, cy - ry * 0.1);
    g.quadraticCurveTo(cx - rx * 1.0, cy + ry * 0.6, cx - rx * 0.95, cy + ry * (age === "child" ? 0.85 : 1.15));
    g.lineTo(cx - rx * 0.78, cy + ry * 0.3);
    g.quadraticCurveTo(cx - rx * 0.62, cy - ry * 0.55, cx + fo * 0.5, cy - ry * 0.78);
    g.quadraticCurveTo(cx + rx * 0.62, cy - ry * 0.55, cx + rx * 0.78, cy + ry * 0.3);
    g.lineTo(cx + rx * 0.95, cy + ry * (age === "child" ? 0.85 : 1.15));
    g.quadraticCurveTo(cx + rx * 1.0, cy + ry * 0.6, cx + rx * 1.02, cy - ry * 0.1);
    g.bezierCurveTo(cx + rx * 1.05, cy - ry * 0.7, cx + rx * 0.6, cy - ry * 1.05, cx + fo * 0.5, cy - ry * 1.02);
  } else if (kind === "itachi") { // centre-parted long bangs framing the face
    g.moveTo(cx + fo * 0.4, cy - ry * 1.02);
    g.bezierCurveTo(cx - rx * 0.7, cy - ry * 1.05, cx - rx * 1.06, cy - ry * 0.6, cx - rx * 1.0, cy + ry * 0.1);
    g.quadraticCurveTo(cx - rx * 0.98, cy + ry * 0.45, cx - rx * 0.86, cy + ry * 0.6); g.lineTo(cx - rx * 0.74, cy + ry * 0.05);
    g.quadraticCurveTo(cx - rx * 0.45, cy - ry * 0.55, cx + fo * 0.4, cy - ry * 0.72);
    g.quadraticCurveTo(cx + rx * 0.45, cy - ry * 0.55, cx + rx * 0.74, cy + ry * 0.05); g.lineTo(cx + rx * 0.86, cy + ry * 0.6);
    g.quadraticCurveTo(cx + rx * 0.98, cy + ry * 0.45, cx + rx * 1.0, cy + ry * 0.1);
    g.bezierCurveTo(cx + rx * 1.06, cy - ry * 0.6, cx + rx * 0.7, cy - ry * 1.05, cx + fo * 0.4, cy - ry * 1.02);
  } else if (kind === "sasuke") { // bangs hanging at both sides of the face
    g.moveTo(cx - rx * 1.02, cy - ry * 0.1);
    g.bezierCurveTo(cx - rx * 1.05, cy - ry * 1.15, cx + rx * 1.05, cy - ry * 1.15, cx + rx * 1.02, cy - ry * 0.1);
    g.lineTo(cx + rx * 0.95, cy + ry * 0.5); g.lineTo(cx + rx * 0.7, cy - ry * 0.1); g.lineTo(cx + rx * 0.35, cy - ry * 0.55);
    g.lineTo(cx + fo * 0.3, cy - ry * 0.38); g.lineTo(cx - rx * 0.35, cy - ry * 0.58); g.lineTo(cx - rx * 0.7, cy - ry * 0.1); g.lineTo(cx - rx * 0.95, cy + ry * 0.5);
    g.closePath();
  } else if (kind === "lily") { // swept fringe
    g.moveTo(cx - rx * 1.02, cy - ry * 0.05);
    g.bezierCurveTo(cx - rx * 1.1, cy - ry * 1.2, cx + rx * 1.1, cy - ry * 1.25, cx + rx * 1.04, cy - ry * 0.05);
    g.quadraticCurveTo(cx + rx * 0.7, cy - ry * 0.45, cx + rx * 0.1 + fo, cy - ry * 0.62);
    g.quadraticCurveTo(cx - rx * 0.5, cy - ry * 0.5, cx - rx * 0.8, cy - ry * 0.2);
    g.closePath();
  } else if (kind === "harry" || kind === "james") { // untidy mop
    g.moveTo(cx - rx * 1.05, cy - ry * 0.1);
    const pts = [-1, -0.7, -0.4, -0.1, 0.2, 0.5, 0.8, 1.05];
    g.lineTo(cx - rx * 1.1, cy - ry * 0.75);
    pts.forEach((t, i) => g.lineTo(cx + t * rx + (i % 2 ? 10 : -6), cy - ry * (i % 2 ? 1.22 : 0.98)));
    g.lineTo(cx + rx * 1.06, cy - ry * 0.1);
    for (let i = pts.length - 1; i >= 0; i--) g.lineTo(cx + pts[i] * rx * 0.85 + fo * 0.4, cy - ry * (i % 2 ? 0.45 : 0.62));
    g.closePath();
  } else if (kind === "jinx") { // blunt blue bangs (child: short bob to the jaw)
    g.moveTo(cx - rx * 1.08, cy + ry * (age === "child" ? 0.75 : 0.35));
    g.bezierCurveTo(cx - rx * 1.15, cy - ry * 1.25, cx + rx * 1.15, cy - ry * 1.25, cx + rx * 1.08, cy + ry * (age === "child" ? 0.75 : 0.35));
    g.lineTo(cx + rx * 0.82, cy + ry * 0.2); g.lineTo(cx + rx * 0.7, cy - ry * 0.45);
    for (let k = 0; k <= 6; k++) { const t = k / 6; g.lineTo(cx + rx * (0.7 - 1.4 * t) + fo * 0.5, cy - ry * (k % 2 ? 0.42 : 0.52)); }
    g.lineTo(cx - rx * 0.82, cy + ry * 0.2); g.closePath();
  } else if (kind === "vi") { // short hair swept to one side, shaved side
    g.moveTo(cx - rx * 1.04, cy - ry * 0.05);
    g.bezierCurveTo(cx - rx * 1.1, cy - ry * 1.3, cx + rx * 1.2, cy - ry * 1.3, cx + rx * 1.08, cy + ry * 0.3);
    g.quadraticCurveTo(cx + rx * 0.9, cy - ry * 0.3, cx + rx * 0.3 + fo, cy - ry * 0.6);
    g.quadraticCurveTo(cx - rx * 0.4, cy - ry * 0.75, cx - rx * 0.9, cy - ry * 0.35); g.closePath();
  } else if (kind === "vander") { // receding grey hair
    g.moveTo(cx - rx * 1.02, cy - ry * 0.1); g.bezierCurveTo(cx - rx * 1.0, cy - ry * 1.0, cx - rx * 0.4, cy - ry * 1.12, cx + fo, cy - ry * 0.95);
    g.bezierCurveTo(cx + rx * 0.4, cy - ry * 1.12, cx + rx * 1.0, cy - ry * 1.0, cx + rx * 1.02, cy - ry * 0.1); g.quadraticCurveTo(cx + rx * 0.7, cy - ry * 0.85, cx + fo, cy - ry * 0.88); g.quadraticCurveTo(cx - rx * 0.7, cy - ry * 0.85, cx - rx * 1.02, cy - ry * 0.1);
  } else if (kind === "mylo") { // spiky short hair
    g.moveTo(cx - rx * 1.04, cy - ry * 0.2);
    [-1, -0.7, -0.4, -0.1, 0.2, 0.5, 0.8, 1.04].forEach((t, i) => g.lineTo(cx + t * rx, cy - ry * (i % 2 ? 1.3 : 1.0)));
    g.lineTo(cx + rx * 1.04, cy - ry * 0.2); g.quadraticCurveTo(cx + fo, cy - ry * 0.7, cx - rx * 1.04, cy - ry * 0.2);
  } else if (kind === "silco") { // slicked straight back
    g.moveTo(cx - rx * 1.02, cy - ry * 0.3); g.bezierCurveTo(cx - rx * 1.05, cy - ry * 1.25, cx + rx * 1.05, cy - ry * 1.25, cx + rx * 1.02, cy - ry * 0.3);
    g.quadraticCurveTo(cx + fo, cy - ry * 0.98, cx - rx * 1.02, cy - ry * 0.3);
  } else if (kind === "nora") { // soft swept fringe
    g.moveTo(cx - rx * 1.04, cy - ry * 0.05);
    g.bezierCurveTo(cx - rx * 1.12, cy - ry * 1.22, cx + rx * 1.12, cy - ry * 1.26, cx + rx * 1.06, cy - ry * 0.05);
    g.quadraticCurveTo(cx + rx * 0.6, cy - ry * 0.5, cx - rx * 0.1 + fo, cy - ry * 0.66);
    g.quadraticCurveTo(cx - rx * 0.6, cy - ry * 0.45, cx - rx * 0.85, cy - ry * 0.15); g.closePath();
  } else if (kind === "victor" || kind === "boyle") { // combed back (Victor) / side part (Boyle)
    g.moveTo(cx - rx * 1.02, cy - ry * 0.25);
    g.bezierCurveTo(cx - rx * 1.06, cy - ry * 1.22, cx + rx * 1.06, cy - ry * 1.22, cx + rx * 1.02, cy - ry * 0.25);
    if (kind === "boyle") { g.quadraticCurveTo(cx + rx * 0.5, cy - ry * 0.95, cx - rx * 0.35 + fo, cy - ry * 0.82); g.quadraticCurveTo(cx - rx * 0.8, cy - ry * 0.7, cx - rx * 1.02, cy - ry * 0.25); }
    else g.quadraticCurveTo(cx + fo, cy - ry * 0.95, cx - rx * 1.02, cy - ry * 0.25);
  } else if (kind === "freeze") { return;
  } else if (kind === "batman") { // cowl: covers head + upper face, two short pointed ears, open lower face
    g.moveTo(cx - rx * 1.08, cy + ry * 0.35);
    g.lineTo(cx - rx * 1.1, cy - ry * 0.7); g.lineTo(cx - rx * 0.85, cy - ry * 1.55); g.lineTo(cx - rx * 0.55, cy - ry * 0.98);
    g.quadraticCurveTo(cx + fo, cy - ry * 1.1, cx + rx * 0.55, cy - ry * 0.98); g.lineTo(cx + rx * 0.85, cy - ry * 1.55); g.lineTo(cx + rx * 1.1, cy - ry * 0.7);
    g.lineTo(cx + rx * 1.08, cy + ry * 0.35); g.lineTo(cx + rx * 0.72 + fo, cy + ry * 0.2);
    g.quadraticCurveTo(cx + rx * 0.55 + fo, cy - ry * 0.12, cx + fo, cy - ry * 0.12); g.quadraticCurveTo(cx - rx * 0.55 + fo, cy - ry * 0.12, cx - rx * 0.72 + fo, cy + ry * 0.2); g.closePath();
    inked(g, "#2e323e", 5);
    g.fillStyle = "#f4f4f4"; for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(cx + fo + sgn * rx * 0.2, cy - ry * 0.02); g.lineTo(cx + fo + sgn * rx * 0.62, cy - ry * 0.08); g.lineTo(cx + fo + sgn * rx * 0.55, cy + ry * 0.06); g.lineTo(cx + fo + sgn * rx * 0.25, cy + ry * 0.06); g.closePath(); g.fill(); }
    return;
  } else if (kind === "neville" || kind === "bully") {
    g.moveTo(cx - rx * 1.02, cy - ry * 0.15);
    g.bezierCurveTo(cx - rx * 1.05, cy - ry * 1.2, cx + rx * 1.05, cy - ry * 1.2, cx + rx * 1.02, cy - ry * 0.15);
    g.quadraticCurveTo(cx + fo, cy - ry * 0.7, cx - rx * 1.02, cy - ry * 0.15);
  } else if (kind === "dumbledore") {
    g.moveTo(cx - rx * 1.0, cy - ry * 0.2);
    g.bezierCurveTo(cx - rx * 1.0, cy - ry * 1.15, cx + rx * 1.0, cy - ry * 1.15, cx + rx * 1.0, cy - ry * 0.2);
    g.quadraticCurveTo(cx + fo, cy - ry * 0.85, cx - rx * 1.0, cy - ry * 0.2);
    // tall hat
    g.moveTo(cx - rx * 1.3, cy - ry * 0.8); g.quadraticCurveTo(cx + fo, cy - ry * 0.65, cx + rx * 1.3, cy - ry * 0.8);
    g.lineTo(cx + rx * 0.5, cy - ry * 1.0); g.quadraticCurveTo(cx + rx * 0.4, cy - ry * 2.0, cx + rx * 1.1, cy - ry * 2.6);
    g.quadraticCurveTo(cx - rx * 0.3, cy - ry * 2.0, cx - rx * 0.6, cy - ry * 1.0); g.closePath();
    inked(g, "#d9d6d2", 4);
    g.beginPath(); g.moveTo(cx - rx * 1.3, cy - ry * 0.8); g.quadraticCurveTo(cx + fo, cy - ry * 0.65, cx + rx * 1.3, cy - ry * 0.8);
    g.lineTo(cx + rx * 0.5, cy - ry * 1.0); g.quadraticCurveTo(cx + rx * 0.4, cy - ry * 2.0, cx + rx * 1.1, cy - ry * 2.6);
    g.quadraticCurveTo(cx - rx * 0.3, cy - ry * 2.0, cx - rx * 0.6, cy - ry * 1.0); g.closePath();
    inked(g, L.coat, 4);
    return;
  } else if (kind === "voldemort") { // hood front, shadow over the brow
    g.moveTo(cx - rx * 1.45, cy + ry * 0.9);
    g.bezierCurveTo(cx - rx * 1.6, cy - ry * 1.5, cx + rx * 1.6, cy - ry * 1.5, cx + rx * 1.45, cy + ry * 0.9);
    g.lineTo(cx + rx * 1.05, cy + ry * 0.7);
    g.bezierCurveTo(cx + rx * 1.1, cy - ry * 0.9, cx - rx * 1.1, cy - ry * 0.9, cx - rx * 1.05, cy + ry * 0.7);
    g.closePath(); inked(g, L.coat, 5);
    g.save(); g.fillStyle = radGrad(g, cx, cy - ry * 0.5, 0, ry * 0.9, [[0, "rgba(0,0,0,0.75)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 1.4); g.restore();
    return;
  }
  const gr = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy);
  gr.addColorStop(0, L.hairHi); gr.addColorStop(0.5, L.hair); gr.addColorStop(1, L.hair);
  inked(g, gr, 5);
  if (HB.current) { // ninja headband: dark cloth + plain steel plate (+ a slash when he is a traitor)
    const by = cy - ry * 0.62, bh = ry * 0.2;
    g.beginPath(); g.moveTo(cx - rx * 1.03, by + bh * 0.2); g.quadraticCurveTo(cx + fo, by - bh * 0.6, cx + rx * 1.03, by + bh * 0.2); g.lineTo(cx + rx * 1.0, by + bh * 1.2); g.quadraticCurveTo(cx + fo, by + bh * 0.4, cx - rx * 1.0, by + bh * 1.2); g.closePath(); inked(g, "#26304a", 3);
    g.beginPath(); g.roundRect(cx + fo - rx * 0.42, by - bh * 0.35, rx * 0.84, bh * 1.35, 6); inked(g, "#b8bec8", 3);
    g.fillStyle = "#7a808a"; for (const sx of [-0.34, 0.34]) for (const sy of [-0.15, 0.75]) { g.beginPath(); g.arc(cx + fo + sx * rx, by + sy * bh, 2.5, 0, 6.283); g.fill(); }
    if (HB.current === "scratched") { g.strokeStyle = "#2a2a30"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + fo - rx * 0.38, by + bh * 0.35); g.lineTo(cx + fo + rx * 0.38, by + bh * 0.35); g.stroke(); }
  }
  if (kind === "snape") { // greasy sheen
    g.save(); g.strokeStyle = "rgba(160,150,190,0.35)"; g.lineWidth = 3;
    for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(cx + sgn * rx * 0.3, cy - ry * 0.95); g.quadraticCurveTo(cx + sgn * rx * 0.95, cy - ry * 0.6, cx + sgn * rx * 0.92, cy + ry * 0.2); g.stroke(); }
    g.restore();
  }
}

/** 2-bone IK: arm angles that put the hand (fingertip) of `side` on a SCREEN-space target, for a character drawn with
 *  person(..., cam {zoom 1, x 0, y 0}, depth 1) at pose x/y/s (no lean/rot). Returns [shoulderDeg, elbowDeg] for armL/armR. */
export function reachArm(kind: Kind, age: Age, side: "L" | "R", p: { x: number; y: number; s: number; kneel?: number; shoulders?: number }, target: [number, number], elbowDown = true): Arm {
  const L = look(kind, age); const kneel = p.kneel ?? 0, sh = p.shoulders ?? 0;
  const Hh = L.H * (1 - kneel * 0.3);
  const shY = -Hh + L.hh * 1.12 + (sh > 0 ? sh * L.hh * 0.16 : sh * L.hh * 0.09);
  const sw = L.sw * (1 - Math.max(0, sh) * 0.05);
  const sx = (side === "L" ? -1 : 1) * sw * 0.44, sy = shY + 14;
  const tx = (target[0] - p.x) / p.s - sx, ty = (target[1] - p.y) / p.s - sy;
  const a = L.H * 0.17, b = L.H * 0.16 + L.H * 0.027 * 1.6; // forearm + hand to the fingertip
  const d = Math.min(a + b - 1, Math.max(Math.abs(a - b) + 1, Math.hypot(tx, ty)));
  const tgt = Math.atan2(tx, ty) * 180 / Math.PI;                     // 0 = straight down, + = toward screen-right
  const alpha = Math.acos((a * a + d * d - b * b) / (2 * a * d)) * 180 / Math.PI;
  const beta = Math.acos((a * a + b * b - d * d) / (2 * a * b)) * 180 / Math.PI;
  const dir = (elbowDown ? 1 : -1) * (tx < 0 ? 1 : -1);
  const upper = tgt + dir * alpha;
  return [upper, -dir * (180 - beta)];
}

/** Animal heads (original designs): ears, broad furred skull, markings, eyes (same expression controls), muzzle, whiskers. */
function beastHead(g: Ctx, L: Look, kind: Kind, age: Age, p: Pose, cx: number, cy: number) {
  const hh = L.hh, rx = hh * (kind === "oogway" ? 0.4 : 0.46), ry = hh * (kind === "oogway" ? 0.52 : 0.47);
  const f = p.facing ?? 0, fo = f * rx * 0.3, lk = p.look ?? [0, 0];
  const eye = p.blink ? 0.05 : (p.eye ?? 1), brow = p.brow ?? 0, mouth = p.mouth ?? 0, open = p.open ?? 0;
  const cub = age === "child", old = kind === "shifu" && age === "adult";
  // neck
  if (kind === "oogway") { g.beginPath(); g.roundRect(cx - rx * 0.3 + fo * 0.3, cy + ry * 0.3, rx * 0.6, hh * 0.75, 14); inked(g, L.skinSh, 4); }
  else { g.beginPath(); g.moveTo(cx - rx * 0.75, cy + ry * 0.4); // fur ruff under the jaw
    for (let k = 0; k <= 8; k++) { const t = k / 8, x = cx - rx * 0.75 + t * rx * 1.5 + fo * 0.3; g.lineTo(x, cy + ry * (k % 2 ? 1.25 : 1.1)); }
    g.lineTo(cx + rx * 0.75, cy + ry * 0.4); g.closePath(); inked(g, kind === "shifu" ? L.skinSh : L.skin, 4); }
  if (p.back) { // back of the head: ears, skull, markings (no face)
    if (kind !== "oogway") for (const sgn of [-1, 1]) { const er = rx * (kind === "shifu" ? 0.42 : 0.3); g.save(); g.translate(cx + sgn * rx * 0.66, cy - ry * 0.82); g.rotate(sgn * 0.35);
      g.beginPath(); if (kind === "shifu") { g.moveTo(-er * 0.8, er * 0.5); g.quadraticCurveTo(-er * 0.7, -er * 1.2, 0, -er * 1.25); g.quadraticCurveTo(er * 0.7, -er * 1.2, er * 0.8, er * 0.5); g.closePath(); } else g.ellipse(0, -er * 0.2, er, er * 0.9, 0, 0, 6.283);
      inked(g, kind === "shifu" ? L.skinSh : L.skin, 4); if (kind === "tailung") { g.beginPath(); g.arc(0, -er * 0.2, er * 0.98, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = L.hair; g.lineWidth = er * 0.28; g.stroke(); } g.restore(); }
    g.beginPath(); g.ellipse(cx, cy, rx * 0.98, ry, 0, 0, 6.283); inked(g, L.skin, 5);
    g.save(); g.clip(); g.fillStyle = kind === "tailung" ? L.hair : kind === "shifu" ? L.skinSh : "rgba(40,50,30,0.3)";
    for (const [sx, sy] of [[-0.4, -0.5], [0.05, -0.65], [0.45, -0.45], [-0.2, -0.1], [0.3, 0.0], [-0.5, 0.2], [0.1, 0.35], [0.55, 0.3]]) { g.beginPath(); g.ellipse(cx + rx * sx, cy + ry * sy, rx * 0.09, rx * 0.07, sx, 0, 6.283); g.fill(); }
    g.restore(); return; }
  // ears (behind the skull)
  if (kind !== "oogway") for (const sgn of [-1, 1]) {
    const ex = cx + sgn * rx * (kind === "shifu" ? 0.78 : 0.66) + fo * 0.4, ey = cy - ry * (kind === "shifu" ? 0.78 : 0.82), er = rx * (kind === "shifu" ? 0.42 : cub ? 0.38 : 0.3);
    const droop = (brow > 0.4 ? brow * 0.5 : 0) + (p.shoulders ?? 0) * 0.3; // grief = ears fold back
    g.save(); g.translate(ex, ey); g.rotate(sgn * (0.35 + droop));
    g.beginPath();
    if (kind === "shifu") { g.moveTo(-er * 0.8, er * 0.5); g.quadraticCurveTo(-er * 0.7, -er * 1.2, 0, -er * 1.25); g.quadraticCurveTo(er * 0.7, -er * 1.2, er * 0.8, er * 0.5); g.closePath(); inked(g, L.hair, 4);
      g.beginPath(); g.moveTo(-er * 0.45, er * 0.4); g.quadraticCurveTo(0, -er * 0.8, er * 0.45, er * 0.4); g.fillStyle = L.skinSh; g.fill(); }
    else { g.ellipse(0, -er * 0.2, er, er * 0.9, 0, 0, 6.283); inked(g, L.skin, 4); g.beginPath(); g.ellipse(0, -er * 0.1, er * 0.55, er * 0.5, 0, 0, 6.283); g.fillStyle = "#c8a0a0"; g.fill();
      g.beginPath(); g.arc(0, -er * 0.2, er * 0.98, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = L.hair; g.lineWidth = er * 0.28; g.stroke(); }
    g.restore();
  }
  // skull: broad cheeks with fur tufts (cats/panda), long smooth head (tortoise)
  g.beginPath();
  if (kind === "oogway") { // wide, flat-topped skull tapering to a beak
    g.moveTo(cx - rx * 1.05, cy); g.bezierCurveTo(cx - rx * 1.1, cy - ry * 0.95, cx + rx * 1.1, cy - ry * 0.95, cx + rx * 1.05, cy);
    g.bezierCurveTo(cx + rx * 1.0, cy + ry * 0.55, cx + rx * 0.45 + fo, cy + ry * 0.8, cx + fo * 1.2, cy + ry * 0.82);
    g.bezierCurveTo(cx - rx * 0.45 + fo, cy + ry * 0.8, cx - rx * 1.0, cy + ry * 0.55, cx - rx * 1.05, cy); }
  else {
    g.moveTo(cx - rx * 0.95, cy - ry * 0.15); g.bezierCurveTo(cx - rx * 0.95, cy - ry * 1.15, cx + rx * 0.95, cy - ry * 1.15, cx + rx * 0.95, cy - ry * 0.15);
    for (let k = 0; k <= 3; k++) { const t = k / 3; g.lineTo(cx + rx * (1.12 - t * 0.35) + fo * t, cy + ry * (0.05 + t * 0.55)); if (k < 3) g.lineTo(cx + rx * (0.92 - t * 0.3) + fo * t, cy + ry * (0.18 + t * 0.55)); }
    g.quadraticCurveTo(cx + fo, cy + ry * 1.0, cx - rx * 0.77 + fo, cy + ry * 0.6);
    for (let k = 3; k >= 0; k--) { const t = k / 3; if (k < 3) g.lineTo(cx - rx * (0.92 - t * 0.3) + fo * t, cy + ry * (0.18 + t * 0.55)); g.lineTo(cx - rx * (1.12 - t * 0.35) + fo * t, cy + ry * (0.05 + t * 0.55)); }
    g.closePath();
  }
  const sk = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.35, 2, cx, cy, ry * 1.25);
  sk.addColorStop(0, L.skin); sk.addColorStop(0.7, L.skin); sk.addColorStop(1, L.skinSh);
  inked(g, sk, 5);
  const ey = cy - ry * (kind === "oogway" ? 0.22 : 0.05), sp = rx * (kind === "oogway" ? 0.5 : 0.4);
  // markings (clipped to the skull)
  g.save(); g.clip();
  if (kind === "tailung") { g.fillStyle = L.hair; const spots = [[-0.35, -0.75], [0.1, -0.85], [0.45, -0.7], [-0.62, -0.45], [0.66, -0.42], [-0.15, -0.55], [0.25, -0.5]];
    for (const [sx, sy] of spots) { g.beginPath(); g.ellipse(cx + rx * sx + fo * 0.6, cy + ry * sy, rx * 0.075, rx * 0.06, sx, 0, 6.283); g.fill(); }
    for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(cx + fo + sgn * rx * 0.55, cy + ry * 0.05); g.lineTo(cx + fo + sgn * rx * 0.9, cy + ry * 0.12); g.strokeStyle = L.hair; g.lineWidth = rx * 0.05; g.stroke(); } }
  if (kind === "shifu") { g.fillStyle = L.hair; // white brow patches, cheeks + muzzle; dark tear stripes
    for (const sgn of [-1, 1]) { g.beginPath(); g.ellipse(cx + fo + sgn * sp, ey - rx * 0.42, rx * 0.2, rx * 0.12, -sgn * 0.3, 0, 6.283); g.fill();
      g.beginPath(); g.ellipse(cx + fo + sgn * rx * 0.62, cy + ry * 0.35, rx * 0.34, rx * 0.26, 0, 0, 6.283); g.fill();
      g.fillStyle = "#5a2410"; g.beginPath(); g.ellipse(cx + fo + sgn * sp * 0.95, ey + rx * 0.36, rx * 0.09, rx * 0.26, sgn * 0.25, 0, 6.283); g.fill(); g.fillStyle = L.hair; } }
  if (kind === "oogway") { g.strokeStyle = "rgba(40,50,30,0.45)"; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(cx + fo, cy - ry * 0.5, rx * (0.25 + k * 0.12), Math.PI * 1.2, Math.PI * 1.8); g.stroke(); } }
  g.restore();
  // eyes (same expression controls as the human rig)
  for (const sgn of [-1, 1]) {
    const far = f * sgn < 0 ? 1 - Math.abs(f) * 0.3 : 1, ex = cx + fo + sgn * sp * (1 - Math.abs(f) * 0.12);
    const ew = rx * (cub ? 0.3 : kind === "oogway" ? 0.2 : 0.25) * far, eh = rx * (cub ? 0.27 : kind === "oogway" ? 0.1 : 0.16) * Math.min(1.25, eye);
    g.save(); g.beginPath(); g.ellipse(ex, ey, ew, Math.max(0.5, eh), sgn * (kind === "tailung" && !cub ? -0.12 : 0), 0, 6.283);
    g.fillStyle = kind === "tailung" ? "#f6e8c4" : "#f4efe8"; g.fill(); g.clip();
    if (eye > 0.1) { const ir = rx * (cub ? 0.2 : kind === "tailung" ? 0.15 : 0.12), ix = ex + lk[0] * ew * 0.45, iy = ey + lk[1] * eh * 0.4;
      g.beginPath(); g.arc(ix, iy, ir, 0, 6.283); g.fillStyle = L.iris; g.fill();
      g.beginPath(); if (kind === "tailung" && !cub) g.ellipse(ix, iy, ir * 0.22, ir * 0.75, 0, 0, 6.283); else g.arc(ix, iy, ir * 0.55, 0, 6.283); g.fillStyle = "#0a0708"; g.fill();
      g.beginPath(); g.arc(ix - ir * 0.35, iy - ir * 0.35, ir * (cub ? 0.32 : 0.22), 0, 6.283); g.fillStyle = "rgba(255,255,255,0.88)"; g.fill(); }
    g.restore();
    g.beginPath(); g.ellipse(ex, ey, ew * 1.05, Math.max(1, eh), 0, Math.PI * 1.05, Math.PI * 1.95); g.strokeStyle = INK; g.lineWidth = kind === "oogway" ? 6 : 4.5; g.stroke();
    if (kind === "oogway") { g.beginPath(); g.ellipse(ex, ey - eh * 0.3, ew * 1.15, eh * 0.9, 0, Math.PI, 0); g.fillStyle = L.skinSh; g.fill(); }
    // brows (fur tufts / white patch edge); same brow semantics
    const by = ey - rx * 0.32 - (eye > 1.05 ? rx * 0.08 : 0), inner = by + brow * -rx * 0.14 + (brow < 0 ? -brow * rx * 0.22 : 0), outer = by + (brow > 0 ? rx * 0.06 * brow : -rx * 0.03);
    g.beginPath(); g.moveTo(ex - sgn * ew * 0.95, inner); g.quadraticCurveTo(ex, Math.min(inner, outer) - 6, ex + sgn * ew * 1.1, outer);
    g.strokeStyle = kind === "shifu" ? (old ? "#ffffff" : "#f6efe2") : kind === "oogway" ? "#4a5840" : L.hair; g.lineWidth = rx * (kind === "shifu" ? 0.11 : 0.08); g.lineCap = "round"; g.stroke();
  }
  if (p.tear && p.tear > 0) { g.save(); g.globalAlpha = 0.8 * p.tear; g.strokeStyle = "#cfe4ff"; g.lineWidth = 3.5;
    for (const sgn of [-1, 1]) { const ex = cx + fo + sgn * sp; g.beginPath(); g.moveTo(ex, ey + rx * 0.15); g.quadraticCurveTo(ex + sgn * 4, ey + rx * 0.5 * p.tear, ex + sgn * 2, ey + rx * 0.9 * p.tear); g.stroke(); } g.restore(); }
  // muzzle
  const mx = cx + fo * 1.2, ny = ey + rx * (kind === "oogway" ? 0.38 : 0.3);
  if (kind !== "oogway") { g.fillStyle = kind === "shifu" ? L.hair : "#f2f0ec"; for (const sgn of [-1, 1]) { g.beginPath(); g.ellipse(mx + sgn * rx * 0.17, ny + rx * 0.22, rx * 0.22, rx * 0.17, 0, 0, 6.283); g.fill(); } }
  g.beginPath();
  if (kind === "oogway") { g.arc(mx - rx * 0.08, ny, 3, 0, 6.283); g.arc(mx + rx * 0.08, ny, 3, 0, 6.283); g.fillStyle = INK; g.fill(); }
  else { const nw = rx * (cub ? 0.13 : 0.16); g.moveTo(mx - nw, ny - nw * 0.3); g.lineTo(mx + nw, ny - nw * 0.3); g.quadraticCurveTo(mx + nw * 0.4, ny + nw * 0.6, mx, ny + nw * 0.8); g.quadraticCurveTo(mx - nw * 0.4, ny + nw * 0.6, mx - nw, ny - nw * 0.3);
    inked(g, kind === "shifu" ? "#1a1212" : "#7a5458", 3); }
  // mouth: Y from the nose, corners by `mouth`, opening by `open`
  const my = ny + rx * (kind === "oogway" ? 0.28 : 0.4), mw = rx * (kind === "oogway" ? 0.7 : 0.26) * (1 + open * 0.2);
  g.beginPath(); if (kind !== "oogway") { g.moveTo(mx, ny + rx * 0.12); g.lineTo(mx, my - rx * 0.04); }
  g.moveTo(mx - mw, my - mouth * rx * 0.08); g.quadraticCurveTo(mx, my + mouth * rx * 0.12 + open * rx * 0.3, mx + mw, my - mouth * rx * 0.08);
  if (open > 0.05) { g.quadraticCurveTo(mx, my - open * rx * 0.02, mx - mw, my - mouth * rx * 0.08); g.fillStyle = "#3a1a20"; g.fill();
    if (kind === "tailung" && open > 0.3) { g.fillStyle = "#f6f2e8"; for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(mx + sgn * mw * 0.55, my - 2); g.lineTo(mx + sgn * mw * 0.45, my + rx * 0.13 * open); g.lineTo(mx + sgn * mw * 0.35, my - 2); g.fill(); } } }
  g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
  // whiskers (old Shifu: long drooping grey moustache whiskers)
  if (kind !== "oogway") { g.strokeStyle = old ? "rgba(230,226,218,0.95)" : "rgba(40,30,30,0.55)"; g.lineWidth = old ? 3.5 : 2; g.lineCap = "round";
    for (const sgn of [-1, 1]) for (let k = 0; k < (old ? 2 : 3); k++) { const wy = ny + rx * (0.2 + k * 0.09); g.beginPath(); g.moveTo(mx + sgn * rx * 0.3, wy);
      g.quadraticCurveTo(mx + sgn * rx * (old ? 0.9 : 0.75), wy + (old ? rx * 0.35 : -rx * 0.04 + k * 4), mx + sgn * rx * (old ? 0.95 : 1.05), wy + (old ? rx * 0.55 : k * 10)); g.stroke(); } }
}
