// "The Scroll That Was Always Empty" (Tai Lung, Kung Fu Panda 2008) — full episode.
// 31 beats keyed to beats.json (times from the real voice). Look/lights/caption style in ./look.ts.
import React from "react";
import { AbsoluteFill, Sequence, getInputProps, useCurrentFrame } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Cam, Ctx, FPS, H, W, clamp, glide, lerp, linGrad, makeCanvas, particles, radGrad, ramp, rng } from "../../btl/core";
import { Age, Arm, Kind, Light, Pose, person, reachArm } from "../../btl/people";
import { blink, talk } from "../../btl/kit";
import { CaptionBox, Cap } from "../../btl/captions";
import { CardActor, CardCanvas, V } from "../../three/kit3d";
import { Flame, Grass, LightShaft, MistPlane, Motes } from "../../three/props";
import { Lantern } from "../../three/village";
import { Mountain, PalaceHall, PeachTree, PrisonCavern, ScrollCase, ScrollHall, Stairs, ValleyHouse, stoneTex } from "../../three/valley";
import { Stage } from "../itachi/stage";
import { CAPTION, GRADE, LIGHTS, PAL } from "./look";
import BEATS from "./beats.json";
import CAPS from "./captions.json";

const fr = (s: number) => Math.round(s * FPS);
type P3 = [number, number, number];
type BP = { t: number; d: number; p: number; f: number };
const mv = (a: P3, b: P3, p: number) => { const k = glide(p); return V(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)); };
const la = (a: Arm, b: Arm, k: number): Arm => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const ON: Cam = { x: 0, y: 0, zoom: 1 };
const Over: React.FC<{ draw: (g: Ctx) => void }> = ({ draw }) => <CanvasFrame draw={(g) => draw(g)} />;
const P = (kind: Kind, age: Age, pose: Pose, L: Light, g: Ctx, cam: Cam = ON) => person(g, cam, 1, kind, age, pose, L);
const SALUTE_L: Arm = [35, 105], SALUTE_R: Arm = [-35, -105], SLEEVES_L: Arm = [35, 75], SLEEVES_R: Arm = [-35, -75];

// ---------- shared sets ----------
const Courtyard: React.FC<{ f: number; dusk?: boolean }> = ({ f, dusk = true }) => <>
  <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><meshToonMaterial map={stoneTex()} /></mesh>
  <PalaceHall pos={[-1, 0, -12]} w={12} d={7} h={4} lit={dusk} /><Stairs pos={[-1, 0, -6.6]} n={4} w={6} />
  <PeachTree pos={[5, 0, -9]} s={1.1} seed={3} /><PeachTree pos={[-7, 0, -9]} s={0.9} seed={8} />
  <Motes f={f} n={50} box={[[-6, 0.3, -10], [6, 4, 2]]} color="#ffd8a0" size={0.05} />
</>;
const Valley: React.FC<{ f: number; houses?: boolean }> = ({ f, houses = true }) => <>
  <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[300, 300]} /><meshToonMaterial color="#7a8a5a" /></mesh>
  <Mountain pos={[0, 0, -70]} r={34} h={30} top={0.22} seed={2} /><Mountain pos={[-55, 0, -110]} r={40} h={36} seed={5} color="#7a7884" /><Mountain pos={[60, 0, -100]} r={36} h={28} seed={9} color="#7a7884" />
  <PalaceHall pos={[0, 30, -70]} w={14} d={9} h={5} lit /><PalaceHall pos={[-9, 30, -74]} w={7} d={6} h={3.5} tiers={1} rotY={0.3} /><PalaceHall pos={[9, 30, -74]} w={7} d={6} h={3.5} tiers={1} rotY={-0.3} />
  <Stairs pos={[0, 0, -36]} n={80} w={3} rise={0.37} run={0.36} />
  {houses && [[-9, 2], [8, 0], [-14, -8], [14, -10], [-6, -16], [6, -18], [-18, 6], [17, 4]].map(([x, z], i) => <ValleyHouse key={i} pos={[x, 0, z]} rotY={x > 0 ? -0.4 : 0.4} seed={i + 2} />)}
  {[[-4, 6], [4.5, 4], [-11, -3], [11, -4], [-3, -10]].map(([x, z], i) => <PeachTree key={i} pos={[x, 0, z]} s={0.8} seed={i * 5 + 1} />)}
  <Grass x0={-20} x1={20} z0={-20} z1={10} n={240} color="#8a9a5a" />
  <MistPlane pos={[0, 14, -50]} w={120} h={14} a={0.35} f={f} color="#fff0e0" /><MistPlane pos={[0, 6, -30]} w={90} h={8} a={0.25} f={f * 1.4} color="#ffe8d8" />
</>;
/** small props drawn in 2D */
const scrollProp = (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.save(); g.translate(x, y); g.rotate(-0.5);
  g.fillStyle = "#8a1a1a"; g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.roundRect(-18, -110, 36, 220, 14); g.fill(); g.stroke();
  g.fillStyle = PAL.gold; for (const yy of [-120, 100]) { g.beginPath(); g.roundRect(-22, yy, 44, 20, 6); g.fill(); g.stroke(); } g.restore(); };
const staff = (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.strokeStyle = "#5a3a24"; g.lineWidth = 14; g.lineCap = "round"; g.beginPath(); g.moveTo(x - 6, y - 260); g.lineTo(x + 10, y + 420); g.stroke(); };
const wrapBand = (g: Ctx, x: number, y: number, rot: number, s: number, a = 1, frayed = 0) => { g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = frayed ? "#cfc2a4" : "#e8dcc0"; g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.roundRect(-70, -26, 140, 52, 16); g.fill(); g.stroke();
  g.strokeStyle = "rgba(120,90,60,0.6)"; g.lineWidth = 3; for (const xx of [-35, 0, 35]) { g.beginPath(); g.moveTo(xx - 10, -24); g.lineTo(xx + 10, 24); g.stroke(); }
  g.fillStyle = frayed ? "#cfc2a4" : "#e8dcc0"; g.strokeStyle = "#1c121c"; g.lineWidth = 4; g.beginPath(); g.moveTo(60, 0); g.quadraticCurveTo(120, 30, 150, 110); g.lineTo(125, 115); g.quadraticCurveTo(100, 50, 55, 22); g.closePath(); g.fill(); g.stroke();
  if (frayed) { g.strokeStyle = "#cfc2a4"; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-70, -20 + k * 8); g.lineTo(-84 - (k % 3) * 5, -22 + k * 9); g.stroke(); } }
  g.restore(); };
const paw = (g: Ctx, x: number, y: number, s: number, rot: number, fur: string, curl = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = fur; g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.roundRect(-40, 0, 80, 200, 36); g.fill(); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-30 + i * 20, 205 - curl * 25, 13, 20 - curl * 8, 0, 0, 6.283); g.fill(); g.stroke(); } g.restore(); };
/** a character drawn as a pure silhouette */
let silC: [HTMLCanvasElement, Ctx] | null = null;
const silhouette = (g: Ctx, kind: Kind, age: Age, pose: Pose, color: string, a: number) => {
  const [c, s] = (silC ??= makeCanvas(W, H)); s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, W, H); s.globalCompositeOperation = "source-over";
  person(s, ON, 1, kind, age, pose, LIGHTS.HALL); s.globalCompositeOperation = "source-in"; s.fillStyle = color; s.fillRect(0, 0, W, H); s.globalCompositeOperation = "source-over";
  g.save(); g.globalAlpha = a; g.drawImage(c, 0, 0); g.restore(); };
const darkVig = (g: Ctx, a: number, r0 = 450) => { g.fillStyle = radGrad(g, W / 2, H * 0.45, r0, 1250, [[0, "rgba(0,0,0,0)"], [1, `rgba(4,2,6,${a})`]]); g.fillRect(0, 0, W, H); };

// ======================= HOOK =======================
const B1: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0.3, 0.9, 2.6], [0.45, 1.15, 1.9], p); const sal = ramp(t, 14, 32);
  return <Stage look="sunset" cam={cam} target={mv([-0.4, 1.7, -6], [-0.2, 1.8, -6], p)} fov={48} vignette={0.55} tint="#c87a40"><Courtyard f={f} />
    <CardActor kind="shifu" age="teen" at={[-1.4, 1, -7.6]} heightM={1.0} camPos={cam} light={LIGHTS.SUNSET} pose={{ facing: 0.35, look: [0.55, 0.2], mouth: -0.15, brow: -0.15, breathe: f, blink: blink(f, 3), armL: SLEEVES_L, armR: SLEEVES_R }} />
    <CardActor kind="tailung" age="teen" at={[0.75, 0, -1.6]} heightM={1.95} camPos={cam} light={LIGHTS.SUNSET} pose={{ facing: -0.6, look: [-0.7, -0.7], mouth: lerp(0.2, 0.5, sal), brow: 0.35, eye: 1.12, breathe: f * 1.6, blink: blink(f, 5),
      armR: la([-95, -5], SALUTE_R, sal), armL: la([60, 40], SALUTE_L, sal), handR: "fist", handL: sal > 0.5 ? "open" : "fist", lean: lerp(-6, -2, sal) }} />
  </Stage>; };
const B2: React.FC<BP> = ({ p, f }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  g.fillStyle = "#06040a"; g.fillRect(0, 0, W, H);
  g.fillStyle = radGrad(g, 540, 1500, 0, 1200, [[0, "rgba(255,200,110,0.55)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
  const z = 1 + 0.06 * glide(p);
  P("tailung", "adult", { x: 540 + 120, y: 560 + 1100 * 4.6, s: 4.6, headOnly: true, still: true, brow: 0.75, eye: 1.08, mouth: -0.3, look: [-0.1, 0.35], tear: 0.6, breathe: f }, LIGHTS.GOLD, g, { x: 0, y: 0, zoom: z });
  g.fillStyle = linGrad(g, 0, 1250, 0, H, [[0, "rgba(232,192,96,0)"], [1, "rgba(232,192,96,0.35)"]]); g.fillRect(0, 1250, W, H - 1250);
  particles(g, f, "dust", 2, 30, "rgba(255,220,150,0.6)"); darkVig(g, 0.85, 380); }} /></AbsoluteFill>;

// ======================= WORLD =======================
const B3: React.FC<BP> = ({ p, f }) => <Stage look="dawn" cam={mv([0, 16, 26], [0, 3.2, 15], p)} target={mv([0, 4, -40], [0, 12, -60], p)} fov={52} vignette={0.35} tint="#e8b890" fogScale={2}>
  <Valley f={f} /><Motes f={f} n={60} box={[[-10, 0.5, -4], [10, 8, 16]]} color="#ffc8d8" size={0.07} drift={0.4} /></Stage>;
const B4: React.FC<BP> = ({ p, f }) => <Stage look="dawn" cam={mv([2, 1.8, -24], [0, 4, -30], p * p * 0.4 + p * 0.6)} target={mv([0, 8, -45], [0, 30, -70], p)} fov={54} vignette={0.35} tint="#e8b890" fogScale={2}>
  <Valley f={f} houses={false} /><Motes f={f} n={40} box={[[-6, 1, -40], [6, 12, -24]]} color="#fff0d0" size={0.06} /></Stage>;
const B5: React.FC<BP> = ({ p, f }) => <Stage look="interior" cam={mv([0, 0.9, 1], [0, 1.8, -4], p)} target={mv([0, 4, -12], [0, 7, -12], p)} fov={46} vignette={0.6} tint="#a87040">
  <ScrollHall f={f} shafts={1.2} /><Motes f={f} n={70} box={[[-3, 0.5, -11], [3, 7, -2]]} color="#ffe0b0" size={0.04} rise={0.01} /></Stage>;
const B6: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  g.fillStyle = "#050306"; g.fillRect(0, 0, W, H); const k = 0.4 + 0.6 * ramp(t, 0, 40), z = 1 + 0.08 * glide(p); // never starts black (QC)
  g.fillStyle = radGrad(g, 540, 1050, 0, 300 + 900 * k, [[0, `rgba(255,226,150,${0.95 * k})`], [0.35, `rgba(232,170,70,${0.55 * k})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + t * 0.004; g.strokeStyle = `rgba(255,220,140,${0.08 * k})`; g.lineWidth = 30; g.beginPath(); g.moveTo(540, 1050); g.lineTo(540 + Math.cos(a) * 1600, 1050 + Math.sin(a) * 1600); g.stroke(); }
  silhouette(g, "tailung", "adult", { x: 540, y: 1560, s: 1.0 * z, facing: 0, still: true, armL: [25, 10], armR: [-25, -10], breathe: f }, "#120a06", ramp(t, 25, 60));
  particles(g, f * 1.5, "sparks", 6, 60, "rgba(255,220,140,0.8)", 1.4); darkVig(g, 0.6); }} /></AbsoluteFill>;

// ======================= RELATIONSHIP =======================
const B7: React.FC<BP> = ({ p, f, t }) => { const cam = mv([-0.6, 1.9, -4.4], [-0.9, 1.6, -5.7], p); const kn = ramp(t, 4, 30);
  return <Stage look="night" cam={cam} target={V(-1.0, 1.5, -8)} fov={44} vignette={0.6} tint="#4a5a8a" fogScale={0.8}><Courtyard f={f} dusk={false} />
    <Lantern pos={[0.2, 1.6, -7.4]} light scale={0.8} color="#e8a040" />
    <CardCanvas at={[-1.2, 1, -7.9]} ppm={1700} camPos={cam} draw={(g) => {
      // the bundle: a woven basket with a blanket and two tiny ears
      g.fillStyle = "#8a6a3a"; g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.ellipse(760, 1830, 150, 60, 0, 0, 6.283); g.fill(); g.stroke();
      g.fillStyle = "#c8b8d8"; g.beginPath(); g.ellipse(760, 1790, 130, 50, 0, Math.PI, 0); g.fill(); g.stroke();
      g.fillStyle = "#e2e0da"; for (const dx of [-30, 30]) { g.beginPath(); g.arc(760 + dx, 1745, 18, 0, 6.283); g.fill(); g.stroke(); }
      P("shifu", "teen", { x: 440, y: 1880, s: 1.55, kneel: kn, facing: 0.55, look: [0.8, 0.6], brow: lerp(0, 0.4, kn), eye: 1.1, mouth: 0.1, breathe: f, blink: blink(f, 7), armR: la([-8, -6], reachArm("shifu", "teen", "R", { x: 440, y: 1880, s: 1.55, kneel: 1 }, [700, 1760]), kn), handR: "open" }, LIGHTS.LANTERN, g);
    }} />
  </Stage>; };
const B8: React.FC<BP> = ({ p, f, t }) => { const grab = ramp(t, 8, 30), soft = ramp(t, 24, 50);
  return <Stage look="night" cam={V(-0.6, 1.9, -4.6)} target={V(-1.2, 1.2, -8)} fov={44} blur={12} vignette={0.65} tint="#7a6a8a"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.05 * glide(p) }, sh = { x: 300, y: 560 + 600 * 2.6, s: 2.6 }, cb = { x: 760, y: 1500 + 520 * 1.25, s: 1.25 };
      const fing: [number, number] = [lerp(640, 600, grab), lerp(1210, 1240, grab)];
      g.fillStyle = "#8a6a3a"; g.strokeStyle = "#1c121c"; g.lineWidth = 6; g.beginPath(); g.ellipse(760, 1830, 330, 160, 0, 0, 6.283); g.fill(); g.stroke();
      P("tailung", "child", { ...cb, facing: -0.35, look: [-0.7, -0.6], mouth: lerp(0, 0.75, soft), eye: 1.2, brow: 0.3, breathe: f * 2, blink: blink(f, 9), armR: reachArm("tailung", "child", "R", cb, fing), handR: "grip", armL: [20, 30] }, LIGHTS.LANTERN, g, c);
      g.fillStyle = "#c8b8d8"; g.beginPath(); g.ellipse(760, 1800, 300, 120, 0, 0, Math.PI); g.fill(); g.stroke();
      P("shifu", "teen", { ...sh, facing: 0.5, look: [0.8, 0.5], mouth: lerp(0, 0.55, soft), brow: lerp(0.4, 0.15, soft), eye: lerp(1.15, 0.9, soft), still: true, breathe: f, blink: blink(f, 4), armR: reachArm("shifu", "teen", "R", sh, [fing[0] - 10, fing[1] + 10]), handR: "point" }, LIGHTS.LANTERN, g, c);
      particles(g, f, "dust", 8, 25, "rgba(255,220,170,0.6)"); }} />}><Courtyard f={f} dusk={false} /><Lantern pos={[0.6, 1.6, -7.4]} light scale={0.8} color="#e8a040" /></Stage>; };
const B9: React.FC<BP> = ({ p, f, t }) => { const tie = ramp(t, 2, 34);
  return <Stage look="interior" cam={V(0, 1.4, 4)} target={V(0, 1.6, -6)} blur={12} vignette={0.6} tint="#c88a50"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.06 * glide(p) }, sh = { x: 360, y: 2010, s: 2.35, kneel: 0.6 }, cb = { x: 790, y: 1990, s: 1.75 };
      const pw: [number, number] = [610, 1330 + Math.sin(t * 0.5) * 6 * (1 - tie)];
      P("tailung", "child", { ...cb, facing: -0.4, look: [-0.5, 0.6], mouth: lerp(0.3, 0.7, tie), brow: 0.3, eye: 1.1, breathe: f * 1.6, blink: blink(f, 11), armR: reachArm("tailung", "child", "R", cb, pw), handR: "open", armL: [20, 10] }, LIGHTS.LANTERN, g, c);
      P("shifu", "teen", { ...sh, facing: 0.45, look: [0.6, 0.3], mouth: 0.35, brow: 0.2, breathe: f, blink: blink(f, 12), armR: reachArm("shifu", "teen", "R", sh, [pw[0] - 20 + Math.sin(t * 0.8) * 14 * (1 - tie), pw[1] + 40]), armL: reachArm("shifu", "teen", "L", sh, [pw[0] - 10 - Math.cos(t * 0.8) * 12 * (1 - tie), pw[1] - 30]), handR: "grip", handL: "grip" }, LIGHTS.LANTERN, g, c);
      g.save(); g.translate((pw[0] - 540) * (c.zoom - 1), (pw[1] - 960) * (c.zoom - 1)); wrapBand(g, pw[0] + 10, pw[1] + 30, -0.4, c.zoom, tie > 0 ? 1 : 0); g.restore();
      particles(g, f, "dust", 9, 30, "rgba(255,220,170,0.6)"); }} />}><ScrollHall f={f} scroll={false} /></Stage>; };
const B10: React.FC<BP> = ({ p, f, t, d }) => { const cam = mv([-2.4, 1.3, 2.4], [2.2, 1.4, 2.0], p); const seg = Math.min(2, Math.floor(t / (d / 3))), ph = (t % (d / 3)) / (d / 3);
  const age: Age = seg === 0 ? "child" : "teen", h = seg === 0 ? 0.85 : seg === 1 ? 1.65 : 1.95; const strike = Math.sin(ph * Math.PI * 2 * (1 + seg * 0.5));
  const tint = seg === 0 ? "#d89a50" : seg === 1 ? "#c87a40" : "#a8b8d0", motes = seg === 2 ? "#ffffff" : seg === 1 ? "#e8a050" : "#ffc8d8";
  return <Stage look="sunset" cam={cam} target={V(0, 1, -3)} fov={44} vignette={0.5} tint={tint}><Courtyard f={f} />
    <Motes f={f} n={70} box={[[-5, 0.3, -6], [5, 5, 2]]} color={motes} size={0.06} rise={seg === 2 ? -0.02 : 0.005} />
    <CardActor kind="shifu" age="teen" at={[-1.4, 1, -7.6]} heightM={1.0} camPos={cam} light={LIGHTS.SUNSET} pose={{ facing: 0.4, look: [0.5, 0.3], mouth: 0.1, breathe: f, blink: blink(f, 13), armL: SLEEVES_L, armR: SLEEVES_R }} />
    <CardActor kind="tailung" age={age} at={[0.2, 0, -3]} heightM={h} camPos={cam} light={LIGHTS.SUNSET} pose={{ facing: -0.5 + strike * 0.2, look: [-0.5, -0.2], brow: -0.3, mouth: -0.1, breathe: f * 2, blink: blink(f, 14),
      armR: strike > 0 ? [-95 * strike, -10] : [-20, -60], armL: strike < 0 ? [95 * -strike, 10] : [20, 60], handR: "fist", handL: "fist", lean: strike * 5 }} />
  </Stage>; };
const B11: React.FC<BP> = ({ p, f, t }) => { const land = ramp(t, 0, 10), smile = ramp(t, 14, 34);
  return <Stage look="sunset" cam={V(0.45, 1.15, 1.9)} target={V(-0.2, 1.8, -6)} fov={48} blur={10} vignette={0.55} tint="#d88a40"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.07 * glide(p) };
      P("shifu", "teen", { x: 300, y: 260 + 600 * 1.9, s: 1.9, facing: 0.4, look: [0.6, 0.5], mouth: lerp(-0.1, 0.65, smile), brow: lerp(-0.1, 0.25, smile), nod: 0.08 * Math.sin(smile * Math.PI), breathe: f, blink: blink(f, 15), armL: SLEEVES_L, armR: SLEEVES_R }, LIGHTS.SUNSET, g, c);
      P("tailung", "teen", { x: 760, y: 900 + 960 * 1.55, s: 1.55, facing: -0.55, look: [-0.75, -0.75], eye: 1.15, mouth: lerp(0.1, 0.75, smile), brow: 0.35, breathe: f * 1.8, blink: blink(f, 16), armR: la([-100, -5], SALUTE_R, land), armL: la([70, 20], SALUTE_L, land), handR: "fist", handL: "open" }, LIGHTS.SUNSET, g, c);
      particles(g, f, "dust", 11, 30, "rgba(255,210,150,0.6)"); }} />}><Courtyard f={f} /></Stage>; };

// ======================= CONFLICT =======================
const B12: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0, 1.2, 3], [0, 1.4, 1.6], p); const turn = ramp(t, 10, 50);
  return <Stage look="interior" cam={cam} target={V(0, 1.4, -6)} fov={46} vignette={0.6} tint="#5a4a7a"><ScrollHall f={f} shafts={0.9} />
    <CardActor kind="oogway" age="adult" at={[0, 0, -7.2]} heightM={1.5} camPos={cam} light={LIGHTS.HALL} pose={{ facing: lerp(0.4, -0.05, turn), look: [lerp(0.5, 0, turn), 0.2], eye: 0.6, mouth: 0, breathe: f * 0.6, blink: blink(f, 17), prop: staff, armR: [-25, -30], armL: [20, 40] }} />
    <CardActor kind="shifu" age="teen" at={[-2.2, 0, -5]} heightM={1.0} camPos={cam} light={LIGHTS.HALL} pose={{ facing: 0.5, look: [0.6, 0], mouth: 0.15, breathe: f, blink: blink(f, 18), armL: SLEEVES_L, armR: SLEEVES_R }} />
    <CardActor kind="tailung" age="teen" at={[0.5, 0, -2.4]} heightM={1.95} camPos={cam} light={LIGHTS.HALL} pose={{ back: true, kneel: 0.75, breathe: f * 1.4 }} />
    <Motes f={f} n={50} box={[[-3, 0.5, -9], [3, 6, -1]]} color="#d8c8f0" size={0.04} />
  </Stage>; };
const B13: React.FC<BP> = ({ p, f, t, d }) => { const half = t < d * 0.45, k = half ? ramp(t, 0, d * 0.45) : ramp(t, d * 0.45, d);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#1a0c18"], [1, "#2a1426"]]); g.fillRect(0, 0, W, H);
    g.fillStyle = radGrad(g, 260, 300, 0, 1500, [[0, "rgba(170,140,210,0.35)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
    const c: Cam = { x: (half ? 1 : -1) * 30 * k, y: 0, zoom: 1 + 0.14 * k }; // stronger push (QC frozen-frame gate)
    if (half) P("oogway", "adult", { x: 540, y: 980 + 760 * 2.6, s: 2.6, headOnly: true, facing: 0.1, look: [0.2, 0.1], eye: lerp(0.65, 0.32, k), mouth: lerp(0, -0.25, k), brow: lerp(0, -0.4, k), still: true, breathe: f }, LIGHTS.HALL, g, c);
    else P("tailung", "teen", { x: 540, y: 820 + 960 * 2.4, s: 2.4, headOnly: true, facing: -0.15, look: [-0.2, -0.2], eye: lerp(1.15, 1.2, k), mouth: lerp(0.4, -0.45, k), brow: lerp(0.1, 0.85, k), open: 0.1 * k, still: true, breathe: f }, LIGHTS.HALL, g, c);
    particles(g, f, "dust", 13, 20, "rgba(210,190,240,0.5)"); darkVig(g, 0.75); }} /></AbsoluteFill>; };
const B14: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0.9, 1.75, 1.2], [0.75, 1.7, 0.4], p); const away = ramp(t, 6, 40);
  return <Stage look="interior" cam={cam} target={V(-0.4, 1.0, -4)} fov={40} vignette={0.65} tint="#6a3a5a"><ScrollHall f={f} shafts={0.8} />
    <CardActor kind="oogway" age="adult" at={[0.9, 0, -7.2]} heightM={1.5} camPos={cam} light={LIGHTS.HALL} pose={{ facing: -0.5, look: [-0.6, 0.1], eye: 0.55, breathe: f * 0.6, prop: staff, armR: [-25, -30], armL: [20, 40] }} />
    <CardActor kind="shifu" age="teen" at={[-0.5, 0, -3.6]} heightM={1.0} camPos={cam} light={LIGHTS.HALL} pose={{ facing: lerp(0.3, 0.55, away), look: [lerp(0.2, 0.5, away), lerp(0.2, 0.95, away)], eye: lerp(0.9, 0.65, away), mouth: -0.3, brow: 0.5, nod: 0.12 * away, shoulders: 0.5 * away, breathe: f, blink: blink(f, 19), armL: SLEEVES_L, armR: SLEEVES_R }} />
    <CardActor kind="tailung" age="teen" at={[0.75, 0, -0.9]} heightM={1.95} camPos={cam} light={LIGHTS.HALL} pose={{ back: true, kneel: 0.3, shoulders: lerp(-0.3, 0.4, away), breathe: f * 1.8, tilt: lerp(0, -5, away) }} />
  </Stage>; };
const B15: React.FC<BP> = ({ p, f, t }) => { const cam = V(Math.sin(t * 0.9) * 0.06, 1.6 + Math.sin(t * 1.3) * 0.05, 6 - 1.5 * glide(p)); const run = ramp(t, 6, 50);
  return <Stage look="fire" cam={cam} target={V(0, 1.8, -8)} fov={56} vignette={0.6} tint="#7a2a3a" fogScale={1.6}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshToonMaterial color="#3a2a26" /></mesh>
    {[[-5, -4], [5, -6], [-6, -12], [6, -14], [-3, -20], [4, -22]].map(([x, z], i) => <ValleyHouse key={i} pos={[x, 0, z]} rotY={x > 0 ? -Math.PI / 2 : Math.PI / 2} seed={i + 9} />)}
    {[[-4.2, 3.6, -4], [4.2, 3.6, -6], [-5, 3.6, -12], [5, 3.6, -14]].map((q, i) => <Flame key={i} pos={q as P3} f={f} s={3} light={6} seed={i * 5} smoke />)}
    <Lantern pos={[1.2, 0.3, -3]} fallen out={0.4} /><Lantern pos={[-1.5, lerp(3.2, 0.3, ramp(t, 10, 40)), -6]} light color="#e8483a" />
    <CardActor kind="tailung" age="teen" at={[lerp(-3.2, 3.2, run), 0, -5]} heightM={2.1} camPos={cam} light={LIGHTS.FIRE} pose={{ facing: 0.7, walk: f * 0.55, look: [0.8, 0], brow: -0.9, mouth: -0.5, open: 0.4, armR: [60, 30], armL: [-40, -30], handR: "fist", handL: "fist", lean: 10 }} />
    <Motes f={f} n={80} box={[[-6, 0.3, -20], [6, 8, 2]]} color="#ffa060" size={0.06} rise={0.03} />
  </Stage>; };
const B16: React.FC<BP> = ({ p, f, t }) => { const lower = ramp(t, 16, 44);
  return <Stage look="fire" cam={V(0, 1.6, 4)} target={V(0, 2.2, -10)} fov={48} blur={12} vignette={0.7} tint="#7a2a3a"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.06 * glide(p) };
      silhouette(g, "tailung", "teen", { x: 760, y: 1990, s: 1.95, facing: -0.4, armR: [-60, -40], armL: [40, 50], handR: "fist", handL: "fist", lean: -8, breathe: f * 2 }, "#140608", 0.92);
      P("shifu", "teen", { x: 330, y: 1910, s: 1.75, facing: 0.5, look: [0.7, -0.6], brow: lerp(-0.5, 0.8, lower), eye: 1.1, mouth: lerp(-0.4, -0.5, lower), tremble: 0.7, breathe: f * 2, blink: blink(f, 21),
        armR: la([-150, -20], [-20, -30], lower), armL: la([60, 60], SLEEVES_L, lower), handR: lower < 0.6 ? "open" : "mitt", tilt: -6 * lower, nod: 0.08 * lower }, LIGHTS.FIRE, g, c);
      particles(g, f * 1.6, "sparks", 16, 50, "rgba(255,150,80,0.8)", 1.5); }} />}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshToonMaterial color="#3a2a26" /></mesh>
    {[[-5, -4], [5, -6], [-6, -12]].map(([x, z], i) => <ValleyHouse key={i} pos={[x, 0, z]} rotY={x > 0 ? -Math.PI / 2 : Math.PI / 2} seed={i + 9} />)}
    {[[-5, 4.2, -4], [5, 4.2, -6]].map((q, i) => <Flame key={i} pos={q as P3} f={f} s={2.2} light={4} seed={i * 5} smoke />)}
  </Stage>; };
const B17: React.FC<BP> = ({ p, f, t, d }) => { const cam = mv([3, 1.4, 1], [2.8, 1.5, 0.6], p); const touch = ramp(t, 0, 10), fall = ramp(t, 10, 26), black = 0.82 * ramp(t, d - 8, d); // deep dark, never pure black outside the final fade (QC)
  return <AbsoluteFill><Stage look="night" cam={cam} target={V(-0.2, 1.2, -4)} fov={44} vignette={0.7} tint="#2a3a6a"><Courtyard f={f} dusk={false} />
    <Flame pos={[-4, 0.2, -6]} f={f} s={1.2 * (1 - fall * 0.7)} light={2} seed={3} />
    <CardActor kind="oogway" age="adult" at={[-1.1, 0, -4]} heightM={1.5} camPos={cam} light={CARD_NIGHT} pose={{ facing: 0.6, look: [0.7, -0.3], eye: 0.6, mouth: 0, breathe: f * 0.5, armR: la([-10, -10], [70, 10], touch), handR: "point", armL: [20, 40] }} />
    <CardActor kind="tailung" age="teen" at={[0.5, 0, -4.2]} heightM={1.95} camPos={cam} light={CARD_NIGHT} pose={{ facing: -0.6, look: [-0.7, 0], eye: lerp(1.2, 0.1, fall), brow: -0.8, mouth: -0.5, open: 0.3, rot: 85 * fall * fall, armR: [-70, -40], armL: [60, 40], handR: "fist", still: true }} />
  </Stage><AbsoluteFill style={{ background: "#000", opacity: black }} /></AbsoluteFill>; };
const CARD_NIGHT: Light = { x: 200, y: 200, r: 1900, key: "#9fb0e8", shade: "#0a0a1a", keyA: 0.3, shadeA: 0.5 };
const B18: React.FC<BP> = ({ p, f, t }) => { const a = lerp(-0.5, 0.35, glide(p)); const cam = V(Math.sin(a) * 3.8, 1.25 + 0.2 * p, Math.cos(a) * 3.8 - 0.4);
  return <Stage look="night" cam={cam} target={V(0, 1.35, -0.5)} fov={46} vignette={0.7} tint="#3a5a7a" fogScale={0.8}><PrisonCavern f={f} />
    <CardActor kind="tailung" age="adult" at={[0, 0.4, -0.4]} heightM={2.2} camPos={cam} light={LIGHTS.PRISON} pose={{ facing: 0.35, look: [0.45, 0.1], brow: -0.7, eye: 0.85, mouth: -0.45, breathe: f * 0.8, blink: blink(f, 23), kneel: 0.9, armL: [-62, -15], armR: [62, 15], handL: "fist", handR: "fist", shoulders: 0.4 }} />
    <CardCanvas at={[0, 0.41, -0.39]} ppm={1700 / 2.2} camPos={cam} shadow={0} draw={(g) => { for (const sx of [-1, 1]) wrapBand(g, 540 + sx * 395, 1200, sx * 1.2, 0.55, 0.9, 1); }} />
    <Motes f={f} n={40} box={[[-5, 0.5, -5], [5, 6, 4]]} color="#a8c0d8" size={0.04} />
  </Stage>; void t; };
const B19: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  g.fillStyle = "#04070c"; g.fillRect(0, 0, W, H); const c: Cam = { x: 0, y: 0, zoom: 1 + 0.2 * glide(p) };
  P("tailung", "adult", { x: 540, y: 700 + 1100 * 4.2, s: 4.2, headOnly: true, facing: 0.05 + 0.08 * Math.sin(t * 0.2), look: [0.05 + 0.3 * Math.sin(t * 0.17), 0.05], eye: 0.75, brow: -0.85, mouth: -0.5, breathe: f }, LIGHTS.PRISON, g, c);
  g.fillStyle = "rgba(4,7,12,0.55)"; g.fillRect(0, 0, W, H); g.fillStyle = radGrad(g, 540, 820, 60, 520, [[0, "rgba(0,0,0,0)"], [1, "rgba(4,7,12,0.92)"]]); g.fillRect(0, 0, W, H);
  const br = 0.5 + 0.5 * Math.sin(t * 0.25); g.fillStyle = `rgba(200,220,240,${0.22 * br})`; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(540 + (i - 2.5) * 40, 1380 + Math.sin(t * 0.1 + i) * 30 - br * 60, 90, 40, 0, 0, 6.283); g.fill(); } }} /></AbsoluteFill>;

// ======================= TRANSFORMATION =======================
const B20: React.FC<BP> = ({ p, f, t }) => { const k = 0.35 * p + 0.65 * p * p; const cam = V(0.2, 1.6, 3 - 9 * k); const flash = ramp(t, 0, 4) * (1 - ramp(t, 4, 14));
  return <AbsoluteFill><Stage look="night" cam={cam} target={V(0, 1.6, -30)} fov={50} vignette={0.6} tint="#3a5a7a" fogScale={1.2}>
    <mesh position={[0, 3, -12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[3.2, 3.2, 40, 16, 1, true]} /><meshToonMaterial color="#2e2c30" side={2} /></mesh>
    <mesh position={[0, 2.5, -31]}><circleGeometry args={[3, 24]} /><meshBasicMaterial color="#fff4e0" /></mesh>
    <LightShaft pos={[0, 2.5, -24]} rot={[Math.PI / 2, 0, 0]} len={14} r={3} a={0.12} />
    <CardActor kind="tailung" age="adult" at={[0, 0, -1.5 - 9 * k]} heightM={2.2} camPos={cam} light={LIGHTS.PRISON} pose={{ back: true, walk: f * 0.7, armL: [-30, -20], armR: [30, 20], lean: 8 }} />
  </Stage><AbsoluteFill style={{ background: "#fff", opacity: flash * 0.6 }} /></AbsoluteFill>; };
const B21: React.FC<BP> = ({ p, f }) => { const cam = mv([0.3, 0.9, 2.6], [0.3, 1.0, 2.1], p);
  return <Stage look="sunset" cam={cam} target={V(0, 3.5, -30)} fov={52} vignette={0.6} tint="#7a3a5a" fogScale={2}><Valley f={f} houses={false} />
    <CardActor kind="tailung" age="adult" at={[0.2, 0, -0.6]} heightM={2.2} camPos={cam} light={LIGHTS.SUNSET} pose={{ back: true, breathe: f * 1.6, shoulders: -0.3, tilt: -4 }} />
  </Stage>; };
const B22: React.FC<BP> = ({ p, f, t }) => { const hit = ramp(t, 0, 7), fly = ramp(t, 2, 12), cam = mv([0.35, 1.5, 0.6], [0.3, 1.45, 0.0], p);
  return <Stage look="interior" cam={cam} target={V(lerp(-0.1, 0.3, hit), 1.3, -6)} fov={52} vignette={0.65} tint="#6a2a4a" flash={(1 - ramp(t, 6, 14)) * ramp(t, 4, 6) * 0.5}>
    <ScrollHall f={f} shafts={0.7} broken={ramp(t, 8, 12)} />
    <CardActor kind="tailung" age="adult" at={[-0.75, 0, -4.5]} heightM={2.2} camPos={cam} light={LIGHTS.HALL} pose={{ facing: 0.5, look: [0.8, 0], brow: -0.9, mouth: -0.6, open: 0.3, armR: la([60, 20], [95, 5], hit), armL: [-40, -40], handR: "fist", handL: "fist", lean: 6 * hit, breathe: f * 2.4 }} />
    <CardActor kind="shifu" age="adult" at={[lerp(0.3, 1.25, fly), lerp(0, 0.6, fly) + 0.5 * Math.sin(fly * Math.PI), -4.6]} heightM={1.0} camPos={cam} light={LIGHTS.HALL} pose={{ x: lerp(540, 330, fly), facing: -0.4, eye: 1.2, mouth: -0.4, open: 0.4, rot: lerp(0, 32, fly), kneel: fly, nod: 0.15 * fly, shoulders: fly, armL: [-90, -20], armR: [90, 20], still: true }} />
    <Motes f={f} n={90} box={[[2.5, 0.3, -6], [5, 5, -3]]} color="#d8c8c0" size={0.07} rise={0.02} />
  </Stage>; };
const B23: React.FC<BP> = ({ p, f, t }) => { const roar = talk(t, 0, 999, 0.9) * 0.6 + 0.35;
  return <Stage look="interior" cam={V(0.3, 0.4, -3)} target={V(0, 6, -10)} fov={50} blur={10} vignette={0.7} tint="#6a2a4a"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.05 * glide(p) };
      P("tailung", "adult", { x: 540, y: 760 + 1100 * 2.3, s: 2.3, facing: -0.1, look: [-0.1, 0.8], brow: lerp(-0.9, 0.5, ramp(t, 20, 50)), eye: 1.1, mouth: -0.6, open: roar, tear: ramp(t, 20, 50) * 0.8, breathe: f * 2.5, armR: [-30, -50], armL: [30, 50], handR: "fist", handL: "fist", tremble: 0.4 }, LIGHTS.HALL, g, c);
      particles(g, f, "dust", 23, 40, "rgba(220,200,200,0.55)"); }} />}><ScrollHall f={f} shafts={0.6} broken={1} /></Stage>; };

// ======================= REVELATION =======================
const B24: React.FC<BP> = ({ p, f, t }) => { const look = ramp(t, 0, 18);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#2a2428"], [1, "#16121a"]]); g.fillRect(0, 0, W, H);
    g.fillStyle = radGrad(g, 540, 800, 0, 1100, [[0, "rgba(230,226,220,0.32)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
    const c: Cam = { x: 0, y: 0, zoom: 1 + 0.06 * glide(p) };
    P("shifu", "adult", { x: 540, y: 560 + 600 * 3.0, s: 3.0, facing: lerp(-0.3, 0.05, look), look: [lerp(-0.5, 0, look), lerp(0.3, -0.7, look)], eye: 0.95, brow: 0.75, mouth: lerp(-0.3, 0.1, ramp(t, 40, 80)), open: talk(t, 14, 80, 0.32), tear: ramp(t, 30, 80) * 0.9, breathe: f, blink: blink(f, 29), tilt: 4, armL: SLEEVES_L, armR: SLEEVES_R }, NEUTRAL, g, c);
    g.fillStyle = "#3a3438"; g.strokeStyle = "#1c121c"; g.lineWidth = 5; for (const [x, y, r] of [[120, 1800, 90], [900, 1840, 120], [700, 1880, 60]]) { g.beginPath(); g.ellipse(x, y, r, r * 0.5, 0.2, 0, 6.283); g.fill(); g.stroke(); }
    particles(g, f, "dust", 24, 30, "rgba(230,220,210,0.5)"); darkVig(g, 0.7); }} /></AbsoluteFill>; };
const NEUTRAL: Light = { x: 540, y: 300, r: 1800, key: "#f0ece6", shade: "#1a1418", keyA: 0.22, shadeA: 0.4 };
const B25: React.FC<BP> = ({ p, f, t, d }) => { const mem = 1 - ramp(t, d * 0.5, d * 0.85);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#2a2428"], [1, "#16121a"]]); g.fillRect(0, 0, W, H);
    const c: Cam = { x: 0, y: 0, zoom: 1.06 + 0.04 * glide(p) };
    P("shifu", "adult", { x: 540, y: 560 + 600 * 3.0, s: 3.0, facing: 0.05, look: [0, -0.5], eye: lerp(0.95, 0.15, ramp(t, d * 0.6, d)), brow: 0.85, mouth: -0.2, tear: 1, breathe: f, tilt: 4, armL: SLEEVES_L, armR: SLEEVES_R }, NEUTRAL, g, c);
    if (mem > 0.01) { g.save(); g.globalAlpha = mem; g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#f0c070"], [1, "#a86a30"]]); g.fillRect(0, 0, W, H);
      const sh = { x: 380, y: 1980, s: 2.2 }, cb = { x: 760, y: 1960, s: 1.6 };
      P("tailung", "child", { ...cb, facing: -0.4, look: [-0.6, -0.5], mouth: 0.8, eye: 1.15, brow: 0.2, still: true, breathe: f }, LIGHTS.LANTERN, g);
      P("shifu", "teen", { ...sh, facing: 0.5, look: [0.7, 0.4], mouth: 0.7, brow: 0.1, still: true, breathe: f, armR: reachArm("shifu", "teen", "R", sh, [720, 1960 - 520 * 1.6 + 30]), handR: "open" }, LIGHTS.LANTERN, g);
      g.fillStyle = "rgba(255,230,180,0.25)"; g.fillRect(0, 0, W, H); g.restore(); }
    darkVig(g, 0.7); }} /></AbsoluteFill>; };
const B26: React.FC<BP> = ({ p, f, t }) => { const cam = mv([3, 1.5, -1], [2.6, 1.6, -2.2], p); const turn = ramp(t, 0, 20);
  return <Stage look="interior" cam={cam} target={V(-0.5, 1.4, -6)} fov={44} vignette={0.65} tint="#4a3a6a"><ScrollHall f={f} shafts={0.6} broken={1} scroll={false} />
    <CardActor kind="shifu" age="adult" at={[-2.8, 0, -8]} heightM={1.0} camPos={cam} light={LIGHTS.HALL} pose={{ x: 420, rot: 18, kneel: 1, nod: 0.2, shoulders: 1, eye: 0.6, brow: 0.8, mouth: -0.2, look: [0.5, 0], still: true, armL: [-60, -10], armR: [40, 20] }} />
    <CardActor kind="tailung" age="adult" at={[lerp(0.2, -0.6, p), 0, -5]} heightM={2.2} camPos={cam} light={LIGHTS.HALL} pose={{ facing: lerp(-0.5, 0.6, turn), look: [lerp(-0.7, 0.4, turn), 0.3], brow: 0.2, eye: 0.9, mouth: -0.3, breathe: f * 1.6, blink: blink(f, 31), prop: scrollProp, armR: [-35, -95], handR: "grip", armL: [20, 20], walk: turn > 0.5 ? f * 0.3 : undefined }} />
  </Stage>; };
const B27: React.FC<BP> = ({ p, f, t }) => { const open = ramp(t, 0, 24);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    g.fillStyle = "#08050a"; g.fillRect(0, 0, W, H);
    g.fillStyle = radGrad(g, 540, 1750, 0, 1500, [[0, `rgba(255,214,130,${0.25 + 0.55 * open})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
    const c: Cam = { x: 0, y: 0, zoom: 1 + 0.07 * glide(p) };
    P("tailung", "adult", { x: 540, y: 600 + 1100 * 3.2, s: 3.2, headOnly: true, facing: 0, look: [0, 0.75], eye: lerp(0.9, 1.15, open), brow: lerp(-0.2, 0.3, open), mouth: -0.2, open: 0.1 * open, still: true, breathe: f }, LIGHTS.GOLD, g, c);
    const w = 200 + 760 * open; g.fillStyle = linGrad(g, 0, 1640, 0, H, [[0, "#f6dc90"], [1, "#a8782c"]]); g.fillRect(540 - w / 2, 1640, w, 300);
    g.fillStyle = "#3a1a10"; g.strokeStyle = "#120a08"; g.lineWidth = 6; for (const x of [540 - w / 2, 540 + w / 2]) { g.beginPath(); g.roundRect(x - 30, 1600, 60, 340, 26); g.fill(); g.stroke(); }
    particles(g, f, "sparks", 27, 40, "rgba(255,220,140,0.8)", 1.2); darkVig(g, 0.6); }} /></AbsoluteFill>; };
const scrollShot = (g: Ctx, f: number, z: number, refl: number, ex: Partial<Pose>, shine: number) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#0a0608"], [0.45, "#1a0e0a"], [1, "#2a160a"]]); g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  const top = 620, bot = 1700, sheet = () => { g.beginPath(); g.moveTo(110, top); g.lineTo(970, top); g.lineTo(1010, bot); g.lineTo(70, bot); g.closePath(); };
  g.fillStyle = linGrad(g, 0, top, 0, bot, [[0, "#c89a40"], [0.35, "#f6dc90"], [0.6, "#e8c060"], [1, "#a8782c"]]); sheet(); g.fill();
  if (refl > 0) { g.save(); sheet(); g.clip(); g.globalAlpha = 0.42 * refl; g.filter = "blur(2.5px) sepia(0.7)"; g.translate(W, 0); g.scale(-1, 1);
    person(g, ON, 1, "tailung", "adult", { x: 540, y: 760 + 1100 * 2.6, s: 2.6, headOnly: true, still: true, look: [0, 0.2], ...ex } as Pose, LIGHTS.GOLD); g.restore(); g.filter = "none"; }
  const sx = -400 + shine * 1600, sh = g.createLinearGradient(sx, top, sx + 500, bot); sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.5, "rgba(255,250,220,0.35)"); sh.addColorStop(1, "rgba(255,255,255,0)");
  g.save(); sheet(); g.clip(); g.fillStyle = sh; g.fillRect(0, top, W, bot - top); g.restore();
  for (const y of [top, bot]) { g.fillStyle = "#3a1a10"; g.strokeStyle = "#120a08"; g.lineWidth = 6; g.beginPath(); g.roundRect(40, y - 34, 1000, 68, 30); g.fill(); g.stroke(); g.fillStyle = PAL.gold; for (const x of [40, 1010]) { g.beginPath(); g.ellipse(x + 15, y, 30, 44, 0, 0, 6.283); g.fill(); g.stroke(); } }
  for (const [x, y] of [[180, top - 10], [900, top - 10], [160, bot + 10], [920, bot + 10]]) { g.fillStyle = PAL.fur; g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, 62, 48, 0, 0, 6.283); g.fill(); g.stroke(); }
  g.restore(); particles(g, f, "dust", 6, 40, "rgba(255,220,150,0.7)"); darkVig(g, 0.7, 500); };
const B28: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => scrollShot(g, f, 1 + 0.05 * glide(p), 0, {}, ramp(t, 0, 50))} /></AbsoluteFill>;
const B29: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => scrollShot(g, f, 1.05 + 0.06 * glide(p), ramp(t, 0, 30),
  { brow: lerp(0.2, 0.75, ramp(t, 10, 50)), eye: lerp(1.15, 0.95, ramp(t, 20, 55)), mouth: lerp(-0.1, -0.4, ramp(t, 10, 50)), tear: ramp(t, 25, 60) * 0.7 }, 1)} /></AbsoluteFill>;
const B30: React.FC<BP> = ({ p, f }) => { const cam = mv([-1.2, 1.3, 4], [1.0, 1.4, 3.4], p);
  return <Stage look="dawn" cam={cam} target={V(0, 1.1, -6)} fov={50} vignette={0.5} tint="#8a8a9a" fogScale={0.8}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshToonMaterial color="#6a6a5a" /></mesh>
    {[[-3.6, -3], [3.6, -5], [-4, -10], [4, -12], [0, -17]].map(([x, z], i) => <ValleyHouse key={i} pos={[x, 0, z]} rotY={x === 0 ? 0 : x > 0 ? -Math.PI / 2 : Math.PI / 2} seed={i + 9} />)}
    <Flame pos={[3.4, 3.1, -5]} f={f} s={0.6} seed={4} smoke />
    <Lantern pos={[0.8, 0.3, -2]} fallen out={1} /><Lantern pos={[-1.2, 0.3, -5]} fallen out={1} color="#8a3a3a" />
    <Lantern pos={[2.2, 3.2 + Math.sin(f * 0.05) * 0.05, -4]} out={1} color="#8a3a3a" />
    <MistPlane pos={[0, 1.5, -10]} w={40} h={4} a={0.3} f={f} color="#d8d8e0" />
    <Motes f={f} n={40} box={[[-5, 0.3, -12], [5, 5, 2]]} color="#c8c8d0" size={0.05} />
  </Stage>; };
const B31: React.FC<BP> = ({ p, f, t, d }) => { const reach = ramp(t, fr(0.8), fr(3.4)), fade = ramp(t, d - 28, d - 2);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    const z = 1 + 0.12 * glide(p); g.fillStyle = "#1a1416"; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    const r = rng(31); for (let y = 0; y < 10; y++) for (let x = 0; x < 6; x++) { const v = 0.7 + r() * 0.25; g.fillStyle = `rgb(${110 * v | 0},${104 * v | 0},${96 * v | 0})`; g.fillRect(x * 190 - 30 + 2, y * 200 - 20 + 2, 186, 196); }
    g.fillStyle = radGrad(g, 560, 800, 0, 900, [[0, "rgba(255,226,170,0.45)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
    // the open scroll lying on the floor
    g.save(); g.translate(560, 620); g.rotate(-0.12); g.fillStyle = linGrad(g, 0, -260, 0, 260, [[0, "#c89a40"], [0.4, "#f6dc90"], [1, "#a8782c"]]); g.fillRect(-300, -250, 600, 500);
    g.fillStyle = "#3a1a10"; g.strokeStyle = "#120a08"; g.lineWidth = 6; for (const y of [-260, 260]) { g.beginPath(); g.roundRect(-340, y - 30, 680, 60, 28); g.fill(); g.stroke(); } g.restore();
    // the frayed training wrap beside it; Shifu's small paw reaches in and closes over it
    wrapBand(g, 540, 1080, 0.35, 1.25, 1, 1);
    const px = lerp(260, 470, reach), py = lerp(2150, 1150, reach); paw(g, px, py, 1.35, 2.9 + 0.2 * reach, PAL.panda, ramp(t, fr(3.0), fr(4.2)));
    g.restore();
    g.fillStyle = "rgba(255,236,200,0.08)"; g.beginPath(); g.moveTo(380, 0); g.lineTo(760, 0); g.lineTo(900, H); g.lineTo(240, H); g.closePath(); g.fill();
    particles(g, f, "dust", 31, 50, "rgba(255,230,190,0.7)"); darkVig(g, 0.75, 420);
    g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, W, H); }} /></AbsoluteFill>; };

const SCENES: React.FC<BP>[] = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20, B21, B22, B23, B24, B25, B26, B27, B28, B29, B30, B31];
type Beat = { id: number; start_s: number; end_s: number };
const BeatScene: React.FC<{ i: number; from: number; d: number }> = ({ i, from, d }) => { const t = useCurrentFrame(); const S = SCENES[i]; return <S t={t} d={d} p={clamp(t / Math.max(1, d - 1))} f={from + t} />; };
const grainTiles = (() => { let tl: HTMLCanvasElement[] | null = null; return () => tl ??= [0, 1, 2, 3].map((k) => { const [c, g] = makeCanvas(256, 256); const im = g.createImageData(256, 256); const r = rng(k * 99 + 7); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; }); })();
const Grain: React.FC = () => <CanvasFrame draw={(g, f) => { g.fillStyle = g.createPattern(grainTiles()[f % 4], "repeat")!; g.fillRect(0, 0, W, H); }} />;

export const TAILUNG_FRAMES = fr((BEATS.beats as Beat[]).at(-1)!.end_s);
export const TaiLungEpisode: React.FC = () => {
  const beats = BEATS.beats as Beat[];
  return <AbsoluteFill style={{ background: "#000" }}>
    {beats.map((b, i) => { const from = fr(b.start_s), d = fr(b.end_s) - from;
      return <Sequence key={b.id} from={from} durationInFrames={d} layout="none"><AbsoluteFill><BeatScene i={i} from={from} d={d} /></AbsoluteFill></Sequence>; })}
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: GRADE.grainOpacity }}><Grain /></AbsoluteFill>
    {(getInputProps() as { plate?: boolean }).plate ? null : <CaptionBox caps={CAPS as Cap[]} look={CAPTION} />}
  </AbsoluteFill>;
};
