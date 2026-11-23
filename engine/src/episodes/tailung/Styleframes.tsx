// "The Scroll That Was Always Empty" — 6 storyboard styleframes (beats 1, 4, 9, 14, 18, 29). Frame index = styleframe.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad, particles, radGrad } from "../../btl/core";
import { Light, person, reachArm } from "../../btl/people";
import { CardActor, V } from "../../three/kit3d";
import { Grass, MistPlane, Motes } from "../../three/props";
import { Mountain, PalaceHall, PeachTree, PrisonCavern, ScrollHall, Stairs, ValleyHouse, stoneTex } from "../../three/valley";
import { CARD_LIGHT, Stage } from "../itachi/stage";
import { LIGHTS } from "./look";

const Over: React.FC<{ draw: (g: Ctx) => void }> = ({ draw }) => <CanvasFrame draw={(g) => draw(g)} />;
const ON = { x: 0, y: 0, zoom: 1 };
const Courtyard: React.FC = () => <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><meshToonMaterial map={stoneTex()} /></mesh>;

// SF1 · beat 1 · hook: the youth finishes a strike and looks up; Shifu on the steps gives nothing
const SF1: React.FC = () => { const cam = V(0.3, 0.9, 2.6), f = 40;
  return <Stage look="sunset" cam={cam} target={V(-0.4, 1.7, -6)} fov={48} vignette={0.55} tint="#c87a40">
    <Courtyard /><PalaceHall pos={[-1, 0, -12]} w={12} d={7} h={4} lit /><Stairs pos={[-1, 0, -6.6]} n={4} w={6} />
    <PeachTree pos={[5, 0, -9]} s={1.1} seed={3} /><PeachTree pos={[-7, 0, -9]} s={0.9} seed={8} />
    <Motes f={f} n={60} box={[[-6, 0.3, -10], [6, 4, 2]]} color="#ffd8a0" size={0.05} />
    <CardActor kind="shifu" age="teen" at={[-1.4, 1, -7.6]} heightM={1.0} camPos={cam} light={LIGHTS.SUNSET} pose={{ facing: 0.35, look: [0.3, 0.4], mouth: -0.15, brow: -0.15, still: true, breathe: f, armL: [35, 75], armR: [-35, -75] }} />
    <CardActor kind="tailung" age="teen" at={[0.75, 0, -1.6]} heightM={1.95} camPos={cam} light={LIGHTS.SUNSET} pose={{ facing: -0.6, look: [-0.7, -0.7], mouth: 0.45, brow: 0.35, eye: 1.12, still: true, breathe: f, armR: [-35, -105], armL: [35, 105], handR: "fist", handL: "open", lean: -2 }} />
  </Stage>; };

// SF2 · beat 4 · world: the palace on the summit, a thousand steps
const SF2: React.FC = () => { const cam = V(0, 2.2, 14), f = 60;
  return <Stage look="dawn" cam={cam} target={V(0, 16, -60)} fov={52} vignette={0.35} tint="#e8b890" fogScale={2}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[300, 300]} /><meshToonMaterial color="#7a8a5a" /></mesh>
    <Mountain pos={[0, 0, -70]} r={34} h={30} top={0.22} seed={2} /><Mountain pos={[-55, 0, -110]} r={40} h={36} seed={5} color="#7a7884" /><Mountain pos={[60, 0, -100]} r={36} h={28} seed={9} color="#7a7884" />
    <PalaceHall pos={[0, 30, -70]} w={14} d={9} h={5} lit /><PalaceHall pos={[-9, 30, -74]} w={7} d={6} h={3.5} tiers={1} rotY={0.3} /><PalaceHall pos={[9, 30, -74]} w={7} d={6} h={3.5} tiers={1} rotY={-0.3} />
    <Stairs pos={[0, 0, -36]} n={80} w={3} rise={0.37} run={0.36} />
    {[[-9, 2], [8, 0], [-14, -8], [14, -10], [-6, -16], [6, -18]].map(([x, z], i) => <ValleyHouse key={i} pos={[x, 0, z]} rotY={x > 0 ? -0.4 : 0.4} seed={i + 2} />)}
    {[[-4, 6], [4.5, 4], [-11, -3], [11, -4], [-3, -10]].map(([x, z], i) => <PeachTree key={i} pos={[x, 0, z]} s={0.8} seed={i * 5 + 1} />)}
    <Grass x0={-20} x1={20} z0={-20} z1={10} n={260} color="#8a9a5a" />
    <MistPlane pos={[0, 14, -50]} w={120} h={14} a={0.35} f={f} color="#fff0e0" /><MistPlane pos={[0, 6, -30]} w={90} h={8} a={0.25} f={f * 1.4} color="#ffe8d8" />
    <Motes f={f} n={40} box={[[-8, 0.5, -2], [8, 6, 10]]} color="#ffc8d8" size={0.06} />
  </Stage>; };

// SF3 · beat 9 · object: Shifu ties a small training wrap on the cub's paw (2.5D close-up over a blurred hall)
const SF3: React.FC = () => <Stage look="interior" cam={V(0, 1.4, 4)} target={V(0, 1.6, -6)} blur={12} vignette={0.6} tint="#c88a50"
  overlay={<Over draw={(g) => {
    const L: Light = LIGHTS.LANTERN, sh = { x: 360, y: 2010, s: 2.35, kneel: 0.6 }, cb = { x: 790, y: 1990, s: 1.75 };
    const paw: [number, number] = [610, 1330];
    person(g, ON, 1, "tailung", "child", { ...cb, facing: -0.4, look: [-0.5, 0.6], mouth: 0.6, brow: 0.3, eye: 1.1, still: true, breathe: 20, armR: reachArm("tailung", "child", "R", cb, paw), handR: "open", armL: [20, 10] }, L);
    person(g, ON, 1, "shifu", "teen", { ...sh, facing: 0.45, look: [0.6, 0.3], mouth: 0.35, brow: 0.2, still: true, breathe: 20, armR: reachArm("shifu", "teen", "R", sh, [paw[0] - 20, paw[1] + 40]), armL: reachArm("shifu", "teen", "L", sh, [paw[0] - 10, paw[1] - 30]), handR: "grip", handL: "grip" }, L);
    // the wrap: a pale cloth band with a loose knot tail
    g.save(); g.translate(paw[0] + 10, paw[1] + 30); g.rotate(-0.4); g.fillStyle = "#e8dcc0"; g.strokeStyle = "#1c121c"; g.lineWidth = 5;
    g.beginPath(); g.roundRect(-70, -26, 140, 52, 16); g.fill(); g.stroke(); g.strokeStyle = "rgba(120,90,60,0.6)"; g.lineWidth = 3;
    for (const x of [-35, 0, 35]) { g.beginPath(); g.moveTo(x - 10, -24); g.lineTo(x + 10, 24); g.stroke(); }
    g.fillStyle = "#e8dcc0"; g.strokeStyle = "#1c121c"; g.lineWidth = 4; g.beginPath(); g.moveTo(60, 0); g.quadraticCurveTo(120, 30, 150, 110); g.lineTo(125, 115); g.quadraticCurveTo(100, 50, 55, 22); g.closePath(); g.fill(); g.stroke(); g.restore();
    particles(g, 30, "dust", 9, 30, "rgba(255,220,170,0.6)");
  }} />}>
  <ScrollHall f={20} scroll={false} />
</Stage>;

// SF4 · beat 14 · conflict: over Tai Lung's shoulder — Shifu looks down, hands hidden; Oogway behind
const SF4: React.FC = () => { const cam = V(0.9, 1.75, 1.2), f = 80;
  return <Stage look="interior" cam={cam} target={V(-0.4, 1.0, -4)} fov={40} vignette={0.65} tint="#6a3a5a">
    <ScrollHall f={f} shafts={0.8} />
    <CardActor kind="oogway" age="adult" at={[0.9, 0, -7.2]} heightM={1.5} camPos={cam} light={LIGHTS.HALL} pose={{ facing: -0.5, look: [-0.6, 0.1], eye: 0.55, mouth: 0, still: true, breathe: f, armR: [-20, -40], armL: [20, 40] }} />
    <CardActor kind="shifu" age="teen" at={[-0.5, 0, -3.6]} heightM={1.0} camPos={cam} light={LIGHTS.HALL} pose={{ facing: 0.3, look: [0.15, 0.95], eye: 0.7, mouth: -0.3, brow: 0.5, nod: 0.12, shoulders: 0.5, still: true, breathe: f, armL: [35, 75], armR: [-35, -75] }} />
    <CardActor kind="tailung" age="teen" at={[0.75, 0, -0.9]} heightM={1.95} camPos={cam} light={LIGHTS.HALL} pose={{ back: true, kneel: 0.3, shoulders: -0.3, still: true, breathe: f }} />
  </Stage>; };

// SF5 · beat 18 · twenty years: chained in the mountain prison
const SF5: React.FC = () => { const cam = V(1.8, 1.25, 3.6), f = 100;
  return <Stage look="night" cam={cam} target={V(0, 1.35, -0.5)} fov={46} vignette={0.7} tint="#3a5a7a" fogScale={0.8}>
    <PrisonCavern f={f} />
    <CardActor kind="tailung" age="adult" at={[0, 0.4, -0.4]} heightM={2.2} camPos={cam} light={LIGHTS.PRISON} pose={{ facing: 0.35, look: [0.45, 0.1], brow: -0.7, eye: 0.85, mouth: -0.45, still: true, breathe: f, kneel: 0.9, armL: [-62, -15], armR: [62, 15], handL: "fist", handR: "fist", shoulders: 0.4 }} />
    <Motes f={f} n={40} box={[[-5, 0.5, -5], [5, 6, 4]]} color="#a8c0d8" size={0.04} />
  </Stage>; };

// SF6 · beat 29 · the blank scroll reflects his face
const SF6: React.FC = () => <AbsoluteFill><CanvasFrame draw={(g) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#0a0608"], [0.45, "#1a0e0a"], [1, "#2a160a"]]); g.fillRect(0, 0, W, H);
  // the unrolled scroll: polished gold sheet between two dark rods
  const top = 620, bot = 1700; g.fillStyle = linGrad(g, 0, top, 0, bot, [[0, "#c89a40"], [0.35, "#f6dc90"], [0.6, "#e8c060"], [1, "#a8782c"]]);
  g.beginPath(); g.moveTo(110, top); g.lineTo(970, top); g.lineTo(1010, bot); g.lineTo(70, bot); g.closePath(); g.fill();
  // reflection of his face (mirror-flipped, softened, gold-tinted)
  g.save(); g.beginPath(); g.moveTo(110, top); g.lineTo(970, top); g.lineTo(1010, bot); g.lineTo(70, bot); g.closePath(); g.clip();
  g.globalAlpha = 0.42; g.filter = "blur(2.5px) sepia(0.7)"; g.translate(W, 0); g.scale(-1, 1);
  person(g, ON, 1, "tailung", "adult", { x: 540, y: 760 + 1100 * 2.6, s: 2.6, headOnly: true, still: true, brow: 0.7, eye: 1.05, mouth: -0.35, look: [0, 0.2], tear: 0.4 }, LIGHTS.GOLD);
  g.restore(); g.filter = "none"; g.globalAlpha = 1;
  const sh = g.createLinearGradient(0, top, W, bot); sh.addColorStop(0.3, "rgba(255,255,255,0)"); sh.addColorStop(0.42, "rgba(255,250,220,0.35)"); sh.addColorStop(0.5, "rgba(255,255,255,0)"); g.fillStyle = sh; g.fillRect(0, top, W, bot - top);
  for (const y of [top, bot]) { g.fillStyle = "#3a1a10"; g.strokeStyle = "#120a08"; g.lineWidth = 6; g.beginPath(); g.roundRect(40, y - 34, 1000, 68, 30); g.fill(); g.stroke(); g.fillStyle = "#e8c060"; for (const x of [40, 1010]) { g.beginPath(); g.ellipse(x + 15, y, 30, 44, 0, 0, 6.283); g.fill(); g.stroke(); } }
  // his paws holding the rods
  for (const [x, y] of [[180, top - 10], [900, top - 10], [160, bot + 10], [920, bot + 10]]) { g.fillStyle = "#d4d2cc"; g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, 62, 48, 0, 0, 6.283); g.fill(); g.stroke(); g.strokeStyle = "rgba(28,18,28,0.5)"; g.lineWidth = 3; for (const d of [-22, 0, 22]) { g.beginPath(); g.moveTo(x + d, y + 18); g.lineTo(x + d, y + 40); g.stroke(); } }
  g.fillStyle = radGrad(g, 540, 1150, 0, 900, [[0, "rgba(255,210,120,0.18)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 0, W, H);
  particles(g, 40, "dust", 6, 40, "rgba(255,220,150,0.7)");
  g.fillStyle = radGrad(g, 540, 1000, 500, 1300, [[0, "rgba(0,0,0,0)"], [1, "rgba(4,2,6,0.7)"]]); g.fillRect(0, 0, W, H);
}} /></AbsoluteFill>;

const SFS = [SF1, SF2, SF3, SF4, SF5, SF6];
export const TaiLungStyleframes: React.FC = () => { const S = SFS[Math.min(SFS.length - 1, useCurrentFrame())]; return <S />; };
void CARD_LIGHT;
