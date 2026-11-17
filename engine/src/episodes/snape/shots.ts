// "Always" — shot plan as code. Frames are tied to words.json (see story/episodes/snape-always/shot-plan.md).
import { Cam, Ctx, Grade, H, W, camAt, clamp, lerp, makeCanvas, particles, post, radGrad, ramp, rng, smooth } from "../../btl/core";
import { corridor, darkHall, hall, hill, lake, layer, office, playground, ruin, shack, tower, classroom } from "../../btl/envs";
import { Age, Kind, Light, Pose, person } from "../../btl/people";

export const FRAMES = 1660;

// ---------- helpers ----------
const LOOKS: Record<string, { H: number; hh: number }> = { child: { H: 640, hh: 168 }, teen: { H: 880, hh: 158 }, adult: { H: 1000, hh: 150 } };
function headOff(kind: Kind, age: Age, kneel = 0) {
  const L = kind === "dumbledore" || kind === "voldemort" ? { H: 1060, hh: 150 } : LOOKS[age];
  return L.H * (1 - kneel * 0.3) - L.hh * 1.12 + L.hh * 0.62;
}
/** Place a character so its head centre sits at (hx, hy) at scale s. */
const at = (kind: Kind, age: Age, hx: number, hy: number, s: number, kneel = 0) => ({ x: hx, y: hy + headOff(kind, age, kneel) * s, s });
/** Natural blinks: 4 frames, every 1.6-3.2 s, per-character seed. */
const blink = (f: number, seed: number) => { const r = rng(seed); let t = Math.floor(r() * 40); while (t < f + 4) { if (f >= t && f < t + 4) return true; t += 48 + Math.floor(r() * 48); } return false; };
const cool: Light = { x: 900, y: 300, r: 1700, key: "#9fb4ff", shade: "#120e22", keyA: 0.25, shadeA: 0.6 };

type Shot = { a: number; b: number; draw: (g: Ctx, f: number, l: number) => void };

// ---------- props ----------
function flower(g: Ctx, x: number, y: number, s: number, open: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = "#3f6b2a"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, 40, 0, 80); g.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const spread = lerp(0.12, 1, open);
    g.save(); g.rotate(a * spread * 0.9 + (1 - spread) * 0);
    g.beginPath(); g.ellipse(0, -38 * lerp(0.6, 1, open), 16 * lerp(0.5, 1, open), 40, 0, 0, 6.283);
    g.fillStyle = i % 2 ? "#f7d8e2" : "#fbe8ee"; g.fill(); g.strokeStyle = "#5a2a3a"; g.lineWidth = 3; g.stroke(); g.restore();
  }
  g.fillStyle = "#f2c040"; g.beginPath(); g.arc(0, 0, 10 * open + 3, 0, 6.283); g.fill();
  g.restore();
}
function wand(color = "#2a1a12") { return (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.strokeStyle = color; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 70, y - 60); g.stroke(); }; }
function doe(g: Ctx, x: number, y: number, s: number, a: number, f: number) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a; g.globalCompositeOperation = "screen";
  g.fillStyle = radGrad(g, 0, -120, 0, 520, [[0, "rgba(200,225,255,0.55)"], [1, "rgba(200,225,255,0)"]]); g.fillRect(-600, -700, 1200, 1200);
  g.beginPath(); // leaping doe silhouette
  g.moveTo(-210, -40); g.quadraticCurveTo(-120, -120, 40, -110); g.quadraticCurveTo(110, -150, 140, -230); g.quadraticCurveTo(150, -270, 185, -265);
  g.lineTo(230, -250); g.quadraticCurveTo(200, -220, 190, -190); g.quadraticCurveTo(180, -140, 150, -90);
  g.quadraticCurveTo(180, -20, 260, 40); g.lineTo(240, 60); g.quadraticCurveTo(160, 10, 110, -40);
  g.quadraticCurveTo(20, -20, -60, -30); g.quadraticCurveTo(-120, 30, -230, 70); g.lineTo(-245, 52); g.quadraticCurveTo(-170, 10, -150, -30);
  g.quadraticCurveTo(-200, -20, -240, -60); g.closePath();
  g.fillStyle = "rgba(225,240,255,0.85)"; g.shadowColor = "#cfe4ff"; g.shadowBlur = 50; g.fill();
  g.shadowBlur = 0; g.globalAlpha = a * 0.9;
  const r = rng(3); for (let i = 0; i < 50; i++) { g.fillStyle = "rgba(235,245,255,0.9)"; g.beginPath(); g.arc(-260 + r() * 520, -280 + r() * 360 + Math.sin(f * 0.1 + i) * 8, 2 + r() * 4, 0, 6.283); g.fill(); }
  g.restore();
}
function lantern(g: Ctx, x: number, y: number, s: number) { g.fillStyle = radGrad(g, x, y, 0, 60 * s, [[0, "rgba(255,210,140,0.95)"], [1, "rgba(255,170,90,0)"]]); g.fillRect(x - 70 * s, y - 70 * s, 140 * s, 140 * s); }

// ---------- grades ----------
const G = {
  dungeon: { tint: "#3a3a7a", tintAlpha: 0.35, vignette: 0.55, lift: "#0b0a12" } as Grade,
  memory: { tint: "#ffb060", tintAlpha: 0.35, vignette: 0.35, lift: "#1a120a" } as Grade,
  split: { tint: "#6a4a4a", tintAlpha: 0.2, vignette: 0.45, lift: "#0e0a0c" } as Grade,
  betrayal: { tint: "#7a2a4a", tintAlpha: 0.4, vignette: 0.55, lift: "#120810" } as Grade,
  dark: { tint: "#1f5a3a", tintAlpha: 0.3, vignette: 0.6, lift: "#040706" } as Grade,
  grief: { tint: "#4a6a9a", tintAlpha: 0.45, vignette: 0.55, lift: "#0a0e14" } as Grade,
  office: { tint: "#a07050", tintAlpha: 0.25, vignette: 0.5, lift: "#0e0a0c" } as Grade,
  silver: { tint: "#b0c8ff", tintAlpha: 0.3, vignette: 0.5, lift: "#0a0c14" } as Grade,
};

// ---------- shots ----------
export const SHOTS: Shot[] = [
  { // S1a hook — dungeon corridor, the teacher looms over the boy
    a: 0, b: 94, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 40, zoom: 1.0 } }, { f: 94, c: { x: 40, y: -20, zoom: 1.12 } }], l);
      layer(g, cam, "cor_back", 0.4, corridor.back, 6);
      layer(g, cam, "cor_walls", 0.75, corridor.walls, 2);
      const L: Light = { x: 980, y: 700, r: 1500, key: "#ffb070", shade: "#140f24", keyA: 0.3, shadeA: 0.6 };
      person(g, cam, 0.95, "harry", "child", { ...at("harry", "child", 330, 1060, 1.05), facing: 0.5, look: [0.8, -0.9], brow: 0.3, eye: 1.05, mouth: -0.3, blink: blink(l, 3), breathe: f }, L, 1);
      person(g, cam, 1.0, "snape", "adult", { ...at("snape", "adult", 740, 560, 1.45), facing: -0.6, look: [-0.8, 0.9], brow: -0.7, eye: 0.75, mouth: -0.4, lean: -3, blink: blink(l, 11), breathe: f, armL: [10, 30], armR: [-6, -10] }, L);
      post(g, f, { ...G.dungeon, glow: { x: 980, y: 700, r: 600, color: "#ff9a50", a: 0.25 } });
    } },
  { // S1b CU — cold eyes; "keeping him alive" (110) — the look holds a fraction too long
    a: 94, b: 146, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: 52, c: { x: 0, y: -30, zoom: 1.06 } }], l);
      layer(g, cam, "cor_back", 0.3, corridor.back, 14);
      const soft = ramp(f, 112, 132);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 560, 740, 4.2), facing: -0.25, look: [-0.5 + soft * 0.2, 0.5], brow: lerp(-0.8, -0.1, soft), eye: lerp(0.7, 0.9, soft), mouth: -0.4, blink: f === 128 || f === 129 }, { x: 1000, y: 600, r: 1500, key: "#ffb070", shade: "#140f24", keyA: 0.25, shadeA: 0.65 });
      post(g, f, G.dungeon);
    } },
  { // S2a memory — playground: a lonely boy behind the hedge, a girl doing something impossible
    a: 146, b: 236, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: -60, y: 0, zoom: 1.08 } }, { f: 90, c: { x: 60, y: -10, zoom: 1.14 } }], l);
      layer(g, cam, "pg_sky", 0.15, playground.sky);
      layer(g, cam, "pg_town", 0.3, playground.town, 5);
      layer(g, cam, "pg_ground", 0.6, playground.ground, 2);
      const L: Light = { x: 900, y: 500, r: 1600, key: "#ffd9a0", shade: "#4a2a30", keyA: 0.35, shadeA: 0.4 };
      person(g, cam, 0.8, "lily", "child", { ...at("lily", "child", 700, 1080, 0.85), facing: -0.2, look: [0.2, 0.6], mouth: 0.7, armR: [-70, -60], blink: blink(l, 5), breathe: f }, L, 2);
      person(g, cam, 1.05, "snape", "child", { ...at("snape", "child", 290, 1150, 1.25), facing: 0.7, look: [1, -0.1], brow: 0.4, eye: 1.1, mouth: 0, blink: blink(l, 7), breathe: f, armL: [30, 50] }, L);
      layer(g, cam, "pg_hedge", 1.25, playground.hedge, 6);
      particles(g, f, "dust", 7, 40, "rgba(255,230,170,0.8)");
      post(g, f, { ...G.memory, glow: { x: 900, y: 450, r: 700, color: "#ffd090", a: 0.4 } });
    } },
  { // S2b insert — the flower opens in her palm ("bloom" 259)
    a: 236, b: 304, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: 68, c: { x: 0, y: -20, zoom: 1.08 } }], l);
      layer(g, cam, "pg_sky", 0.1, playground.sky, 20);
      layer(g, cam, "pg_town", 0.2, playground.town, 28);
      const open = ramp(f, 246, 276);
      // her hand, palm up
      g.save(); const z = cam.zoom; g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2 + cam.y);
      g.fillStyle = "#f1d2bd"; g.strokeStyle = "#1c121c"; g.lineWidth = 6;
      g.beginPath(); g.moveTo(600, 1020); g.quadraticCurveTo(820, 1150, 1000, 1500); g.lineTo(1300, 1500); g.lineTo(1300, 1300); g.quadraticCurveTo(900, 1000, 700, 930); g.closePath(); g.fill(); g.stroke(); // forearm
      g.fillStyle = "#d9b65e"; g.beginPath(); g.moveTo(880, 1180); g.quadraticCurveTo(1000, 1300, 1060, 1500); g.lineTo(1300, 1500); g.lineTo(1300, 1150); g.quadraticCurveTo(1100, 1080, 960, 1060); g.closePath(); g.fill(); g.stroke(); // cuff
      g.fillStyle = "#f1d2bd";
      g.beginPath(); g.ellipse(540, 960, 230, 115, -0.12, 0, 6.283); g.fill(); g.stroke(); // palm
      for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(350 + i * 105, 880 - Math.abs(i - 1.5) * 18, 42, 95, 0.25 - i * 0.13, 0, 6.283); g.fill(); g.stroke(); }
      g.beginPath(); g.ellipse(700, 1010, 50, 95, -0.9, 0, 6.283); g.fill(); g.stroke(); // thumb
      g.fillStyle = radGrad(g, 540, 800, 0, 420 * (0.4 + open), [[0, `rgba(255,240,200,${0.6 * open})`], [1, "rgba(255,200,120,0)"]]); g.fillRect(0, 300, W, 1000);
      flower(g, 540, 820 - open * 30, 2.4, open);
      g.restore();
      particles(g, f, "sparks", 11, Math.round(30 * open), "rgba(255,240,190,0.9)");
      post(g, f, { ...G.memory, glow: { x: 540, y: 800, r: 500, color: "#ffe2a0", a: 0.35 * open } });
    } },
  { // S3 two-shot — "He was the one who told her she was a witch" (witch 368)
    a: 304, b: 400, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 30, y: 0, zoom: 1.1 } }, { f: 96, c: { x: -10, y: -30, zoom: 1.2 } }], l);
      layer(g, cam, "pg_sky", 0.15, playground.sky, 10);
      layer(g, cam, "pg_town", 0.3, playground.town, 12);
      layer(g, cam, "pg_tree", 0.55, playground.tree, 6);
      const L: Light = { x: 950, y: 450, r: 1500, key: "#ffd9a0", shade: "#4a2a30", keyA: 0.35, shadeA: 0.4 };
      const wow = ramp(f, 362, 378);
      person(g, cam, 1, "snape", "child", { ...at("snape", "child", 330, 760, 1.9), facing: 0.6, look: [0.9, 0], brow: 0.2, mouth: 0.3 + 0.2 * Math.sin(f * 0.6), open: f < 384 ? 0.25 + 0.25 * Math.abs(Math.sin(f * 0.7)) : 0, armR: [-40, -60], blink: blink(l, 9), breathe: f }, L);
      person(g, cam, 1, "lily", "child", { ...at("lily", "child", 770, 800, 1.85), facing: -0.5, look: [-0.9, 0.05], brow: 0.2 + wow * 0.5, eye: 1 + wow * 0.2, mouth: 0.3 + wow * 0.6, open: wow * 0.5, blink: blink(l, 13), breathe: f }, L);
      particles(g, f, "dust", 8, 30, "rgba(255,230,170,0.8)");
      post(g, f, { ...G.memory, glow: { x: 950, y: 420, r: 700, color: "#ffd090", a: 0.35 } });
    } },
  { // S4 sorted apart — warm red left, cold green right; they drift; "Dark Arts" (497) darkens his side
    a: 400, b: 534, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: -40, zoom: 1.25 } }, { f: 134, c: { x: 0, y: 0, zoom: 1.0 } }], l);
      layer(g, cam, "hall_back", 0.4, hall.back, 4);
      layer(g, cam, "hall_candles", 0.25, hall.candles, 3);
      const apart = ramp(f, 425, 500), dark = ramp(f, 490, 515);
      person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", lerp(470, 280, apart), 900, 0.95), facing: -0.6 * apart + 0.4 * (1 - apart), look: [lerp(0.8, 0.6, apart), 0], brow: 0.3 * apart, mouth: lerp(0.5, 0, apart), blink: blink(l, 15), breathe: f }, { x: 0, y: 600, r: 1600, key: "#ffb070", shade: "#2a1018", keyA: 0.4, shadeA: 0.5 });
      person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", lerp(610, 800, apart), 900, 0.95), facing: lerp(-0.5, 0.4, apart), look: [lerp(-0.8, -0.5, apart), 0.2], brow: lerp(0, -0.6, dark), mouth: -0.2, blink: blink(l, 17), breathe: f }, { x: 1080, y: 600, r: 1600, key: "#70e0a0", shade: "#04140e", keyA: 0.35, shadeA: 0.5 + dark * 0.3 });
      // the green side swallows him
      g.save(); g.globalCompositeOperation = "multiply"; g.fillStyle = `rgba(20,60,40,${dark * 0.6})`; g.fillRect(W * 0.55, 0, W * 0.45, H); g.restore();
      post(g, f, G.split);
    } },
  { // S5a lake — humiliated, on his knees; she steps toward him
    a: 534, b: 604, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 40, y: 0, zoom: 1.05 } }, { f: 70, c: { x: 80, y: -10, zoom: 1.15 } }], l);
      layer(g, cam, "lake_sky", 0.1, lake.sky);
      layer(g, cam, "lake_far", 0.3, lake.far, 4);
      layer(g, cam, "lake_ground", 0.6, lake.ground, 2);
      const L: Light = { x: 1050, y: 900, r: 1500, key: "#ff8a70", shade: "#1a0818", keyA: 0.45, shadeA: 0.6 };
      for (const [bx, sd] of [[180, 21], [330, 22], [930, 23]]) person(g, cam, 0.5, "bully", "teen", { ...at("bully", "teen", bx, 760, 0.55), facing: 0.3, mouth: 0.9, open: 0.4 + 0.3 * Math.abs(Math.sin(f * 0.4 + bx)), eye: 0.6, breathe: f + bx }, L, 6);
      person(g, cam, 0.9, "lily", "teen", { ...at("lily", "teen", 300, 820, 1.05), facing: 0.5, look: [0.8, 0.6], brow: 0.5, mouth: -0.2, armR: [-50, -30], blink: blink(l, 19), breathe: f }, L);
      person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 720, 1060, 1.15, 1), kneel: 1, facing: -0.3, look: [-0.3, 0.8], brow: -0.4, eye: 0.7, mouth: -0.6, lean: 10, blink: blink(l, 25), breathe: f * 2, armL: [20, 20], armR: [-30, -10] }, L);
      post(g, f, G.betrayal);
    } },
  { // S5b CU — "he called her the one word" (word 618): shame turns into a snarl
    a: 604, b: 640, draw: (g, f, l) => {
      const cam = { x: 0, y: -10 * smooth(l / 36), zoom: 1 + 0.06 * smooth(l / 36), roll: -3 };
      layer(g, cam, "lake_sky", 0.1, lake.sky, 18);
      layer(g, cam, "lake_far", 0.2, lake.far, 18);
      const sn = ramp(f, 606, 618);
      person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 560, 760, 4.0), facing: -0.3, look: [-0.7, -0.1], brow: lerp(-0.3, -1, sn), eye: lerp(0.8, 1.05, sn), mouth: -0.9, open: sn * 0.6 * (f < 632 ? 1 : 0.3) }, { x: 1050, y: 800, r: 1400, key: "#ff7060", shade: "#1a0818", keyA: 0.45, shadeA: 0.65 });
      post(g, f, G.betrayal);
    } },
  { // S5c CU — her face as it lands ("never take back" 642)
    a: 640, b: 674, draw: (g, f, l) => {
      const cam = { x: 0, y: 0, zoom: 1 + 0.05 * smooth(l / 34) };
      layer(g, cam, "lake_sky", 0.1, lake.sky, 18);
      layer(g, cam, "lake_far", 0.2, lake.far, 18);
      const hurt = ramp(f, 640, 656);
      person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", 520, 760, 4.0), facing: 0.3, look: [0.6, 0.3], brow: lerp(0.3, 1, hurt), eye: lerp(1.1, 0.85, hurt), mouth: -0.5, open: 0.15, tear: hurt * 0.6 }, { x: 0, y: 800, r: 1400, key: "#ff9a80", shade: "#1a0818", keyA: 0.35, shadeA: 0.55 });
      post(g, f, G.betrayal);
    } },
  { // S6a "She walked away." — her back, receding
    a: 674, b: 704, draw: (g, f, l) => {
      const cam = { x: 0, y: 0, zoom: 1.0 + 0.03 * l / 30 };
      layer(g, cam, "lake_sky", 0.1, lake.sky);
      layer(g, cam, "lake_far", 0.3, lake.far, 3);
      layer(g, cam, "lake_ground", 0.6, lake.ground, 1);
      const t = smooth(l / 30), L: Light = { x: 1050, y: 900, r: 1500, key: "#ff8a70", shade: "#1a0818", keyA: 0.4, shadeA: 0.6 };
      person(g, cam, 0.8, "lily", "teen", { x: lerp(560, 620, t), y: lerp(1400, 1180, t), s: lerp(0.95, 0.6, t), back: true, breathe: f }, L, 1);
      person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 200, 1300, 1.0, 1), kneel: 1, facing: 0.5, look: [0.9, -0.5], brow: 0.8, eye: 0.9, mouth: -0.5, lean: 6, breathe: f }, L, 3);
      post(g, f, G.betrayal);
    } },
  { // S6b "He chose Voldemort." — kneeling before the hooded figure
    a: 704, b: 742, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 40, zoom: 1.12 } }, { f: 38, c: { x: 0, y: 0, zoom: 1.0 } }], l);
      layer(g, cam, "dark_back", 0.4, darkHall.back, 3);
      const L: Light = { x: 540, y: 0, r: 1900, key: "#80ffb0", shade: "#000000", keyA: 0.3, shadeA: 0.75 };
      person(g, cam, 0.85, "voldemort", "adult", { ...at("voldemort", "adult", 600, 640, 1.2), facing: -0.2, look: [-0.3, 0.8], blink: blink(l, 29), breathe: f, armR: [-25, -30] }, L, 1);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 380, 1200, 1.2, 1), kneel: 1, facing: 0.6, back: false, look: [0.6, -0.8], brow: -0.2, eye: 0.8, mouth: -0.3, lean: 14, breathe: f }, L);
      post(g, f, G.dark);
    } },
  { // S7a he carries the prophecy (758) — whispering up to his master
    a: 742, b: 826, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: -40, y: 0, zoom: 1.2 } }, { f: 84, c: { x: -80, y: -20, zoom: 1.32 } }], l);
      layer(g, cam, "dark_back", 0.4, darkHall.back, 6);
      const L: Light = { x: 540, y: 0, r: 1900, key: "#80ffb0", shade: "#000000", keyA: 0.3, shadeA: 0.75 };
      person(g, cam, 0.9, "voldemort", "adult", { ...at("voldemort", "adult", 720, 700, 1.3), facing: -0.5, look: [-0.6, 0.6], breathe: f, armR: [-40, -60] }, L, 2);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 1000, 1.4, 1), kneel: 1, facing: 0.7, look: [0.8, -0.6], brow: -0.1, eye: 0.85, mouth: 0, open: 0.15 + 0.15 * Math.abs(Math.sin(f * 0.5)), lean: 12, blink: blink(l, 31), breathe: f }, L);
      post(g, f, G.dark);
    } },
  { // S7b CU — "who it pointed to. Lily's son." (848): the realisation
    a: 826, b: 880, draw: (g, f, l) => {
      const cam = { x: 0, y: -20 * smooth(l / 54), zoom: 1 + 0.12 * smooth(l / 54) };
      layer(g, cam, "dark_back", 0.3, darkHall.back, 16);
      const r = ramp(f, 836, 852);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 760, 4.3), facing: 0.15, look: [lerp(0.4, 0, r), lerp(-0.4, 0.1, r)], brow: lerp(-0.2, 0.9, r), eye: lerp(0.85, 1.25, r), mouth: -0.4, open: r * 0.35, blink: f === 832 }, { x: 540, y: 0, r: 1700, key: "#a0ffd0", shade: "#000000", keyA: 0.35, shadeA: 0.7 });
      post(g, f, G.dark);
    } },
  { // S8a hilltop — he begs Dumbledore (937) to hide her
    a: 880, b: 970, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: 90, c: { x: 30, y: -30, zoom: 1.12 } }], l);
      layer(g, cam, "hill_sky", 0.1, hill.sky);
      layer(g, cam, "hill_ground", 0.6, hill.ground, 1);
      const L: Light = { x: 270, y: 340, r: 1800, key: "#c8d4ff", shade: "#05070e", keyA: 0.3, shadeA: 0.6 };
      person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 760, 720, 1.0), facing: -0.4, look: [-0.7, 0.8], brow: 0.1, mouth: -0.1, blink: blink(l, 33), breathe: f, armR: [-10, -20] }, L, 1);
      const beg = ramp(f, 930, 950);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 350, 1120, 1.2, 1), kneel: 1, facing: 0.6, look: [0.8, -0.9], brow: 0.9, eye: 1.0, mouth: -0.5, open: 0.3, lean: 6 - beg * 6, armL: [lerp(20, 120, beg), lerp(10, 40, beg)], armR: [lerp(-20, 150, beg), lerp(-10, 30, beg)], blink: blink(l, 35), breathe: f * 1.6 }, L);
      particles(g, f, "rain", 41, 60, "rgba(190,205,240,0.5)", 0.8);
      post(g, f, G.grief);
    } },
  { // S8b "It wasn't enough." — the ruined house; he holds her
    a: 970, b: 1012, draw: (g, f, l) => {
      const cam = { x: 0, y: 0, zoom: 1.0 + 0.04 * smooth(l / 42) };
      layer(g, cam, "ruin_back", 0.5, ruin.back, 2);
      const L: Light = { x: 700, y: 300, r: 1600, key: "#b8c8ff", shade: "#06080e", keyA: 0.25, shadeA: 0.6 };
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 330, 640, 1.2, 1), kneel: 1, facing: 0.5, look: [0.4, 1], brow: 1, eye: 0.6, mouth: -0.7, open: 0.25, tear: 1, lean: 14, armL: [50, 40], armR: [25, 60], breathe: f * 2 }, L);
      person(g, cam, 1, "lily", "adult", { x: 1250, y: 1130, s: 0.85, rot: -84, armL: [0, 0], armR: [0, 0], facing: 0, eye: 0, brow: 0.1, mouth: 0.05 }, { ...L, keyA: 0.35 });
      layer(g, cam, "ruin_rubble", 1.2, ruin.rubble, 8);
      particles(g, f, "rain", 43, 70, "rgba(190,205,240,0.45)", 0.9);
      post(g, f, G.grief);
    } },
  { // S9 the promise (1023) — "Protect the boy with her eyes" (1066): green catches his face
    a: 1012, b: 1100, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 60, y: 0, zoom: 1.05 } }, { f: 88, c: { x: -60, y: -40, zoom: 1.3 } }], l);
      layer(g, cam, "off_back", 0.45, office.back, 5);
      layer(g, cam, "off_desk", 0.75, office.desk, 2);
      const L: Light = { x: 900, y: 1100, r: 1500, key: "#ffc890", shade: "#120c18", keyA: 0.35, shadeA: 0.55 };
      person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 820, 760, 0.95), facing: -0.6, look: [-0.8, 0.1], brow: 0.4, mouth: -0.1, open: f > 1050 && f < 1084 ? 0.15 * Math.abs(Math.sin(f * 0.6)) : 0, blink: blink(l, 37), breathe: f }, L, 2);
      const green = ramp(f, 1062, 1080);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 330, 820, 1.25), facing: 0.6, look: [0.6, 0.2 + green * 0.3], brow: lerp(0.6, 0.9, green), eye: 0.85, mouth: -0.4, blink: blink(l, 39), breathe: f }, { ...L, key: green > 0 ? "#60ffa0" : L.key, keyA: 0.35 + green * 0.1 });
      post(g, f, { ...G.office, glow: { x: 330, y: 650, r: 420, color: "#40e080", a: 0.25 * green } });
    } },
  { // S10a "That didn't make him kind." (1121) — potions dungeon, he looms over the desks
    a: 1100, b: 1176, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 30, zoom: 1.0 } }, { f: 76, c: { x: 20, y: 0, zoom: 1.1 } }], l);
      layer(g, cam, "cls_back", 0.45, classroom.back, 4);
      const L: Light = { x: 100, y: 200, r: 1800, key: "#c0e0c8", shade: "#0a0c0c", keyA: 0.25, shadeA: 0.6 };
      person(g, cam, 0.9, "harry", "teen", { ...at("harry", "teen", 260, 1100, 0.8), facing: 0.5, look: [0.8, -0.8], brow: -0.6, mouth: -0.4, blink: blink(l, 41), breathe: f }, L, 1);
      person(g, cam, 0.9, "neville", "teen", { ...at("neville", "teen", 520, 1120, 0.8), facing: 0.4, look: [0.7, -0.9], brow: 0.9, eye: 1.1, mouth: -0.5, blink: blink(l, 43), breathe: f * 1.5 }, L, 1);
      layer(g, cam, "cls_desks", 0.95, classroom.desks, 0);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 820, 640, 1.35), facing: -0.7, look: [-0.8, 0.9], brow: -0.9, eye: 0.7, mouth: -0.6, lean: -8, armL: [60, 40], armR: [-10, -20], blink: blink(l, 45), breathe: f }, L);
      particles(g, f, "dust", 47, 30, "rgba(170,230,180,0.5)");
      post(g, f, G.dungeon);
    } },
  { // S10b CU Neville — "cruel to Neville" (1183)
    a: 1176, b: 1214, draw: (g, f, l) => {
      const cam = { x: 0, y: 0, zoom: 1 + 0.05 * smooth(l / 38) };
      layer(g, cam, "cls_back", 0.3, classroom.back, 16);
      person(g, cam, 1, "neville", "teen", { ...at("neville", "teen", 540, 760, 3.8), facing: 0.2, look: [0.4, -0.9], brow: 1, eye: 1.15, mouth: -0.6, open: 0.15, tear: 0.4, blink: blink(l, 49) }, { x: 100, y: 200, r: 1700, key: "#c0e0c8", shade: "#0a0c0c", keyA: 0.25, shadeA: 0.6 });
      post(g, f, G.dungeon);
    } },
  { // S10c low-angle CU Snape — "kids who couldn't fight back" (1226)
    a: 1214, b: 1258, draw: (g, f, l) => {
      const cam = { x: 0, y: 0, zoom: 1.0 + 0.06 * smooth(l / 44), roll: 4 };
      layer(g, cam, "cls_back", 0.3, classroom.back, 16);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 700, 3.6), facing: -0.2, look: [-0.2, 0.9], brow: -1, eye: 0.7, mouth: -0.7, blink: blink(l, 51) }, { x: 100, y: 1600, r: 1800, key: "#c0e0c8", shade: "#05060a", keyA: 0.3, shadeA: 0.7 });
      post(g, f, G.dungeon);
    } },
  { // S11 "But he kept that promise." — alone at the tower window, watching a small lantern cross the grounds
    a: 1258, b: 1312, draw: (g, f, l) => {
      const cam = { x: 0, y: 0, zoom: 1.0 + 0.05 * smooth(l / 54) };
      layer(g, cam, "tow_view", 0.2, tower.view, 3);
      lantern(g, lerp(380, 520, l / 54), 1170, 0.6);
      layer(g, cam, "tow_frame", 0.6, tower.frame, 0);
      person(g, cam, 1, "snape", "adult", { x: 560, y: 2150, s: 1.6, back: true, breathe: f }, { x: 540, y: 800, r: 1500, key: "#8090c0", shade: "#05060a", keyA: 0.3, shadeA: 0.6 });
      post(g, f, G.grief);
    } },
  { // S12a the doe — "after all this time" (1384) ... "one word" (1416)
    a: 1312, b: 1430, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: 118, c: { x: -50, y: -40, zoom: 1.18 } }], l);
      layer(g, cam, "off_back", 0.45, office.back, 6);
      const d = ramp(f, 1330, 1370);
      const L: Light = { x: 560, y: 760, r: 1500, key: "#d8e8ff", shade: "#0a0c18", keyA: 0.2 + 0.3 * d, shadeA: 0.6 };
      person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 860, 700, 0.95), facing: -0.6, look: [-0.8, 0.2], brow: 0.6 * d, eye: 1, mouth: -0.1, open: f > 1380 && f < 1400 ? 0.2 : 0, tear: d * 0.5, blink: blink(l, 53), breathe: f }, L, 2);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 290, 820, 1.25), facing: 0.5, look: [0.5, -0.4], brow: 0.7, eye: 0.85, mouth: -0.3, armR: [-100, -30], prop: wand(), blink: blink(l, 55), breathe: f }, L);
      withDoe(g, cam, f, d);
      post(g, f, { ...G.silver, glow: { x: 560, y: 760, r: 700, color: "#d0e4ff", a: 0.35 * d } });
    } },
  { // S12b CU — "Always." (1435)
    a: 1430, b: 1478, draw: (g, f, l) => {
      const cam = { x: 0, y: -10 * smooth(l / 48), zoom: 1 + 0.05 * smooth(l / 48) };
      layer(g, cam, "off_back", 0.3, office.back, 18);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 520, 760, 4.2), facing: 0.25, look: [0.3, -0.1], brow: 0.9, eye: 0.8, mouth: -0.3, open: f >= 1434 && f < 1452 ? 0.18 : 0, tear: ramp(f, 1440, 1470) }, { x: 900, y: 700, r: 1400, key: "#e0ecff", shade: "#0a0c18", keyA: 0.45, shadeA: 0.55 });
      post(g, f, { ...G.silver, glow: { x: 900, y: 700, r: 700, color: "#d0e4ff", a: 0.3 } });
    } },
  { // S13a the shack — "Dying, he asked Harry for one last thing"
    a: 1478, b: 1526, draw: (g, f, l) => {
      const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: 48, c: { x: 30, y: -20, zoom: 1.1 } }], l);
      layer(g, cam, "shk_back", 0.5, shack.back, 3);
      const L: Light = { x: 760, y: 450, r: 1700, key: "#c0d0e8", shade: "#08060a", keyA: 0.3, shadeA: 0.65 };
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 1080, 1.25, 1), kneel: 1, facing: 0.4, look: [0.9, -0.2], brow: 0.8, eye: 0.6, mouth: -0.3, open: 0.15, lean: -5, armL: [10, 20], armR: [-40, -60], breathe: f * 2.2 }, L);
      person(g, cam, 0.95, "harry", "teen", { ...at("harry", "teen", 790, 1060, 1.1, 1), kneel: 1, facing: -0.6, look: [-0.9, 0.2], brow: 0.8, eye: 1.05, mouth: -0.4, lean: -10, armL: [70, 40], blink: blink(l, 57), breathe: f * 1.5 }, L);
      particles(g, f, "dust", 59, 40, "rgba(220,225,235,0.6)");
      post(g, f, G.grief);
    } },
  { // S13b ECU Harry's eyes — "Look at me." (1529)
    a: 1526, b: 1568, draw: (g, f, l) => {
      const cam = { x: 0, y: 0, zoom: 1 + 0.04 * smooth(l / 42) };
      layer(g, cam, "shk_back", 0.3, shack.back, 20);
      person(g, cam, 1, "harry", "teen", { ...at("harry", "teen", 540, 860, 6.5), facing: -0.1, look: [-0.1, 0.3], brow: 0.7, eye: 1.1, mouth: -0.3, blink: false }, { x: 760, y: 450, r: 1700, key: "#c0d0e8", shade: "#08060a", keyA: 0.35, shadeA: 0.5 });
      post(g, f, { ...G.grief, glow: { x: 540, y: 960, r: 500, color: "#40e080", a: 0.12 } });
    } },
  { // S14 payoff — his eyes find hers; the memory warms, then darkness ("her eyes" 1614)
    a: 1568, b: FRAMES, draw: (g, f, l) => {
      const cam = { x: 0, y: -20 * smooth(l / 60), zoom: 1 + 0.08 * smooth(l / 92) };
      const close = ramp(f, 1590, 1640);
      layer(g, cam, "shk_back", 0.3, shack.back, 20);
      person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 760, 4.2), facing: 0.1, look: [0, -0.3], brow: lerp(0.8, 0.2, close), eye: lerp(0.8, 0.0, close), mouth: lerp(-0.3, 0.15, close), tear: 1 }, { x: 540, y: 300, r: 1600, key: lerp(0, 1, close) > 0.5 ? "#ffd090" : "#c0d0e8", shade: "#08060a", keyA: 0.3 + close * 0.15, shadeA: 0.55 });
      post(g, f, { ...G.grief, tintAlpha: lerp(0.45, 0.1, close) });
      // memory: young Lily's eyes, in the warm light of the playground
      const mem = ramp(f, 1598, 1622);
      if (mem > 0) {
        const [c, m] = memCanvas();
        m.clearRect(0, 0, W, H);
        layer(m, { x: 0, y: 0, zoom: 1 }, "pg_sky", 0.1, playground.sky, 24);
        person(m, { x: 0, y: 0, zoom: 1 + 0.03 * smooth(l / 92) }, 1, "lily", "child", { ...at("lily", "child", 540, 800, 5.2), facing: 0, look: [0, 0], brow: 0.2, eye: 1, mouth: 0.6 }, { x: 900, y: 500, r: 1500, key: "#ffd9a0", shade: "#4a2a30", keyA: 0.35, shadeA: 0.35 });
        post(m, f, { ...G.memory, glow: { x: 900, y: 450, r: 800, color: "#ffd090", a: 0.4 } });
        g.save(); g.globalAlpha = mem; g.drawImage(c, 0, 0); g.restore();
      }
      const out = ramp(f, 1638, 1656);
      if (out > 0) { g.fillStyle = `rgba(0,0,0,${out})`; g.fillRect(0, 0, W, H); }
    } },
];

let mem: [HTMLCanvasElement, Ctx] | null = null;
const memCanvas = () => (mem ??= makeCanvas(W, H));

function withDoe(g: Ctx, cam: Cam, f: number, d: number) {
  if (d <= 0) return;
  g.save();
  const z = cam.zoom; g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2 - cam.x, -H / 2 - cam.y);
  doe(g, lerp(520, 600, d) + Math.sin(f * 0.05) * 10, 760 + Math.sin(f * 0.07) * 12, 1.05, clamp(d), f);
  g.restore();
}

export function drawEpisode(g: Ctx, f: number) {
  const s = SHOTS.find((x) => f >= x.a && f < x.b) ?? SHOTS[SHOTS.length - 1];
  s.draw(g, f, f - s.a);
}
