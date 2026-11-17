// Shared episode kit: placement, blinks, lip flaps, grades, lights, props and effects (extracted from Always v2).
import { Cam, Ctx, Grade, H, W, clamp, lerp, makeCanvas, radGrad, rng } from "./core";
import { Age, Kind, Light } from "./people";

// ---------- helpers ----------
export const LOOKS: Record<string, { H: number; hh: number }> = { child: { H: 640, hh: 168 }, teen: { H: 880, hh: 158 }, adult: { H: 1000, hh: 150 } };
export const headOff = (kind: Kind, age: Age, kneel = 0) => { const L = kind === "dumbledore" || kind === "voldemort" ? { H: 1060, hh: 150 } : LOOKS[age]; return L.H * (1 - kneel * 0.3) - L.hh * 1.12 + L.hh * 0.62; };
export const at = (kind: Kind, age: Age, hx: number, hy: number, s: number, kneel = 0) => ({ x: hx, y: hy + headOff(kind, age, kneel) * s, s, kneel });
export const blink = (f: number, seed: number) => { const r = rng(seed); let t = Math.floor(r() * 40); while (t < f + 4) { if (f >= t && f < t + 4) return true; t += 48 + Math.floor(r() * 48); } return false; };
/** mouth movement while a character speaks (between frames a and b) */
export const talk = (f: number, a: number, b: number, amt = 0.35) => (f >= a && f < b ? amt * Math.abs(Math.sin((f - a) * 0.62)) * (0.6 + 0.4 * Math.sin(f * 0.21)) : 0);
export type Shot = { a: number; b: number; draw: (g: Ctx, f: number, l: number, n: number) => void };

export const G = {
  dungeon: { tint: "#3a3a7a", tintAlpha: 0.35, vignette: 0.55, lift: "#0b0a12" } as Grade,
  home: { tint: "#6a4a3a", tintAlpha: 0.35, vignette: 0.6, lift: "#0c0908" } as Grade,
  memory: { tint: "#ffb060", tintAlpha: 0.35, vignette: 0.35, lift: "#1a120a" } as Grade,
  split: { tint: "#6a4a4a", tintAlpha: 0.2, vignette: 0.45, lift: "#0e0a0c" } as Grade,
  betrayal: { tint: "#7a2a4a", tintAlpha: 0.4, vignette: 0.55, lift: "#120810" } as Grade,
  dark: { tint: "#1f5a3a", tintAlpha: 0.3, vignette: 0.6, lift: "#040706" } as Grade,
  grief: { tint: "#4a6a9a", tintAlpha: 0.45, vignette: 0.55, lift: "#0a0e14" } as Grade,
  office: { tint: "#a07050", tintAlpha: 0.25, vignette: 0.5, lift: "#0e0a0c" } as Grade,
  silver: { tint: "#b0c8ff", tintAlpha: 0.3, vignette: 0.5, lift: "#0a0c14" } as Grade,
};
export const L_DUN: Light = { x: 980, y: 700, r: 1500, key: "#ffb070", shade: "#140f24", keyA: 0.3, shadeA: 0.6 };
export const L_MEM: Light = { x: 900, y: 500, r: 1600, key: "#ffd9a0", shade: "#4a2a30", keyA: 0.35, shadeA: 0.4 };
export const L_LAKE: Light = { x: 1050, y: 900, r: 1500, key: "#ff8a70", shade: "#1a0818", keyA: 0.45, shadeA: 0.6 };
export const L_DARK: Light = { x: 540, y: 0, r: 1900, key: "#80ffb0", shade: "#000000", keyA: 0.3, shadeA: 0.75 };
export const L_HILL: Light = { x: 270, y: 340, r: 1800, key: "#c8d4ff", shade: "#05070e", keyA: 0.3, shadeA: 0.6 };
export const L_OFF: Light = { x: 900, y: 1100, r: 1500, key: "#ffc890", shade: "#120c18", keyA: 0.35, shadeA: 0.55 };
export const L_SHK: Light = { x: 760, y: 450, r: 1700, key: "#c0d0e8", shade: "#08060a", keyA: 0.3, shadeA: 0.65 };
export const L_CLS: Light = { x: 100, y: 200, r: 1800, key: "#c0e0c8", shade: "#0a0c0c", keyA: 0.25, shadeA: 0.6 };

// ---------- props / effects ----------
export function flower(g: Ctx, x: number, y: number, s: number, open: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = "#3f6b2a"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, 40, 0, 80); g.stroke();
  for (let i = 0; i < 6; i++) {
    const spread = lerp(0.12, 1, open);
    g.save(); g.rotate(((i / 6) * Math.PI * 2 - Math.PI / 2) * spread * 0.9);
    g.beginPath(); g.ellipse(0, -38 * lerp(0.6, 1, open), 16 * lerp(0.5, 1, open), 40, 0, 0, 6.283);
    g.fillStyle = i % 2 ? "#f7d8e2" : "#fbe8ee"; g.fill(); g.strokeStyle = "#5a2a3a"; g.lineWidth = 3; g.stroke(); g.restore();
  }
  g.fillStyle = "#f2c040"; g.beginPath(); g.arc(0, 0, 10 * open + 3, 0, 6.283); g.fill();
  g.restore();
}
export const wand = (color = "#2a1a12", tip?: string) => (g: Ctx, hand: "L" | "R", x: number, y: number) => {
  if (hand !== "R") return;
  g.strokeStyle = color; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70, y - 60); g.stroke();
  if (tip) { g.fillStyle = radGrad(g, x + 70, y - 60, 0, 50, [[0, tip], [1, "rgba(0,0,0,0)"]]); g.fillRect(x + 20, y - 110, 100, 100); }
};
export const holdFlower = (open: number) => (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand === "R") flower(g, x, y - 30, 0.55, open); };
export function doe(g: Ctx, x: number, y: number, s: number, a: number, f: number) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a; g.globalCompositeOperation = "screen";
  g.fillStyle = radGrad(g, 0, -120, 0, 520, [[0, "rgba(200,225,255,0.55)"], [1, "rgba(200,225,255,0)"]]); g.fillRect(-600, -700, 1200, 1200);
  const leg = Math.sin(f * 0.25) * 12;
  g.beginPath();
  g.moveTo(-210, -40); g.quadraticCurveTo(-120, -120, 40, -110); g.quadraticCurveTo(110, -150, 140, -230); g.quadraticCurveTo(150, -270, 185, -265);
  g.lineTo(230, -250); g.quadraticCurveTo(200, -220, 190, -190); g.quadraticCurveTo(180, -140, 150, -90);
  g.quadraticCurveTo(180, -20, 260 + leg, 40); g.lineTo(240 + leg, 60); g.quadraticCurveTo(160, 10, 110, -40);
  g.quadraticCurveTo(20, -20, -60, -30); g.quadraticCurveTo(-120, 30, -230 - leg, 70); g.lineTo(-245 - leg, 52); g.quadraticCurveTo(-170, 10, -150, -30);
  g.quadraticCurveTo(-200, -20, -240, -60); g.closePath();
  g.fillStyle = "rgba(225,240,255,0.85)"; g.shadowColor = "#cfe4ff"; g.shadowBlur = 50; g.fill();
  g.shadowBlur = 0;
  const r = rng(3); for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(235,245,255,0.9)"; g.beginPath(); g.arc(-300 + r() * 600 - f * 0.8 % 40, -300 + r() * 380 + Math.sin(f * 0.1 + i) * 8, 2 + r() * 4, 0, 6.283); g.fill(); }
  g.restore();
}
/** Arguing parents as shadows on the kitchen wall (canon: his parents fought; staging is ours). */
export function argueShadows(g: Ctx, cam: Cam, f: number) {
  g.save();
  const z = 1 + (cam.zoom - 1) * 0.5; g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2 - cam.x * 0.5, -H / 2 - cam.y * 0.5);
  g.fillStyle = "rgba(5,3,3,0.75)"; g.filter = "blur(6px)";
  const jab = Math.sin(f * 0.35) > 0.3 ? 1 : 0, cower = 0.5 + 0.5 * Math.sin(f * 0.08);
  // man: looming, jabbing arm
  g.beginPath(); g.ellipse(560, 520, 70, 85, 0, 0, 6.283); g.fill();
  g.beginPath(); g.moveTo(470, 600); g.lineTo(650, 600); g.lineTo(700, 1150); g.lineTo(430, 1150); g.fill();
  g.lineWidth = 46; g.lineCap = "round"; g.strokeStyle = "rgba(5,3,3,0.75)"; g.beginPath(); g.moveTo(620, 640); g.lineTo(760 + jab * 60, 600 - jab * 40); g.stroke();
  // woman: shrinking away
  g.beginPath(); g.ellipse(930 + cower * 10, 600 + cower * 25, 55, 70, 0.2, 0, 6.283); g.fill();
  g.beginPath(); g.moveTo(870, 660 + cower * 20); g.lineTo(990, 660 + cower * 20); g.lineTo(1020, 1150); g.lineTo(850, 1150); g.fill();
  g.restore();
}
export function vignetteDark(g: Ctx, a: number) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
let off2: [HTMLCanvasElement, Ctx] | null = null;
export const offC = () => (off2 ??= makeCanvas(W, H));
/** draw `fn` into an offscreen frame and composite with alpha (dissolves) */
export function dissolve(g: Ctx, alpha: number, fn: (m: Ctx) => void) {
  if (alpha <= 0) return;
  const [c, m] = offC(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.globalCompositeOperation = "source-over"; m.filter = "none"; m.clearRect(0, 0, W, H);
  fn(m); g.save(); g.globalAlpha = clamp(alpha); g.drawImage(c, 0, 0); g.restore();
}


/** The Sorting Hat: patched, slumped wizard hat whose brim-crease opens like a mouth. */
export function sortingHat(g: Ctx, x: number, y: number, s: number, talkAmt: number, f: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const sway = Math.sin(f * 0.06) * 4;
  g.fillStyle = "#4a3a2c"; g.strokeStyle = "#1c121c"; g.lineWidth = 6; g.lineJoin = "round";
  g.beginPath(); g.ellipse(0, 0, 150, 34, 0, 0, 6.283); g.fill(); g.stroke(); // brim
  g.beginPath(); g.moveTo(-95, -10); g.quadraticCurveTo(-80, -120, -20 + sway, -170); g.quadraticCurveTo(30 + sway, -230, 90 + sway * 2, -200);
  g.quadraticCurveTo(40 + sway, -170, 40, -110); g.quadraticCurveTo(60, -50, 95, -10); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = "rgba(20,12,10,0.6)"; g.lineWidth = 4; g.beginPath(); g.moveTo(-60, -60); g.lineTo(-20, -70); g.moveTo(-30, -110); g.lineTo(10, -100); g.stroke(); // patches / creases
  g.fillStyle = "#1a0e0a"; g.beginPath(); g.ellipse(0, -40, 46, 6 + talkAmt * 22, 0, 0, Math.PI); g.fill(); // the rip that speaks
  g.beginPath(); g.ellipse(-26, -78, 14, 5, 0.2, 0, 6.283); g.ellipse(26, -78, 14, 5, -0.2, 0, 6.283); g.fill(); // folds like eyes
  g.restore();
}
