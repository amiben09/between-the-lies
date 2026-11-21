// "Perfect" (Jinx, Arcane S1) — full episode. 31 beats keyed to beats.json (times from the real voice).
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, getInputProps, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Cam, Ctx, H, W, clamp, glide, lerp, makeCanvas, particles, radGrad, ramp, rng } from "../../btl/core";
import { Arm, Kind, Age, Light, Pose, person, reachArm } from "../../btl/people";
import { CardActor, CardCanvas, Inked, V, toon } from "../../three/kit3d";
import { Flame, MistPlane, Motes } from "../../three/props";
import { CARD_LIGHT, Look, Stage } from "../itachi/stage";
import { BlastSite, Hideout, MonkeyBomb, RocketRoof, SilcoOffice, TableHall, VerticalCity, ZaunStreet } from "./sets";
import BEATS from "./beats.json";
import CAPS from "./captions.json";

const FPS = 30; const fr = (s: number) => Math.round(s * FPS);
type P3 = [number, number, number];
type BP = { t: number; d: number; p: number; f: number };
const mv = (a: P3, b: P3, p: number) => { const k = glide(p); return V(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)); };
const lerpArm = (a: Arm, b: Arm, k: number): Arm => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const ON: Cam = { x: 0, y: 0, zoom: 1 };
const L2 = (l: Look) => CARD_LIGHT[l];
const SMOKE: Light = { x: 900, y: 600, r: 1900, key: "#ffa860", shade: "#0a140e", keyA: 0.3, shadeA: 0.5 };
const WARM: Light = { x: 700, y: 200, r: 1900, key: "#ffc070", shade: "#2a1a14", keyA: 0.3, shadeA: 0.35 };
const CANDLE: Light = { x: 540, y: 1500, r: 1500, key: "#ffa050", shade: "#08040a", keyA: 0.38, shadeA: 0.6 };
const GREEN: Light = { x: 540, y: 300, r: 1800, key: "#8aff9a", shade: "#06100a", keyA: 0.25, shadeA: 0.55 };
const Over: React.FC<{ draw: (g: Ctx) => void }> = ({ draw }) => <CanvasFrame draw={(g) => draw(g)} />;
const CLAG: Partial<Pose> = { coat: "#6a5a3a", coatHi: "#8a7a54", robe: false, trim: null };
const THUG: Partial<Pose> = { coat: "#2a2a2a", coatHi: "#444", robe: false, trim: null, brow: -0.6, mouth: -0.3 };
/** shoulder-mounted rocket launcher drawn in the rig's hand (original design) */
const launcher = (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.save(); g.translate(x, y); g.rotate(-1.2);
  g.fillStyle = "#3a3f4a"; g.strokeStyle = "#120e16"; g.lineWidth = 5; g.beginPath(); g.roundRect(-40, -170, 80, 260, 18); g.fill(); g.stroke();
  g.fillStyle = "#e84a9a"; g.fillRect(-40, -120, 80, 18); g.fillStyle = "#5ab8ff"; g.beginPath(); g.arc(0, -150, 22, 0, 6.283); g.fill(); g.stroke(); g.restore(); };
const pistol = (g: Ctx, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.fillStyle = "#2a2a30"; g.strokeStyle = "#120e16"; g.lineWidth = 4; g.beginPath(); g.roundRect(x - 10, y - 8, 70, 22, 5); g.fill(); g.stroke(); };

// ======================= HOOK =======================
const B1: React.FC<BP> = ({ p, f }) => { const cam = mv([0.4, 0.75, 2.6], [0.3, 0.8, 1.2], p);
  return <Stage look="fire" cam={cam} target={V(0, 1.2, -8)} fov={44} vignette={0.6} tint="#2a5a3a" fogScale={0.3}>
    <ZaunStreet f={f} smoke={1} fire />
    <CardActor kind="vi" age="child" at={[0.6, 0, lerp(-5.5, -7, p)]} heightM={1.45} camPos={cam} light={SMOKE} pose={{ back: true, shoulders: 0.4, walk: f * 0.3, breathe: f }} />
    <CardActor kind="jinx" age="child" at={[-0.15, 0, -1.6]} heightM={1.2} camPos={cam} res={0.8} light={SMOKE} pose={{ back: true, kneel: 1, armR: lerpArm([-30, -20], [-150, -10], ramp(f, 4, 30)), handR: "open", tremble: 0.4, breathe: f * 2 }} />
  </Stage>; };
const B2: React.FC<BP> = ({ p, f, t }) => { const touch = ramp(t, 4, 24);
  return <Stage look="candle" cam={V(0, 1.4, 1)} target={V(0, 2, -3)} blur={10} vignette={0.6} tint="#2a6a3a"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.05 * glide(p) };
      const sl = { x: 330, y: 380 + 1000 * 2.1, s: 2.1 }, jx = { x: 790, y: 520 + 880 * 2.2, s: 2.2 };
      person(g, c, 1, "silco", "adult", { ...sl, facing: 0.5, look: [0.7, 0.1], brow: 0.2, mouth: 0.25, armR: lerpArm([-10, -10], [-95, -40], touch), handR: "open", still: true, breathe: f }, GREEN);
      person(g, c, 1, "jinx", "teen", { ...jx, facing: -0.5, look: [-0.8, -0.1], brow: 0.8, eye: 0.7, mouth: 0.25 * touch - 0.2, tear: 0.8, tilt: -6 * touch, still: true, breathe: f * 1.4 }, GREEN);
      particles(g, f, "dust", 31, 25, "rgba(160,255,170,0.6)"); }} />}>
    <SilcoOffice f={f} />
  </Stage>; };

// ======================= WORLD =======================
const B3: React.FC<BP> = ({ p, f }) => { const cam = mv([0, 110, 120], [0, 62, 60], p), look = mv([0, 70, -80], [0, 40, -80], p);
  return <Stage look="day" cam={cam} target={look} fov={50} vignette={0.35} tint="#e8c890" fogScale={4}><VerticalCity f={f} /></Stage>; };
const B4: React.FC<BP> = ({ p, f }) => { const cam = mv([0, 52, 50], [0, 12, 30], p * p * 0.4 + p * 0.6), look = mv([0, 36, -80], [0, 6, -60], p);
  return <Stage look="night" cam={cam} target={look} fov={50} vignette={0.5} tint="#3a7a3a" fogScale={3}><VerticalCity f={f} /></Stage>; };
const B5: React.FC<BP> = ({ p, f }) => { const cam = mv([-1.6, 1.6, 3], [1.4, 1.6, 2.4], p);
  return <Stage look="night" cam={cam} target={mv([-0.6, 1.4, -8], [0.6, 1.4, -8], p)} fov={46} vignette={0.5} tint="#2a5a3a" fogScale={0.6}>
    <ZaunStreet f={f} smoke={0.5} />
    {[[-2.6, -4, 0.5], [2.4, -6, -0.6], [-1.8, -9, 0.3], [1.2, -11, -0.4], [3, -3, -0.7]].map(([x, z, fc], i) =>
      <CardActor key={i} kind="bully" age="adult" at={[x, 0, z]} heightM={1.7 + (i % 2) * 0.1} camPos={cam} light={GREEN} res={0.4} pose={{ ...THUG, coat: ["#2a2a2a", "#3a2a3a", "#2a3a2a"][i % 3], facing: fc, walk: i % 2 ? f * 0.25 : undefined, breathe: f + i * 9 }} />)}
  </Stage>; };
const Crystal: React.FC<{ f: number; crack?: number }> = ({ f, crack = 0 }) => { const pulse = 0.8 + 0.2 * Math.sin(f * 0.25);
  return <group position={[0, 1.0, -2]}>
    <mesh rotation={[0, f * 0.02, 0]}><octahedronGeometry args={[0.35, 0]} /><meshBasicMaterial color={crack > 0 ? "#e8ffff" : "#6ae8ff"} toneMapped={false} /></mesh>
    <pointLight intensity={4 * pulse + crack * 20} distance={8} decay={1.4} color="#6ae8ff" />
    {[0, 1, 2].map((k) => <Inked key={k} geo={new THREE.TorusGeometry(0.6 + k * 0.18, 0.03, 6, 24)} mat={toon("#c8a050")} pos={[0, 0, 0]} rot={[f * 0.03 * (k + 1), k, 0]} />)}
  </group>; };
const B6: React.FC<BP> = ({ p, f }) => { const cam = mv([1.6, 1.4, 1.5], [0.6, 1.1, -0.4], p);
  return <Stage look="candle" cam={cam} target={V(0, 1.0, -2)} fov={40} vignette={0.6} tint="#2a5a6a"><Hideout f={f} bench={false} /><Crystal f={f} /><Motes f={f} n={60} box={[[-1, 0.4, -3], [1, 2, -1]]} color="#9af0ff" size={0.03} rise={0.6} seed={3} /></Stage>; };
const B7: React.FC<BP> = ({ p, f }) => <Stage look="fire" cam={mv([0.5, 1.6, 4], [0.35, 1.5, 3.2], p)} target={V(0, 1.2, -3)} fov={44} vignette={0.5} tint="#2a5a6a"><ambientLight intensity={0.6} color="#9adfff" /><pointLight position={[0, 2.2, -1.5]} intensity={6 + 4 * Math.sin(f * 0.9)} distance={14} decay={1.2} color="#6ae8ff" /><BlastSite f={f} blast={0.05 + 0.7 * ramp(p, 0.1, 1)} /></Stage>;

// ======================= RELATIONSHIP (warm) =======================
const B8: React.FC<BP> = ({ p, f }) => { const cam = mv([1.6, 1.4, 4.2], [1.0, 1.4, 3.0], p);
  return <Stage look="interior" cam={cam} target={V(0.4, 1.3, -1.2)} fov={42} vignette={0.45} tint="#ffa040">
    <Hideout f={f} />
    <CardCanvas at={[0.4, 0, -1.0]} ppm={650} camPos={cam} draw={(g) => { const bob = Math.sin(f * 0.25) * 8;
      person(g, ON, 1, "vander", "adult", { x: 560, y: 1880, s: 1.08, facing: 0, mouth: 0.8, open: 0.25, eye: 0.6, armL: [-150, -20], armR: [150, 20], breathe: f }, WARM);
      person(g, ON, 1, "vi", "child", { x: 300, y: 1120 + bob, s: 1.05, facing: 0.3, mouth: 1, open: 0.4, eye: 0.6, armL: [-60, -40], breathe: f }, WARM);
      person(g, ON, 1, "jinx", "child", { x: 820, y: 1120 - bob, s: 1.0, facing: -0.3, mouth: 1, open: 0.45, eye: 0.6, armR: [60, 40], breathe: f }, WARM); }} />
  </Stage>; };
const B9: React.FC<BP> = ({ p, f, t }) => { const drop = ramp(t, 40, 60);
  return <Stage look="interior" cam={V(0.4, 1.3, 3)} target={V(0, 1.3, -3)} blur={10} vignette={0.5} tint="#c86a30"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.06 * glide(p) };
      person(g, c, 1, "jinx", "child", { x: 720, y: 760 + 640 * 2.4, s: 2.4, facing: -0.4, look: [-0.7, 0.1], brow: drop * 0.9, eye: 1 - drop * 0.25, mouth: 0.8 - drop * 1.3, tear: drop * 0.4, still: true, breathe: f }, WARM);
      person(g, c, 1, "mylo", "teen", { x: 200, y: 520 + 880 * 3.2, s: 3.2, facing: 0.5, look: [0.8, 0.2], brow: -0.7, mouth: 0.4, armR: [-95, 10], handR: "point", still: true, breathe: f }, WARM);
    }} />}><Hideout f={f} /></Stage>; };
const B10: React.FC<BP> = ({ p, f, t }) => { const bump = ramp(t, 12, 28);
  return <Stage look="interior" cam={V(-0.6, 1.0, 3)} target={V(0, 1.2, -3)} blur={10} vignette={0.5} tint="#ffa040"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.04 * glide(p) };
      const vi = { x: 330, y: 700 + 640 * 2.5 * 0.7 + 640 * 2.5 * 0.3, s: 2.5 }, pw = { x: 760, y: 800 + 640 * 2.4, s: 2.4 };
      person(g, c, 1, "vi", "child", { ...vi, kneel: 1, facing: 0.5, look: [0.7, -0.2], brow: 0.3, mouth: 0.6, armR: lerpArm([-20, -20], [-80, -20], bump), handR: "fist", still: true, breathe: f }, WARM);
      person(g, c, 1, "jinx", "child", { ...pw, facing: -0.5, look: [-0.7, 0.3], brow: 0.4 - bump * 0.4, mouth: -0.2 + bump * 1.0, tear: 0.4 * (1 - bump), armL: lerpArm([20, 20], [80, 20], bump), handL: "fist", still: true, breathe: f }, WARM);
    }} />}><Hideout f={f} /></Stage>; };
const B11: React.FC<BP> = ({ p, f }) => { const a = lerp(-0.6, 0.2, glide(p)); const cam = V(-3.55 + Math.sin(a) * 0.85, 1.12, 1.35 + Math.cos(a) * 0.85);
  return <Stage look="interior" cam={cam} target={V(-3.55, 0.82, 1.3)} fov={36} vignette={0.5} tint="#ffa040"><Hideout f={f} /></Stage>; };
const B12: React.FC<BP> = ({ p, f, t }) => { const cam = mv([-1.6, 1.2, 2.6], [-1.8, 1.15, 2.3], p); const puff = ramp(t, 10, 22), slump = ramp(t, 24, 38);
  return <Stage look="interior" cam={cam} target={V(-3.4, 0.9, 1.4)} fov={40} vignette={0.5} tint="#ffa040">
    <Hideout f={f} />
    <CardActor kind="jinx" age="child" at={[-2.9, 0, 1.6]} heightM={1.2} camPos={cam} light={WARM} res={0.7} pose={{ facing: -0.6, look: [-0.8, 0.5], brow: slump * 0.8, mouth: 0.6 - slump * 1.1, shoulders: slump * 0.8, armL: [70 - slump * 60, 30], handL: "point", breathe: f }} />
    {puff > 0 && <MistPlane pos={[-3.55, 1.1 + puff * 0.3, 1.3]} w={0.8 * puff + 0.1} h={0.6 * puff + 0.1} color="#c8c8c0" a={0.6 * (1 - slump * 0.6)} f={f * 4} />}
  </Stage>; };

// ======================= CONFLICT =======================
const B13: React.FC<BP> = ({ p, f }) => { const cam = mv([0.3, 6, 6], [0.3, 2.2, 3.4], p);
  return <Stage look="night" cam={cam} target={V(0, 1.3, -6)} fov={44} vignette={0.6} tint="#2a5a3a" fogScale={0.6}>
    <ZaunStreet f={f} smoke={0.4} rain />
    <CardActor kind="vander" age="adult" at={[lerp(0.2, -0.6, p), 0, lerp(-5, -7.5, p)]} heightM={1.95} camPos={cam} spherical light={GREEN} pose={{ back: true, lean: -8, kneel: 0.3, breathe: f }} />
    {[-0.9, 1.1].map((x, i) => <CardActor key={i} kind="bully" age="adult" at={[x + lerp(0, -0.8, p), 0, lerp(-5.2, -7.7, p)]} heightM={1.8} camPos={cam} spherical light={GREEN} res={0.4} pose={{ ...THUG, back: true, walk: f * 0.3 + i, breathe: f }} />)}
    <CardActor kind="silco" age="adult" at={[2.4, 0, -9]} heightM={1.82} camPos={cam} spherical light={GREEN} pose={{ facing: -0.3, look: [-0.5, 0.2], brow: -0.2, mouth: 0.15, armL: [10, 30], armR: [-10, -30], breathe: f }} />
  </Stage>; };
const B14: React.FC<BP> = ({ p, f }) => { const cam = mv([2.4, 1.3, 3], [1.0, 1.3, 1.4], p);
  return <Stage look="night" cam={cam} target={V(0, 1.1, -8)} fov={44} vignette={0.55} tint="#2a5a3a" fogScale={0.6}>
    <ZaunStreet f={f} smoke={0.4} />
    {([["vi", "child", 0.3, 0], ["mylo", "teen", -0.6, 0.6], ["bully", "teen", 0.9, 1.1]] as [Kind, Age, number, number][]).map(([k, a, x, dz], i) =>
      <CardActor key={i} kind={k} age={a} at={[x, 0, lerp(-3, -10, p) - dz]} heightM={a === "child" ? 1.45 : 1.65} camPos={cam} light={GREEN} res={0.5} pose={{ ...(k === "bully" ? CLAG : {}), back: true, walk: f * 0.55 + i, lean: 6, breathe: f }} />)}
    <CardActor kind="jinx" age="child" at={[-2.6, 0, 0.2]} heightM={1.2} camPos={cam} light={GREEN} res={0.6} pose={{ facing: 0.6, look: [0.9, -0.1], brow: 0.6, mouth: -0.3, armR: [-30, -60], breathe: f }} />
  </Stage>; };
const B15: React.FC<BP> = ({ p, f }) => { const cam = mv([-0.3, 0.75, 1.4], [-0.2, 0.8, -1.6], p); const z = lerp(-1.2, -4.4, p);
  return <Stage look="night" cam={cam} target={V(0.1, 0.8, -9)} fov={44} vignette={0.6} tint="#2a4a5a" fogScale={0.6}>
    <ZaunStreet f={f} smoke={0.5} />
    <CardActor kind="jinx" age="child" at={[0, 0, z]} heightM={1.2} camPos={cam} light={{ ...GREEN, key: "#6ae8ff" }} res={0.7} pose={{ back: true, walk: f * 0.45, breathe: f }} />
    <MonkeyBomb pos={[0.22, 0.5, z + 0.12]} f={f} s={0.8} glow={1} />
  </Stage>; };
const B16: React.FC<BP> = ({ p, f, t, d }) => { const k = clamp(t / Math.max(1, d - 2)); const x = lerp(2, 0.4, k), y = lerp(5, 0.2, k * k), z = lerp(-5.8, -3.2, k);
  return <Stage look="fire" cam={mv([-0.6, 1.6, 0.6], [-0.2, 1.4, -0.6], p)} target={V(lerp(1.0, 0.6, p), lerp(2.6, 1.2, p), -4.5)} fov={46} vignette={0.45} tint="#2a4a5a" fogScale={0.5}>
    <ambientLight intensity={1.4} color="#ffb080" /><pointLight position={[0.4, 2.4, -3.2]} intensity={6} distance={10} decay={1.2} color="#ffd0a0" /><BlastSite f={f} /><pointLight position={[1.2, 3, -3]} intensity={3} distance={8} decay={1.4} color="#6ae8ff" />
    <group position={[x, y, z]} rotation={[k * 6, k * 3, 0]}><MonkeyBomb pos={[0, 0, 0]} f={f} s={1.2} glow={1} /></group>
  </Stage>; };
const B17: React.FC<BP> = ({ p, f, t, d }) => { const b = ramp(t, 0, d * 0.9);
  return <Stage look="fire" cam={V(Math.sin(f * 2) * 0.06 * (1 - b), 1.4 + Math.cos(f * 2.3) * 0.05 * (1 - b), 4.4 - b * 0.4)} target={V(0, 1.4, -3)} fov={46} vignette={0.5} tint="#5a5a4a" fogScale={0.4}><BlastSite f={f} blast={b < 0.85 ? Math.min(0.55, b) : 0} after={b >= 0.85} /></Stage>; };
const Gauntlet: React.FC = () => <group position={[0.2, 0.2, -1.6]} rotation={[0, 0.6, Math.PI / 2.4]}>
  <Inked geo={new THREE.CylinderGeometry(0.16, 0.2, 0.55, 12)} mat={toon("#6a5a4a")} pos={[0, 0, 0]} />
  {[0, 1, 2, 3].map((k) => <Inked key={k} geo={new THREE.BoxGeometry(0.06, 0.18, 0.08)} mat={toon("#8a7a6a")} pos={[-0.09 + k * 0.06, 0.36, 0.05]} />)}
  <Inked geo={new THREE.TorusGeometry(0.19, 0.03, 6, 16)} mat={toon("#c8a050")} pos={[0, -0.2, 0]} rot={[Math.PI / 2, 0, 0]} />
</group>;
const B18: React.FC<BP> = ({ p, f }) => { const cam = mv([1.2, 1.6, 2.6], [1.0, 2.2, 3.2], p);
  return <Stage look="fire" cam={cam} target={V(0, 0.6, -2)} fov={44} vignette={0.55} tint="#5a4a3a" fogScale={0.4}>
    <BlastSite f={f} after /><Gauntlet />
    <CardActor kind="jinx" age="child" at={[-0.6, 0, -1.2]} heightM={1.2} camPos={cam} spherical light={SMOKE} res={0.7} pose={{ kneel: 1, facing: 0.3, look: [0.6, 0.8], brow: 0.9, eye: 0.6, mouth: -0.5, tear: 1, shoulders: 0.7, armL: [20, 30], armR: [-20, -30], breathe: f * 2 }} />
  </Stage>; };
const B19: React.FC<BP> = ({ p, f, t }) => {
  return <Stage look="fire" cam={V(0.2, 1, 2)} target={V(0, 1.4, -8)} blur={10} vignette={0.6} tint="#5a3a2a" fogScale={0.3}
    overlay={<Over draw={(g) => { const c = { x: 0, y: -30 * p, zoom: 1 + 0.08 * glide(p) };
      person(g, c, 1, "vi", "child", { x: 540, y: 380 + 640 * 3.4, s: 3.4, facing: 0.1, look: [0.2, 0.6], brow: -0.8, eye: 1.1, mouth: -0.7, open: 0.25 + Math.abs(Math.sin(t * 0.5)) * 0.25, tear: 1, tremble: 0.4, still: true, breathe: f * 2 }, SMOKE);
      particles(g, f, "sparks", 19, 40, "rgba(255,160,80,0.85)", 1.4); }} />}><ZaunStreet f={f} smoke={1} fire /></Stage>; };
const B20: React.FC<BP> = ({ p, f }) => { const cam = mv([0.3, 2.0, 3.0], [0.3, 6, 5], p);
  return <Stage look="fire" cam={cam} target={V(0, 0.6, -4)} fov={44} vignette={0.6} tint="#2a5a3a" fogScale={0.3}>
    <ZaunStreet f={f} smoke={1} fire />
    <CardActor kind="vi" age="child" at={[0.8, 0, lerp(-5, -8, p)]} heightM={1.45} camPos={cam} spherical light={SMOKE} pose={{ back: true, lean: 10, armL: [40, 20], armR: [-40, -20], breathe: f }} />
    {[-0.4, 1.8].map((x, i) => <CardActor key={i} kind="bully" age="adult" at={[x, 0, lerp(-5.2, -8.2, p)]} heightM={1.8} camPos={cam} spherical light={SMOKE} res={0.4} pose={{ ...THUG, back: true, walk: f * 0.3, breathe: f }} />)}
    <CardActor kind="jinx" age="child" at={[-0.4, 0, -1.4]} heightM={1.2} camPos={cam} spherical light={SMOKE} res={0.7} pose={{ kneel: 1, back: true, shoulders: 0.8, breathe: f * 2 }} />
  </Stage>; };

// ======================= TRANSFORMATION =======================
const B21: React.FC<BP> = ({ p, f, t }) => { const a = lerp(0.6, 0.1, glide(p)); const cam = V(Math.sin(a) * 3.2, 1.1, -2.2 + Math.cos(a) * 3.2); const hug = ramp(t, 0, 30);
  return <Stage look="fire" cam={cam} target={V(0, 1.0, -2.2)} fov={40} vignette={0.6} tint="#2a5a3a" fogScale={0.3}>
    <ZaunStreet f={f} smoke={1} fire />
    <CardCanvas at={[0, 0, -2.2]} ppm={700} camPos={cam} draw={(g) => {
      person(g, ON, 1, "silco", "adult", { x: 620, y: 1880, s: 1.2, kneel: 1, facing: -0.4, look: [-0.5, 0.4], brow: 0.1, mouth: 0.05, armL: lerpArm([10, 10], [-70, -60], hug), armR: lerpArm([-10, -10], [-60, -80], hug), breathe: f }, SMOKE);
      const pw = { x: lerp(330, 470, hug), y: 1880, s: 1.25 };
      person(g, ON, 1, "jinx", "child", { ...pw, facing: 0.6, look: [0.5, -0.6], brow: 0.9, eye: 0.5, mouth: -0.5, open: 0.2, tear: 1, armL: lerpArm([8, 6], reachArm("jinx", "child", "L", pw, [585, 1235]), hug), armR: lerpArm([-8, -6], reachArm("jinx", "child", "R", pw, [650, 1255]), hug), handL: "grip", handR: "grip", walk: hug < 0.6 ? f * 0.6 : undefined, breathe: f * 2 }, SMOKE);
    }} />
  </Stage>; };
const B22: React.FC<BP> = ({ p, f }) => <Stage look="fire" cam={V(0.3, 1.2, 2)} target={V(0, 1.4, -8)} blur={12} vignette={0.6} tint="#2a5a3a" fogScale={0.3}
  overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.06 * glide(p) };
    person(g, c, 1, "silco", "adult", { x: 560, y: 320 + 1000 * 3.0, s: 3.0, facing: 0.25, look: [0.6, -0.2], brow: -0.15, eye: 0.75, mouth: 0.05, still: true, breathe: f }, { ...GREEN, x: 900, y: 300 });
    particles(g, f, "dust", 22, 30, "rgba(200,255,200,0.5)"); }} />}><ZaunStreet f={f} smoke={1} fire /></Stage>;
const B23: React.FC<BP> = ({ p, f, t, d }) => { const cam = mv([0.8, 1.4, 2.4], [0.6, 1.35, 2.1], p); const grown = t > d * 0.55;
  return <Stage look="candle" cam={cam} target={V(0, 1.1, -1.6)} fov={42} vignette={0.6} tint="#2a6a3a">
    <SilcoOffice f={f * 6} />
    <CardActor kind={"jinx"} age={grown ? "teen" : "child"} at={[-0.5, 0, -1.1]} heightM={grown ? 1.6 : 1.2} camPos={cam} light={GREEN} pose={{ facing: 0.4, look: [0.6, 0.6], brow: grown ? -0.2 : 0.2, mouth: grown ? 0.3 : 0, armR: [-60, -40], breathe: f }} />
    <CardActor kind="silco" age="adult" at={[0.8, 0, -2.2]} heightM={1.82} camPos={cam} light={GREEN} pose={{ facing: -0.3, look: [-0.6, 0.2], mouth: 0.2, armL: [10, 30], breathe: f }} />
  </Stage>; };
const B24: React.FC<BP> = ({ p, f, t }) => { const turn = ramp(t, 0, 16);
  return <Stage look="candle" cam={V(0, 1.4, 1.5)} target={V(0, 2, -4)} blur={8} vignette={0.6} tint="#6a2a6a"
    overlay={<Over draw={(g) => { const c = { x: 0, y: -40 * p, zoom: 1 + 0.08 * glide(p) };
      person(g, c, 1, "jinx", "teen", { x: 540, y: 300 + 880 * 2.5, s: 2.5, back: turn < 0.4, facing: -0.15, look: [-0.1, 0.4], brow: -0.4, mouth: 0.9 * turn, open: 0.2 * turn, eye: 1.05, armR: [-150, -40], handR: "grip", prop: launcher, still: true, breathe: f }, { x: 300, y: 300, r: 1800, key: "#ff5aa8", shade: "#10061a", keyA: 0.32, shadeA: 0.5 });
      particles(g, f, "sparks", 24, 30, "rgba(255,90,170,0.7)"); }} />}><TableHall f={f} /></Stage>; };
const B25: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0, 2.6, 3.6], [0, 2.2, 2.6], p); const shot = t > 34; const flash = t > 34 && t < 40 ? 1 - (t - 34) / 6 : 0;
  return <Stage look="candle" cam={cam} target={V(0, 0.9, -1.6)} fov={44} vignette={0.65} tint="#7a2a3a" flash={flash * 0.6}>
    <TableHall f={f} />
    <CardActor kind="jinx" age="teen" at={[-0.8, 0, -0.8]} heightM={1.6} camPos={cam} spherical light={CANDLE} pose={{ facing: 0.6, look: [0.8, 0.1], brow: 0.8, eye: 1.15, mouth: -0.5, open: 0.2, tremble: 0.9, armR: [-100, 0], handR: "grip", prop: pistol, breathe: f * 2 }} />
    <CardActor kind="silco" age="adult" at={[0.8, 0, -0.8]} heightM={1.82} camPos={cam} spherical light={CANDLE} pose={{ facing: -0.6, look: [-0.8, 0.1], brow: 0.4, mouth: -0.1, armR: shot ? [-20, -10] : [-80, -10], armL: [10, 10], lean: shot ? -24 * ramp(t, 34, 50) : 0, kneel: shot ? ramp(t, 36, 52) : 0, breathe: f }} />
  </Stage>; };
const B26: React.FC<BP> = ({ p, f, t }) => { const cam = mv([0.6, 19.6, 4], [0.4, 21.5, 5], p); const k = ramp(t, 8, 70); const rx = lerp(0, 8, k), ry = lerp(19.5, 88, k), rz = lerp(-1, -68, k);
  return <Stage look="night" cam={cam} target={mv([0, 21, -10], [6, 70, -68], ramp(t, 4, 70))} fov={48} vignette={0.55} tint="#3a2a6a" fogScale={4}>
    <RocketRoof f={f} />
    <CardActor kind="jinx" age="teen" at={[0, 18.3, 1.4]} heightM={1.6} camPos={cam} light={{ ...GREEN, key: "#ff5aa8" }} pose={{ back: true, armR: [-150, -40], breathe: f }} />
    {k > 0 && <group position={[rx, ry, rz]}><mesh rotation={[-0.8, 0, -0.1]}><coneGeometry args={[0.25, 1.2, 8]} /><meshBasicMaterial color="#ff5aa8" toneMapped={false} /></mesh><pointLight intensity={8} distance={30} decay={1.2} color="#6ae8ff" /><Flame pos={[0, -0.8, 0.4]} f={f} s={1.6} smoke /></group>}
    <Motes f={f} n={60} box={[[-3, 18.5, -2], [3, 22, 3]]} color="#ffb0e0" size={0.04} rise={0.6} seed={8} />
  </Stage>; };

// ======================= REVELATION =======================
const B27: React.FC<BP> = ({ p, f }) => { const cam = mv([0.2, 1.3, 3.2], [0.15, 1.25, 2.9], p);
  return <Stage look="candle" cam={cam} target={V(-0.6, 0.6, -1.4)} fov={42} vignette={0.7} tint="#3a2a5a">
    <TableHall f={f} candles={0.6} /><ambientLight intensity={1.6} color="#c08060" /><pointLight position={[-0.4, 1.6, 0.4]} intensity={9} distance={6} decay={1.2} color="#ffb070" />
    <CardActor kind="jinx" age="teen" at={[-0.8, 0, -0.9]} heightM={1.6} camPos={cam} light={CANDLE} pose={{ kneel: 1, nod: 0, shoulders: 1, lean: Math.sin(f * 0.18) * 5, brow: 0.9, eye: 0.4, mouth: -0.4, armL: [25, 70], armR: [-25, -70], handL: "grip", handR: "grip", breathe: f }} />
  </Stage>; };
const B28: React.FC<BP> = ({ p, f, t }) => { const cup = ramp(t, 4, 30);
  return <Stage look="candle" cam={V(0.4, 1.2, 1.5)} target={V(0, 1, -3)} blur={10} vignette={0.65} tint="#7a2a3a"
    overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.05 * glide(p) };
      person(g, c, 1, "silco", "adult", { x: 330, y: 560 + 1000 * 2.2, s: 2.2, kneel: 0.4, facing: 0.5, look: [0.7, -0.2], brow: 0.3, eye: 0.55, mouth: 0.3, armR: lerpArm([-10, -10], [-105, -35], cup), handR: "open", still: true, breathe: f * 0.4 }, CANDLE);
      person(g, c, 1, "jinx", "teen", { x: 780, y: 520 + 880 * 2.3, s: 2.3, facing: -0.5, look: [-0.8, 0.1], brow: 0.95, eye: 0.7, mouth: -0.5, open: 0.15 + Math.abs(Math.sin(t * 0.35)) * 0.1, tear: 1, tremble: 0.5, still: true, breathe: f * 2 }, CANDLE);
      particles(g, f, "dust", 28, 25, "rgba(255,200,140,0.6)"); }} />}><TableHall f={f} /></Stage>; };
const B29: React.FC<BP> = ({ p, f }) => <Stage look="candle" cam={V(0, 1.2, 1.5)} target={V(0, 1, -3)} blur={14} vignette={0.7} tint="#7a2a3a"
  overlay={<Over draw={(g) => { const c = { x: 0, y: 0, zoom: 1 + 0.08 * glide(p) };
    person(g, c, 1, "silco", "adult", { x: 540, y: 560 + 1000 * 4.2, s: 4.2, facing: 0.15, look: [0.3, -0.1], brow: 0.35, eye: lerp(0.6, 0.3, p), mouth: 0.45, still: true, breathe: f * 0.3 }, CANDLE);
    particles(g, f * 2, "sparks", 29, 30, "rgba(255,190,120,0.7)", 1.6); }} />}><TableHall f={f} /></Stage>;

// ======================= PAYOFF =======================
const B30: React.FC<BP> = ({ p, f }) => { const cam = mv([0.4, 0.75, 2.6], [0.3, 0.8, 1.6], p);
  return <Stage look="fire" cam={cam} target={V(0, 1.2, -8)} fov={44} vignette={0.7} tint="#2a6a3a" fogScale={0.3}>
    <ZaunStreet f={f} smoke={1} fire />
    <CardActor kind="vi" age="child" at={[0.6, 0, lerp(-6, -7.2, p)]} heightM={1.45} camPos={cam} light={SMOKE} pose={{ back: true, shoulders: 0.4, walk: f * 0.3, breathe: f }} />
    <CardActor kind="jinx" age="child" at={[-0.15, 0, -1.6]} heightM={1.2} camPos={cam} res={0.8} light={SMOKE} pose={{ back: true, kneel: 1, armR: [-150, -10], handR: "open", breathe: f * 2 }} />
  </Stage>; };
const B31: React.FC<BP> = ({ p, f, t, d }) => { const back = ramp(t, 20, d); const cam = mv([0.5, 1.15, -0.2], [0.8, 2.4, 3.6], back);
  const fade = ramp(t, d - 28, d - 2);
  return <AbsoluteFill>
    <Stage look="candle" cam={cam} target={V(0, 0.9, -1.7)} fov={40} vignette={0.7} tint="#7a2a3a">
      <TableHall f={f} candles={1 - 0.6 * ramp(t, 10, d - 30)} /><ambientLight intensity={1.2} color="#c08060" /><pointLight position={[0.2, 1.6, -0.6]} intensity={7 - 2 * back} distance={7} decay={1.2} color="#ffb070" />
      <CardCanvas at={[0, 0, -2.25]} ppm={700} camPos={cam} draw={(g) => {
        person(g, ON, 1, "silco", "adult", { x: 330, y: 1880, s: 1.2, kneel: 1, facing: 0.4, look: [0.6, -0.3], eye: 0.08, mouth: 0.4, armR: [-35, -15], handR: "open", still: true, breathe: 0 }, CANDLE);
        person(g, ON, 1, "jinx", "teen", { x: 700, y: 1880, s: 1.32, kneel: 1, facing: -0.5, look: [-0.7, 0.3], brow: 0.9, eye: 0.5, mouth: -0.4, tear: 1, armL: [80, 40], handL: "grip", breathe: f * 1.2 }, CANDLE);
      }} />
    </Stage>
    <AbsoluteFill style={{ background: "#000", opacity: fade }} />
  </AbsoluteFill>; };

const SCENES: React.FC<BP>[] = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20, B21, B22, B23, B24, B25, B26, B27, B28, B29, B30, B31];
type Beat = { id: number; start_s: number; end_s: number };
const BeatScene: React.FC<{ i: number; from: number; d: number }> = ({ i, from, d }) => { const t = useCurrentFrame(); const S = SCENES[i]; return <S t={t} d={d} p={clamp(t / Math.max(1, d - 1))} f={from + t} />; };

type Cap = { text: string; s: number; e: number; hl: number[] };
const Captions: React.FC = () => {
  const t = useCurrentFrame() / 30; const c = (CAPS as Cap[]).find((x) => t >= x.s - 0.04 && t < x.e); if (!c) return null;
  const k = Math.min(1, (t - c.s + 0.04) / 0.1);
  return <div style={{ position: "absolute", left: 56, right: 120, top: 1330, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>
    <div style={{ background: "rgba(8,6,12,0.62)", borderRadius: 22, padding: "14px 30px 18px", boxShadow: "0 0 0 2px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.55)", fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: 58, lineHeight: 1.2, color: "#fbf7ef", textAlign: "center", textWrap: "balance", maxWidth: 860, textShadow: "0 2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 0 0 12px rgba(0,0,0,0.9)" }}>
      {c.text.split(" ").map((w, i) => <span key={i} style={{ color: c.hl.includes(i) ? "#ff7ac0" : undefined }}>{w.replace(/-/g, "‑")}{" "}</span>)}
    </div></div>;
};
const grainTiles = (() => { let t: HTMLCanvasElement[] | null = null; return () => t ??= [0, 1, 2, 3].map((k) => { const [c, g] = makeCanvas(256, 256); const im = g.createImageData(256, 256); const r = rng(k * 99 + 7); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; }); })();
const Grain: React.FC = () => <CanvasFrame draw={(g, f) => { g.fillStyle = g.createPattern(grainTiles()[f % 4], "repeat")!; g.fillRect(0, 0, W, H); }} />;
void radGrad; void useMemo;

export const JINX_FRAMES = fr((BEATS.beats as Beat[]).at(-1)!.end_s);
export const JinxEpisode: React.FC = () => {
  const beats = BEATS.beats as Beat[];
  return <AbsoluteFill style={{ background: "#000" }}>
    {beats.map((b, i) => { const from = fr(b.start_s), d = fr(b.end_s) - from;
      return <Sequence key={b.id} from={from} durationInFrames={d} layout="none"><AbsoluteFill><BeatScene i={i} from={from} d={d} /></AbsoluteFill></Sequence>; })}
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.06 }}><Grain /></AbsoluteFill>
    {(getInputProps() as { plate?: boolean }).plate ? null : <Captions />}
  </AbsoluteFill>;
};
