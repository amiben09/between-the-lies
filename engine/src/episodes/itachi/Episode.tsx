// "Next Time" (Itachi) — full episode. 33 beats keyed to beats.json (times from the real voice, words.json).
// 3D beats: dressed Three.js sets + 2D-rig cards. 2.5D close-ups: full-res 2D rig over a blurred 3D set (depth of field).
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Cam, Ctx, H, W, clamp, glide, lerp, linGrad, makeCanvas, particles, post, radGrad, ramp, rng } from "../../btl/core";
import { Arm, Light, Pose, person, reachArm } from "../../btl/people";
import { CardActor, CardCanvas, Inked, V, canvasTex, gradientMap, toon } from "../../three/kit3d";
import { House, Lantern, Street, Backdrop } from "../../three/village";
import { Motes, Rain3D } from "../../three/props";
import { CARD_LIGHT, Look, Stage } from "./stage";
import { ClanStreet, CliffTop, Council, Forest, MapRoom, NoticeBoard, PoliceHQ, Porch, Rooftops, RuinedHall, TrainingYard, Valley } from "./sets";
import BEATS from "./beats.json";
import CAPS from "./captions.json";

const FPS = 30; const fr = (s: number) => Math.round(s * FPS);
type P3 = [number, number, number];
type BP = { t: number; d: number; p: number; f: number };
const mv = (a: P3, b: P3, p: number) => { const k = glide(p); return V(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)); };
const lerpArm = (a: Arm, b: Arm, k: number): Arm => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const ON: Cam = { x: 0, y: 0, zoom: 1 };
const blade = (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.strokeStyle = "#c8ccd4"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y + 160); g.stroke(); g.strokeStyle = "#2a1a14"; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 4, y - 22); g.lineTo(x, y + 4); g.stroke(); };
const IT_T: Partial<Pose> = { headband: "plain" }, IT_A: Partial<Pose> = { headband: "scratched" };
/** forehead point of a Sasuke drawn at (x, y, s) facing ~0.45 */
const forehead = (x: number, y: number, s: number, Hu: number): [number, number] => [x + 38 * s, y - Hu * s + 38 * s];
const L2 = (look: Look) => CARD_LIGHT[look];

/** 2D overlay (characters on a transparent canvas over a 3D set). */
const Over: React.FC<{ draw: (g: Ctx) => void }> = ({ draw }) => <CanvasFrame draw={(g) => draw(g)} />;

// ---------- textures ----------
const beastTex = () => canvasTex(1024, 512, (g, w, h) => {
  g.fillStyle = "#07040a"; g.beginPath(); g.moveTo(0, h); g.bezierCurveTo(w * 0.1, h * 0.55, w * 0.25, h * 0.35, w * 0.38, h * 0.38); // back
  g.bezierCurveTo(w * 0.42, h * 0.2, w * 0.5, h * 0.12, w * 0.56, h * 0.2); g.lineTo(w * 0.6, h * 0.05); g.lineTo(w * 0.63, h * 0.22); g.lineTo(w * 0.68, h * 0.08); g.lineTo(w * 0.69, h * 0.27); // head + ears
  g.bezierCurveTo(w * 0.78, h * 0.32, w * 0.8, h * 0.5, w * 0.74, h * 0.6); g.bezierCurveTo(w * 0.8, h * 0.8, w * 0.85, h, w * 0.85, h); g.closePath(); g.fill();
  for (let i = 0; i < 6; i++) { g.lineWidth = 34 - i * 2; g.strokeStyle = "#07040a"; g.lineCap = "round"; g.beginPath(); g.moveTo(w * 0.1, h * 0.75); g.bezierCurveTo(w * (0.02 - i * 0.01), h * (0.5 - i * 0.07), w * (0.12 + i * 0.03), h * (0.2 - i * 0.02), w * (0.04 + i * 0.05), h * (0.08 + (i % 2) * 0.06)); g.stroke(); }
  g.fillStyle = "#ff3a1a"; for (const x of [0.64, 0.7]) { g.beginPath(); g.ellipse(w * x, h * 0.3, 10, 5, 0.2, 0, 6.283); g.fill(); }
});
const Birds: React.FC<{ f: number; at: P3 }> = ({ f, at }) => <group position={at}>{[0, 1, 2, 3, 4].map((i) => { const flap = Math.sin(f * 0.5 + i * 1.3) * 0.6; const x = (f * 0.06 + i * 1.7) % 30 - 15; return <group key={i} position={[x, Math.sin(i * 2.1) * 1.5, -i * 2]}><mesh rotation={[0, 0, flap]} position={[-0.25, 0, 0]}><planeGeometry args={[0.5, 0.08]} /><meshBasicMaterial color="#2a2028" side={THREE.DoubleSide} /></mesh><mesh rotation={[0, 0, -flap]} position={[0.25, 0, 0]}><planeGeometry args={[0.5, 0.08]} /><meshBasicMaterial color="#2a2028" side={THREE.DoubleSide} /></mesh></group>; })}</group>;

// ======================= HOOK =======================
const B1: React.FC<BP> = ({ p, f }) => {
  const cam = mv([0.7, 10, 9], [0.7, 2.3, 6], p), look = mv([0, 9, -60], [0, 1.4, -16], p);
  return <Stage look="nightRed" cam={cam} target={look} vignette={0.6} tint="#5a1830">
    <ClanStreet f={f} mood="night" fallen moonXY={[0.5, 0.62]} />
    <CardActor kind="itachi" age="adult" at={[0, 0, -16]} heightM={1.75} camPos={cam} light={L2("nightRed")} pose={{ ...IT_A, back: true, armR: [-10, -5], prop: blade, breathe: f }} />
  </Stage>;
};
const B2: React.FC<BP> = ({ p, f }) => {
  const s = 3.6, y = 430 + 448 * s;
  return <Stage look="nightRed" cam={V(0.3, 1.0, -24)} target={V(0, 1.7, 0)} blur={9} vignette={0.65} tint="#4a1830"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.05 * glide(p) };
      person(g, c, 1, "sasuke", "child", { x: 540, y, s, kneel: 1, look: [0.15, -0.9], brow: 0.95, eye: 1.1, mouth: -0.6, open: 0.18 + Math.sin(f * 0.4) * 0.04, tear: 1, handL: "fist", handR: "fist", armL: [12, 30], armR: [-12, -30], shoulders: 0.35, tremble: 0.35, breathe: f * 1.6 }, { ...L2("nightRed"), x: 700, y: 300 });
      particles(g, f, "dust", 12, 30, "rgba(255,170,120,0.6)"); }} />}>
    <ClanStreet f={f} mood="night" fallen />
  </Stage>;
};
const B3: React.FC<BP> = ({ p, f }) => {
  const turn = ramp(p * 52, 4, 18), red = ramp(p * 52, 22, 40);
  return <Stage look="nightRed" cam={V(0.4, 0.5, -10)} target={V(0, 7, -40)} blur={5} vignette={0.6} tint="#6a1828" roll={-0.03 * p}
    overlay={<Over draw={(g) => { const c = { x: -30 * p, y: -60 * p, zoom: 1 + 0.12 * p };
      person(g, c, 1, "itachi", "adult", { ...IT_A, x: 560, y: 2250, s: 2.2, back: turn < 0.5, facing: -0.15, look: [-0.05, 0.75], brow: -0.1, eye: 0.75, mouth: -0.1, eyesRed: red, armR: [-6, -4], prop: blade, still: true, breathe: f }, { ...L2("nightRed"), x: 980, y: 120 });
      if (red > 0) { const pulse = 0.75 + 0.25 * Math.sin(f * 0.5); g.save(); g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 560, 330, 0, 260 + 60 * pulse, [[0, `rgba(255,40,30,${0.4 * red * pulse})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore(); }
      particles(g, f * 2, "sparks", 13, 45, "rgba(255,120,70,0.8)"); }} />}>
    <ClanStreet f={f} mood="night" />
  </Stage>;
};

// ======================= WORLD =======================
const B4: React.FC<BP> = ({ p, f }) => {
  const cam = mv([0, 32, 34], [0, 9, 9], p), look = mv([0, 4, -50], [0, 4.5, -26], p);
  return <Stage look="dawn" cam={cam} target={look} fov={46} vignette={0.35} tint="#ffb070"><Valley f={f} /><Birds f={f} at={[0, 16, -30]} /></Stage>;
};
const kid = (i: number): Partial<Pose> => ({ coat: ["#5a6a8a", "#7a5a4a", "#4a6a5a"][i], coatHi: ["#7a8aaa", "#9a7a6a", "#6a8a7a"][i], robe: false, trim: null });
const B5: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([-1.9, 1.05, 1.4], [-0.2, 1.1, 0.9], p), look = mv([-0.6, 0.95, -4], [0.2, 0.95, -4.5], p);
  const throwK = ramp(t, 18, 26), fly = clamp((t - 24) / 14, 0, 1);
  return <Stage look="day" cam={cam} target={look} fov={44} vignette={0.3}>
    <TrainingYard f={f} knifeFly={t > 24 ? fly : undefined} />
    <CardActor kind="bully" age="child" at={[-1.1, 0, -2.0]} heightM={1.25} camPos={cam} light={L2("day")} pose={{ ...kid(0), facing: 0.75, look: [0.8, 0.1], brow: -0.3, mouth: 0.1, armR: lerpArm([-30, -100], [-120, 10], throwK), handR: "open", breathe: f }} />
    <CardActor kind="bully" age="child" at={[1.6, 0, -3.4]} heightM={1.2} camPos={cam} light={L2("day")} pose={{ ...kid(1), facing: -0.5, look: [-0.6, 0.1], mouth: 0.4, armL: [10, 20], handR: "grip", breathe: f + 20 }} />
    <CardActor kind="bully" age="child" at={[2.6, 0, -8.5]} heightM={1.25} camPos={cam} light={L2("day")} pose={{ ...kid(2), facing: -0.3, armR: [-100 + Math.sin(f * 0.3) * 40, -20], breathe: f + 40 }} />
  </Stage>;
};
const B6: React.FC<BP> = ({ p, f }) => {
  const cam = mv([-3.2, 1.5, 6.5], [2.2, 1.5, 6.0], p), look = mv([-1.6, 1.6, -4], [1.2, 1.6, -4], p);
  const off: Partial<Pose> = { coat: "#2a3048", coatHi: "#3a4462", robe: false, trim: "#8a2a2a" };
  return <Stage look="day" cam={cam} target={look} vignette={0.3}>
    <PoliceHQ f={f} />
    <CardActor kind="bully" age="adult" at={[-1.7, 0, -3.5]} heightM={1.78} camPos={cam} light={L2("day")} pose={{ ...off, facing: 0.2, brow: -0.4, mouth: -0.2, armL: [5, 5], armR: [-5, -5], breathe: f }} />
    <CardActor kind="bully" age="adult" at={[1.7, 0, -3.5]} heightM={1.74} camPos={cam} light={L2("day")} pose={{ ...off, facing: -0.3, look: [0, 0.7], brow: -0.2, armR: [-60, -95], armL: [-40, -100], handR: "grip", prop: (g, h, x, y) => { if (h === "R") { g.fillStyle = "#efe6d0"; g.fillRect(x - 40, y - 70, 80, 100); g.fillStyle = "#3a2a1e"; for (let i = 0; i < 4; i++) g.fillRect(x - 30, y - 55 + i * 18, 55, 5); } }, breathe: f + 15 }} />
    <CardActor kind="bully" age="adult" at={[lerp(-6, 3, p), 0, -0.5]} heightM={1.7} camPos={cam} light={L2("day")} pose={{ coat: "#6a5a48", coatHi: "#8a7a64", robe: false, trim: null, facing: 0.7, walk: f * 0.28, breathe: f }} />
  </Stage>;
};
const eyeBg = (g: Ctx, w: number, h: number) => { g.fillStyle = linGrad(g, 0, 0, 0, h, [[0, "#1a1420"], [1, "#0a080e"]]); g.fillRect(0, 0, w, h); };
const B7: React.FC<BP> = ({ p, f }) => {
  const draw = useMemo(() => (g: Ctx, lf: number) => {
    const pp = lf / 55; const red = ramp(lf, 14, 34), open = ramp(lf, 0, 10);
    eyeBg(g, W, H);
    const s = 7, top = 900 - 87 * s;
    person(g, { x: 0, y: 0, zoom: 1 + 0.08 * glide(pp) }, 1, "itachi", "teen", { ...IT_T, x: 540, y: top + 880 * s, s, facing: 0, look: [0, 0], eye: 0.25 + open * 0.8, brow: -0.2, eyesRed: red, still: true, headOnly: true, breathe: lf }, { x: 540, y: 400, r: 1600, key: "#ffd8c8", shade: "#0a0610", keyA: 0.25, shadeA: 0.5 });
    post(g, lf, { tint: "#a02020", tintAlpha: 0.15 + 0.3 * red, vignette: 0.6, lift: "#0a0608", glow: { x: 540, y: 900, r: 700, color: "#ff2a1a", a: 0.25 * red } });
  }, []);
  return <AbsoluteFill style={{ background: "#000" }}><CanvasFrame draw={draw} /></AbsoluteFill>;
};
const B8: React.FC<BP> = ({ p, f }) => {
  const cam = mv([0, 24, 26], [0, 14, 4], p * p), look = V(0, 4, -45);
  const beast = useMemo(beastTex, []);
  return <Stage look="fire" cam={cam} target={look} fov={46} vignette={0.6} tint="#a03010">
    <Valley f={f} burning />
    <mesh position={[lerp(-60, -10, p), 26, -110]}><planeGeometry args={[110, 55]} /><meshBasicMaterial map={beast} transparent fog={false} depthWrite={false} /></mesh>
  </Stage>;
};
const B9: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([0.4, 0.8, 1.3], [0.2, 0.62, 0.1], p), look = mv([0, 0.6, -1.6], [0.15, 0.42, -1.15], p);
  const slide = ramp(t, 4, 26), tap = t > 30 ? Math.max(0, Math.sin((t - 30) * 0.5)) : 0;
  const elder = (i: number): Partial<Pose> => ({ coat: ["#3a3446", "#4a2e34", "#2e3a40"][i], coatHi: ["#4e465e", "#64404a", "#40505a"][i], robe: true, trim: null, kneel: 1, brow: -0.5, mouth: -0.3, look: [0, 0.6], breathe: f + i * 17 });
  return <Stage look="interior" cam={cam} target={look} fov={40} vignette={0.65} tint="#4a3a6a">
    <Council f={f} file={slide} />
    <CardActor kind="bully" age="adult" at={[-0.85, 0, -2.15]} heightM={1.7} camPos={cam} spherical light={L2("interior")} pose={{ ...elder(0), facing: 0.3 }} />
    <CardActor kind="bully" age="adult" at={[0.05, 0, -2.2]} heightM={1.7} camPos={cam} spherical light={L2("interior")} pose={{ ...elder(1), armR: [-55 - tap * 10, -40], handR: "point" }} />
    <CardActor kind="bully" age="adult" at={[0.9, 0, -2.15]} heightM={1.7} camPos={cam} spherical light={L2("interior")} pose={{ ...elder(2), facing: -0.3 }} />
  </Stage>;
};
const B10: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([0.4, 3.6, 3.0], [0.15, 1.7, 0.55], p), look = mv([0, 0.4, -0.6], [0.05, 0.4, -0.45], p);
  const L: Light = { x: 540, y: 1400, r: 1600, key: "#ffb060", shade: "#100808", keyA: 0.4, shadeA: 0.6 };
  const men: [number, number][] = [[-1.4, -0.4], [-0.9, -1.4], [0.5, -1.6], [1.5, -0.6]];
  const stab = ramp(t, 44, 52);
  return <Stage look="candle" cam={cam} target={look} fov={48} vignette={0.65} tint="#8a3a1a">
    <MapRoom f={f} knife={stab} />
    {men.map(([x, z], i) => <CardActor key={i} kind="bully" age="adult" at={[x, 0, z - 0.4]} heightM={1.1} camPos={cam} spherical light={L} pose={{ coat: "#262428", coatHi: "#3a363e", robe: true, trim: null, kneel: 1, look: [0, 0.9], brow: -0.6, mouth: -0.3, breathe: f + i * 9, armR: i === 1 ? lerpArm([-60, -60], [-150, -20], stab) : i === 2 ? [-60 + Math.sin(f * 0.15) * 15, -40] : [-20, -30], handR: i === 1 ? "fist" : i === 2 ? "point" : "mitt" }} />)}
  </Stage>;
};

// ======================= RELATIONSHIP (memory = warm amber) =======================
const PPM2 = 700; // two-shot cards: 700 px per metre, s≈1.27 for both brothers
const B11: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([3.6, 1.25, 4.8], [2.5, 1.15, 3.1], p), look = V(0.5, 1.0, -1.5);
  const up = ramp(t, 20, 40);
  return <Stage look="sunset" cam={cam} target={look} fov={36} vignette={0.4} tint="#ffa040">
    <Porch f={f} />
    <CardCanvas at={[0.5, 0, -1.25]} ppm={PPM2} camPos={cam} draw={(g) => person(g, ON, 1, "itachi", "teen", { ...IT_T, x: 540, y: 1880 - 378, s: 1.27, kneel: 1, facing: -0.3, look: [-0.2 + up * 0.1, 0.3 - up * 1.0], mouth: up * 0.7, brow: 0.2, armL: [20, 40], armR: [-20, -40], breathe: f }, L2("sunset"))} />
  </Stage>;
};
const B12: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([3.2, 1.15, 4.0], [2.2, 1.2, 3.0], p), look = mv([1.6, 0.9, -0.8], [0.6, 1.1, -1.3], p);
  const run = clamp(t / 26), on = t > 26;
  return <Stage look="sunset" cam={cam} target={look} fov={38} vignette={0.4} tint="#ffa040">
    <Porch f={f} />
    <CardCanvas at={[0.6, 0, -1.25]} ppm={600} camPos={cam} draw={(g) => {
      const s = 1700 / 1700 * 1.09; // 600 ppm → s≈1.09
      if (!on) person(g, ON, 1, "sasuke", "child", { x: lerp(1040, 640, run), y: 1880, s, facing: -0.7, walk: f * 0.55, mouth: 0.8, open: 0.3, armL: [-30, -40], armR: [30, 40], breathe: f }, L2("sunset"));
      else person(g, ON, 1, "sasuke", "child", { x: 600, y: 1880 - 324 - 160 + Math.sin(t * 0.5) * 6, s, facing: -0.3, mouth: 1, open: 0.45, eye: 0.5, armL: [-70, -50], armR: [70, 50], breathe: f }, L2("sunset"));
      person(g, ON, 1, "itachi", "teen", { ...IT_T, x: 540, y: 1880 - 324, s, kneel: 1, facing: on ? -0.1 : 0.4, look: on ? [0.3, -0.3] : [0.8, 0], mouth: on ? 1 : 0.4, open: on ? 0.35 : 0, eye: on ? 0.55 : 1, lean: on ? 6 : 0, armL: [20, 40], armR: [-20, -40], breathe: f }, L2("sunset"));
    }} />
  </Stage>;
};
const B13: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([-1.5, 0.75, 1.9], [-0.5, 0.8, 1.6], p), look = V(0.1, 1.05, -2.1);
  return <Stage look="day" cam={cam} target={look} fov={40} vignette={0.4} tint="#ffd080" fogScale={0.7}>
    <Forest f={f} />
    <CardCanvas at={[0.1, 0, -2.1]} ppm={PPM2} camPos={cam} draw={(g) => {
      const it = { x: 700, y: 1880, s: 1.27 }; const sa = { x: 400, y: 1880, s: 1.27 };
      const tug = Math.sin(t * 0.45) * 0.5 + 0.5;
      person(g, ON, 1, "itachi", "teen", { ...IT_T, ...it, facing: -0.5, look: [-0.7, 0.6], mouth: 0.3, brow: 0.3, armL: [12, 18], armR: [-10, -10], breathe: f }, L2("day"));
      person(g, ON, 1, "sasuke", "child", { ...sa, facing: 0.5, look: [0.7, -0.8], brow: 0.7, eye: 1.1, mouth: -0.2, open: 0.15 + tug * 0.25, armR: reachArm("sasuke", "child", "R", sa, [612 - tug * 14, 1360 + tug * 18]), handR: "grip", armL: [-30 - tug * 20, -60], handL: "open", lean: 0, breathe: f * 1.5 }, L2("day"));
    }} />
  </Stage>;
};
const B14: React.FC<BP> = ({ p, f, t }) => {
  const reach = ramp(t, 3, 18), flinch = ramp(t, 17, 22) * (1 - ramp(t, 30, 40)), rub = ramp(t, 36, 46);
  return <Stage look="day" cam={V(0.2, 1.2, 3)} target={V(0, 1.5, -4)} blur={10} vignette={0.4} tint="#ffd080" fogScale={0.7}
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.025 * glide(p) };
      const L: Light = { x: 900, y: 300, r: 1700, key: "#fff0c8", shade: "#2a3018", keyA: 0.3, shadeA: 0.35 };
      const sa = { x: 330, y: 880 + 556 * 3.0 + flinch * 14, s: 3.0 };
      person(g, c, 1, "sasuke", "child", { ...sa, facing: 0.45, look: [0.6, -0.7], brow: 0.5 - flinch * 0.6, eye: 0.6 - flinch * 0.45, mouth: -0.4 - rub * 0.2, open: rub * 0.15, nod: -0.04 + flinch * 0.05, tilt: -6, armR: rub > 0 ? lerpArm([-10, -10], reachArm("sasuke", "child", "R", sa, forehead(sa.x, sa.y, sa.s, 640)), rub) : undefined, handR: rub > 0.5 ? "open" : undefined, still: true, breathe: f }, L);
      const it4 = { x: 900, y: 450 + 801 * 2.4, s: 2.4 };
      const tgt = forehead(sa.x, sa.y, sa.s, 640);
      person(g, c, 1, "itachi", "teen", { ...IT_T, ...it4, facing: -0.55, look: [-0.8, 0.6], brow: 0.35, mouth: 0.2 + reach * 0.3, tilt: 5, armL: lerpArm([10, 15], reachArm("itachi", "teen", "L", it4, [tgt[0] + (1 - ramp(t, 18, 28)) * 0 + ramp(t, 22, 32) * 60, tgt[1]]), ramp(t, 3, 18) * (1 - ramp(t, 24, 36))), handL: "point", still: true, breathe: f }, L);
      particles(g, f, "dust", 61, 30, "rgba(255,250,210,0.7)"); }} />}>
    <Forest f={f} />
  </Stage>;
};
const B15: React.FC<BP> = ({ p, f }) => {
  const cam = mv([-0.7, 1.0, 1.9], [-0.8, 1.15, 2.9], p);
  return <Stage look="day" cam={cam} target={V(0.2, 1.0, -3)} fov={40} vignette={0.4} tint="#ffd080" fogScale={0.7}>
    <Forest f={f} />
    <CardActor kind="sasuke" age="child" at={[-0.45, 0, 0.6]} heightM={1.15} camPos={cam} light={L2("day")} res={0.7} pose={{ back: true, shoulders: 0.4, breathe: f }} />
    <CardActor kind="itachi" age="teen" at={[lerp(0.4, 0.7, p), 0, lerp(-2.6, -3.3, p)]} heightM={1.62} camPos={cam} light={L2("day")} pose={{ ...IT_T, facing: 0.65, look: [-0.9, 0], mouth: 0.6, walk: f * 0.3, breathe: f }} />
  </Stage>;
};

// ======================= CONFLICT =======================
const B16: React.FC<BP> = ({ p, f }) => {
  const cam = mv([-2.4, 4.7, 4.4], [-1.3, 5.2, 3.6], p), look = mv([-0.6, 3.3, 1.0], [0, 0.8, -3.0], p);
  return <Stage look="night" cam={cam} target={look} fov={44} vignette={0.6} tint="#3a3a7a">
    <Rooftops f={f} />
    <CardActor kind="itachi" age="teen" at={[-0.9, 3.62, 1.75]} heightM={1.62} camPos={cam} light={{ ...L2("night"), x: 700, y: 1700, key: "#ffb070", keyA: 0.25 }} pose={{ ...IT_T, mask: true, kneel: 1, facing: 0.6, look: [0.4, 0.9], armL: [-20, -40], armR: [-30, -60], breathe: f * 0.6 }} />
  </Stage>;
};
const B17: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([1.5, 0.72, 0.6], [0.55, 0.55, -0.55], p), look = mv([-0.3, 0.7, -1.5], [-0.1, 0.48, -1.1], p);
  const slide = ramp(t, 10, 50), hand = ramp(t, 70, 100);
  const elder = (i: number): Partial<Pose> => ({ coat: ["#3a3446", "#4a2e34", "#2e3a40"][i], coatHi: ["#4e465e", "#64404a", "#40505a"][i], robe: true, trim: null, kneel: 1, brow: -0.5, mouth: -0.3, look: [-0.4, 0.5], breathe: f + i * 17 });
  return <Stage look="interior" cam={cam} target={look} fov={40} vignette={0.65} tint="#4a3a6a">
    <Council f={f} scroll={slide} file={0} />
    {[-0.85, 0.05, 0.9].map((x, i) => <CardActor key={i} kind="bully" age="adult" at={[x, 0, -2.2]} heightM={1.7} camPos={cam} spherical light={L2("interior")} pose={{ ...elder(i), armR: i === 1 ? lerpArm([-10, -10], [-70, -30], slide * (1 - ramp(t, 55, 70))) : undefined }} />)}
    <CardActor kind="itachi" age="teen" at={[-0.95, 0, -0.35]} heightM={1.62} camPos={cam} spherical light={L2("interior")} pose={{ ...IT_T, kneel: 1, facing: 0.35, look: [0.5, 0.5], brow: 0.45, mouth: -0.15, armR: lerpArm([-15, -30], [-55, -20], hand), armL: [15, 25], breathe: f * 0.8 }} />
  </Stage>;
};
const B18: React.FC<BP> = ({ p, f }) => {
  const q = 0.35 * p + 0.65 * p * p; const L_ = (a: P3, b: P3) => V(lerp(a[0], b[0], q), lerp(a[1], b[1], q), lerp(a[2], b[2], q)); const cam = L_([0.4, 1.7, 0.9], [2.0, 6.0, 14.0]), look = L_([0, 1.0, -6], [0.8, -4.0, -30]);
  return <Stage look="night" cam={cam} target={look} fov={44} vignette={0.55} tint="#2a3a7a"
    overlay={<Over draw={(g) => particles(g, f, "sparks", 77, 40, "rgba(215,255,160,0.85)", 2.2)} />}>
    <CliffTop f={f} />
    <CardActor kind="itachi" age="teen" at={[0, 0, -1.4]} heightM={1.62} camPos={cam} light={L2("night")} pose={{ ...IT_T, back: true, shoulders: 0.3, breathe: f }} />
  </Stage>;
};
const B19: React.FC<BP> = ({ p, f, t }) => {
  const tear = ramp(t, 14, 40), close = ramp(t, 46, 56), tie = ramp(t, 64, 84) * (1 - ramp(t, 96, 104) * 0.3);
  const s = 3.4, it = { x: 540, y: 330 + 880 * s, s };
  const hx = 540, hy = 330 + 30 * s;
  return <Stage look="night" cam={V(0, 1.5, 1)} target={V(0, -2, -30)} blur={10} vignette={0.6} tint="#2a3a7a"
    overlay={<Over draw={(g) => { const c = { x: 40 * Math.sin(p * 2.2), y: -40 * p, zoom: 1 + 0.14 * p };
      particles(g, f * 2.5, "dust", 91, 22, "rgba(210,255,170,0.75)", 1.6);
      person(g, c, 1, "itachi", "teen", { ...IT_T, ...it, facing: -0.15, look: [0.3, 0.3], brow: 0.75, eye: 0.85 - close * 0.75, mouth: -0.25, tear, nod: close * 0.03,
        armL: tie > 0 ? lerpArm([12, 14], reachArm("itachi", "teen", "L", it, [hx - 120, hy]), tie) : [12, 14], armR: tie > 0 ? lerpArm([-12, -14], reachArm("itachi", "teen", "R", it, [hx + 120, hy]), tie) : [-12, -14], handL: "grip", handR: "grip", tremble: tie * 0.2, still: true, breathe: f }, { ...L2("night"), x: 200, y: 300 });
      particles(g, f, "dust", 33, 18, "rgba(200,230,255,0.5)"); }} />}>
    <CliffTop f={f} />
  </Stage>;
};
const B20: React.FC<BP> = ({ p, f }) => {
  const cam = mv([0.4, 2.2, -10], [0.4, 2.2, -2], p);
  const out = (z: number) => clamp(((-z) / 46 - (1 - p * 1.25)) * 8);
  return <Stage look="nightRed" cam={cam} target={V(0, 1.8, -50)} vignette={0.6} tint="#4a1830"><ClanStreet f={f} mood="night" lanternOut={out} /></Stage>;
};
const B21: React.FC<BP> = ({ p, f }) => {
  const cam = mv([1.1, 0.95, 3.9], [1.12, 0.95, 3.7], p);
  return <Stage look="night" cam={cam} target={V(1.2, 1.05, -0.4)} fov={36} vignette={0.6} tint="#2a2050">
    <Backdrop mood="night" moon="red" z={-60} y={18} />
    <Street len={30} width={14} mood="night" z0={8} />
    <House x={0} z={-3} w={7} d={5} h={3.6} face={0} seed={77} mood="night" door="open" lit={0} />
    <House x={-8} z={-4} w={6} d={5} h={3.2} face={0} seed={78} mood="night" lit={0} /><House x={8} z={-4} w={6} d={5} h={3.4} face={0} seed={79} mood="night" lit={0} />
    <mesh position={[1.25, 1.0, -0.47]}><planeGeometry args={[1.25, 2.0]} /><meshBasicMaterial color="#ffc070" /></mesh>
    <mesh position={[1.25, 0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.3, 1.8]} /><meshBasicMaterial color="#c8823a" transparent opacity={0.45} depthWrite={false} /></mesh>
    <Lantern pos={[-2.6, 2.4, -0.8]} out={1} /><Lantern pos={[3.3, 2.4, -0.8]} out={1} />
    <Motes f={f} n={30} box={[[0.6, 0.2, -0.4], [1.9, 2.0, 0.6]]} color="#ffd8a0" size={0.02} rise={0.3} seed={4} />
    <CardActor kind="sasuke" age="child" at={[1.25, 0, -0.25]} heightM={1.2} camPos={cam} res={0.7} light={{ x: 540, y: 600, r: 1500, key: "#ffc070", shade: "#0a0a1c", keyA: 0.35, shadeA: 0.5 }} pose={{ facing: -0.1, look: [0.1, 0.0], brow: 0.8, eye: 1.15, mouth: -0.3, open: 0.12, handL: "grip", handR: "grip", tremble: 0.15, breathe: f * 1.4 }} />
  </Stage>;
};

// ======================= TRANSFORMATION =======================
const B22: React.FC<BP> = ({ p, f, t }) => {
  const low = ramp(t, 0, 20);
  return <Stage look="nightRed" cam={V(0.2, 1.4, -8)} target={V(0, 2.5, -40)} blur={10} vignette={0.65} tint="#5a1830"
    overlay={<Over draw={(g) => { const c = { x: 0, y: lerp(650, 0, glide(p)), zoom: 1 };
      person(g, c, 1, "itachi", "adult", { ...IT_A, x: 600, y: 3300, s: 3.0, facing: -0.3, look: [-0.2, 0.5], brow: 0.3, eye: 0.6, mouth: -0.15, armR: lerpArm([-40, -60], [-6, -4], low), handR: "grip", prop: blade, armL: [10, 10], tremble: 0.6, still: true, breathe: f }, { ...L2("nightRed"), x: 900, y: 400 });
      particles(g, f, "dust", 22, 25, "rgba(255,150,120,0.5)"); }} />}>
    <ClanStreet f={f} mood="night" />
  </Stage>;
};
const B23: React.FC<BP> = ({ p, f, t }) => {
  const back = glide(p);
  return <Stage look="nightRed" cam={V(-0.3, 0.6, -6)} target={V(0, 4, -40)} blur={8} vignette={0.65} tint="#6a1828"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.05 * back };
      person(g, c, 1, "itachi", "adult", { ...IT_A, x: 770, y: 2300, s: 2.0, facing: -0.6, look: [-0.7, 0.7], brow: -0.55, eye: 0.7, mouth: -0.2, eyesRed: 1, armR: [-6, -4], prop: blade, still: true, breathe: f }, { ...L2("nightRed"), x: 1000, y: 300 });
      person(g, c, 1, "sasuke", "child", { x: lerp(330, 220, back), y: 1960, s: 2.1, facing: 0.5, look: [0.8, -0.8], brow: 1, eye: 1.2, mouth: -0.6, open: 0.3, lean: -6 * back, armL: [-50, -70], armR: [40, 70], handL: "open", handR: "open", tremble: 0.5, still: true, breathe: f * 2 }, { ...L2("nightRed"), x: 900, y: 600 });
      g.save(); g.globalCompositeOperation = "screen"; g.fillStyle = radGrad(g, 700, 520, 0, 300, [[0, "rgba(255,30,20,0.3)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore(); }} />}>
    <ClanStreet f={f} mood="night" />
  </Stage>;
};
const B24: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([-1.9, 1.3, -2.6], [-1.6, 1.25, -3.2], p);
  const hit = Math.sin(t * 0.75) > 0.2;
  return <Stage look="rainDay" cam={cam} target={V(-0.3, 1.1, -6)} fov={42} vignette={0.55} tint="#3a4a6a">
    <TrainingYard f={f} rain crack={ramp(t, 18, 34)} />
    <CardActor kind="sasuke" age="teen" at={[-0.85, 0, -5.75]} heightM={1.6} camPos={cam} res={0.6} light={L2("rainDay")} pose={{ facing: 0.8, look: [0.8, 0], brow: -0.8, mouth: -0.5, open: hit ? 0.2 : 0, lean: hit ? 6 : 2, armR: hit ? [-100, -5] : [-40, -110], armL: hit ? [-30, -110] : [-90, -10], handR: "fist", handL: "fist", breathe: f * 2 }} />
  </Stage>;
};
const B25: React.FC<BP> = ({ p, f }) => {
  const cam = mv([0.4, 1.6, 4.2], [-0.12, 1.62, 0.55], p);
  return <Stage look="rainDay" cam={cam} target={mv([0, 1.6, -2], [-0.2, 1.6, -2], p)} fov={42} vignette={0.6} tint="#3a4a6a"><NoticeBoard f={f} /></Stage>;
};
const B26: React.FC<BP> = ({ p, f }) => {
  const cam = mv([0.55, 0.32, 3.0], [0.8, 1.5, 6.4], p), look = mv([0.3, 0.06, 2.0], [0.1, 1.1, -14], p);
  return <Stage look="rainDay" cam={cam} target={look} vignette={0.5} tint="#6a6a6a">
    <ClanStreet f={f} mood="day" overgrown />
    <group position={[0.3, 0.03, 2.0]} rotation={[0, 0.6, Math.PI / 2]}>
      <Inked geo={new THREE.BoxGeometry(0.035, 0.22, 0.012)} mat={toon("#a8865a")} pos={[0, 0.06, 0]} />
      <Inked geo={new THREE.CylinderGeometry(0.014, 0.014, 0.11, 8)} mat={toon("#5a3a22")} pos={[0, -0.1, 0]} />
      <Inked geo={new THREE.TorusGeometry(0.022, 0.006, 6, 12)} mat={toon("#5a3a22")} pos={[0, -0.175, 0]} />
    </group>
  </Stage>;
};

// ======================= REVELATION =======================
const B27: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([-2.6, 0.8, 5.6], [-1.1, 0.85, 5.2], p);
  const flash = t > 18 && t < 24 ? 1 - (t - 18) / 6 : 0;
  return <Stage look="storm" cam={cam} target={V(0.2, 1.4, -3)} vignette={0.6} flash={flash} tint="#2a3a5a">
    <RuinedHall f={f} flash={flash} />
    <CardActor kind="itachi" age="adult" at={[0.5, 0.54, -5.6]} heightM={1.75} camPos={cam} light={L2("storm")} pose={{ ...IT_A, facing: 0.1, brow: 0.2, mouth: 0, eyesRed: 0.6, armL: [6, 6], armR: [-6, -6], breathe: f }} />
    <CardActor kind="sasuke" age="teen" at={[-0.4, 0, 0.8]} heightM={1.62} camPos={cam} res={0.7} light={L2("storm")} pose={{ back: true, armR: [-8, -20], handR: "fist", breathe: f * 1.5 }} />
  </Stage>;
};
const B28: React.FC<BP> = ({ p, f, t }) => {
  const step = glide(p), cough = ramp(t, 20, 26) * (1 - ramp(t, 40, 50)); const flash = t > 52 && t < 58 ? 1 - (t - 52) / 6 : 0;
  return <Stage look="storm" cam={V(0, 1.6, 3)} target={V(0, 1.7, -6)} blur={8} vignette={0.6} flash={flash} tint="#2a3a5a"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.06 * step };
      const its = lerp(1.6, 2.05, step), it = { x: lerp(720, 680, step), y: lerp(1720, 1880, step), s: its };
      person(g, c, 1, "itachi", "adult", { ...IT_A, ...it, facing: -0.3, look: [-0.5, 0.2], brow: 0.5 + cough * 0.3, eye: 0.65 - cough * 0.3, mouth: -0.2, open: cough * 0.3, lean: Math.sin(t * 0.18) * 4, nod: cough * 0.06, shoulders: 0.5 + cough * 0.4, armR: cough > 0 ? lerpArm([-6, -6], [-150, -150], cough) : [-6, -6], handR: "fist", armL: [-30 + Math.sin(t * 0.18) * 10, -20], handL: "open", breathe: f * 1.6 }, { ...L2("storm"), x: 400, y: 0 });
      person(g, c, 1, "sasuke", "teen", { x: lerp(260, 180, step), y: 500 + 880 * 3.4, s: 3.4, back: true, shoulders: -0.3, armR: [-10, -30], handR: "fist", breathe: f * 1.8 }, { ...L2("storm"), x: 800, y: 200 });
      particles(g, f, "rain", 71, 100, "rgba(200,215,240,0.5)", 1.1); }} />}>
    <RuinedHall f={f} flash={flash} />
  </Stage>;
};
const B29: React.FC<BP> = ({ p, f, t }) => {
  const reach = ramp(t, 2, 16), smile = ramp(t, 20, 36);
  return <Stage look="storm" cam={V(-0.5, 1.6, 2)} target={V(-1, 1.8, -6)} blur={12} vignette={0.55} tint="#3a5a8a"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.025 * glide(p) };
      const L: Light = { x: 540, y: 100, r: 1800, key: "#c0d0f0", shade: "#060810", keyA: 0.3, shadeA: 0.6 };
      const sa = { x: 330, y: 800 + 801 * 2.7, s: 2.7 };
      person(g, c, 1, "sasuke", "teen", { ...sa, facing: 0.45, look: [0.7, -0.5], brow: 0.9, eye: 1.15 - reach * 0.2, mouth: -0.5, open: 0.15, shoulders: -0.7, tilt: -4, still: true, breathe: f }, L);
      const it6 = { x: 900, y: 470 + 925 * 2.3, s: 2.3 };
      person(g, c, 1, "itachi", "adult", { ...IT_A, ...it6, facing: -0.55, look: [-0.8, 0.5], brow: 0.5 - smile * 0.2, eye: 0.6 - smile * 0.1, mouth: 0.1 + smile * 0.5, tilt: 8, armL: lerpArm([10, 12], reachArm("itachi", "adult", "L", it6, forehead(sa.x, sa.y, sa.s, 880)), reach), handL: "point", tremble: 0.15, still: true, breathe: f * 0.5 }, L);
      particles(g, f, "rain", 71, 120, "rgba(200,215,240,0.55)", 1.1); }} />}>
    <RuinedHall f={f} />
  </Stage>;
};
const B30: React.FC<BP> = ({ p, f, t }) => {
  const cam = mv([0.6, 1.6, 3.2], [0.8, 7.5, 5.5], p), look = mv([-0.7, 1.0, -1.0], [-0.6, 0.3, -1.0], p);
  const slide = ramp(t, 0, 30);
  return <Stage look="storm" cam={cam} target={look} vignette={0.6} tint="#2a3a5a">
    <RuinedHall f={f} />
    <CardActor kind="itachi" age="adult" at={[-1.3, 0, -0.75]} heightM={1.75} camPos={cam} spherical light={L2("storm")} pose={{ ...IT_A, kneel: slide, shoulders: 0.4 + slide * 0.6, nod: slide * 0.08, eye: 0.6 - slide * 0.5, mouth: 0.4, lean: -slide * 10, armL: [10 + slide * 20, 10], armR: [-10, -10], still: true, breathe: f * 0.3 }} />
    <CardActor kind="sasuke" age="teen" at={[0.3, 0, -0.4]} heightM={1.62} camPos={cam} spherical light={L2("storm")} pose={{ facing: -0.5, look: [-0.8, 0.6], brow: 0.9, eye: 1.0, mouth: -0.4, open: 0.1, shoulders: 0.3, armL: [5, 5], armR: [-5, -5], breathe: f }} />
  </Stage>;
};
const B31: React.FC<BP> = ({ p, f, t }) => {
  const a = lerp(-0.55, -0.15, glide(p)), cam = V(Math.sin(a) * 3.0, 1.3, -1.6 + Math.cos(a) * 3.0);
  const hand = ramp(t, 40, 75);
  return <Stage look="night" cam={cam} target={V(0, 0.45, -3.6)} vignette={0.55} tint="#2a3a7a">
    <CliffTop f={f} />
    <CardActor kind="sasuke" age="teen" at={[0, 0, -1.5]} heightM={1.62} camPos={cam} light={L2("night")} res={0.7} pose={{ back: true, kneel: 1, shoulders: 0.4, armR: lerpArm([-6, -10], [-160, -40], hand), breathe: f }} />
  </Stage>;
};

// ======================= PAYOFF =======================
const B32: React.FC<BP> = ({ p, f, t }) => {
  const s = 3.4, sa = { x: 540, y: 300 + 880 * s, s }; const touch = ramp(t, 0, 14);
  return <Stage look="night" cam={V(0.5, 1.4, 1.2)} target={V(0, -2, -30)} blur={11} vignette={0.6} tint="#2a3a7a"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.06 * glide(p) };
      person(g, c, 1, "sasuke", "teen", { ...sa, facing: 0.15, look: [0.1, 0.5], brow: 0.95, eye: 0.7, mouth: -0.35, tear: 1, tilt: -3, armR: lerpArm([-8, -10], reachArm("sasuke", "teen", "R", sa, [540 + 18 * s, 300 + 40 * s]), touch), handR: "point", tremble: 0.2, still: true, breathe: f }, { ...L2("night"), x: 300, y: 300 });
      particles(g, f, "dust", 44, 18, "rgba(200,230,255,0.5)"); }} />}>
    <CliffTop f={f} />
  </Stage>;
};
const B33: React.FC<BP> = ({ p, f, t, d }) => {
  const up = ramp(t, 60, d);
  const cam = mv([2.4, 1.1, 3.0], [2.0, 6.5, 8.5], up), look = mv([-0.1, 0.9, -1.2], [-3, 7, -40], up);
  const reach = ramp(t, 8, 22) * (1 - ramp(t, 34, 48)), laugh = ramp(t, 26, 40);
  const flashIn = 1 - ramp(t, 0, 10), fade = ramp(t, d - 30, d - 2);
  return <AbsoluteFill>
    <Stage look="sunset" cam={cam} target={look} fov={38} vignette={0.4} tint="#ffa040">
      <Porch f={f} />
      <CardCanvas at={[-0.1, 0, -0.9]} ppm={PPM2} camPos={cam} draw={(g) => {
        const sa = { x: 380, y: 1880, s: 1.27 }, it = { x: 680, y: 1880, s: 1.27 };
        person(g, ON, 1, "sasuke", "child", { ...sa, facing: 0.45, look: [0.7, -0.5], brow: 0.3 - laugh * 0.3, eye: 1 - laugh * 0.5, mouth: -0.2 + laugh * 1.1, open: laugh * 0.35, nod: reach * 0.03, breathe: f }, L2("sunset"));
        person(g, ON, 1, "itachi", "teen", { ...IT_T, ...it, kneel: 1, facing: -0.5, look: [-0.7, 0.2], mouth: 0.4 + laugh * 0.6, open: laugh * 0.3, eye: 1 - laugh * 0.4, armL: lerpArm([12, 20], reachArm("itachi", "teen", "L", { ...it, kneel: 1 }, forehead(sa.x, sa.y, sa.s, 640)), reach), handL: "point", breathe: f }, L2("sunset"));
      }} />
    </Stage>
    <AbsoluteFill style={{ background: "#fff2d8", opacity: flashIn * 0.7 }} />
    <AbsoluteFill style={{ background: "#000", opacity: fade }} />
  </AbsoluteFill>;
};

const SCENES: React.FC<BP>[] = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20, B21, B22, B23, B24, B25, B26, B27, B28, B29, B30, B31, B32, B33];
type Beat = { id: number; start_s: number; end_s: number };

const BeatScene: React.FC<{ i: number; from: number; d: number }> = ({ i, from, d }) => {
  const t = useCurrentFrame(); const S = SCENES[i];
  return <S t={t} d={d} p={clamp(t / Math.max(1, d - 1))} f={from + t} />;
};

type Cap = { text: string; s: number; e: number; hl: number[] };
const Captions: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const c = (CAPS as Cap[]).find((x) => t >= x.s - 0.04 && t < x.e);
  if (!c) return null;
  const k = Math.min(1, (t - c.s + 0.04) / 0.1);
  return (
    <div style={{ position: "absolute", left: 56, right: 120, top: 1330, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>
      <div style={{ background: "rgba(8,6,12,0.62)", borderRadius: 22, padding: "14px 30px 18px", boxShadow: "0 0 0 2px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.55)",
        fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: 58, lineHeight: 1.2, color: "#fbf7ef", textAlign: "center", textWrap: "balance", maxWidth: 860,
        textShadow: "0 2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 0 0 12px rgba(0,0,0,0.9)" }}>
        {c.text.split(" ").map((w, i) => <span key={i} style={{ color: c.hl.includes(i) ? "#ff9a8a" : undefined }}>{w.replace(/-/g, "‑")}{" "}</span>)}
      </div>
    </div>
  );
};

/** Unifying film grain over the whole picture (4 cached tiles). */
const grainTiles = (() => { let t: HTMLCanvasElement[] | null = null; return () => t ??= [0, 1, 2, 3].map((k) => { const [c, g] = makeCanvas(256, 256); const im = g.createImageData(256, 256); const r = rng(k * 99 + 7); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; }); })();
const Grain: React.FC = () => <CanvasFrame draw={(g, f) => { g.fillStyle = g.createPattern(grainTiles()[f % 4], "repeat")!; g.fillRect(0, 0, W, H); }} />;

export const TOTAL_FRAMES = fr((BEATS.beats as Beat[]).at(-1)!.end_s);
export const ItachiEpisode: React.FC<{ only?: number }> = ({ only }) => {
  const beats = BEATS.beats as Beat[];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {beats.map((b, i) => { const from = fr(b.start_s), d = fr(b.end_s) - from; if (only !== undefined && only !== b.id) return null;
        return <Sequence key={b.id} from={from} durationInFrames={d} layout="none"><AbsoluteFill><BeatScene i={i} from={from} d={d} /></AbsoluteFill></Sequence>; })}
      <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.06 }}><Grain /></AbsoluteFill>
      <Captions />
    </AbsoluteFill>
  );
};
