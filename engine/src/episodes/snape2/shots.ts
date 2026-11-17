// "Always" v2 — shot plan as code. Every cut and acting beat is keyed to words.json / lines.json (no hand-typed frames),
// so a re-recorded voice re-times the whole film. Canon labels: story/episodes/snape-always/canon-timeline.md.
import { Cam, Ctx, Grade, H, K, W, camAt, clamp, lerp, linGrad, glide, makeCanvas, particles, post, radGrad, ramp, rng, smooth } from "../../btl/core";
import { classroom, corridor, darkHall, fg, hall, hill, home, lake, layer, layerRack, office, officeNight, playground, shack } from "../../btl/envs";
import { Age, Kind, Light, Pose, person } from "../../btl/people";
import WORDS from "./words.json";
import LINES from "./lines.json";

// ---------- timing from the voice ----------
type Wd = { w: string; s: number; e: number; line: number };
const WD = (WORDS as { words: Wd[] }).words;
const LN = LINES as { line: number; s: number; e: number }[];
const fr = (t: number) => Math.round(t * 30);
const norm = (x: string) => x.toLowerCase().replace(/[^a-z']/g, "");
/** frame where `word` (n-th occurrence inside narration line `li`) starts */
export const wf = (li: number, word: string, n = 0) => { const m = WD.filter((w) => w.line === li && norm(w.w) === norm(word)); if (!m[n]) throw new Error(`word ${word} not in line ${li}`); return fr(m[n].s); };
export const we = (li: number, word: string, n = 0) => { const m = WD.filter((w) => w.line === li && norm(w.w) === norm(word)); return fr(m[n].e); };
const ls = (li: number) => fr(LN[li].s), le = (li: number) => fr(LN[li].e);
export const LAST_WORD = fr(WD[WD.length - 1].e);
export const FRAMES = LAST_WORD + 132; // 4.4 s payoff after the final spoken word (review point 7)

// ---------- helpers ----------
const LOOKS: Record<string, { H: number; hh: number }> = { child: { H: 640, hh: 168 }, teen: { H: 880, hh: 158 }, adult: { H: 1000, hh: 150 } };
const headOff = (kind: Kind, age: Age, kneel = 0) => { const L = kind === "dumbledore" || kind === "voldemort" ? { H: 1060, hh: 150 } : LOOKS[age]; return L.H * (1 - kneel * 0.3) - L.hh * 1.12 + L.hh * 0.62; };
const at = (kind: Kind, age: Age, hx: number, hy: number, s: number, kneel = 0) => ({ x: hx, y: hy + headOff(kind, age, kneel) * s, s, kneel });
const blink = (f: number, seed: number) => { const r = rng(seed); let t = Math.floor(r() * 40); while (t < f + 4) { if (f >= t && f < t + 4) return true; t += 48 + Math.floor(r() * 48); } return false; };
/** mouth movement while a character speaks (between frames a and b) */
const talk = (f: number, a: number, b: number, amt = 0.35) => (f >= a && f < b ? amt * Math.abs(Math.sin((f - a) * 0.62)) * (0.6 + 0.4 * Math.sin(f * 0.21)) : 0);
type Shot = { a: number; b: number; draw: (g: Ctx, f: number, l: number, n: number) => void };

const G = {
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
const L_DUN: Light = { x: 980, y: 700, r: 1500, key: "#ffb070", shade: "#140f24", keyA: 0.3, shadeA: 0.6 };
const L_MEM: Light = { x: 900, y: 500, r: 1600, key: "#ffd9a0", shade: "#4a2a30", keyA: 0.35, shadeA: 0.4 };
const L_LAKE: Light = { x: 1050, y: 900, r: 1500, key: "#ff8a70", shade: "#1a0818", keyA: 0.45, shadeA: 0.6 };
const L_DARK: Light = { x: 540, y: 0, r: 1900, key: "#80ffb0", shade: "#000000", keyA: 0.3, shadeA: 0.75 };
const L_HILL: Light = { x: 270, y: 340, r: 1800, key: "#c8d4ff", shade: "#05070e", keyA: 0.3, shadeA: 0.6 };
const L_OFF: Light = { x: 900, y: 1100, r: 1500, key: "#ffc890", shade: "#120c18", keyA: 0.35, shadeA: 0.55 };
const L_SHK: Light = { x: 760, y: 450, r: 1700, key: "#c0d0e8", shade: "#08060a", keyA: 0.3, shadeA: 0.65 };
const L_CLS: Light = { x: 100, y: 200, r: 1800, key: "#c0e0c8", shade: "#0a0c0c", keyA: 0.25, shadeA: 0.6 };

// ---------- props / effects ----------
function flower(g: Ctx, x: number, y: number, s: number, open: number) {
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
const wand = (color = "#2a1a12", tip?: string) => (g: Ctx, hand: "L" | "R", x: number, y: number) => {
  if (hand !== "R") return;
  g.strokeStyle = color; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70, y - 60); g.stroke();
  if (tip) { g.fillStyle = radGrad(g, x + 70, y - 60, 0, 50, [[0, tip], [1, "rgba(0,0,0,0)"]]); g.fillRect(x + 20, y - 110, 100, 100); }
};
const holdFlower = (open: number) => (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand === "R") flower(g, x, y - 30, 0.55, open); };
function doe(g: Ctx, x: number, y: number, s: number, a: number, f: number) {
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
function argueShadows(g: Ctx, cam: Cam, f: number) {
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
function vignetteDark(g: Ctx, a: number) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
let off2: [HTMLCanvasElement, Ctx] | null = null;
const offC = () => (off2 ??= makeCanvas(W, H));
/** draw `fn` into an offscreen frame and composite with alpha (dissolves) */
function dissolve(g: Ctx, alpha: number, fn: (m: Ctx) => void) {
  if (alpha <= 0) return;
  const [c, m] = offC(); m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.globalCompositeOperation = "source-over"; m.filter = "none"; m.clearRect(0, 0, W, H);
  fn(m); g.save(); g.globalAlpha = clamp(alpha); g.drawImage(c, 0, 0); g.restore();
}

// ---------- the film ----------
const S: Shot[] = [];
const add = (a: number, b: number, draw: Shot["draw"]) => S.push({ a, b, draw });

// L0 hook — "The teacher who treated Harry Potter like dirt spent the boy's whole life keeping him alive."
const c1 = wf(0, "spent") - 4;
add(0, c1, (g, f, l) => { // reveal: lateral dolly past a pillar; Snape strides in and stops over the boy, who flinches
  const cam = camAt([{ f: 0, c: { x: 140, y: 30, zoom: 1.06 } }, { f: c1, c: { x: -60, y: -40, zoom: 1.26 } }], l);
  layer(g, cam, "cor_back", 0.4, corridor.back, 6);
  layer(g, cam, "cor_walls", 0.7, corridor.walls, 2);
  const arrive = ramp(f, 4, 40), flinch = ramp(f, 36, 44);
  person(g, cam, 0.95, "harry", "child", { ...at("harry", "child", 330 - flinch * 12, 1060, 1.05), facing: 0.5, look: [K(f, [[0, -0.3], [30, 0.8]]), K(f, [[0, 0.2], [34, -0.9]])], brow: K(f, [[0, 0], [40, 0.5]]), eye: 1 + flinch * 0.15, mouth: -0.3, shoulders: -flinch * 0.8, lean: -flinch * 4, tremble: flinch * 0.35, blink: blink(l, 3), breathe: f * 1.4, handL: "fist", handR: "fist" }, L_DUN, 1);
  person(g, cam, 1.0, "snape", "adult", { ...at("snape", "adult", lerp(1250, 740, arrive), 560, 1.45), walk: arrive < 1 ? f * 0.32 : undefined, facing: -0.6, look: [-0.8, K(f, [[20, 0], [44, 0.9]])], brow: K(f, [[40, -0.5], [80, -0.9]]), eye: 0.75, mouth: -0.4, lean: K(f, [[40, -3], [90, -7]]), tilt: K(f, [[44, 0], [90, -5]]), blink: blink(l, 11), breathe: f, armL: [10, 30], armR: [-6, -10], handR: "fist" }, L_DUN);
  layer(g, cam, "fg_pillar", 1.35, fg.pillar, 10);
  post(g, f, { ...G.dungeon, glow: { x: 980, y: 700, r: 600, color: "#ff9a50", a: 0.25 } });
});
add(c1, ls(1) - 2, (g, f, l, n) => { // CU: cold contempt — on "alive" his eyes flick away for a beat (the secret), then the mask returns
  const cam = { x: 0, y: -30 * glide(l / n), zoom: 1 + 0.07 * glide(l / n) };
  layer(g, cam, "cor_back", 0.3, corridor.back, 14);
  const a = wf(0, "alive"), away = ramp(f, a - 6, a + 4) * (1 - ramp(f, a + 22, a + 30));
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 560, 740, 4.2), facing: -0.25, look: [lerp(-0.5, 0.6, away), lerp(0.5, -0.2, away)], brow: lerp(-0.8, 0.3, away), eye: lerp(0.7, 0.85, away), mouth: lerp(-0.4, -0.15, away), tilt: away * 4, blink: f === a + 26 || f === a + 27, breathe: f }, { ...L_DUN, keyA: 0.25, shadeA: 0.65 });
  post(g, f, G.dungeon);
});

// L1 — "Severus Snape grew up in a house full of shouting. Then he saw a girl make a flower open in her hand."
const c3 = wf(1, "then") - 3;
add(ls(1) - 2, c3, (g, f, l, n) => { // home: shadows argue on the wall; the boy in the corner covers his ears and shakes
  const cam = camAt([{ f: 0, c: { x: -80, y: -60, zoom: 1.0 } }, { f: n, c: { x: 40, y: 20, zoom: 1.12 } }], l);
  layer(g, cam, "home_back", 0.5, home.back, 3);
  argueShadows(g, cam, f);
  const flinch = Math.sin(f * 0.35) > 0.3 ? 1 : 0;
  person(g, cam, 1, "snape", "child", { ...at("snape", "child", 250, 1200, 1.45, 0.8), facing: 0.4, look: [0.6, 0.2], brow: 1, eye: 0.35 + flinch * 0.2, mouth: -0.6, shoulders: -0.9, tremble: 0.5 + flinch * 0.3, armL: [-150, -99], armR: [150, 99], handL: "grip", handR: "grip", lean: 6, breathe: f * 1.6 }, { x: 330, y: 230, r: 1500, key: "#ffc880", shade: "#0c0606", keyA: 0.3, shadeA: 0.6 });
  post(g, f, G.home);
});
const c4 = wf(1, "flower") - 6;
add(c3, c4, (g, f, l, n) => { // playground reveal: dolly sideways past the hedge — he lifts his head; she is doing the impossible
  const cam = camAt([{ f: 0, c: { x: -160, y: 0, zoom: 1.12 } }, { f: n, c: { x: 90, y: -10, zoom: 1.16 } }], l);
  layer(g, cam, "pg_sky", 0.15, playground.sky);
  layer(g, cam, "pg_town", 0.3, playground.town, 5);
  layer(g, cam, "pg_ground", 0.6, playground.ground, 2);
  const awe = ramp(f, c3 + 10, c3 + 30);
  person(g, cam, 0.8, "lily", "child", { ...at("lily", "child", 700, 1080, 0.85), facing: -0.2, look: [0.2, 0.6], mouth: 0.7, armR: [-70, -60], handR: "open", prop: holdFlower(0.3), blink: blink(l, 5), breathe: f }, L_MEM, 2);
  person(g, cam, 1.05, "snape", "child", { ...at("snape", "child", 290, 1150, 1.25), facing: 0.7, look: [1, lerp(0.4, -0.1, awe)], nod: lerp(0.15, 0, awe), brow: lerp(0.8, 0.3, awe), eye: lerp(0.8, 1.15, awe), mouth: 0, open: awe * 0.2, blink: blink(l, 7), breathe: f, armL: [30, 50], handL: "grip" }, L_MEM);
  layer(g, cam, "pg_hedge", 1.35, playground.hedge, 8);
  particles(g, f, "dust", 7, 40, "rgba(255,230,170,0.8)");
  post(g, f, { ...G.memory, glow: { x: 900, y: 450, r: 700, color: "#ffd090", a: 0.4 } });
});
add(c4, ls(2) - 2, (g, f, l, n) => { // insert: the flower opens in her palm on "open"
  const cam = { x: 0, y: -20 * glide(l / n), zoom: 1 + 0.08 * glide(l / n) };
  layer(g, cam, "pg_sky", 0.1, playground.sky, 20);
  layer(g, cam, "pg_town", 0.2, playground.town, 28);
  const open = ramp(f, wf(1, "open") - 4, wf(1, "hand") + 6);
  g.save(); g.translate(W / 2, H / 2); g.scale(cam.zoom, cam.zoom); g.translate(-W / 2, -H / 2 + cam.y);
  g.fillStyle = "#f1d2bd"; g.strokeStyle = "#1c121c"; g.lineWidth = 6;
  g.beginPath(); g.moveTo(600, 1020); g.quadraticCurveTo(820, 1150, 1000, 1500); g.lineTo(1300, 1500); g.lineTo(1300, 1300); g.quadraticCurveTo(900, 1000, 700, 930); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#d9b65e"; g.beginPath(); g.moveTo(880, 1180); g.quadraticCurveTo(1000, 1300, 1060, 1500); g.lineTo(1300, 1500); g.lineTo(1300, 1150); g.quadraticCurveTo(1100, 1080, 960, 1060); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#f1d2bd";
  g.beginPath(); g.ellipse(540, 960, 230, 115, -0.12, 0, 6.283); g.fill(); g.stroke();
  const curl = 1 - open * 0.25;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(350 + i * 105, 880 - Math.abs(i - 1.5) * 18, 42, 95 * curl, 0.25 - i * 0.13, 0, 6.283); g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(700, 1010, 50, 95, -0.9, 0, 6.283); g.fill(); g.stroke();
  g.fillStyle = radGrad(g, 540, 800, 0, 420 * (0.4 + open), [[0, `rgba(255,240,200,${0.6 * open})`], [1, "rgba(255,200,120,0)"]]); g.fillRect(0, 300, W, 1000);
  flower(g, 540, 820 - open * 30, 2.4, open);
  g.restore();
  particles(g, f, "sparks", 11, Math.round(30 * open), "rgba(255,240,190,0.9)");
  post(g, f, { ...G.memory, glow: { x: 540, y: 800, r: 500, color: "#ffe2a0", a: 0.35 * open } });
});

// L2 — "Lily Evans. He told her she was a witch. For a boy nobody noticed, she was proof he mattered."
const c6 = wf(2, "for") - 3;
add(ls(2) - 2, c6, (g, f, l, n) => { // two-shot: he blurts it out, open-handed; she goes from wary to delighted
  const cam = camAt([{ f: 0, c: { x: 40, y: 0, zoom: 1.1 } }, { f: n, c: { x: -20, y: -30, zoom: 1.2 } }], l);
  layer(g, cam, "pg_sky", 0.15, playground.sky, 10);
  layer(g, cam, "pg_town", 0.3, playground.town, 12);
  layer(g, cam, "pg_tree", 0.55, playground.tree, 6);
  const say = wf(2, "told"), wow = ramp(f, wf(2, "witch") - 2, wf(2, "witch") + 12);
  person(g, cam, 1, "snape", "child", { ...at("snape", "child", 330, 760, 1.9), facing: 0.6, look: [0.9, 0], brow: K(f, [[say - 10, 0.5], [say, -0.1]]), mouth: 0.25, open: talk(f, say - 2, wf(2, "witch") + 8, 0.4), armR: [K(f, [[say - 8, -10], [say + 4, -60]]), K(f, [[say - 8, -10], [say + 4, -50]])], handR: "open", lean: K(f, [[say - 6, 0], [say + 6, 5]]), blink: blink(l, 9), breathe: f }, L_MEM);
  person(g, cam, 1, "lily", "child", { ...at("lily", "child", 770, 800, 1.85), facing: -0.5, look: [-0.9, 0.05], brow: lerp(-0.3, 0.6, wow), eye: 1 + wow * 0.2, mouth: lerp(-0.2, 0.9, wow), open: wow * 0.45, tilt: lerp(-4, 3, wow), shoulders: lerp(-0.3, 0, wow), blink: blink(l, 13), breathe: f, armL: [10, 10], handL: K(f, [[0, 0], [1, 1]]) > 0 ? "mitt" : "mitt" }, L_MEM);
  particles(g, f, "dust", 8, 30, "rgba(255,230,170,0.8)");
  post(g, f, { ...G.memory, glow: { x: 950, y: 420, r: 700, color: "#ffd090", a: 0.35 } });
});
add(c6, ls(3) - 2, (g, f, l, n) => { // CU: rack focus off her (soft foreground hair) onto him — the first small smile of his life
  const cam = { x: 20 * glide(l / n), y: -20 * glide(l / n), zoom: 1.02 + 0.06 * glide(l / n) };
  layer(g, cam, "pg_sky", 0.12, playground.sky, 18);
  layer(g, cam, "pg_tree_b", 0.3, playground.tree, 22);
  const smile = ramp(f, wf(2, "proof") - 6, wf(2, "mattered") + 6);
  person(g, cam, 1, "snape", "child", { ...at("snape", "child", 600, 780, 3.6), facing: -0.35, look: [-0.7, 0.05], brow: lerp(0.5, 0.15, smile), eye: 1.0, mouth: lerp(-0.1, 0.45, smile), shoulders: lerp(-0.2, 0.15, smile), tilt: smile * -3, blink: blink(l, 15), breathe: f }, { ...L_MEM, x: 200 });
  const foc = ramp(f, c6, c6 + 14);
  person(g, cam, 1.25, "lily", "child", { ...at("lily", "child", 60, 900, 4.4), facing: 0.6, back: false, look: [0.8, 0], mouth: 0.6, breathe: f }, L_MEM, lerp(4, 18, foc));
  post(g, f, { ...G.memory, glow: { x: 250, y: 500, r: 800, color: "#ffd090", a: 0.35 } });
});

// L3 — "At Hogwarts, she went to Gryffindor. He went to Slytherin, where the Dark Arts made him feel powerful."
const c8 = wf(3, "where") - 3;
add(ls(3) - 2, c8, (g, f, l, n) => { // the hall: pull-back reveal; they walk to opposite sides, she glances back, he doesn't
  const cam = camAt([{ f: 0, c: { x: 0, y: -40, zoom: 1.3 } }, { f: n, c: { x: 0, y: 0, zoom: 1.0 } }], l);
  layer(g, cam, "hall_back", 0.4, hall.back, 4);
  layer(g, cam, "hall_candles", 0.25, hall.candles, 3);
  const g1 = wf(3, "gryffindor"), s1 = wf(3, "slytherin");
  const lw = ramp(f, g1 - 6, g1 + 30), sw_ = ramp(f, s1 - 6, s1 + 26);
  person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", lerp(470, 280, lw), 900, 0.95), walk: lw > 0 && lw < 1 ? f * 0.3 : undefined, facing: lw < 1 ? -0.6 : K(f, [[s1, -0.6], [s1 + 14, 0.5]]), look: [K(f, [[s1, -0.5], [s1 + 14, 0.9]]), 0], brow: 0.3 * lw, mouth: lerp(0.5, -0.1, sw_), blink: blink(l, 15), breathe: f }, { x: 0, y: 600, r: 1600, key: "#ffb070", shade: "#2a1018", keyA: 0.4, shadeA: 0.5 });
  person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", lerp(610, 800, sw_), 900, 0.95), walk: sw_ > 0 && sw_ < 1 ? f * 0.3 : undefined, facing: lerp(-0.5, 0.5, sw_), look: [lerp(-0.8, 0.5, sw_), 0.2], brow: -0.2 * sw_, mouth: -0.2, blink: blink(l, 17), breathe: f }, { x: 1080, y: 600, r: 1600, key: "#70e0a0", shade: "#04140e", keyA: 0.35, shadeA: 0.5 });
  post(g, f, G.split);
});
add(c8, ls(4) - 2, (g, f, l, n) => { // low-angle dolly-in: green light, older boys around him; his spine straightens, a first smirk
  const cam = camAt([{ f: 0, c: { x: -60, y: 60, zoom: 1.05 } }, { f: n, c: { x: 20, y: 0, zoom: 1.2 } }], l);
  layer(g, cam, "dark_back", 0.35, darkHall.back, 8);
  const pw = ramp(f, wf(3, "powerful") - 10, wf(3, "powerful") + 8);
  for (const [bx, sd] of [[150, 61], [930, 62]] as [number, number][]) person(g, cam, 0.7, "bully", "teen", { ...at("bully", "teen", bx, 760, 0.85), facing: bx < 500 ? 0.5 : -0.5, look: [bx < 500 ? 0.8 : -0.8, 0], mouth: 0.4, brow: -0.3, breathe: f + sd, blink: blink(l, sd) }, L_DARK, 5);
  person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 540, 760, 1.3), facing: 0.1, look: [0, K(f, [[c8, 0.5], [c8 + 30, -0.1]])], brow: lerp(0.2, -0.5, pw), eye: lerp(1, 0.8, pw), mouth: lerp(-0.2, 0.35, pw), shoulders: lerp(0.4, -0.2, pw), nod: lerp(0.12, -0.05, pw), armR: [-60, -80], handR: "grip", prop: wand("#2a1a12", pw > 0.2 ? "rgba(120,255,170,0.9)" : undefined), blink: blink(l, 19), breathe: f }, { ...L_DARK, keyA: 0.3 + pw * 0.15 });
  particles(g, f, "sparks", 23, Math.round(25 * pw), "rgba(120,255,170,0.8)");
  post(g, f, G.dark);
});

// L4 — "Then James Potter's gang humiliated him in front of everyone. Lily stood up for him."
const c10 = wf(4, "lily") - 4;
add(ls(4) - 2, c10, (g, f, l, n) => { // lake: hoisted upside down, the crowd laughs; James points his wand
  const cam = camAt([{ f: 0, c: { x: 120, y: 0, zoom: 1.1 } }, { f: n, c: { x: -40, y: -20, zoom: 1.18, roll: -2 } }], l);
  layer(g, cam, "lake_sky", 0.1, lake.sky);
  layer(g, cam, "lake_far", 0.3, lake.far, 4);
  layer(g, cam, "lake_ground", 0.6, lake.ground, 2);
  for (const [bx, sd] of [[120, 21], [270, 22], [980, 23]] as [number, number][]) person(g, cam, 0.5, "bully", "teen", { ...at("bully", "teen", bx, 760, 0.55), facing: 0.3, mouth: 0.9, open: 0.3 + 0.3 * Math.abs(Math.sin(f * 0.4 + bx)), eye: 0.6, breathe: f + bx, shoulders: Math.sin(f * 0.5 + bx) * 0.3 }, L_LAKE, 6);
  person(g, cam, 0.85, "james", "teen", { ...at("james", "teen", 260, 860, 1.05), facing: 0.6, look: [0.9, -0.4], mouth: 0.8, open: 0.25 + 0.2 * Math.abs(Math.sin(f * 0.45)), brow: -0.2, armR: [-120, -20], handR: "grip", prop: wand(), blink: blink(l, 27), breathe: f }, L_LAKE);
  const bob = Math.sin(f * 0.18) * 14;
  person(g, cam, 1, "snape", "teen", { x: 760, y: 280 + bob, s: 0.95, rot: 180, facing: 0, look: [0, 0.5], brow: -0.5, eye: 0.6, mouth: -0.8, open: 0.2, armL: [40, 20], armR: [-40, -20], handL: "open", handR: "open", tremble: 0.3, breathe: f * 2 }, L_LAKE);
  layer(g, cam, "fg_reeds", 1.3, fg.reeds, 8);
  post(g, f, G.betrayal);
});
add(c10, ls(5) - 2, (g, f, l, n) => { // she steps in between, pointing at James; behind her he turns his face away
  const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.1 } }, { f: n, c: { x: 40, y: -20, zoom: 1.2 } }], l);
  layer(g, cam, "lake_sky", 0.1, lake.sky);
  layer(g, cam, "lake_far", 0.3, lake.far, 4);
  layer(g, cam, "lake_ground", 0.6, lake.ground, 2);
  const step = ramp(f, c10, c10 + 18);
  person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 820, 1020, 1.05, 1), facing: 0.6, look: [0.9, 0.6], brow: 0.3, eye: 0.6, mouth: -0.7, shoulders: 0.8, lean: 12, armL: [30, 40], handL: "fist", blink: blink(l, 25), breathe: f * 2 }, L_LAKE, 2);
  person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", lerp(640, 480, step), 820, 1.15), walk: step < 1 ? f * 0.32 : undefined, facing: -0.5, look: [-0.9, 0], brow: -0.8, eye: 1.05, mouth: -0.4, open: talk(f, c10 + 10, ls(5) - 4, 0.35), armR: [K(f, [[c10 + 8, -10], [c10 + 18, -100]]), K(f, [[c10 + 8, -5], [c10 + 18, -10]])], handR: "point", blink: blink(l, 29), breathe: f }, L_LAKE);
  post(g, f, G.betrayal);
});

// L5 — "And to prove he didn't need her, he called her the one word he could never take back." {pause}
const c12 = wf(5, "one") - 2;
add(ls(5) - 2, c12, (g, f, l, n) => { // CU: shame curdles into fury; he lifts his chin to say it
  const cam = { x: 0, y: -10 * glide(l / n), zoom: 1 + 0.1 * glide(l / n), roll: -2 * glide(l / n) };
  layer(g, cam, "lake_sky", 0.1, lake.sky, 18);
  layer(g, cam, "lake_far", 0.2, lake.far, 18);
  const prove = ramp(f, wf(5, "prove") - 4, wf(5, "need") + 4), call = ramp(f, wf(5, "called") - 4, wf(5, "called") + 6);
  person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 560, 760, 4.0), facing: -0.3, look: [lerp(0.6, -0.7, prove), lerp(0.6, -0.1, prove)], nod: lerp(0.18, -0.05, prove), brow: lerp(0.4, -1, prove), eye: lerp(0.65, 1.05, call), mouth: lerp(-0.6, -0.9, prove), open: call * 0.55 * (f < c12 - 2 ? 1 : 0.3), tremble: prove * 0.25, breathe: f * 2 }, { x: 1050, y: 800, r: 1400, key: "#ff7060", shade: "#1a0818", keyA: 0.45, shadeA: 0.65 });
  post(g, f, G.betrayal);
});
add(c12, ls(6) - 2, (g, f, l, n) => { // CU Lily — the word lands; hold through the silence; her eyes close
  const cam = { x: 0, y: 0, zoom: 1 + 0.06 * glide(l / n) };
  layer(g, cam, "lake_sky", 0.1, lake.sky, 18);
  layer(g, cam, "lake_far", 0.2, lake.far, 18);
  const hurt = ramp(f, c12 + 2, c12 + 16), shut = ramp(f, le(5) + 4, le(5) + 18) * (1 - ramp(f, le(5) + 26, le(5) + 34));
  person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", 520, 760, 4.0), facing: 0.3, look: [lerp(0.6, 0.2, hurt), lerp(0.3, 0.5, hurt)], brow: lerp(-0.3, 1, hurt), eye: lerp(1.15, 0.85, hurt) * (1 - shut * 0.95), mouth: -0.5, open: lerp(0.3, 0.05, hurt), tear: hurt * 0.7, tilt: hurt * -4, nod: hurt * 0.06, still: true }, { x: 0, y: 800, r: 1400, key: "#ff9a80", shade: "#1a0818", keyA: 0.35, shadeA: 0.55 });
  post(g, f, G.betrayal);
});

// L6 — "She walked away. He chose Voldemort."
const c14 = wf(6, "he") - 3;
add(ls(6) - 2, c14, (g, f, l, n) => { // she walks away; rack focus to his hand reaching after her, then dropping
  const cam = { x: -30 * glide(l / n), y: 0, zoom: 1.04 + 0.03 * glide(l / n) };
  layer(g, cam, "lake_sky", 0.1, lake.sky);
  layer(g, cam, "lake_far", 0.3, lake.far, 3);
  layer(g, cam, "lake_ground", 0.6, lake.ground, 1);
  const t = glide(l / n), foc = ramp(f, ls(6) + 10, ls(6) + 22);
  person(g, cam, 0.8, "lily", "teen", { x: lerp(560, 640, t), y: lerp(1300, 1120, t), s: lerp(0.9, 0.55, t), back: true, walk: f * 0.3, breathe: f }, L_LAKE, lerp(0, 6, foc));
  const reach = K(f, [[ls(6), 0], [ls(6) + 10, 1], [c14 - 10, 1], [c14, 0.2]]);
  person(g, cam, 1.2, "snape", "teen", { ...at("snape", "teen", 180, 1150, 1.6, 1), facing: 0.5, look: [0.9, -0.4], brow: 0.9, eye: 0.85, mouth: -0.5, open: 0.1, lean: 8, armR: [lerp(-20, -95, reach), lerp(-10, -20, reach)], handR: reach > 0.5 ? "open" : "mitt", breathe: f * 1.5 }, L_LAKE, lerp(8, 0, foc));
  post(g, f, G.betrayal);
});
add(c14, ls(7) - 2, (g, f, l, n) => { // tilt up from the black floor to the hooded figure; he kneels in the foreground
  const cam = camAt([{ f: 0, c: { x: 0, y: 260, zoom: 1.15 } }, { f: n, c: { x: 0, y: 0, zoom: 1.0 } }], l);
  layer(g, cam, "dark_back", 0.4, darkHall.back, 3);
  person(g, cam, 0.85, "voldemort", "adult", { ...at("voldemort", "adult", 600, 640, 1.2), facing: -0.2, look: [-0.3, 0.8], blink: blink(l, 29), breathe: f, armR: [-25, -30], handR: "open", tilt: 3 }, L_DARK, 1);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 380, 1200, 1.2, 1), facing: 0.6, look: [0.6, -0.8], brow: -0.2, eye: 0.8, mouth: -0.3, lean: 14, nod: 0.1, breathe: f, armL: [20, 30], armR: [-20, -30] }, L_DARK);
  post(g, f, G.dark);
});

// L7 — "He carried a prophecy to his master, then realized who it pointed to. Lily's son." {pause}
const c16 = wf(7, "then") - 3;
add(ls(7) - 2, c16, (g, f, l, n) => { // arc dolly around the pair; he whispers up, the master leans in
  const cam = camAt([{ f: 0, c: { x: -120, y: 0, zoom: 1.2 } }, { f: n, c: { x: 80, y: -20, zoom: 1.32 } }], l);
  layer(g, cam, "dark_back", 0.35, darkHall.back, 6);
  const lean = ramp(f, ls(7) + 10, ls(7) + 40);
  person(g, cam, 0.9, "voldemort", "adult", { ...at("voldemort", "adult", 720, 700, 1.3), facing: -0.5, look: [-0.6, 0.6], lean: -lean * 8, tilt: -lean * 5, breathe: f, armR: [-40, -60], handR: "open" }, L_DARK, 2);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 1000, 1.4, 1), facing: 0.7, look: [0.8, -0.6], brow: -0.1, eye: 0.85, mouth: 0, open: talk(f, ls(7), c16 - 4, 0.25), lean: 12, blink: blink(l, 31), breathe: f, armR: [-70, -40], handR: "open" }, L_DARK);
  layer(g, cam, "fg_pillar_d", 1.4, fg.pillar, 12);
  post(g, f, G.dark);
});
add(c16, ls(8) - 2, (g, f, l, n) => { // CU: realisation — eyes widen, breath catches, a tremor
  const cam = { x: 0, y: -40 * glide(l / n), zoom: 1 + 0.24 * glide(l / n) };
  layer(g, cam, "dark_back", 0.3, darkHall.back, 16);
  const r = ramp(f, wf(7, "lily's") - 8, wf(7, "son") + 4);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 760, 4.3), facing: 0.15, look: [lerp(0.4, 0, r), lerp(-0.4, 0.1, r)], brow: lerp(-0.2, 0.9, r), eye: lerp(0.85, 1.25, r), mouth: -0.4, open: r * 0.35, tremble: r * 0.6, nod: -r * 0.05, blink: f === c16 + 6, breathe: f * (1 + r) }, { x: 540, y: 0, r: 1700, key: "#a0ffd0", shade: "#000000", keyA: 0.35, shadeA: 0.7 });
  post(g, f, G.dark);
});

// L8 — "He begged Voldemort to spare her. He begged Dumbledore to hide her." / L9 "It wasn't enough." {pause}
const c18 = wf(8, "he", 1) - 3;
add(ls(8) - 2, c18, (g, f, l, n) => { // reaction CU on the master: cold amusement; Snape's begging hands in the soft foreground
  const cam = { x: -40 + 90 * glide(l / n), y: 20 - 30 * glide(l / n), zoom: 1.04 + 0.12 * glide(l / n) };
  layer(g, cam, "dark_back", 0.3, darkHall.back, 16);
  person(g, cam, 1, "voldemort", "adult", { ...at("voldemort", "adult", 600, 700, 3.4), facing: -0.3, look: [-0.5, 0.6], tilt: K(f, [[ls(8), 0], [ls(8) + 30, 6]]), mouth: K(f, [[ls(8) + 20, 0], [ls(8) + 34, 0.25]]), breathe: f }, L_DARK);
  person(g, cam, 1.3, "snape", "adult", { x: 200, y: 2600, s: 1.8, facing: 0.6, back: true, armL: [-160, -20], armR: [-150, -10], breathe: f, tremble: 0.4 }, L_DARK, 10);
  post(g, f, G.dark);
});
add(c18, ls(9) - 2, (g, f, l, n) => { // hilltop wind: he sinks to his knees in front of Dumbledore (posture = visual embellishment)
  const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: n, c: { x: 40, y: -30, zoom: 1.12 } }], l);
  layer(g, cam, "hill_sky", 0.1, hill.sky);
  layer(g, cam, "hill_ground", 0.6, hill.ground, 1);
  const sink = ramp(f, c18 + 4, c18 + 26);
  person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 760, 720, 1.0), facing: -0.4, look: [-0.7, lerp(0.3, 0.9, sink)], brow: 0.1, mouth: -0.1, blink: blink(l, 33), breathe: f, armR: [-10, -20], tilt: Math.sin(f * 0.07) * 1 }, L_HILL, 1);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 350, lerp(560, 1120, sink), 1.2, sink), facing: 0.6, look: [0.8, -0.9], brow: 0.9, eye: 1.0, mouth: -0.5, open: talk(f, c18, ls(9) - 6, 0.3), lean: 6 - sink * 4, armL: [lerp(10, 120, sink), lerp(10, 40, sink)], armR: [lerp(-10, 150, sink), lerp(-10, 30, sink)], handL: "open", handR: "open", tremble: 0.3, blink: blink(l, 35), breathe: f * 1.6 }, L_HILL);
  particles(g, f, "dust", 37, 50, "rgba(200,210,240,0.5)"); // wind-blown grit (canon: windswept, no rain)
  post(g, f, G.grief);
});
const c20 = ls(10) - 2;
add(ls(9) - 2, c20, (g, f, l, n) => { // "It wasn't enough." — office at night, slumped in a chair, face in hands, shoulders shaking. Silence.
  const cam = { x: -30 - 15 * glide(l / n), y: 110 + 10 * glide(l / n), zoom: 1.3 + 0.1 * glide(l / n) };
  layer(g, cam, "offn_back", 0.45, officeNight.back, 6);
  person(g, cam, 0.85, "dumbledore", "adult", { ...at("dumbledore", "adult", 900, 640, 0.85), facing: -0.6, look: [-0.8, 0.6], brow: 0.5, mouth: -0.2, breathe: f }, { ...L_OFF, keyA: 0.15 }, 3);
  layer(g, cam, "fg_chair", 1.0, fg.chair, 0);
  const sob = Math.max(0, Math.sin(f * 0.3)) * 0.6;
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 920, 1.25, 0.55), facing: 0.1, look: [0, 1], brow: 1, eye: 0.15, mouth: -0.7, open: 0.2, nod: 0.35, shoulders: 1, lean: 7, tremble: 0.6 + sob, armL: [30, 150], armR: [-30, -150], handL: "open", handR: "open", breathe: f * 2.4 }, { x: 900, y: 1300, r: 1400, key: "#ff9a60", shade: "#05060c", keyA: 0.25, shadeA: 0.7 });
  post(g, f, { ...G.grief, glow: { x: 900, y: 1300, r: 600, color: "#ff8040", a: 0.15 } });
});

// L10 — "So he made a promise. Protect the boy with her eyes."
add(c20, ls(11) - 2, (g, f, l, n) => { // he lifts his head; Dumbledore speaks the condition; green light on "eyes"
  const cam = camAt([{ f: 0, c: { x: 80, y: 0, zoom: 1.05 } }, { f: n, c: { x: -60, y: -40, zoom: 1.3 } }], l);
  layer(g, cam, "off_back", 0.45, office.back, 5);
  layer(g, cam, "off_desk", 0.75, office.desk, 2);
  const lift = ramp(f, c20, c20 + 26), green = ramp(f, wf(10, "eyes") - 6, wf(10, "eyes") + 10);
  person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 820, 760, 0.95), facing: -0.6, look: [-0.8, 0.1], brow: 0.4, mouth: -0.1, open: talk(f, wf(10, "protect"), we(10, "eyes"), 0.25), armR: [-40, -60], handR: "open", blink: blink(l, 37), breathe: f }, L_OFF, 2);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 330, 820, 1.25), facing: 0.6, look: [0.6, lerp(0.8, 0.1, lift)], nod: lerp(0.3, 0, lift), shoulders: lerp(0.8, 0.1, lift), brow: lerp(1, 0.6, lift), eye: 0.8, mouth: -0.4, tear: 0.6, blink: blink(l, 39), breathe: f, handL: "fist", armL: [12, 10] }, { ...L_OFF, key: green > 0.3 ? "#60ffa0" : L_OFF.key, keyA: 0.35 + green * 0.1 });
  layer(g, cam, "fg_shelf", 1.35, fg.shelf, 10);
  post(g, f, { ...G.office, glow: { x: 330, y: 650, r: 420, color: "#40e080", a: 0.25 * green } });
});

// L11 — "But the boy had her eyes, in James Potter's face."
add(ls(11) - 2, ls(12) - 2, (g, f, l, n) => { // Snape's POV: Harry's green eyes... then his father's face superimposes, and Harry's glare
  const cam = { x: 0, y: -10 * glide(l / n), zoom: 1 + 0.06 * glide(l / n) };
  layer(g, cam, "cls_back", 0.3, classroom.back, 16);
  const j = ramp(f, wf(11, "james") - 4, wf(11, "james") + 8) * (1 - ramp(f, we(11, "face") + 6, we(11, "face") + 18));
  person(g, cam, 1, "harry", "child", { ...at("harry", "child", 540, 760, 4.6), facing: 0, look: [0, -0.1], brow: lerp(0.3, -0.4, j), eye: 1.05, mouth: -0.3, blink: blink(l, 41), breathe: f }, { ...L_CLS, keyA: 0.3 });
  if (wf(11, "eyes") <= f) { g.save(); g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 540, 640, 0, 380, [[0, `rgba(60,230,130,${0.22 * ramp(f, wf(11, "eyes") - 2, wf(11, "eyes") + 8)})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore(); }
  dissolve(g, j * 0.62, (m) => { person(m, cam, 1, "james", "teen", { ...at("james", "teen", 540, 760, 4.4), facing: 0.1, look: [0.2, -0.1], brow: -0.2, mouth: 0.6, eye: 0.85, breathe: f }, { x: 1000, y: 600, r: 1500, key: "#ff9a80", shade: "#1a0818", keyA: 0.35, shadeA: 0.5 }); });
  post(g, f, G.dungeon);
});

// L12 — "So he guarded Harry and punished him, and crushed kids like Neville who couldn't fight back." / L13
const c23 = wf(12, "and", 1) - 3;
add(ls(12) - 2, c23, (g, f, l, n) => { // classroom: he prowls between desks (walk), stops at Harry, leans in
  const cam = camAt([{ f: 0, c: { x: 80, y: 30, zoom: 1.0 } }, { f: n, c: { x: -20, y: 0, zoom: 1.12 } }], l);
  layer(g, cam, "cls_back", 0.45, classroom.back, 4);
  const walkT = ramp(f, ls(12) - 2, ls(12) + 34), loom = ramp(f, ls(12) + 30, ls(12) + 46);
  person(g, cam, 0.9, "harry", "teen", { ...at("harry", "teen", 260, 1100, 0.8), facing: 0.5, look: [0.8, lerp(-0.2, -0.8, loom)], brow: -0.6, mouth: -0.4, shoulders: -loom * 0.4, blink: blink(l, 41), breathe: f, handR: "fist" }, L_CLS, 1);
  person(g, cam, 0.9, "neville", "teen", { ...at("neville", "teen", 520, 1120, 0.8), facing: 0.4, look: [0.7, -0.9], brow: 0.9, eye: 1.1, mouth: -0.5, shoulders: -0.6, tremble: 0.3, blink: blink(l, 43), breathe: f * 1.5 }, L_CLS, 1);
  layer(g, cam, "cls_desks", 0.95, classroom.desks, 0);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", lerp(1100, 760, walkT), 640, 1.35), walk: walkT < 1 ? f * 0.3 : undefined, facing: -0.7, look: [-0.8, lerp(0.3, 0.9, loom)], brow: -0.9, eye: 0.7, mouth: lerp(-0.6, 0.25, loom), lean: -loom * 10, nod: loom * 0.08, armL: [60, 40], armR: [-10, -20], handL: "point", blink: blink(l, 45), breathe: f }, L_CLS);
  layer(g, cam, "fg_cauldron", 1.3, fg.cauldron, 10);
  particles(g, f, "dust", 47, 30, "rgba(170,230,180,0.5)");
  post(g, f, G.dungeon);
});
const c25 = wf(13, "it", 1) - 3;
add(c23, c25, (g, f, l, n) => { // CU Neville: his shadow falls over the boy; trembling; he looks down — the harmed child gets the screen
  const cam = { x: 0, y: 0, zoom: 1 + 0.07 * glide(l / n) };
  layer(g, cam, "cls_back", 0.3, classroom.back, 16);
  const shade = ramp(f, c23, c23 + 24), down = ramp(f, ls(13), ls(13) + 20);
  person(g, cam, 1, "neville", "teen", { ...at("neville", "teen", 540, 760, 3.8), facing: 0.2, look: [0.4, lerp(-0.9, 0.7, down)], nod: down * 0.12, brow: 1, eye: lerp(1.15, 0.8, down), mouth: -0.6, open: 0.12, tear: 0.4 + down * 0.4, tremble: 0.5, shoulders: -0.6, breathe: f * 1.8 }, { ...L_CLS, keyA: 0.25 });
  g.save(); g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, `rgba(0,0,0,${0.55 * shade})`], [0.6, `rgba(0,0,0,${0.25 * shade})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore();
  post(g, f, G.dungeon);
});
add(c25, ls(14) - 2, (g, f, l, n) => { // "It doesn't excuse it." — pull back: the dungeon empties; he stands alone
  const cam = camAt([{ f: 0, c: { x: 0, y: -40, zoom: 1.35 } }, { f: n, c: { x: 0, y: 0, zoom: 1.0 } }], l);
  layer(g, cam, "cls_back", 0.45, classroom.back, 3);
  layer(g, cam, "cls_desks", 0.8, classroom.desks, 1);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 560, 700, 0.95), facing: 0, look: [0, 0.5], brow: 0.3, eye: 0.7, mouth: -0.3, shoulders: 0.3, nod: 0.05, breathe: f }, L_CLS);
  post(g, f, { ...G.dungeon, vignette: 0.7 });
});

// L14 — "When Dumbledore asked if he cared for the boy, Snape conjured her silver doe."
add(ls(14) - 2, ls(15) - 2, (g, f, l, n) => { // the doe bursts from his wand; the camera follows it across the room (parallax)
  const doeT = ramp(f, wf(14, "snape") - 4, le(14) + 10);
  const cam = camAt([{ f: 0, c: { x: -70, y: 10, zoom: 1.0 } }, { f: wf(14, "snape") - ls(14), c: { x: -30, y: 0, zoom: 1.06 } }, { f: n, c: { x: 90, y: -40, zoom: 1.18 } }], l);
  layer(g, cam, "off_back", 0.45, office.back, 6);
  const Lt: Light = { x: lerp(300, 620, doeT), y: 760, r: 1500, key: "#d8e8ff", shade: "#0a0c18", keyA: 0.2 + 0.3 * doeT, shadeA: 0.6 };
  person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 860, 700, 0.95), facing: -0.6, look: [lerp(-0.8, -0.3, doeT), lerp(0.2, -0.3, doeT)], brow: lerp(-0.2, 0.7, doeT), eye: lerp(0.9, 1.1, doeT), mouth: -0.1, open: talk(f, ls(14), wf(14, "snape") - 2, 0.25), blink: blink(l, 53), breathe: f }, Lt, 2);
  const raise = ramp(f, wf(14, "snape") - 10, wf(14, "conjured"));
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 290, 820, 1.25), facing: 0.5, look: [0.5, lerp(0.3, -0.4, raise)], brow: lerp(-0.6, 0.7, raise), eye: 0.85, mouth: lerp(-0.6, -0.3, raise), armR: [lerp(-10, -100, raise), lerp(-10, -30, raise)], handR: "grip", prop: wand("#2a1a12", raise > 0.6 ? "rgba(220,235,255,0.95)" : undefined), blink: blink(l, 55), breathe: f }, Lt);
  if (doeT > 0) { g.save(); g.translate(W / 2, H / 2); g.scale(cam.zoom, cam.zoom); g.translate(-W / 2 - cam.x, -H / 2 - cam.y); doe(g, lerp(380, 640, doeT) + Math.sin(f * 0.05) * 10, lerp(700, 760, doeT) + Math.sin(f * 0.07) * 12, lerp(0.5, 1.05, doeT), clamp(doeT * 1.4), f); g.restore(); }
  layer(g, cam, "fg_shelf_b", 1.4, fg.shelf, 12);
  post(g, f, { ...G.silver, glow: { x: 560, y: 760, r: 700, color: "#d0e4ff", a: 0.35 * doeT } });
});

// L15 — "After all this time?" {pause} — reaction CU Dumbledore, wet-eyed
add(ls(15) - 2, ls(16) - 4, (g, f, l, n) => {
  const cam = { x: -10 * glide(l / n), y: 0, zoom: 1 + 0.05 * glide(l / n) };
  layer(g, cam, "off_back", 0.3, office.back, 18);
  const soft = ramp(f, ls(15), le(15) + 8);
  person(g, cam, 1, "dumbledore", "adult", { ...at("dumbledore", "adult", 560, 700, 3.4), facing: -0.3, look: [-0.6, 0], brow: lerp(0.3, 0.8, soft), eye: lerp(1.05, 0.9, soft), mouth: -0.15, open: talk(f, ls(15), le(15), 0.22), tear: soft * 0.6, tilt: -soft * 3, breathe: f }, { x: 300, y: 700, r: 1400, key: "#e0ecff", shade: "#0a0c18", keyA: 0.4, shadeA: 0.55 });
  post(g, f, { ...G.silver, glow: { x: 300, y: 700, r: 700, color: "#d0e4ff", a: 0.3 } });
});
// L16 — "Always." {pause} — CU Snape: a small nod, the tear falls
add(ls(16) - 4, ls(17) - 2, (g, f, l, n) => {
  const cam = { x: 0, y: -14 * glide(l / n), zoom: 1 + 0.06 * glide(l / n) };
  layer(g, cam, "off_back", 0.3, office.back, 18);
  const nodA = K(f, [[ls(16) - 2, 0], [ls(16) + 6, 0.07], [ls(16) + 16, 0]]);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 520, 760, 4.2), facing: 0.25, look: [0.3, K(f, [[ls(16), -0.1], [le(16) + 10, 0.3]])], brow: 0.9, eye: K(f, [[ls(16), 0.85], [le(16) + 14, 0.6]]), mouth: -0.3, open: talk(f, ls(16), le(16), 0.18), nod: nodA, tear: ramp(f, ls(16), le(16) + 20), breathe: f, still: true }, { x: 900, y: 700, r: 1400, key: "#e0ecff", shade: "#0a0c18", keyA: 0.45, shadeA: 0.55 });
  post(g, f, { ...G.silver, glow: { x: 900, y: 700, r: 700, color: "#d0e4ff", a: 0.3 } });
});

// L17 — "Dying, he asked Harry for one last thing. Look at me." {pause}
const c29 = wf(17, "look") - 3;
add(ls(17) - 2, c29, (g, f, l, n) => { // the shack: Harry drops to his knees beside him; Snape's hand finds Harry's robe
  const cam = camAt([{ f: 0, c: { x: 60, y: 0, zoom: 1.0 } }, { f: n, c: { x: -20, y: -30, zoom: 1.16 } }], l);
  layer(g, cam, "shk_back", 0.5, shack.back, 3);
  const kneelH = ramp(f, ls(17), ls(17) + 16), grab = ramp(f, wf(17, "asked") - 2, wf(17, "asked") + 12);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 1080, 1.25, 1), facing: 0.4, look: [0.9, -0.2], brow: 0.8, eye: 0.6, mouth: -0.3, open: 0.15, lean: -5, shoulders: 0.6, armL: [10, 20], armR: [lerp(-40, -100, grab), lerp(-60, -30, grab)], handR: grab > 0.5 ? "grip" : "mitt", tremble: 0.4, breathe: f * 2.2 }, L_SHK);
  person(g, cam, 0.95, "harry", "teen", { ...at("harry", "teen", 790, lerp(780, 1060, kneelH), 1.1, kneelH), facing: -0.6, look: [-0.9, 0.2], brow: 0.8, eye: 1.05, mouth: -0.4, lean: -10 * kneelH, armL: [70, 40], handL: "open", blink: blink(l, 57), breathe: f * 1.5 }, L_SHK);
  particles(g, f, "dust", 59, 40, "rgba(220,225,235,0.6)");
  post(g, f, G.grief);
});
const c30 = wf(17, "look") + Math.round((ls(18) - wf(17, "look")) * 0.55);
add(c29, c30, (g, f, l, n) => { // ECU Harry's green eyes — he obeys, looks straight down at him
  const cam = { x: 0, y: 0, zoom: 1 + 0.05 * glide(l / n) };
  layer(g, cam, "shk_back", 0.3, shack.back, 20);
  person(g, cam, 1, "harry", "teen", { ...at("harry", "teen", 540, 860, 6.5), facing: -0.1, look: [K(f, [[c29, -0.4], [c29 + 10, 0]]), K(f, [[c29, 0], [c29 + 10, 0.35]])], brow: 0.7, eye: 1.1, mouth: -0.3, still: true }, { ...L_SHK, keyA: 0.35, shadeA: 0.5 });
  post(g, f, { ...G.grief, glow: { x: 540, y: 960, r: 500, color: "#40e080", a: 0.14 } });
});
add(c30, ls(18) - 2, (g, f, l, n) => { // reverse ECU: the black eyes find the green
  const cam = { x: 0, y: 0, zoom: 1.05 + 0.04 * glide(l / n) };
  layer(g, cam, "shk_back", 0.3, shack.back, 20);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 820, 6.2), facing: 0.05, look: [0, -0.35], brow: 0.85, eye: 0.85, mouth: -0.2, tear: 1, still: true }, { x: 540, y: 300, r: 1600, key: "#c0d0e8", shade: "#08060a", keyA: 0.3, shadeA: 0.55 });
  g.save(); g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 540, 780, 0, 360, [[0, "rgba(60,220,120,0.12)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore();
  post(g, f, G.grief);
});

// L18 — "Maybe so the last thing he ever saw was her eyes." + 4.4 s payoff
const memF = wf(18, "her") - 6;
const reveal = LAST_WORD + 30;
add(ls(18) - 2, reveal, (g, f, l, n) => { // his eyes close; the face finally relaxes; dissolve into her eyes, warm
  const cam = { x: 0, y: -45 * glide(l / n), zoom: 1 + 0.16 * glide(l / n) };
  const close = ramp(f, wf(18, "thing") - 4, wf(18, "her") + 4);
  layer(g, cam, "shk_back", 0.3, shack.back, 20);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 760, 4.2), facing: 0.1, look: [0, -0.3], brow: lerp(0.8, 0.05, close), eye: lerp(0.8, 0.0, close), mouth: lerp(-0.3, 0.15, close), nod: close * 0.05, tear: 1, breathe: f * lerp(0.9, 0.35, close), shoulders: close * 0.3 }, { x: 540, y: 300, r: 1600, key: close > 0.5 ? "#ffd090" : "#c0d0e8", shade: "#08060a", keyA: 0.3 + close * 0.15, shadeA: 0.55 });
  post(g, f, { ...G.grief, tintAlpha: lerp(0.45, 0.1, close) });
  dissolve(g, ramp(f, memF, memF + 22), (m) => {
    layer(m, { x: 0, y: 0, zoom: 1 }, "pg_sky", 0.1, playground.sky, 24);
    person(m, { x: 0, y: 0, zoom: 1 + 0.03 * glide(l / n) }, 1, "lily", "child", { ...at("lily", "child", 540, 800, 5.2), facing: 0, look: [0, 0], brow: 0.2, eye: 1, mouth: lerp(0.3, 0.7, ramp(f, memF + 10, memF + 40)), blink: f === memF + 44 || f === memF + 45 }, L_MEM);
    post(m, f, { ...G.memory, glow: { x: 900, y: 450, r: 800, color: "#ffd090", a: 0.4 } });
  });
});
add(reveal, FRAMES, (g, f, l, n) => { // payoff: pull back from her face to the playground — the two of them, before any of it happened
  const cam = camAt([{ f: 0, c: { x: 0, y: -40, zoom: 1.35 } }, { f: n, c: { x: 30, y: 0, zoom: 1.0 } }], l);
  layer(g, cam, "pg_sky", 0.15, playground.sky);
  layer(g, cam, "pg_town", 0.3, playground.town, 5);
  layer(g, cam, "pg_ground", 0.6, playground.ground, 2);
  layer(g, cam, "pg_tree", 0.7, playground.tree, 2);
  const turn = ramp(f, reveal + 30, reveal + 60);
  person(g, cam, 1, "lily", "child", { ...at("lily", "child", 640, 900, 1.15), facing: lerp(0, -0.5, turn), look: [lerp(0, -0.8, turn), 0.3], mouth: 0.8, armR: [-60, -70], handR: "open", prop: holdFlower(1), blink: blink(l, 71), breathe: f }, L_MEM);
  person(g, cam, 1, "snape", "child", { ...at("snape", "child", 390, 930, 1.12), facing: 0.6, look: [0.8, -0.1], brow: 0.2, mouth: lerp(0.2, 0.5, turn), eye: 1.05, shoulders: 0.1, blink: blink(l, 73), breathe: f }, L_MEM);
  particles(g, f, "dust", 77, 50, "rgba(255,230,170,0.8)");
  post(g, f, { ...G.memory, glow: { x: 900, y: 450, r: 800, color: "#ffd090", a: 0.45 } });
  const out = ramp(f, FRAMES - 24, FRAMES - 2);
  if (out > 0) vignetteDark(g, out);
});

export const SHOTS = S;
export const SHOT_BOUNDS = S.map((s) => [s.a, s.b]);
export function drawEpisode(g: Ctx, f: number) {
  const s = S.find((x) => f >= x.a && f < x.b) ?? S[S.length - 1];
  s.draw(g, f, f - s.a, s.b - s.a);
}
