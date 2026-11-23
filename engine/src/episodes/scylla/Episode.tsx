// "The Monster She Made" (Scylla, from Madeline Miller's novel Circe) — full episode, ORIGINAL imagined visuals.
// 31 beats keyed to beats.json (times from the real voice). Look/lights/caption style in ./look.ts.
import React from "react";
import { AbsoluteFill, Sequence, getInputProps, useCurrentFrame } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Cam, Ctx, FPS, H, W, clamp, glide, lerp, linGrad, makeCanvas, particles, radGrad, ramp, rng } from "../../btl/core";
import { Age, Kind, Light, Pose, person, reachArm } from "../../btl/people";
import { blink, talk } from "../../btl/kit";
import { scylla } from "../../btl/myth";
import { CaptionBox, Cap } from "../../btl/captions";
import { CardActor, CardCanvas, V } from "../../three/kit3d";
import { Flame, Motes } from "../../three/props";
import { Backdrop } from "../../three/village";
import { Beach, Cliff, CloudHalls, Cove, IslandHouse, Ocean, SEA, Ship } from "../../three/sea";
import { Stage } from "../itachi/stage";
import { CAPTION, GRADE, LIGHTS, PAL, basket } from "./look";
import BEATS from "./beats.json";
import CAPS from "./captions.json";

const fr = (s: number) => Math.round(s * FPS);
type P3 = [number, number, number];
type BP = { t: number; d: number; p: number; f: number };
const mv = (a: P3, b: P3, p: number) => { const k = glide(p); return V(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)); };
const ON: Cam = { x: 0, y: 0, zoom: 1 };
const Over: React.FC<{ draw: (g: Ctx) => void }> = ({ draw }) => <CanvasFrame draw={(g) => draw(g)} />;
const P = (kind: Kind, age: Age, pose: Pose, L: Light, g: Ctx, cam: Cam = ON) => person(g, cam, 1, kind, age, pose, L);
const darkVig = (g: Ctx, a: number, r0 = 450) => { g.fillStyle = radGrad(g, W / 2, H * 0.45, r0, 1250, [[0, "rgba(0,0,0,0)"], [1, `rgba(4,2,8,${a})`]]); g.fillRect(0, 0, W, H); };
let silC: [HTMLCanvasElement, Ctx] | null = null;
const silhouette = (g: Ctx, kind: Kind, age: Age, pose: Pose, color: string, a: number, cam: Cam = ON) => {
  const [c, s] = (silC ??= makeCanvas(W, H)); s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, W, H); s.globalCompositeOperation = "source-over";
  person(s, cam, 1, kind, age, pose, LIGHTS.DAY); s.globalCompositeOperation = "source-in"; s.fillStyle = color; s.fillRect(0, 0, W, H); s.globalCompositeOperation = "source-over";
  g.save(); g.globalAlpha = a; g.drawImage(c, 0, 0); g.restore(); };
const fish = (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.save(); g.translate(x, y); g.rotate(-0.4); g.fillStyle = "#9ab0c0"; g.strokeStyle = "#1c121c"; g.lineWidth = 4;
  g.beginPath(); g.ellipse(50, 0, 60, 22, 0, 0, 6.283); g.fill(); g.stroke(); g.beginPath(); g.moveTo(105, 0); g.lineTo(135, -22); g.lineTo(135, 22); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#1c121c"; g.beginPath(); g.arc(18, -5, 4, 0, 6.283); g.fill(); g.restore(); };
const necklace = (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.strokeStyle = "#c8f0f0"; g.lineWidth = 3; g.beginPath(); g.arc(x, y + 60, 60, 0.2, Math.PI - 0.2); g.stroke();
  g.fillStyle = "#7af0e0"; for (let k = 0; k < 7; k++) { const a = 0.3 + k * 0.4; g.beginPath(); g.arc(x + Math.cos(a) * 60, y + 60 + Math.sin(a) * 60, 10, 0, 6.283); g.fill(); } };
const sky = (g: Ctx, stops: [number, string][]) => { g.fillStyle = linGrad(g, 0, 0, 0, H, stops); g.fillRect(0, 0, W, H); };

// ======================= HOOK =======================
const B1: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0, 1.6, 13], [-0.5, 2.2, 9.5], p);
  return <Stage look="night" cam={cam} target={mv([-1, 5, -16], [-3, 8.5, -18], p)} fov={52} vignette={0.6} tint="#4a5a9a" fogScale={2.2} flash={ramp(t, 40, 42) * (1 - ramp(t, 42, 50)) * 0.6}>
    <Backdrop mood="night" moon="white" moonXY={[0.7, 0.35]} z={-90} y={24} /><Ocean f={f} storm={0.8} color="#2a5070" />
    <directionalLight position={[20, 30, -40]} intensity={1.4} color="#c8d8ff" />
    <Cliff pos={[-6, -1, -20]} r={7} h={13} seed={3} color="#55504c" /><Cliff pos={[12, -1, -24]} r={9} h={16} seed={7} color="#55504c" />
    <Ship pos={[1.5, 0, -4 - 2 * p]} rotY={0.5} f={f} />
    <CardCanvas at={[-4.2, 11.5, -19]} ppm={105} camPos={cam} shadow={0} draw={(g) => scylla(g, ON, 540, 1700, 1.2, f, LIGHTS.NIGHT, { rise: lerp(0.5, 0.95, p), fear: 0, tint: "#2a3438", lunge: ramp(t, 40, 60) * 0.5, lungeHead: 4 })} />
  </Stage>; };
const B2: React.FC<BP> = ({ p, f }) => { const cam = mv([0.8, 1.3, 27], [0.6, 1.4, 24.5], p);
  return <Stage look="sunset" cam={cam} target={V(-0.5, 1.5, 8)} fov={46} vignette={0.5} tint="#e8904a">
    <Backdrop mood="sunset" z={-90} y={12} /><Ocean f={f} color="#3a5a7a" amp={0.2} /><Beach /><ambientLight intensity={0.6} color="#ffc890" />
    <Cliff pos={[-16, -1, -10]} r={8} h={14} seed={5} color="#6a4a4a" />
    <CardActor kind="circe" age="teen" at={[0, 0.05, lerp(21.5, 19, p)]} heightM={1.65} camPos={cam} light={LIGHTS.SUNSET} pose={{ back: true, walk: f * 0.25, prop: basket(1), armL: [20, 70] }} />
    <Motes f={f} n={50} box={[[-4, 0.3, 14], [4, 4, 25]]} color="#ffd8a0" size={0.05} />
  </Stage>; };

// ======================= WORLD =======================
const B3: React.FC<BP> = ({ p, f }) => <Stage look="dawn" cam={mv([0, 8, 20], [0, 16, 12], p)} target={mv([0, 14, -40], [0, 20, -40], p)} fov={52} vignette={0.4} tint="#f0c070" fogScale={2.5}>
  <Backdrop mood="dawn" z={-100} y={22} /><Ocean f={f} color="#4a7a9a" amp={0.25} /><CloudHalls f={f} y={18} z={-40} />
  <pointLight position={[0, 30, -30]} intensity={6} distance={80} color="#ffe0a0" /><Motes f={f} n={60} box={[[-12, 12, -30], [12, 24, 0]]} color="#fff0c0" size={0.08} />
</Stage>;
const B4: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#2a6a8a"], [1, "#1a4a6a"]]); const z = 1 + 0.12 * glide(p);
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  g.strokeStyle = "rgba(220,240,250,0.35)"; g.lineWidth = 4; for (let k = 0; k < 22; k++) { const y = k * 95 + ((f * 2) % 95); g.beginPath(); for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * 0.02 + f * 0.05 + k) * 12); g.stroke(); }
  const bx = lerp(380, 640, ramp(t, 8, 50)), by = 1150 - 40 * ramp(t, 8, 50);
  g.save(); g.translate(bx, by); g.rotate(-0.3 + Math.sin(f * 0.1) * 0.05); g.fillStyle = "#8a5a32"; g.strokeStyle = "#1c121c"; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 70, 26, 0, 0, 6.283); g.fill(); g.stroke();
  g.fillStyle = "#e8dcc0"; g.beginPath(); g.moveTo(-5, -5); g.lineTo(35, -70); g.lineTo(-25, -60); g.closePath(); g.fill(); g.stroke(); g.restore();
  // the god's golden hand
  g.save(); g.translate(bx - 230, by + 120); g.rotate(-0.5); g.fillStyle = "#f0c860"; g.strokeStyle = "#7a5a1a"; g.lineWidth = 6;
  g.beginPath(); g.roundRect(-120, 0, 240, 420, 90); g.fill(); g.stroke(); for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-110 + i * 58, -150, 50, 180, 25); g.fill(); g.stroke(); }
  g.beginPath(); g.roundRect(120, 40, 140, 54, 27); g.fill(); g.stroke(); g.restore();
  g.fillStyle = radGrad(g, bx - 200, by, 0, 600, [[0, "rgba(255,220,120,0.35)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H); g.restore();
  particles(g, f, "dust", 4, 30, "rgba(255,240,200,0.6)"); darkVig(g, 0.5); }} /></AbsoluteFill>;
const flowers = (g: Ctx, f: number, glow: number) => { const r = rng(5);
  for (let k = 0; k < 9; k++) { const x = 140 + k * 100 + (r() - 0.5) * 60, h = 380 + r() * 300, sway = Math.sin(f * 0.04 + k) * 14;
    g.strokeStyle = "#3a6a2a"; g.lineWidth = 10; g.beginPath(); g.moveTo(x, 1500); g.quadraticCurveTo(x + sway * 0.5, 1500 - h * 0.6, x + sway, 1500 - h); g.stroke();
    g.fillStyle = radGrad(g, x + sway, 1500 - h, 0, 120, [[0, `rgba(255,220,90,${0.5 * glow})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(x + sway - 120, 1500 - h - 120, 240, 240);
    g.fillStyle = PAL.sap; g.strokeStyle = "#5a3a10"; g.lineWidth = 3; for (let q = 0; q < 6; q++) { const a = q / 6 * 6.283 + f * 0.003; g.beginPath(); g.ellipse(x + sway + Math.cos(a) * 30, 1500 - h + Math.sin(a) * 30, 26, 15, a, 0, 6.283); g.fill(); g.stroke(); }
    g.fillStyle = "#c87a1a"; g.beginPath(); g.arc(x + sway, 1500 - h, 16, 0, 6.283); g.fill(); } };
const B5: React.FC<BP> = ({ p, f }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#2a1a2a"], [0.6, "#4a2a2a"], [1, "#1a0808"]]); const z = 1 + 0.14 * glide(p);
  g.save(); g.translate(W / 2, H * 0.6); g.scale(z, z); g.translate(-W / 2, -H * 0.6);
  g.fillStyle = linGrad(g, 0, 1450, 0, H, [[0, "#5a1a14"], [1, "#1a0606"]]); g.beginPath(); g.moveTo(0, 1480); for (let x = 0; x <= W; x += 60) g.lineTo(x, 1460 + Math.sin(x * 0.03) * 20); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = "rgba(140,20,20,0.5)"; for (let k = 0; k < 14; k++) { g.beginPath(); g.ellipse(80 + k * 75, 1560 + (k % 3) * 60, 50, 12, 0, 0, 6.283); g.fill(); }
  flowers(g, f, 0.8 + 0.2 * Math.sin(f * 0.1)); g.restore(); particles(g, f, "sparks", 5, 40, "rgba(255,220,120,0.7)", 1.1); darkVig(g, 0.6); }} /></AbsoluteFill>;
const B6: React.FC<BP> = ({ p, f, t }) => { const drop = ramp(t, 0, 20), gold = ramp(t, 20, 45);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    sky(g, [[0, "#2a1a2a"], [1, "#100608"]]); const z = 1 + 0.14 * glide(p); g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    g.fillStyle = radGrad(g, 540, 1100, 0, 700 * (0.3 + gold), [[0, `rgba(255,214,110,${0.6 * gold})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
    // a small bird on a branch
    g.strokeStyle = "#3a2a1a"; g.lineWidth = 18; g.beginPath(); g.moveTo(80, 1250); g.lineTo(1000, 1200); g.stroke();
    const col = gold < 0.5 ? "#7a7a80" : "#f0c050", hi = gold < 0.5 ? "#a8a8b0" : "#fff0a0";
    g.save(); g.translate(540, 1110); g.scale(1 + 0.1 * gold, 1 + 0.1 * gold); g.fillStyle = col; g.strokeStyle = "#1c121c"; g.lineWidth = 6;
    g.beginPath(); g.ellipse(0, 0, 120, 85, 0, 0, 6.283); g.fill(); g.stroke(); g.beginPath(); g.arc(90, -70, 60, 0, 6.283); g.fill(); g.stroke();
    g.fillStyle = hi; g.beginPath(); g.ellipse(-20, -10, 70, 40, -0.3, 0, 6.283); g.fill(); g.fillStyle = "#e8a030"; g.beginPath(); g.moveTo(145, -75); g.lineTo(190, -62); g.lineTo(145, -55); g.fill();
    g.fillStyle = "#1c121c"; g.beginPath(); g.arc(105, -80, 9, 0, 6.283); g.fill(); g.restore();
    if (drop < 1) { g.fillStyle = PAL.sap; g.beginPath(); g.ellipse(560, lerp(200, 1040, drop * drop), 16, 24, 0, 0, 6.283); g.fill(); }
    if (gold > 0) { for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, rr = 150 + 300 * gold; g.fillStyle = `rgba(255,230,140,${0.8 * (1 - gold * 0.6)})`; g.beginPath(); g.arc(540 + Math.cos(a) * rr, 1100 + Math.sin(a) * rr * 0.7, 8, 0, 6.283); g.fill(); } }
    g.restore(); particles(g, f, "sparks", 6, 40, "rgba(255,220,120,0.7)", 1.2); darkVig(g, 0.6); }} /></AbsoluteFill>; };

// ======================= RELATIONSHIP =======================
const GoldHall: React.FC = () => <>
  <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 40]} /><meshToonMaterial color="#c8a050" emissive="#a07020" emissiveIntensity={0.15} /></mesh>
  {[-1, 1].map((sx) => [0, 1, 2, 3].map((k) => <mesh key={`${sx}${k}`} position={[sx * 4, 4, -2 - k * 4]}><cylinderGeometry args={[0.4, 0.45, 8, 14]} /><meshToonMaterial color="#f0d070" emissive="#ffc040" emissiveIntensity={0.4} /></mesh>))}
  <mesh position={[0, 4, -16]}><planeGeometry args={[16, 8]} /><meshToonMaterial color="#ffe0a0" emissive="#ffb040" emissiveIntensity={0.8} /></mesh>
</>;
const B7: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0, 1.3, 1.6], [0, 1.4, 0.6], p);
  return <Stage look="day" cam={cam} target={V(0, 1.5, -6)} fov={48} vignette={0.5} tint="#f0b050">
    <GoldHall />
    {([[-1.6, "nora", 0, 0.5], [-0.8, "james", 1, 0.3], [0.9, "lily", 2, -0.3], [1.7, "vander", 3, -0.5]] as [number, Kind, number, number][]).map(([x, k, ph, fc]) =>
      <CardCanvas key={k} at={[x, 0, -6.2 - Math.abs(x) * 0.4]} ppm={1700 / 2.4} camPos={cam} draw={(g) => silhouette(g, k, "adult", { x: 540, y: 1880, s: 1.6, facing: fc, tilt: Math.sin(f * 0.2 + ph) * 5, still: true }, "#5a3a10", 0.92)} />)}
    <CardActor kind="circe" age="teen" at={[0.2, 0, -4.5]} heightM={1.6} camPos={cam} light={{ ...LIGHTS.HALL, keyA: 0.15, shadeA: 0.55 }} pose={{ facing: 0, look: [0, 0.7], eye: 0.8, brow: 0.5, mouth: -0.2, shoulders: 0.6, breathe: f, blink: blink(f, 7), armL: [30, 70], armR: [-30, -70] }} />
    <Motes f={f} n={50} box={[[-4, 0.5, -10], [4, 6, 0]]} color="#fff0b0" size={0.05} />
  </Stage>; void t; };
const B8: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#6a4a20"], [1, "#2a1a10"]]); const c: Cam = { x: 20 * glide(p), y: 0, zoom: 1 + 0.14 * glide(p) };
  P("circe", "teen", { x: 540, y: 640 + 880 * 2.5, s: 2.5, headOnly: true, facing: -0.1, look: [-0.1, 0.8], eye: 0.75, brow: 0.7, mouth: -0.3, tear: ramp(t, 10, 40) * 0.5, breathe: f, blink: blink(f, 8) }, { ...LIGHTS.HALL, keyA: 0.25 }, g, c);
  for (let k = 0; k < 4; k++) { const x = ((f * 9 + k * 300) % 1600) - 300; g.fillStyle = "rgba(20,10,0,0.28)"; g.beginPath(); g.ellipse(x, 900 + k * 90, 180, 600, 0.3, 0, 6.283); g.fill(); }
  darkVig(g, 0.6); }} /></AbsoluteFill>;
const B9: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0.5, 1.4, 26], [0.3, 1.4, 24], p);
  return <Stage look="dawn" cam={cam} target={V(0, 1.2, 18)} fov={46} vignette={0.45} tint="#f0b890">
    <Backdrop mood="dawn" z={-90} y={12} /><Ocean f={f} color="#4a7aa0" amp={0.18} /><Beach /><ambientLight intensity={0.5} color="#ffd0b0" />
    <CardActor kind="glaucos" age="adult" at={[0.8, 0.05, 19]} heightM={1.75} camPos={cam} light={LIGHTS.DAWN} pose={{ facing: -0.5, look: [-0.7, -0.1], mouth: lerp(0, 0.6, ramp(t, 20, 50)), breathe: f, blink: blink(f, 9), armR: [-60 + Math.sin(f * 0.2) * 15, -60], armL: [40, 50] }} />
    <CardActor kind="circe" age="teen" at={[-0.9, 0.05, 20]} heightM={1.6} camPos={cam} light={LIGHTS.DAWN} pose={{ facing: 0.5, look: [0.7, 0], mouth: 0.1, brow: 0.3, breathe: f, blink: blink(f, 10), prop: basket(1), armL: [20, 70] }} />
    <Motes f={f} n={30} box={[[-4, 0.3, 15], [4, 4, 22]]} color="#fff0e0" size={0.04} />
  </Stage>; };
const B10: React.FC<BP> = ({ p, f, t }) => { const laugh = ramp(t, 4, 18);
  return <Stage look="dawn" cam={V(0.3, 1.4, 24)} target={V(0, 1.2, 18)} fov={46} blur={12} vignette={0.5} tint="#f0b890"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.12 * glide(p) };
      P("glaucos", "adult", { x: 760, y: 560 + 1000 * 1.9, s: 1.9, facing: -0.45, look: [-0.7, 0.1], mouth: 0.7, brow: 0.2, breathe: f, prop: fish, armR: [-75, -35], handR: "grip" }, LIGHTS.DAWN, g, c);
      P("circe", "teen", { x: 300, y: 600 + 880 * 2.0, s: 2.0, facing: 0.45, look: [0.7, 0.1], mouth: lerp(0.2, 0.9, laugh), open: 0.3 * laugh, brow: lerp(0.3, -0.1, laugh), eye: lerp(1, 0.75, laugh), breathe: f * 1.5 }, LIGHTS.DAWN, g, c); }} />}>
    <Backdrop mood="dawn" z={-90} y={12} /><Ocean f={f} color="#4a7aa0" amp={0.18} /><Beach />
  </Stage>; };
const B11: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#140a08"], [1, "#2a1408"]]); const c: Cam = { x: -40 * glide(p), y: 0, zoom: 1 + 0.22 * glide(p) }; const fl = 0.55 + 0.25 * Math.sin(f * 0.9) + 0.12 * Math.sin(f * 2.3); // firelight flicker (QC frozen-frame gate)
  g.fillStyle = radGrad(g, 300, 1700, 0, 1000, [[0, `rgba(255,150,60,${fl})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
  P("glaucos", "adult", { x: 360, y: 900 + 1000 * 2.4, s: 2.4, headOnly: true, facing: 0.3, eye: 0.05, mouth: 0.15, tilt: 18, still: true, breathe: f }, { ...LIGHTS.SUNSET, x: 300, y: 1800 }, g, c);
  // the cup and the drip of sap from her fingers
  g.save(); g.translate((760 - 540) * (c.zoom - 1), 0); g.fillStyle = "#a8683a"; g.strokeStyle = "#1c121c"; g.lineWidth = 6; g.beginPath(); g.moveTo(680, 1350); g.lineTo(860, 1350); g.lineTo(830, 1560); g.lineTo(710, 1560); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#d8a47c"; g.beginPath(); g.roundRect(700, 900, 140, 120, 50); g.fill(); g.stroke();
  const k = (t * 0.08) % 1; g.fillStyle = PAL.sap; g.beginPath(); g.ellipse(770, lerp(1030, 1340, k * k), 12, 18, 0, 0, 6.283); g.fill();
  g.fillStyle = radGrad(g, 770, 1350, 0, 120, [[0, "rgba(255,220,100,0.7)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(650, 1230, 240, 240); g.restore();
  particles(g, f, "sparks", 11, 30, "rgba(255,170,80,0.7)", 1.2); darkVig(g, 0.6); }} /></AbsoluteFill>;
const B12: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0, 0.6, 6], [0, 1.0, 5], p), rise = ramp(t, 0, 30);
  return <Stage look="dawn" cam={cam} target={V(0, 1.8, -2)} fov={50} vignette={0.45} tint="#5ab0a0">
    <Backdrop mood="dawn" z={-90} y={12} /><Ocean f={f} color="#2a8a9a" amp={0.25} />
    <pointLight position={[0, 1.5, 0]} intensity={4 * rise} distance={10} color="#80ffe0" />
    <CardActor kind="seagod" age="adult" at={[0, lerp(-1.8, 0, rise), -1]} heightM={2.0} camPos={cam} light={{ ...LIGHTS.DAY, key: "#a0fff0", keyA: 0.35 }} pose={{ facing: 0, look: [0.2, -0.2], mouth: 0.2, eye: 0.9, breathe: f, armL: [-40, -20], armR: [40, 20] }} />
    <Motes f={f} n={80} box={[[-3, 0, -3], [3, 4, 1]]} color="#c8fff0" size={0.06} rise={0.03} />
  </Stage>; };

// ======================= CONFLICT =======================
const B13: React.FC<BP> = ({ p, f, t }) => { const drop = ramp(t, 10, 40);
  return <Stage look="day" cam={V(0, 1.2, 5)} target={V(0, 1.6, -4)} fov={48} blur={12} vignette={0.5} tint="#5a9ab0"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.12 * glide(p) }, ci = { x: 300, y: 700 + 880 * 2.0, s: 2.0 };
      P("seagod", "adult", { x: 790, y: 520 + 1060 * 1.8, s: 1.8, facing: 0.6, look: [0.9, -0.2], mouth: 0.1, eye: 0.85, breathe: f }, LIGHTS.DAY, g, c);
      P("circe", "teen", { ...ci, facing: 0.5, look: [0.7, -0.3], brow: lerp(0.2, 0.8, drop), mouth: lerp(0.3, -0.3, drop), breathe: f, blink: blink(f, 13), armR: [lerp(-110, -15, drop), lerp(-20, -10, drop)], handR: "open" }, LIGHTS.DAY, g, c); }} />}>
    <Backdrop mood="day" z={-90} y={14} /><Ocean f={f} color="#2a7a9a" amp={0.15} y={-0.3} />
  </Stage>; };
const B14: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0.9, 1.7, 0.2], [0.4, 1.7, -0.6], p), drape = ramp(t, 6, 40);
  return <Stage look="day" cam={cam} target={V(0, 1.8, -4.2)} fov={46} vignette={0.4} tint="#5ab0c0">
    <Backdrop mood="day" z={-90} y={14} /><Ocean f={f} color="#2a7a9a" amp={0.15} y={-0.3} /><Cove f={f} pool={PAL.cove} />
    <Cliff pos={[-9, -1, -14]} r={6} h={12} seed={2} /><Cliff pos={[10, -1, -12]} r={5} h={10} seed={4} />
    <CardCanvas at={[0, 0.8, -4.2]} ppm={1700 / 1.9} camPos={cam} draw={(g) => { const sc = { x: 380, y: 1880, s: 1.6 }, gd = { x: 760, y: 1880, s: 1.55 };
      P("scylla", "teen", { ...sc, facing: 0.35, look: [0.4, -0.2], mouth: lerp(0.3, 0.7, drape), brow: -0.2, eye: 0.85, breathe: f, blink: blink(f, 14), armL: [-25, -80], handL: "open" }, LIGHTS.DAY, g);
      P("seagod", "adult", { ...gd, facing: -0.4, look: [-0.7, 0.1], mouth: 0.3, breathe: f, armR: reachArm("seagod", "adult", "R", gd, [lerp(520, 430, drape), 1880 - 880 * 1.6 + lerp(120, 190, drape)]), handR: "grip" }, LIGHTS.DAY, g);
    }} />
  </Stage>; };
const B15: React.FC<BP> = ({ p, f, t }) => <Stage look="day" cam={V(0.4, 1.7, -0.6)} target={V(0, 1.8, -4.2)} fov={46} blur={12} vignette={0.45} tint="#5ab0c0"
  overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.12 * glide(p) };
    P("scylla", "teen", { x: 560, y: 520 + 880 * 2.2, s: 2.2, facing: -0.1, look: [-0.2, 0], mouth: 0.75, open: talk(t, 4, 40, 0.4), brow: -0.4, eye: 0.8, tilt: -6, breathe: f * 1.4, prop: necklace, armR: [-140, -30], handR: "grip" }, LIGHTS.DAY, g, c); }} />}>
  <Backdrop mood="day" z={-90} y={14} /><Ocean f={f} color="#2a7a9a" amp={0.15} y={-0.3} /><Cove f={f} pool={PAL.cove} />
</Stage>;
const B16: React.FC<BP> = ({ p, f }) => { const cam = mv([2.5, 2.2, 3], [2.0, 2.0, 2.2], p);
  return <Stage look="night" cam={cam} target={V(0, 0.6, -4)} fov={46} vignette={0.6} tint="#3a4a8a" fogScale={1.5}>
    <Backdrop mood="night" moon="white" moonXY={[0.3, 0.3]} z={-90} y={14} /><Ocean f={f} color="#1a3048" y={-0.3} /><Cove f={f} pool="#0a1820" glow={0.08} />
    <CardActor kind="circe" age="teen" at={[0.7, 0.6, -2]} heightM={1.6} camPos={cam} light={LIGHTS.NIGHT} pose={{ kneel: 1, facing: -0.5, look: [-0.7, 0.7], brow: 0.5, mouth: -0.3, breathe: f, prop: basket(1), armL: [20, 70] }} />
  </Stage>; };
const B17: React.FC<BP> = ({ p, f, t }) => { const pour = ramp(t, 0, 20);
  return <Stage look="night" cam={V(0, 1.2, 2)} target={V(0, 0.6, -4)} fov={46} blur={12} vignette={0.7} tint="#2a3a6a"
    overlay={<Over draw={(g) => { const c: Cam = { x: 0, y: 0, zoom: 1 + 0.12 * glide(p) }, ci = { x: 360, y: 1880, s: 1.7, kneel: 1 }, vial: [number, number] = [640, 1180];
      g.save(); g.translate(W / 2, H / 2); g.scale(c.zoom, c.zoom); g.translate(-W / 2, -H / 2);
      g.fillStyle = radGrad(g, 650, 1720, 0, 520, [[0, `rgba(255,210,90,${0.5 * pour})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 900, W, H - 900);
      for (let k = 0; k < 5; k++) { const ph = ((t * 0.03 + k * 0.2) % 1); g.strokeStyle = `rgba(240,192,64,${0.6 * (1 - ph) * pour})`; g.lineWidth = 5; g.beginPath(); g.ellipse(650, 1720, 40 + ph * 420, 12 + ph * 110, 0, 0, 6.283); g.stroke(); }
      g.strokeStyle = PAL.sap; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.moveTo(vial[0] + 30, vial[1] + 40); g.quadraticCurveTo(660, 1500, 650, lerp(1300, 1715, pour)); g.stroke(); g.strokeStyle = PAL.sapHi; g.lineWidth = 5; g.stroke(); g.restore();
      P("circe", "teen", { ...ci, facing: 0.45, look: [0.6, 0.8], brow: 0.55, eye: 0.85, mouth: -0.35, tear: 0.5, breathe: f, blink: blink(f, 17), armR: reachArm("circe", "teen", "R", ci, vial), handR: "grip", armL: reachArm("circe", "teen", "L", ci, [vial[0] - 40, vial[1] + 50]), handL: "open" }, LIGHTS.SAP, g, c);
      particles(g, f, "sparks", 17, 40, "rgba(255,220,120,0.8)", 1.2); }} />}>
    <Backdrop mood="night" z={-90} y={14} /><Ocean f={f} color="#1a3048" y={-0.3} /><Cove f={f} pool="#0a1418" glow={0.25} />
  </Stage>; };
const B18: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#0e1018"], [1, "#1a120a"]]); const c: Cam = { x: -60 * glide(p), y: 20 * glide(p), zoom: 1 + 0.26 * glide(p) }; const gl = 0.5 + 0.2 * Math.sin(f * 0.35) + 0.08 * Math.sin(f * 1.7); // the sap glow pulses (QC)
  g.fillStyle = radGrad(g, 540, 1900, 0, 1300, [[0, `rgba(255,200,80,${gl})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
  P("circe", "teen", { x: 540, y: 620 + 880 * 2.6, s: 2.6, headOnly: true, facing: 0.05, look: [0, 0.6], eye: 0.8, brow: lerp(0.5, -0.3, ramp(t, 20, 70)), mouth: -0.4, tear: 0.8, breathe: f, blink: blink(f, 18) }, LIGHTS.SAP, g, c);
  particles(g, f, "sparks", 18, 25, "rgba(255,220,120,0.7)", 1.1); darkVig(g, 0.7); }} /></AbsoluteFill>;

// ======================= TRANSFORMATION =======================
const B19: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0, 1.4, 3.6], [0, 1.2, 2.6], p * p), boil = ramp(t, 4, 20);
  return <Stage look="dawn" cam={cam} target={V(0, 1.2, -4)} fov={48} vignette={0.55} tint="#7aa080" flash={boil * 0.3}>
    <Backdrop mood="dawn" z={-90} y={14} /><Ocean f={f} color="#3a6a8a" y={-0.3} /><Cove f={f} pool="#4a8a5a" glow={0.5 * boil} boil={boil} />
    <CardActor kind="scylla" age="teen" at={[0, 0.15, -4]} heightM={1.65} camPos={cam} light={LIGHTS.DAWN} pose={{ facing: 0, look: [0, -0.3], eye: 1.2, brow: 0.9, mouth: -0.5, open: 0.5 * boil, tremble: boil, breathe: f * 2, armL: [-120, -30], armR: [120, 30], kneel: 0.3 * boil }} />
  </Stage>; };
const B20: React.FC<BP> = ({ p, f, t }) => <Stage look="storm" cam={V(0, 0.6, 4)} target={V(0, 3, -6)} fov={50} blur={10} vignette={0.65} tint="#3a5a5a" flash={(1 - ramp(t, 0, 8)) * 0.4}
  overlay={<Over draw={(g) => { scylla(g, { x: 0, y: -30 * p, zoom: 1 + 0.1 * glide(p) }, 540, 1400, 1.0, f, LIGHTS.STORM, { rise: clamp(0.25 + ramp(t, 0, 24) * 0.8), fear: 1, lunge: ramp(t, 20, 40) * 0.5, lungeHead: 2 }); particles(g, f, "rain", 5, 120, "rgba(200,230,240,0.6)"); }} />}>
  <Backdrop mood="night" z={-90} y={14} /><Ocean f={f} storm={0.6} color="#1a3a48" y={-0.3} /><Cove f={f} pool="#2a5a4a" boil={1} /><Cliff pos={[-8, -1, -14]} r={6} h={12} seed={2} color="#4a4440" />
</Stage>;
const B21: React.FC<BP> = ({ p, f }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#1a2a2a"], [1, "#06100e"]]); scylla(g, { x: 0, y: -260, zoom: 1.6 + 0.2 * glide(p) }, 540, 1500, 1.15, f * 1.6, LIGHTS.STORM, { rise: 1, fear: 1, lunge: 0.3 + 0.3 * Math.sin(f * 0.2), lungeHead: 1 });
  particles(g, f, "rain", 21, 100, "rgba(200,230,240,0.5)"); darkVig(g, 0.65); }} /></AbsoluteFill>;
const B22: React.FC<BP> = ({ p, f, t }) => { const cam = mv([2, 1.5, 12], [1, 2.2, 10], p);
  return <Stage look="sunset" cam={cam} target={V(-2, 5, -12)} fov={52} vignette={0.6} tint="#a84a3a" fogScale={2.5}>
    <Backdrop mood="sunset" z={-90} y={20} /><Ocean f={f} color="#3a4a6a" amp={0.4} />
    <Cliff pos={[-5, -1, -16]} r={6} h={11} seed={3} color="#5a4a44" /><Cliff pos={[11, -1, -20]} r={8} h={13} seed={7} color="#5a4a44" />
    <Ship pos={[lerp(4, -1, p), 0, -5]} rotY={0.3} f={f} />
    <CardCanvas at={[-3.6, 9.6, -15]} ppm={105} camPos={cam} shadow={0} draw={(g) => scylla(g, ON, 540, 1700, 1.2, f, LIGHTS.SUNSET, { rise: 1, fear: 0.4, lunge: ramp(t, 40, 75) * 1.0, lungeHead: 3 })} />
  </Stage>; };
const B23: React.FC<BP> = ({ p, f }) => { const cam = mv([-3, 2.4, 10], [3, 2.2, 9], p);
  return <Stage look="rainDay" cam={cam} target={V(0, 1.6, 0)} fov={48} vignette={0.55} tint="#5a6a8a">
    <Backdrop mood="day" z={-90} y={10} /><Ocean f={f} color="#3a5a74" y={-0.6} />
    <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[9, 11, 1.4, 20]} /><meshToonMaterial color="#7a8a5a" /></mesh>
    <IslandHouse pos={[0, 0.3, -1]} lit={0} />
    <CardActor kind="circe" age="teen" at={[0.2, 0.3, 1.3]} heightM={1.6} camPos={cam} light={LIGHTS.DAY} pose={{ facing: 0.2, look: [0.6, 0.1], eye: 0.85, brow: 0.5, mouth: -0.2, breathe: f, blink: blink(f, 23), armL: [30, 70], armR: [-30, -70] }} />
    <Motes f={f} n={40} box={[[-6, 0.5, -4], [6, 5, 4]]} color="#d8e0f0" size={0.04} />
  </Stage>; };
const B24: React.FC<BP> = ({ p, f, t }) => { const hear = ramp(t, 25, 50);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    sky(g, [[0, "#8a98a8"], [1, "#3a4450"]]); const c: Cam = { x: 0, y: 0, zoom: 1 + 0.12 * glide(p) };
    g.save(); g.translate(W / 2, H / 2); g.scale(c.zoom, c.zoom); g.translate(-W / 2, -H / 2);
    g.fillStyle = "#5a4a3a"; g.fillRect(0, 0, 160, H); g.fillRect(920, 0, 160, H); g.fillRect(0, 0, W, 160); g.restore();
    silhouette(g, "james", "adult", { x: 280, y: 1950, s: 1.5, facing: 0.4, still: true, armR: [-60, -50], handR: "open" }, "#2a2a34", 0.95, c);
    g.save(); g.fillStyle = "#e8e0c0"; for (const sx of [180, 360]) { g.beginPath(); g.moveTo(sx, 1880); g.lineTo(sx - 40, 1820); g.lineTo(sx + 10, 1860); g.fill(); } g.restore();
    P("circe", "teen", { x: 760, y: 560 + 880 * 1.9, s: 1.9, facing: -0.45, look: [-0.7, 0], eye: lerp(0.9, 1.2, hear), brow: lerp(0.3, 0.9, hear), mouth: lerp(-0.1, -0.5, hear), open: 0.15 * hear, breathe: f, blink: blink(f, 24), tremble: 0.4 * hear, armL: [30, 70], armR: [-30, -70] }, LIGHTS.DAY, g, c);
    darkVig(g, 0.5); }} /></AbsoluteFill>; };

// ======================= REVELATION =======================
const B25: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#141a2a"], [1, "#0a0c14"]]); const c: Cam = { x: 0, y: -40 * glide(p), zoom: 1 + 0.12 * glide(p) };
  const r = rng(25); for (let k = 0; k < 26; k++) { const x = 80 + r() * 920, y = 200 + r() * 1300, born = r() * 30, life = ramp(t, born, born + 10) * (1 - ramp(t, born + 20, born + 34));
    g.fillStyle = radGrad(g, x, y - t * 2, 0, 60, [[0, `rgba(255,190,100,${0.7 * life})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(x - 60, y - t * 2 - 60, 120, 120); }
  P("circe", "teen", { x: 540, y: 1720, s: 1.5, kneel: 1, facing: 0, look: [0, 0.8], eye: 0.5, brow: 0.9, mouth: -0.5, tear: 1, nod: 0.15, shoulders: 1, breathe: f * 1.5, tremble: 0.3, armL: [40, 100], armR: [-40, -100] }, { ...LIGHTS.NIGHT, key: "#ffc890", y: 600 }, g, c);
  darkVig(g, 0.6); }} /></AbsoluteFill>;
const B26: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0.6, 1.5, 3.4], [0.5, 1.6, 0.8], p);
  return <Stage look="dawn" cam={cam} target={V(-1, 4, -16)} fov={50} vignette={0.55} tint="#8a8aa8" fogScale={2}>
    <Backdrop mood="dawn" z={-90} y={20} /><Ocean f={f} color="#3a5a7a" amp={0.3} />
    <Cliff pos={[-5, -1, -18]} r={6} h={11} seed={3} color="#5a5450" /><Cliff pos={[10, -1, -22]} r={8} h={13} seed={7} color="#5a5450" />
    <CardCanvas at={[-3.6, 9.6, -17]} ppm={110} camPos={cam} shadow={0} draw={(g) => scylla(g, ON, 540, 1700, 1.2, f, LIGHTS.DAWN, { rise: 1, fear: 0.3, tint: "#3a4a44" })} />
    <group position={[0, 0.2, lerp(0, -3, p)]} rotation={[0, 0, Math.sin(f * 0.07) * 0.06]}>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.6, 1, 0.6]}><cylinderGeometry args={[0.6, 0.3, 2.6, 8]} /><meshToonMaterial color={SEA.wood} /></mesh></group>
    <CardActor kind="circe" age="adult" at={[0, 0.35, lerp(0, -3, p)]} heightM={1.6} camPos={cam} light={LIGHTS.DAWN} pose={{ back: true, kneel: 0.6, armL: [-30 + Math.sin(t * 0.25) * 30, -20], armR: [30 - Math.sin(t * 0.25) * 30, 20], breathe: f }} />
  </Stage>; };
const B27: React.FC<BP> = ({ p, f }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#6a7480"], [1, "#2a3038"]]); scylla(g, { x: 0, y: 0, zoom: 1 + 0.12 * glide(p) }, 600, 1150, 0.85, f, LIGHTS.DAWN, { rise: 1, fear: 0.5, lunge: 0.2, lungeHead: 2 });
  P("circe", "adult", { x: 260, y: 640 + 880 * 1.9, s: 1.9, facing: 0.5, look: [0.6, -0.6], eye: 1.0, brow: 0.6, mouth: -0.2, breathe: f, armL: [30, 70], armR: [-30, -70] }, LIGHTS.DAWN, g);
  darkVig(g, 0.55); }} /></AbsoluteFill>;
const B28: React.FC<BP> = ({ p, f, t }) => { const st = ramp(t, 8, 90);
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    sky(g, [[0, "#8a8478"], [1, "#2a2824"]]); g.fillStyle = radGrad(g, 540, 900, 0, 1000, [[0, `rgba(255,214,120,${0.5 * Math.sin(st * Math.PI)})`], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
    scylla(g, { x: 0, y: -120 * glide(p), zoom: 1.3 + 0.15 * glide(p) }, 540, 1300, 0.9, f * (1 - st), LIGHTS.DAWN, { rise: 1, fear: lerp(0.8, 0.1, st), stone: st, eyesClosed: ramp(t, 50, 85) });
    particles(g, f, "dust", 28, 50, "rgba(230,220,200,0.6)"); darkVig(g, 0.55); }} /></AbsoluteFill>; };
const B29: React.FC<BP> = ({ p, f }) => { const cam = mv([1, 1.8, 10], [-0.5, 2.6, 8.5], p);
  return <Stage look="dawn" cam={cam} target={V(-2.5, 6, -14)} fov={50} vignette={0.45} tint="#e8c0a0" fogScale={2.5}>
    <Backdrop mood="dawn" z={-90} y={20} /><Ocean f={f} color="#4a7a9a" amp={0.15} />
    <Cliff pos={[-5, -1, -16]} r={6} h={11} seed={3} color="#6a6058" /><Cliff pos={[11, -1, -20]} r={8} h={13} seed={7} color="#6a6058" />
    <CardCanvas at={[-3.6, 9.6, -15]} ppm={105} camPos={cam} shadow={0} draw={(g) => scylla(g, ON, 540, 1700, 1.2, 0, LIGHTS.DAWN, { rise: 1, fear: 0.1, stone: 1, eyesClosed: 1 })} />
    <Motes f={f} n={14} box={[[-6, 9, -16], [-2, 13, -13]]} color="#2a2a2a" size={0.12} drift={1.2} />
  </Stage>; };
const B30: React.FC<BP> = ({ p, f, t }) => <AbsoluteFill><CanvasFrame draw={(g) => {
  sky(g, [[0, "#3a4a58"], [1, "#0c1820"]]); const c: Cam = { x: 0, y: 0, zoom: 1 + 0.12 * glide(p) };
  g.save(); g.globalAlpha = 0.72; g.filter = "blur(1.5px)"; g.translate(W, 0); g.scale(-1, 1);
  P("circe", "adult", { x: 540, y: 820 + 880 * 3.0, s: 3.0, headOnly: true, facing: 0, look: [0, -0.2], brow: lerp(0.4, 0.8, ramp(t, 10, 50)), eye: 0.9, mouth: -0.25, tear: ramp(t, 20, 60) * 0.7, breathe: f, blink: blink(f, 30) }, LIGHTS.DAWN, g, c);
  g.restore(); g.filter = "none"; g.fillStyle = "rgba(20,40,60,0.3)"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 6; k++) { const ph = (t * 0.02 + k / 6) % 1; g.strokeStyle = `rgba(230,240,250,${0.3 * (1 - ph)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(540, 800, 60 + ph * 520, 16 + ph * 120, 0, 0, 6.283); g.stroke(); }
  g.fillStyle = "#4a4440"; g.strokeStyle = "#1c121c"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 160); g.quadraticCurveTo(700, 260, 540, 200); g.quadraticCurveTo(300, 150, 0, 300); g.closePath(); g.fill(); g.stroke();
  basket(0)(g, "L", 860, 110); particles(g, f, "dust", 30, 30, "rgba(255,240,220,0.5)"); }} /></AbsoluteFill>;
const B31: React.FC<BP> = ({ p, f, t, d }) => { const fade = ramp(t, d - 28, d - 2), fl = ramp(t, fr(0.6), fr(4.2));
  return <AbsoluteFill><CanvasFrame draw={(g) => {
    sky(g, [[0, "#f0a060"], [0.5, "#c86a5a"], [1, "#3a2a3a"]]); const z = 1 + 0.12 * glide(p);
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    g.fillStyle = radGrad(g, 760, 760, 0, 400, [[0, "rgba(255,230,170,0.9)"], [1, "rgba(255,200,120,0)"]]); g.fillRect(0, 0, W, H);
    g.fillStyle = "#3a4a6a"; g.fillRect(0, 1000, W, H); g.strokeStyle = "rgba(255,200,150,0.35)"; g.lineWidth = 3; for (let k = 0; k < 12; k++) { const y = 1030 + k * 30; g.beginPath(); g.moveTo(560 + Math.sin(f * 0.05 + k) * 40 - k * 20, y); g.lineTo(900 + k * 20, y); g.stroke(); }
    scylla(g, ON, 260, 930, 0.45, 0, LIGHTS.SUNSET, { rise: 1, fear: 0.1, stone: 1, eyesClosed: 1 });
    g.fillStyle = "#4a3a34"; g.strokeStyle = "#1c121c"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 1380); g.quadraticCurveTo(500, 1300, W, 1420); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill(); g.stroke();
    basket(0)(g, "L", 560, 1250);
    const fx = lerp(600, 980, fl), fy = lerp(1240, 1500, fl) - Math.sin(fl * Math.PI) * 260; g.save(); g.translate(fx, fy); g.rotate(fl * 6); g.fillStyle = PAL.sap; g.beginPath(); for (let q = 0; q < 6; q++) { const a = q / 6 * 6.283; g.ellipse(Math.cos(a) * 18, Math.sin(a) * 18, 16, 9, a, 0, 6.283); } g.fill(); g.fillStyle = "#c87a1a"; g.beginPath(); g.arc(0, 0, 8, 0, 6.283); g.fill(); g.restore();
    g.restore(); particles(g, f, "dust", 31, 40, "rgba(255,230,190,0.6)"); darkVig(g, 0.55, 500);
    g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, W, H); }} /></AbsoluteFill>; };

const SCENES: React.FC<BP>[] = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20, B21, B22, B23, B24, B25, B26, B27, B28, B29, B30, B31];
type Beat = { id: number; start_s: number; end_s: number };
const BeatScene: React.FC<{ i: number; from: number; d: number }> = ({ i, from, d }) => { const t = useCurrentFrame(); const S = SCENES[i]; return <S t={t} d={d} p={clamp(t / Math.max(1, d - 1))} f={from + t} />; };
const grainTiles = (() => { let tl: HTMLCanvasElement[] | null = null; return () => tl ??= [0, 1, 2, 3].map((k) => { const [c, g] = makeCanvas(256, 256); const im = g.createImageData(256, 256); const r = rng(k * 99 + 7); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; }); })();
const Grain: React.FC = () => <CanvasFrame draw={(g, f) => { g.fillStyle = g.createPattern(grainTiles()[f % 4], "repeat")!; g.fillRect(0, 0, W, H); }} />;
void Flame;

export const SCYLLA_FRAMES = fr((BEATS.beats as Beat[]).at(-1)!.end_s);
export const ScyllaEpisode: React.FC = () => {
  const beats = BEATS.beats as Beat[];
  return <AbsoluteFill style={{ background: "#000" }}>
    {beats.map((b, i) => { const from = fr(b.start_s), d = fr(b.end_s) - from;
      return <Sequence key={b.id} from={from} durationInFrames={d} layout="none"><AbsoluteFill><BeatScene i={i} from={from} d={d} /></AbsoluteFill></Sequence>; })}
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: GRADE.grainOpacity }}><Grain /></AbsoluteFill>
    {(getInputProps() as { plate?: boolean }).plate ? null : <CaptionBox caps={CAPS as Cap[]} look={CAPTION} />}
  </AbsoluteFill>;
};
