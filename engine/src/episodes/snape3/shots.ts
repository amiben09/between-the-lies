// "Always" v3 — MANDATORY ORDER: 1 hook · 2 world · 3 world rules · 4 characters · 5 main drama · 6 final revelation.
// Every world-building sentence has its own scene (see story/episodes/snape-always/shot-plan-v3.md). All timing from the voice.
import { Ctx, H, K, W, camAt, glide, lerp, linGrad, particles, post, radGrad, ramp } from "../../btl/core";
import { castle, classroom, corridor, darkHall, fg, hill, lake, layer, office, officeNight, playground, shack, sortHall, wedding } from "../../btl/envs";
import { Kind, Light, person } from "../../btl/people";
import { G, L_CLS, L_DARK, L_DUN, L_HILL, L_LAKE, L_MEM, L_OFF, L_SHK, at, blink, dissolve, doe, flower, holdFlower, sortingHat, talk, vignetteDark, wand } from "../../btl/kit";
import WORDS from "./words.json";
import LINES from "./lines.json";

type Wd = { w: string; s: number; e: number; line: number };
const WD = (WORDS as { words: Wd[] }).words;
const LN = LINES as { line: number; s: number; e: number }[];
const fr = (t: number) => Math.round(t * 30);
const norm = (x: string) => x.toLowerCase().replace(/[^a-z']/g, "");
const wf = (li: number, word: string, n = 0) => { const m = WD.filter((w) => w.line === li && norm(w.w) === norm(word)); if (!m[n]) throw new Error(`word ${word} not in line ${li}`); return fr(m[n].s); };
const we = (li: number, word: string, n = 0) => { const m = WD.filter((w) => w.line === li && norm(w.w) === norm(word)); return fr(m[n].e); };
const ls = (li: number) => fr(LN[li].s), le = (li: number) => fr(LN[li].e);
export const LAST_WORD = fr(WD[WD.length - 1].e);
export const FRAMES = LAST_WORD + 123; // 4.1 s payoff after the final word (≥ 4 s rule, ≤ 75 s total)

type Shot = { a: number; b: number; draw: (g: Ctx, f: number, l: number, n: number) => void };
const S: Shot[] = [];
const add = (a: number, b: number, draw: Shot["draw"]) => S.push({ a, b, draw });
const ROBE = { coat: "#1d1a22", coatHi: "#343040", robe: true };
const RED = "#a8322b", GREEN = "#2f6b48";
const Lr: Light = { x: 0, y: 600, r: 1600, key: "#ffb070", shade: "#2a1018", keyA: 0.4, shadeA: 0.5 };
const Lg: Light = { x: 1080, y: 600, r: 1600, key: "#70e0a0", shade: "#04140e", keyA: 0.35, shadeA: 0.5 };

// ===================== 1 · EMOTIONAL HOOK =====================
// "First, he hurt the love of his life." — her face as the word lands (betrayal palette)
const h1 = wf(0, "then") - 3;
add(0, h1, (g, f, l, n) => {
  const cam = { x: 0, y: 0, zoom: 1.04 + 0.08 * glide(l / n) };
  layer(g, cam, "lake_sky", 0.1, lake.sky, 18);
  layer(g, cam, "lake_far", 0.2, lake.far, 18);
  const hurt = ramp(f, wf(0, "hurt") - 2, wf(0, "hurt") + 12);
  person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", 520, 760, 4.0), facing: 0.3, look: [lerp(0.6, 0.2, hurt), lerp(0.2, 0.5, hurt)], brow: lerp(0, 1, hurt), eye: lerp(1.1, 0.85, hurt), mouth: -0.4, open: 0.1, tear: hurt * 0.8, tilt: -hurt * 4, breathe: f }, { x: 0, y: 800, r: 1400, key: "#ff9a80", shade: "#1a0818", keyA: 0.35, shadeA: 0.55 });
  post(g, f, G.betrayal);
});
// "Then he spent the rest of his life protecting her son." — the dark teacher steps in and stands over the boy
add(h1, ls(1) - 2, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 140, y: 30, zoom: 1.06 } }, { f: n, c: { x: -60, y: -40, zoom: 1.24 } }], l);
  layer(g, cam, "cor_back", 0.4, corridor.back, 6);
  layer(g, cam, "cor_walls", 0.7, corridor.walls, 2);
  const arrive = ramp(f, h1, h1 + 32), flinch = ramp(f, h1 + 28, h1 + 36);
  person(g, cam, 0.95, "harry", "child", { ...at("harry", "child", 330 - flinch * 12, 1060, 1.05), facing: 0.5, look: [K(l, [[0, -0.3], [26, 0.8]]), K(l, [[0, 0.2], [30, -0.9]])], brow: lerp(0, 0.5, flinch), eye: 1 + flinch * 0.15, mouth: -0.3, shoulders: -flinch * 0.8, tremble: flinch * 0.3, blink: blink(l, 3), breathe: f * 1.4, handL: "fist", handR: "fist" }, L_DUN, 1);
  person(g, cam, 1.0, "snape", "adult", { ...at("snape", "adult", lerp(1250, 740, arrive), 560, 1.45), walk: arrive < 1 ? f * 0.32 : undefined, facing: -0.6, look: [-0.8, K(l, [[16, 0], [36, 0.9]])], brow: -0.7, eye: 0.75, mouth: -0.4, lean: K(l, [[30, -3], [n, -7]]), tilt: K(l, [[34, 0], [n, -5]]), blink: blink(l, 11), breathe: f, armL: [10, 30], handR: "fist" }, L_DUN);
  layer(g, cam, "fg_pillar", 1.35, fg.pillar, 10);
  post(g, f, { ...G.dungeon, glow: { x: 980, y: 700, r: 600, color: "#ff9a50", a: 0.25 } });
});

// ===================== 2 · WORLD =====================
// "Severus Snape was born a wizard. Young wizards train at a hidden castle school called Hogwarts."
const w1 = wf(1, "young") - 3;
add(ls(1) - 2, w1, (g, f, l, n) => { // a boy's open palm; a spark of magic answers him (he is a wizard)
  const cam = { x: 0, y: -20 * glide(l / n), zoom: 1.02 + 0.08 * glide(l / n) };
  layer(g, cam, "home_bg", 0.2, castle.sky, 16);
  const spark = ramp(f, wf(1, "wizard") - 8, wf(1, "wizard") + 6);
  person(g, cam, 1, "snape", "child", { ...at("snape", "child", 540, 700, 3.4), facing: 0.1, look: [0.1, 0.9], brow: 0.3, eye: lerp(0.9, 1.15, spark), mouth: lerp(0, 0.3, spark), armR: [-30, -110], handR: "open", breathe: f, blink: blink(l, 5) }, { x: 540, y: 1500, r: 1400, key: "#9fc0ff", shade: "#0a0c18", keyA: 0.3 + spark * 0.2, shadeA: 0.5 });
  g.save(); g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 640, 1180, 0, 170 * (0.3 + spark), [[0, `rgba(170,210,255,${0.45 * spark})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore();
  particles(g, f, "sparks", 131, Math.round(30 * spark), "rgba(190,220,255,0.9)");
  post(g, f, G.silver);
});
add(w1, ls(2) - 2, (g, f, l, n) => { // establishing: the hidden castle across the black lake — crane down from the sky
  const cam = camAt([{ f: 0, c: { x: 40, y: -260, zoom: 1.12 } }, { f: n, c: { x: -40, y: 20, zoom: 1.0 } }], l);
  layer(g, cam, "cas_sky", 0.1, castle.sky);
  layer(g, cam, "cas_hills", 0.25, castle.hills, 3);
  layer(g, cam, "cas_castle", 0.4, castle.castle, 1);
  layer(g, cam, "cas_lake", 0.55, castle.lake, 1);
  layer(g, cam, "cas_shore", 1.2, castle.shore, 4);
  particles(g, f, "dust", 133, 30, "rgba(255,220,160,0.6)");
  post(g, f, { tint: "#3a4a8a", tintAlpha: 0.3, vignette: 0.5, lift: "#06080f", glow: { x: 540, y: 820, r: 700, color: "#ffc070", a: 0.15 } });
});

// ===================== 3 · WORLD RULES =====================
// "There, a magic hat sorts students into houses by who they are inside."
add(ls(2) - 2, ls(3) - 2, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 0, y: -120, zoom: 1.0 } }, { f: n, c: { x: 0, y: 40, zoom: 1.35 } }], l);
  layer(g, cam, "sh_back", 0.4, sortHall.back, 5);
  layer(g, cam, "sh_candles", 0.25, sortHall.candles, 3);
  const onHead = ramp(f, wf(2, "students") - 6, wf(2, "students") + 8);
  const inside = ramp(f, wf(2, "inside") - 8, wf(2, "inside") + 4);
  const kid = at("bully", "child", 540, 900, 1.25);
  person(g, cam, 1, "bully", "child", { ...kid, ...ROBE, trim: null, facing: 0, look: [0, -0.9], brow: 0.5, eye: 1.1 + inside * 0.1, mouth: -0.2, open: inside * 0.2, breathe: f, blink: blink(l, 7) }, { x: 540, y: 300, r: 1400, key: "#ffd9a0", shade: "#1a1018", keyA: 0.35, shadeA: 0.5 });
  g.save(); g.translate(W / 2, H / 2); g.scale(cam.zoom, cam.zoom); g.translate(-W / 2 - cam.x, -H / 2 - cam.y);
  const hy = lerp(560, 760, onHead);
  if (inside > 0) { g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 540, 900, 0, 260, [[0, `rgba(255,230,170,${0.45 * inside})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 500, W, 900); g.globalCompositeOperation = "source-over"; }
  sortingHat(g, 540, hy, lerp(0.9, 1.05, onHead), talk(f, ls(2), le(2), 0.6), f);
  g.restore();
  post(g, f, G.split);
});
// "Gryffindor takes the brave. Slytherin takes the ambitious. The two houses are enemies."
add(ls(3) - 2, ls(4) - 2, (g, f, l, n) => { // pan from the lion side to the snake side, then pull back: two rows glaring
  const gs = wf(3, "slytherin") - ls(3), en = wf(3, "two") - ls(3);
  const cam = camAt([{ f: 0, c: { x: -260, y: 0, zoom: 1.25 } }, { f: gs - 6, c: { x: -240, y: 0, zoom: 1.28 } }, { f: gs + 8, c: { x: 250, y: 0, zoom: 1.28 } }, { f: en - 4, c: { x: 260, y: 0, zoom: 1.26 } }, { f: n, c: { x: 0, y: 20, zoom: 1.0 } }], l);
  layer(g, cam, "sh_back", 0.55, sortHall.back, 3);
  layer(g, cam, "sh_candles", 0.35, sortHall.candles, 2);
  const glare = ramp(f, wf(3, "enemies") - 10, wf(3, "enemies") + 6);
  const kinds: Kind[] = ["bully", "james", "bully", "neville"];
  for (let i = 0; i < 4; i++) {
    person(g, cam, 1, kinds[i], "teen", { ...at(kinds[i], "teen", 120 + i * 95, 960 + (i % 2) * 40, 0.75), ...ROBE, trim: RED, facing: 0.6, look: [0.9, 0], brow: -0.7 * glare, mouth: lerp(0.4, -0.3, glare), lean: -glare * 4, breathe: f + i * 9, blink: blink(l, 40 + i) }, Lr, 1);
    person(g, cam, 1, "bully", "teen", { ...at("bully", "teen", 960 - i * 95, 960 + ((i + 1) % 2) * 40, 0.75), ...ROBE, trim: GREEN, facing: -0.6, look: [-0.9, 0], brow: -0.7 * glare, mouth: lerp(0.2, 0.3, glare), lean: glare * 4, breathe: f + i * 7, blink: blink(l, 50 + i) }, Lg, 1);
  }
  post(g, f, G.split);
});

// ===================== 4 · CHARACTERS =====================
// "As a lonely boy, Severus met Lily, a girl who made flowers bloom in her hand."
const c4 = wf(4, "flowers") - 6;
add(ls(4) - 2, c4, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: -160, y: 0, zoom: 1.12 } }, { f: n, c: { x: 90, y: -10, zoom: 1.18 } }], l);
  layer(g, cam, "pg_sky", 0.15, playground.sky);
  layer(g, cam, "pg_town", 0.3, playground.town, 5);
  layer(g, cam, "pg_ground", 0.6, playground.ground, 2);
  const awe = ramp(f, wf(4, "lily") - 6, wf(4, "lily") + 14);
  person(g, cam, 0.8, "lily", "child", { ...at("lily", "child", 700, 1080, 0.85), facing: -0.2, look: [0.2, 0.6], mouth: 0.7, armR: [-70, -60], handR: "open", prop: holdFlower(0.3), blink: blink(l, 5), breathe: f }, L_MEM, 2);
  person(g, cam, 1.05, "snape", "child", { ...at("snape", "child", 290, 1150, 1.25), facing: 0.7, look: [1, lerp(0.4, -0.1, awe)], nod: lerp(0.15, 0, awe), shoulders: lerp(0.5, 0, awe), brow: lerp(0.8, 0.3, awe), eye: lerp(0.8, 1.15, awe), mouth: lerp(-0.2, 0.2, awe), open: awe * 0.15, blink: blink(l, 7), breathe: f, armL: [30, 50], handL: "grip" }, L_MEM);
  layer(g, cam, "pg_hedge", 1.35, playground.hedge, 8);
  particles(g, f, "dust", 7, 40, "rgba(255,230,170,0.8)");
  post(g, f, { ...G.memory, glow: { x: 900, y: 450, r: 700, color: "#ffd090", a: 0.4 } });
});
add(c4, ls(5) - 2, (g, f, l, n) => { // insert: the flower opens in her palm
  const cam = { x: 0, y: -20 * glide(l / n), zoom: 1 + 0.08 * glide(l / n) };
  layer(g, cam, "pg_sky", 0.1, playground.sky, 20);
  layer(g, cam, "pg_town", 0.2, playground.town, 28);
  const open = ramp(f, wf(4, "bloom") - 6, we(4, "hand") + 4);
  g.save(); g.translate(W / 2, H / 2); g.scale(cam.zoom, cam.zoom); g.translate(-W / 2, -H / 2 + cam.y);
  g.fillStyle = "#f1d2bd"; g.strokeStyle = "#1c121c"; g.lineWidth = 6;
  g.beginPath(); g.moveTo(600, 1020); g.quadraticCurveTo(820, 1150, 1000, 1500); g.lineTo(1300, 1500); g.lineTo(1300, 1300); g.quadraticCurveTo(900, 1000, 700, 930); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#d9b65e"; g.beginPath(); g.moveTo(880, 1180); g.quadraticCurveTo(1000, 1300, 1060, 1500); g.lineTo(1300, 1500); g.lineTo(1300, 1150); g.quadraticCurveTo(1100, 1080, 960, 1060); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#f1d2bd"; g.beginPath(); g.ellipse(540, 960, 230, 115, -0.12, 0, 6.283); g.fill(); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(350 + i * 105, 880 - Math.abs(i - 1.5) * 18, 42, 95 * (1 - open * 0.25), 0.25 - i * 0.13, 0, 6.283); g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(700, 1010, 50, 95, -0.9, 0, 6.283); g.fill(); g.stroke();
  g.fillStyle = radGrad(g, 540, 800, 0, 420 * (0.4 + open), [[0, `rgba(255,240,200,${0.6 * open})`], [1, "rgba(255,200,120,0)"]]); g.fillRect(0, 300, W, 1000);
  flower(g, 540, 820 - open * 30, 2.4, open);
  g.restore();
  particles(g, f, "sparks", 11, Math.round(30 * open), "rgba(255,240,190,0.9)");
  post(g, f, { ...G.memory, glow: { x: 540, y: 800, r: 500, color: "#ffe2a0", a: 0.35 * open } });
});
// "But the hat split them: Lily to Gryffindor, Severus to Slytherin."
add(ls(5) - 2, ls(6) - 2, (g, f, l, n) => { // at eleven, in school robes: sent to opposite sides; she glances back, so does he
  const cam = camAt([{ f: 0, c: { x: 0, y: -40, zoom: 1.3 } }, { f: n, c: { x: 0, y: 0, zoom: 1.02 } }], l);
  layer(g, cam, "sh_back", 0.4, sortHall.back, 4);
  layer(g, cam, "sh_candles", 0.25, sortHall.candles, 3);
  const g1 = wf(5, "gryffindor"), s1 = wf(5, "slytherin");
  const lw = ramp(f, g1 - 8, g1 + 24), sw = ramp(f, s1 - 6, s1 + 22), back = ramp(f, s1 + 10, s1 + 24);
  person(g, cam, 1, "lily", "child", { ...at("lily", "child", lerp(470, 250, lw), 900, 1.2), ...ROBE, trim: RED, walk: lw > 0 && lw < 1 ? f * 0.3 : undefined, facing: lw < 1 ? -0.6 : lerp(-0.6, 0.6, back), look: [lerp(-0.5, 0.9, back), 0], brow: 0.4 * back, mouth: lerp(0.4, -0.1, back), blink: blink(l, 15), breathe: f }, Lr);
  person(g, cam, 1, "snape", "child", { ...at("snape", "child", lerp(620, 830, sw), 900, 1.2), ...ROBE, trim: GREEN, walk: sw > 0 && sw < 1 ? f * 0.3 : undefined, facing: lerp(-0.4, 0.6, sw) * (1 - back) + -0.6 * back, look: [lerp(-0.5, -0.9, back), 0], brow: 0.6 * back, mouth: -0.2, blink: blink(l, 17), breathe: f }, Lg);
  g.save(); g.translate(W / 2, H / 2); g.scale(cam.zoom, cam.zoom); g.translate(-W / 2 - cam.x, -H / 2 - cam.y); sortingHat(g, 540, 560, 0.55, talk(f, g1 - 4, g1 + 8, 0.6) + talk(f, s1 - 4, s1 + 8, 0.6), f); g.restore();
  post(g, f, G.split);
});

// ===================== 5 · MAIN DRAMA =====================
// "There, James Potter, a Gryffindor bully, humiliated him in public."
add(ls(6) - 2, ls(7) - 2, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 120, y: 0, zoom: 1.1 } }, { f: n, c: { x: -40, y: -20, zoom: 1.2, roll: -2 } }], l);
  layer(g, cam, "lake_sky", 0.1, lake.sky);
  layer(g, cam, "lake_far", 0.3, lake.far, 4);
  layer(g, cam, "lake_ground", 0.6, lake.ground, 2);
  for (const [bx] of [[120], [270], [980]] as [number][]) person(g, cam, 0.5, "bully", "teen", { ...at("bully", "teen", bx, 760, 0.55), facing: 0.3, mouth: 0.9, open: 0.3 + 0.3 * Math.abs(Math.sin(f * 0.4 + bx)), eye: 0.6, breathe: f + bx, shoulders: Math.sin(f * 0.5 + bx) * 0.3 }, L_LAKE, 6);
  person(g, cam, 0.85, "james", "teen", { ...at("james", "teen", 260, 860, 1.05), facing: 0.6, look: [0.9, -0.4], mouth: 0.8, open: 0.25 + 0.2 * Math.abs(Math.sin(f * 0.45)), brow: -0.2, armR: [-120, -20], handR: "grip", prop: wand(), blink: blink(l, 27), breathe: f }, L_LAKE);
  const up = ramp(f, wf(6, "humiliated") - 8, wf(6, "humiliated") + 6);
  person(g, cam, 1, "snape", "teen", { x: 760, y: lerp(1500, 280, up) + Math.sin(f * 0.18) * 14 * up, s: 0.95, rot: lerp(0, 180, up), facing: 0, look: [0, 0.5], brow: -0.5, eye: 0.6, mouth: -0.8, open: 0.2, armL: [40, 20], armR: [-40, -20], handL: "open", handR: "open", tremble: 0.3, breathe: f * 2 }, L_LAKE);
  layer(g, cam, "fg_reeds", 1.3, fg.reeds, 8);
  post(g, f, G.betrayal);
});
// "Lily defended him. To prove he didn't need her, he called her a Mudblood, their cruelest slur." {pause}
const d1 = wf(7, "to") - 3, d2 = we(7, "mudblood") + 2;
add(ls(7) - 2, d1, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.1 } }, { f: n, c: { x: 40, y: -20, zoom: 1.2 } }], l);
  layer(g, cam, "lake_sky", 0.1, lake.sky);
  layer(g, cam, "lake_far", 0.3, lake.far, 4);
  layer(g, cam, "lake_ground", 0.6, lake.ground, 2);
  const step = ramp(f, ls(7) - 2, ls(7) + 16);
  person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 820, 1020, 1.05, 1), facing: 0.6, look: [0.9, 0.6], brow: 0.3, eye: 0.6, mouth: -0.7, shoulders: 0.8, lean: 12, armL: [30, 40], handL: "fist", blink: blink(l, 25), breathe: f * 2 }, L_LAKE, 2);
  person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", lerp(640, 480, step), 820, 1.15), walk: step < 1 ? f * 0.32 : undefined, facing: -0.5, look: [-0.9, 0], brow: -0.8, eye: 1.05, mouth: -0.4, open: talk(f, ls(7) + 6, d1 - 2, 0.35), armR: [lerp(-10, -100, step), lerp(-5, -10, step)], handR: "point", blink: blink(l, 29), breathe: f }, L_LAKE);
  post(g, f, G.betrayal);
});
add(d1, d2, (g, f, l, n) => { // CU: shame curdles into fury; chin up for the word
  const cam = { x: 0, y: -10 * glide(l / n), zoom: 1 + 0.12 * glide(l / n), roll: -2 * glide(l / n) };
  layer(g, cam, "lake_sky", 0.1, lake.sky, 18);
  layer(g, cam, "lake_far", 0.2, lake.far, 18);
  const prove = ramp(f, d1, wf(7, "need") + 4), call = ramp(f, wf(7, "mudblood") - 4, wf(7, "mudblood") + 4);
  person(g, cam, 1, "snape", "teen", { ...at("snape", "teen", 560, 760, 4.0), facing: -0.3, look: [lerp(0.6, -0.7, prove), lerp(0.6, -0.1, prove)], nod: lerp(0.18, -0.05, prove), brow: lerp(0.4, -1, prove), eye: lerp(0.65, 1.05, call), mouth: lerp(-0.6, -0.9, prove), open: call * 0.55, tremble: prove * 0.25, breathe: f * 2 }, { x: 1050, y: 800, r: 1400, key: "#ff7060", shade: "#1a0818", keyA: 0.45, shadeA: 0.65 });
  post(g, f, G.betrayal);
});
add(d2, ls(8) - 2, (g, f, l, n) => { // CU Lily: it lands; hold through the silence; her eyes close
  const cam = { x: 0, y: 0, zoom: 1 + 0.08 * glide(l / n) };
  layer(g, cam, "lake_sky", 0.1, lake.sky, 18);
  layer(g, cam, "lake_far", 0.2, lake.far, 18);
  const hurt = ramp(f, d2, d2 + 14), shut = ramp(f, le(7) + 4, le(7) + 16);
  person(g, cam, 1, "lily", "teen", { ...at("lily", "teen", 520, 760, 4.0), facing: 0.3, look: [lerp(0.6, 0.2, hurt), lerp(0.3, 0.5, hurt)], brow: lerp(-0.3, 1, hurt), eye: lerp(1.15, 0.85, hurt) * (1 - shut * 0.9), mouth: -0.5, open: lerp(0.3, 0.05, hurt), tear: hurt * 0.8, tilt: hurt * -4, nod: hurt * 0.06, breathe: f * 1.5 }, { x: 0, y: 800, r: 1400, key: "#ff9a80", shade: "#1a0818", keyA: 0.35, shadeA: 0.55 });
  post(g, f, G.betrayal);
});
// "She never forgave him, and later married James."
const m1 = wf(8, "and") - 3;
add(ls(8) - 2, m1, (g, f, l, n) => { // she walks away; his hand reaches after her and drops
  const cam = { x: -30 * glide(l / n), y: 0, zoom: 1.04 + 0.04 * glide(l / n) };
  layer(g, cam, "lake_sky", 0.1, lake.sky);
  layer(g, cam, "lake_far", 0.3, lake.far, 3);
  layer(g, cam, "lake_ground", 0.6, lake.ground, 1);
  const t = glide(l / n), foc = ramp(f, ls(8) + 6, ls(8) + 18);
  person(g, cam, 0.8, "lily", "teen", { x: lerp(560, 640, t), y: lerp(1300, 1140, t), s: lerp(0.9, 0.6, t), back: true, walk: f * 0.3, breathe: f }, L_LAKE, lerp(0, 6, foc));
  const reach = K(f, [[ls(8), 0], [ls(8) + 10, 1], [m1 - 8, 1], [m1, 0.2]]);
  person(g, cam, 1.2, "snape", "teen", { ...at("snape", "teen", 180, 1150, 1.6, 1), facing: 0.5, look: [0.9, -0.4], brow: 0.9, eye: 0.85, mouth: -0.5, lean: 8, armR: [lerp(-20, -95, reach), lerp(-10, -20, reach)], handR: reach > 0.5 ? "open" : "mitt", breathe: f * 1.5 }, L_LAKE, lerp(8, 0, foc));
  post(g, f, G.betrayal);
});
add(m1, ls(9) - 2, (g, f, l, n) => { // the wedding, bright and far away; he watches from behind the hedge, in shadow
  const cam = camAt([{ f: 0, c: { x: -80, y: 0, zoom: 1.08 } }, { f: n, c: { x: 40, y: -20, zoom: 1.16 } }], l);
  layer(g, cam, "wed_back", 0.5, wedding.back, 2);
  const Lw: Light = { x: 700, y: 300, r: 1600, key: "#fff0d0", shade: "#4a4060", keyA: 0.35, shadeA: 0.3 };
  person(g, cam, 0.55, "lily", "adult", { ...at("lily", "adult", 500, 900, 0.62), coat: "#f4f0ea", coatHi: "#ffffff", facing: 0.4, look: [0.8, 0], mouth: 0.8, armR: [-30, -40], blink: blink(l, 61), breathe: f }, Lw, 2);
  person(g, cam, 0.55, "james", "adult", { ...at("james", "adult", 590, 890, 0.62), facing: -0.4, look: [-0.8, 0], mouth: 0.7, armL: [30, 40], blink: blink(l, 63), breathe: f }, Lw, 2);
  particles(g, f, "dust", 141, 50, "rgba(255,210,225,0.9)"); // confetti petals
  layer(g, cam, "wed_hedge", 1.15, wedding.hedge, 6);
  const look_ = ramp(f, m1 + 6, m1 + 20);
  person(g, cam, 1.25, "snape", "adult", { ...at("snape", "adult", 230, 960, 2.2), facing: 0.6, look: [0.9, -0.1], brow: lerp(0.4, 0.95, look_), eye: lerp(1, 0.75, look_), mouth: -0.5, nod: look_ * 0.06, breathe: f }, { x: 900, y: 300, r: 1500, key: "#c0c8e0", shade: "#05060c", keyA: 0.2, shadeA: 0.8 }, 1);
  post(g, f, { tint: "#b0a0c0", tintAlpha: 0.2, vignette: 0.45, lift: "#0c0a10" });
});
// "Severus joined Voldemort, the most feared dark wizard alive."
add(ls(9) - 2, ls(10) - 2, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 0, y: 260, zoom: 1.15 } }, { f: n, c: { x: 0, y: 0, zoom: 1.0 } }], l);
  layer(g, cam, "dark_back", 0.4, darkHall.back, 3);
  const rise = ramp(f, wf(9, "most") - 6, wf(9, "alive"));
  person(g, cam, 0.85, "voldemort", "adult", { ...at("voldemort", "adult", 600, 640, 1.2), facing: -0.2, look: [-0.3, 0.8], blink: blink(l, 29), breathe: f, armR: [lerp(-25, -120, rise), lerp(-30, -20, rise)], handR: "open", tilt: 3 }, { ...L_DARK, keyA: 0.3 + rise * 0.15 }, 1);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 380, 1200, 1.2, 1), facing: 0.6, look: [0.6, -0.8], brow: -0.2, eye: 0.8, mouth: -0.3, lean: 14, nod: 0.1, breathe: f, armL: [20, 30], armR: [-20, -30] }, L_DARK);
  particles(g, f, "sparks", 151, Math.round(30 * rise), "rgba(120,255,170,0.7)");
  post(g, f, G.dark);
});
// "He passed his master a prophecy, then realized it meant Lily's baby son." {pause}
const p1 = wf(10, "then") - 3;
add(ls(10) - 2, p1, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: -120, y: 0, zoom: 1.2 } }, { f: n, c: { x: 80, y: -20, zoom: 1.32 } }], l);
  layer(g, cam, "dark_back", 0.35, darkHall.back, 6);
  const lean = ramp(f, ls(10) + 6, ls(10) + 30);
  person(g, cam, 0.9, "voldemort", "adult", { ...at("voldemort", "adult", 720, 700, 1.3), facing: -0.5, look: [-0.6, 0.6], lean: -lean * 8, tilt: -lean * 5, breathe: f, armR: [-40, -60], handR: "open" }, L_DARK, 2);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 1000, 1.4, 1), facing: 0.7, look: [0.8, -0.6], brow: -0.1, eye: 0.85, open: talk(f, ls(10), p1 - 4, 0.25), lean: 12, blink: blink(l, 31), breathe: f, armR: [-70, -40], handR: "open" }, L_DARK);
  layer(g, cam, "fg_pillar_d", 1.4, fg.pillar, 12);
  post(g, f, G.dark);
});
add(p1, ls(11) - 2, (g, f, l, n) => { // CU: the realisation — and a flash of her with the baby
  const cam = { x: 0, y: -40 * glide(l / n), zoom: 1 + 0.22 * glide(l / n) };
  layer(g, cam, "dark_back", 0.3, darkHall.back, 16);
  const r = ramp(f, wf(10, "lily's") - 8, wf(10, "son") + 4);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 760, 4.3), facing: 0.15, look: [lerp(0.4, 0, r), lerp(-0.4, 0.1, r)], brow: lerp(-0.2, 0.9, r), eye: lerp(0.85, 1.25, r), mouth: -0.4, open: r * 0.35, tremble: r * 0.6, breathe: f * (1 + r) }, { x: 540, y: 0, r: 1700, key: "#a0ffd0", shade: "#000000", keyA: 0.35, shadeA: 0.7 });
  post(g, f, G.dark);
  const flash = ramp(f, wf(10, "baby") - 1, wf(10, "baby") + 3) * (1 - ramp(f, we(10, "son") + 2, we(10, "son") + 7));
  dissolve(g, flash * 0.92, (m) => { // memory flash: Lily cradling the baby (warm)
    layer(m, { x: 0, y: 0, zoom: 1 }, "pg_sky", 0.1, playground.sky, 24);
    person(m, { x: 0, y: 0, zoom: 1 }, 1, "lily", "adult", { ...at("lily", "adult", 540, 700, 2.6), facing: 0.2, look: [0.3, 0.8], mouth: 0.6, brow: 0.2, armL: [40, 80], armR: [-40, -80], still: true }, L_MEM);
    m.fillStyle = "#bcd4ee"; m.strokeStyle = "#1c121c"; m.lineWidth = 6; m.beginPath(); m.ellipse(580, 1210, 160, 100, 0.1, 0, 6.283); m.fill(); m.stroke(); // blanket
    m.fillStyle = "#f3cdb4"; m.beginPath(); m.arc(440, 1150, 64, 0, 6.283); m.fill(); m.stroke(); // baby head
    m.fillStyle = "#120f12"; m.beginPath(); m.ellipse(440, 1098, 40, 16, 0, Math.PI, 0); m.fill(); // tuft of black hair
    m.lineWidth = 4; m.beginPath(); m.arc(420, 1150, 9, 0.2, Math.PI - 0.2); m.moveTo(469, 1150); m.arc(460, 1150, 9, 0.2, Math.PI - 0.2); m.stroke(); // sleeping eyes
    m.beginPath(); m.arc(440, 1176, 8, 0.3, Math.PI - 0.3); m.stroke();
    post(m, f, G.memory);
  });
});
// "He begged Dumbledore, the school's headmaster, to hide her." — hilltop wind
add(ls(11) - 2, ls(12) - 2, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: n, c: { x: 40, y: -30, zoom: 1.12 } }], l);
  layer(g, cam, "hill_sky", 0.1, hill.sky);
  layer(g, cam, "hill_ground", 0.6, hill.ground, 1);
  const sink = ramp(f, ls(11) + 2, ls(11) + 24);
  person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 760, 720, 1.0), facing: -0.4, look: [-0.7, lerp(0.3, 0.9, sink)], brow: 0.1, mouth: -0.1, blink: blink(l, 33), breathe: f, armR: [-10, -20] }, L_HILL, 1);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 350, lerp(560, 1120, sink), 1.2, sink), facing: 0.6, look: [0.8, -0.9], brow: 0.9, eye: 1.0, mouth: -0.5, open: talk(f, ls(11), le(11), 0.3), lean: 6 - sink * 4, armL: [lerp(10, 120, sink), lerp(10, 40, sink)], armR: [lerp(-10, 150, sink), lerp(-10, 30, sink)], handL: "open", handR: "open", tremble: 0.3, blink: blink(l, 35), breathe: f * 1.6 }, L_HILL);
  particles(g, f, "dust", 37, 50, "rgba(200,210,240,0.5)");
  post(g, f, G.grief);
});
// "It wasn't enough." {pause} — office at night, slumped, face in hands
add(ls(12) - 2, ls(13) - 2, (g, f, l, n) => {
  const cam = { x: -30 - 15 * glide(l / n), y: 110 + 10 * glide(l / n), zoom: 1.3 + 0.12 * glide(l / n) };
  layer(g, cam, "offn_back", 0.45, officeNight.back, 6);
  person(g, cam, 0.85, "dumbledore", "adult", { ...at("dumbledore", "adult", 900, 640, 0.85), facing: -0.6, look: [-0.8, 0.6], brow: 0.5, mouth: -0.2, breathe: f }, { ...L_OFF, keyA: 0.15 }, 3);
  layer(g, cam, "fg_chair", 1.0, fg.chair, 0);
  const sob = Math.max(0, Math.sin(f * 0.3)) * 0.6;
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 920, 1.25, 0.55), facing: 0.1, look: [0, 1], brow: 1, eye: 0.15, mouth: -0.7, open: 0.2, nod: 0.35, shoulders: 1, lean: 7, tremble: 0.6 + sob, armL: [30, 150], armR: [-30, -150], handL: "open", handR: "open", breathe: f * 2.4 }, { x: 900, y: 1300, r: 1400, key: "#ff9a60", shade: "#05060c", keyA: 0.25, shadeA: 0.7 });
  post(g, f, { ...G.grief, glow: { x: 900, y: 1300, r: 600, color: "#ff8040", a: 0.15 } });
});
// "So he promised to protect the boy with her eyes."
add(ls(13) - 2, ls(14) - 2, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 80, y: 0, zoom: 1.05 } }, { f: n, c: { x: -60, y: -40, zoom: 1.3 } }], l);
  layer(g, cam, "off_back", 0.45, office.back, 5);
  layer(g, cam, "off_desk", 0.75, office.desk, 2);
  const lift = ramp(f, ls(13) - 2, ls(13) + 22), green = ramp(f, wf(13, "eyes") - 6, wf(13, "eyes") + 10);
  person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 820, 760, 0.95), facing: -0.6, look: [-0.8, 0.1], brow: 0.4, mouth: -0.1, armR: [-40, -60], handR: "open", blink: blink(l, 37), breathe: f }, L_OFF, 2);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 330, 820, 1.25), facing: 0.6, look: [0.6, lerp(0.8, 0.1, lift)], nod: lerp(0.3, 0, lift), shoulders: lerp(0.8, 0.1, lift), brow: lerp(1, 0.6, lift), eye: 0.8, mouth: -0.4, open: talk(f, wf(13, "promised"), wf(13, "protect"), 0.2), tear: 0.6, blink: blink(l, 39), breathe: f, handL: "fist", armL: [12, 10] }, { ...L_OFF, key: green > 0.3 ? "#60ffa0" : L_OFF.key, keyA: 0.35 + green * 0.1 });
  layer(g, cam, "fg_shelf", 1.35, fg.shelf, 10);
  post(g, f, { ...G.office, glow: { x: 330, y: 650, r: 420, color: "#40e080", a: 0.25 * green } });
});
// "But Harry had her eyes in James Potter's face, so Severus guarded him and tormented him."
const t1 = wf(14, "so") - 3;
add(ls(14) - 2, t1, (g, f, l, n) => { // his POV: green eyes... then his father's face superimposes
  const cam = { x: 0, y: -10 * glide(l / n), zoom: 1 + 0.08 * glide(l / n) };
  layer(g, cam, "cls_back", 0.3, classroom.back, 16);
  const j = ramp(f, wf(14, "james") - 4, wf(14, "james") + 8) * (1 - ramp(f, we(14, "face") + 4, we(14, "face") + 14));
  person(g, cam, 1, "harry", "child", { ...at("harry", "child", 540, 760, 4.6), ...ROBE, trim: RED, facing: 0, look: [0, -0.1], brow: lerp(0.3, -0.4, j), eye: 1.05, mouth: -0.3, blink: blink(l, 41), breathe: f }, { ...L_CLS, keyA: 0.3 });
  if (wf(14, "eyes") <= f) { g.save(); g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 540, 640, 0, 380, [[0, `rgba(60,230,130,${0.22 * ramp(f, wf(14, "eyes") - 2, wf(14, "eyes") + 8)})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore(); }
  dissolve(g, j * 0.62, (m) => { person(m, cam, 1, "james", "teen", { ...at("james", "teen", 540, 760, 4.4), facing: 0.1, look: [0.2, -0.1], brow: -0.2, mouth: 0.6, eye: 0.85, breathe: f }, { x: 1000, y: 600, r: 1500, key: "#ff9a80", shade: "#1a0818", keyA: 0.35, shadeA: 0.5 }); });
  post(g, f, G.dungeon);
});
add(t1, ls(15) - 2, (g, f, l, n) => { // classroom: prowls in, stands over Harry — guarding and tormenting in one gesture
  const cam = camAt([{ f: 0, c: { x: 80, y: 30, zoom: 1.0 } }, { f: n, c: { x: -20, y: 0, zoom: 1.14 } }], l);
  layer(g, cam, "cls_back", 0.45, classroom.back, 4);
  const walkT = ramp(f, t1, t1 + 30), loom = ramp(f, t1 + 26, t1 + 40);
  person(g, cam, 0.9, "harry", "teen", { ...at("harry", "teen", 300, 1100, 0.8), facing: 0.5, look: [0.8, lerp(-0.2, -0.8, loom)], brow: -0.6, mouth: -0.4, shoulders: -loom * 0.4, blink: blink(l, 41), breathe: f, handR: "fist" }, L_CLS, 1);
  layer(g, cam, "cls_desks", 0.95, classroom.desks, 0);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", lerp(1100, 700, walkT), 640, 1.35), walk: walkT < 1 ? f * 0.3 : undefined, facing: -0.7, look: [-0.8, lerp(0.3, 0.9, loom)], brow: -0.9, eye: 0.7, mouth: lerp(-0.6, 0.25, loom), lean: -loom * 10, nod: loom * 0.08, armL: [60, 40], armR: [-10, -20], handL: "point", blink: blink(l, 45), breathe: f }, L_CLS);
  layer(g, cam, "fg_cauldron", 1.3, fg.cauldron, 10);
  particles(g, f, "dust", 47, 30, "rgba(170,230,180,0.5)");
  post(g, f, G.dungeon);
});
// "That explains it. It doesn't excuse it." {pause} — the boy's face, then the empty room
const x1 = wf(15, "it", 1) - 3;
add(ls(15) - 2, x1, (g, f, l, n) => {
  const cam = { x: 0, y: 0, zoom: 1 + 0.08 * glide(l / n) };
  layer(g, cam, "cls_back", 0.3, classroom.back, 16);
  const down = ramp(f, ls(15), ls(15) + 18);
  person(g, cam, 1, "harry", "child", { ...at("harry", "child", 540, 760, 4.6), ...ROBE, trim: RED, facing: 0.15, look: [0.3, lerp(-0.6, 0.7, down)], nod: down * 0.1, brow: 0.9, eye: lerp(1.05, 0.8, down), mouth: -0.5, tear: down * 0.5, shoulders: -0.4, breathe: f * 1.6 }, { ...L_CLS, keyA: 0.25 });
  g.save(); g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "rgba(0,0,0,0.45)"], [0.6, "rgba(0,0,0,0.2)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore();
  post(g, f, G.dungeon);
});
add(x1, ls(16) - 2, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 0, y: -40, zoom: 1.35 } }, { f: n, c: { x: 0, y: 0, zoom: 1.0 } }], l);
  layer(g, cam, "cls_back", 0.45, classroom.back, 3);
  layer(g, cam, "cls_desks", 0.8, classroom.desks, 1);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 560, 700, 0.95), facing: 0, look: [0, 0.5], brow: 0.3, eye: 0.7, mouth: -0.3, shoulders: 0.3, nod: 0.05, breathe: f }, L_CLS);
  post(g, f, { ...G.dungeon, vignette: 0.7 });
});

// ===================== 6 · FINAL REVELATION =====================
// "Asked if he cared for the boy, Severus answered with a silver doe, a memory of Lily."
add(ls(16) - 2, ls(17) - 2, (g, f, l, n) => {
  const sv = wf(16, "severus"), doeT = ramp(f, sv - 4, le(16) + 10);
  const cam = camAt([{ f: 0, c: { x: -70, y: 10, zoom: 1.0 } }, { f: sv - ls(16), c: { x: -30, y: 0, zoom: 1.06 } }, { f: n, c: { x: 90, y: -40, zoom: 1.18 } }], l);
  layer(g, cam, "off_back", 0.45, office.back, 6);
  const Lt: Light = { x: lerp(300, 620, doeT), y: 760, r: 1500, key: "#d8e8ff", shade: "#0a0c18", keyA: 0.2 + 0.3 * doeT, shadeA: 0.6 };
  person(g, cam, 0.9, "dumbledore", "adult", { ...at("dumbledore", "adult", 860, 700, 0.95), facing: -0.6, look: [lerp(-0.8, -0.3, doeT), lerp(0.2, -0.3, doeT)], brow: lerp(-0.2, 0.7, doeT), eye: lerp(0.9, 1.1, doeT), mouth: -0.1, open: talk(f, ls(16), sv - 2, 0.25), blink: blink(l, 53), breathe: f }, Lt, 2);
  const raise = ramp(f, sv - 10, wf(16, "answered") + 4);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 290, 820, 1.25), facing: 0.5, look: [0.5, lerp(0.3, -0.4, raise)], brow: lerp(-0.6, 0.7, raise), eye: 0.85, mouth: lerp(-0.6, -0.3, raise), armR: [lerp(-10, -100, raise), lerp(-10, -30, raise)], handR: "grip", prop: wand("#2a1a12", raise > 0.6 ? "rgba(220,235,255,0.95)" : undefined), blink: blink(l, 55), breathe: f }, Lt);
  if (doeT > 0) { g.save(); g.translate(W / 2, H / 2); g.scale(cam.zoom, cam.zoom); g.translate(-W / 2 - cam.x, -H / 2 - cam.y); doe(g, lerp(380, 640, doeT) + Math.sin(f * 0.05) * 10, lerp(700, 760, doeT) + Math.sin(f * 0.07) * 12, lerp(0.5, 1.05, doeT), Math.min(1, doeT * 1.4), f); g.restore(); }
  layer(g, cam, "fg_shelf_b", 1.4, fg.shelf, 12);
  post(g, f, { ...G.silver, glow: { x: 560, y: 760, r: 700, color: "#d0e4ff", a: 0.35 * doeT } });
});
// "After all this time?" {pause}
add(ls(17) - 2, ls(18) - 4, (g, f, l, n) => {
  const cam = { x: -10 * glide(l / n), y: 0, zoom: 1 + 0.07 * glide(l / n) };
  layer(g, cam, "off_back", 0.3, office.back, 18);
  const soft = ramp(f, ls(17), le(17) + 8);
  person(g, cam, 1, "dumbledore", "adult", { ...at("dumbledore", "adult", 560, 700, 3.4), facing: -0.3, look: [-0.6, 0], brow: lerp(0.3, 0.8, soft), eye: lerp(1.05, 0.9, soft), mouth: -0.15, open: talk(f, ls(17), le(17), 0.22), tear: soft * 0.6, tilt: -soft * 3, breathe: f }, { x: 300, y: 700, r: 1400, key: "#e0ecff", shade: "#0a0c18", keyA: 0.4, shadeA: 0.55 });
  post(g, f, { ...G.silver, glow: { x: 300, y: 700, r: 700, color: "#d0e4ff", a: 0.3 } });
});
// "Always." {pause}
add(ls(18) - 4, ls(19) - 2, (g, f, l, n) => {
  const cam = { x: 0, y: -14 * glide(l / n), zoom: 1 + 0.07 * glide(l / n) };
  layer(g, cam, "off_back", 0.3, office.back, 18);
  const nodA = K(f, [[ls(18) - 2, 0], [ls(18) + 6, 0.07], [ls(18) + 16, 0]]);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 520, 760, 4.2), facing: 0.25, look: [0.3, K(f, [[ls(18), -0.1], [le(18) + 10, 0.3]])], brow: 0.9, eye: K(f, [[ls(18), 0.85], [le(18) + 14, 0.6]]), mouth: -0.3, open: talk(f, ls(18), le(18), 0.18), nod: nodA, tear: ramp(f, ls(18), le(18) + 18), breathe: f }, { x: 900, y: 700, r: 1400, key: "#e0ecff", shade: "#0a0c18", keyA: 0.45, shadeA: 0.55 });
  post(g, f, { ...G.silver, glow: { x: 900, y: 700, r: 700, color: "#d0e4ff", a: 0.3 } });
});
// "Dying, he asked Harry for one last thing. Look at me." {pause}
const k1 = wf(19, "look") - 3, k2 = wf(19, "look") + Math.round((ls(20) - wf(19, "look")) * 0.55);
add(ls(19) - 2, k1, (g, f, l, n) => {
  const cam = camAt([{ f: 0, c: { x: 60, y: 0, zoom: 1.0 } }, { f: n, c: { x: -20, y: -30, zoom: 1.16 } }], l);
  layer(g, cam, "shk_back", 0.5, shack.back, 3);
  const kneelH = ramp(f, ls(19), ls(19) + 16), grab = ramp(f, wf(19, "asked") - 2, wf(19, "asked") + 12);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 400, 1080, 1.25, 1), facing: 0.4, look: [0.9, -0.2], brow: 0.8, eye: 0.6, mouth: -0.3, open: 0.15, lean: -5, shoulders: 0.6, armL: [10, 20], armR: [lerp(20, 95, grab), lerp(20, 25, grab)], handR: grab > 0.5 ? "grip" : "mitt", tremble: 0.4, breathe: f * 2.2 }, L_SHK);
  person(g, cam, 0.95, "harry", "teen", { ...at("harry", "teen", 790, lerp(780, 1060, kneelH), 1.1, kneelH), facing: -0.6, look: [-0.9, 0.2], brow: 0.8, eye: 1.05, mouth: -0.4, lean: -10 * kneelH, armL: [70, 40], handL: "open", blink: blink(l, 57), breathe: f * 1.5 }, L_SHK);
  particles(g, f, "dust", 59, 40, "rgba(220,225,235,0.6)");
  post(g, f, G.grief);
});
add(k1, k2, (g, f, l, n) => {
  const cam = { x: 0, y: 0, zoom: 1 + 0.06 * glide(l / n) };
  layer(g, cam, "shk_back", 0.3, shack.back, 20);
  person(g, cam, 1, "harry", "teen", { ...at("harry", "teen", 540, 860, 6.5), facing: -0.1, look: [K(f, [[k1, -0.4], [k1 + 10, 0]]), K(f, [[k1, 0], [k1 + 10, 0.35]])], brow: 0.7, eye: 1.1, mouth: -0.3, breathe: f }, { ...L_SHK, keyA: 0.35, shadeA: 0.5 });
  post(g, f, { ...G.grief, glow: { x: 540, y: 960, r: 500, color: "#40e080", a: 0.14 } });
});
add(k2, ls(20) - 2, (g, f, l, n) => {
  const cam = { x: 0, y: 0, zoom: 1.05 + 0.06 * glide(l / n) };
  layer(g, cam, "shk_back", 0.3, shack.back, 20);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 820, 6.2), facing: 0.05, look: [0, -0.35], brow: 0.85, eye: 0.85, mouth: -0.2, tear: 1, breathe: f * 0.6 }, { x: 540, y: 300, r: 1600, key: "#c0d0e8", shade: "#08060a", keyA: 0.3, shadeA: 0.55 });
  g.save(); g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 540, 780, 0, 360, [[0, "rgba(60,220,120,0.12)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore();
  post(g, f, G.grief);
});
// "Maybe so the last thing he ever saw was her eyes." + payoff
const memF = wf(20, "her") - 6, reveal = LAST_WORD + 30;
add(ls(20) - 2, reveal, (g, f, l, n) => {
  const cam = { x: 0, y: -45 * glide(l / n), zoom: 1 + 0.16 * glide(l / n) };
  const close = ramp(f, wf(20, "thing") - 4, wf(20, "her") + 4);
  layer(g, cam, "shk_back", 0.3, shack.back, 20);
  person(g, cam, 1, "snape", "adult", { ...at("snape", "adult", 540, 760, 4.2), facing: 0.1, look: [0, -0.3], brow: lerp(0.8, 0.05, close), eye: lerp(0.8, 0, close), mouth: lerp(-0.3, 0.15, close), nod: close * 0.05, tear: 1, breathe: f * lerp(0.9, 0.35, close), shoulders: close * 0.3 }, { x: 540, y: 300, r: 1600, key: close > 0.5 ? "#ffd090" : "#c0d0e8", shade: "#08060a", keyA: 0.3 + close * 0.15, shadeA: 0.55 });
  post(g, f, { ...G.grief, tintAlpha: lerp(0.45, 0.1, close) });
  dissolve(g, ramp(f, memF, memF + 22), (m) => {
    layer(m, { x: 0, y: 0, zoom: 1 }, "pg_sky", 0.1, playground.sky, 24);
    person(m, { x: 0, y: 0, zoom: 1 + 0.03 * glide(l / n) }, 1, "lily", "child", { ...at("lily", "child", 540, 800, 5.2), facing: 0, look: [0, 0], brow: 0.2, eye: 1, mouth: lerp(0.3, 0.7, ramp(f, memF + 10, memF + 40)), blink: f === memF + 44 || f === memF + 45 }, L_MEM);
    post(m, f, { ...G.memory, glow: { x: 900, y: 450, r: 800, color: "#ffd090", a: 0.4 } });
  });
});
add(reveal, FRAMES, (g, f, l, n) => { // pull back: the two of them on the playground, before any of it happened
  const cam = camAt([{ f: 0, c: { x: 0, y: -40, zoom: 1.35 } }, { f: n, c: { x: 30, y: 0, zoom: 1.0 } }], l);
  layer(g, cam, "pg_sky", 0.15, playground.sky);
  layer(g, cam, "pg_town", 0.3, playground.town, 5);
  layer(g, cam, "pg_ground", 0.6, playground.ground, 2);
  layer(g, cam, "pg_tree", 0.7, playground.tree, 2);
  const turn = ramp(f, reveal + 24, reveal + 54);
  person(g, cam, 1, "lily", "child", { ...at("lily", "child", 640, 900, 1.15), facing: lerp(0, -0.5, turn), look: [lerp(0, -0.8, turn), 0.3], mouth: 0.8, armR: [-60, -70], handR: "open", prop: holdFlower(1), blink: blink(l, 71), breathe: f }, L_MEM);
  person(g, cam, 1, "snape", "child", { ...at("snape", "child", 390, 930, 1.12), facing: 0.6, look: [0.8, -0.1], brow: 0.2, mouth: lerp(0.2, 0.5, turn), eye: 1.05, shoulders: 0.1, blink: blink(l, 73), breathe: f }, L_MEM);
  particles(g, f, "dust", 77, 50, "rgba(255,230,170,0.8)");
  post(g, f, { ...G.memory, glow: { x: 900, y: 450, r: 800, color: "#ffd090", a: 0.45 } });
  const out = ramp(f, FRAMES - 22, FRAMES - 2);
  if (out > 0) vignetteDark(g, out);
});

export const SHOTS = S;
export function drawEpisode(g: Ctx, f: number) {
  const s = S.find((x) => f >= x.a && f < x.b) ?? S[S.length - 1];
  s.draw(g, f, f - s.a, s.b - s.a);
}
