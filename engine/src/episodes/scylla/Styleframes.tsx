// "The Monster She Made" — 6 styleframes (beats 1, 2, 14, 17, 20, 30). Frame index = styleframe.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad, particles, radGrad } from "../../btl/core";
import { person, reachArm } from "../../btl/people";
import { scylla } from "../../btl/myth";
import { CardActor, CardCanvas, V } from "../../three/kit3d";
import { Motes } from "../../three/props";
import { Backdrop } from "../../three/village";
import { Beach, Cliff, Cove, Ocean, Ship } from "../../three/sea";
import { Stage } from "../itachi/stage";
import { LIGHTS, PAL, basket } from "./look";

const ON = { x: 0, y: 0, zoom: 1 };
const Over: React.FC<{ draw: (g: Ctx) => void }> = ({ draw }) => <CanvasFrame draw={(g) => draw(g)} />;

// SF1 · beat 1 · the strait at night, a ship, the necks uncoiling on the cliff
const SF1: React.FC = () => { const cam = V(0, 1.6, 12), f = 40;
  return <Stage look="night" cam={cam} target={V(-1.5, 6, -16)} fov={52} vignette={0.6} tint="#4a5a9a" fogScale={2.2}>
    <Backdrop mood="night" moon="white" moonXY={[0.7, 0.35]} z={-90} y={24} /><Ocean f={f} storm={0.8} color="#2a5070" />
    <directionalLight position={[20, 30, -40]} intensity={1.4} color="#c8d8ff" />
    <Cliff pos={[-11, -1, -20]} r={8} h={13} seed={3} color="#55504c" /><Cliff pos={[12, -1, -24]} r={9} h={16} seed={7} color="#55504c" />
    <Ship pos={[1, 0, -4]} rotY={0.5} f={f} />
    <CardCanvas at={[-8.5, 11.5, -19]} ppm={150} camPos={cam} shadow={0} draw={(g) => scylla(g, ON, 540, 1700, 1.2, f, LIGHTS.NIGHT, { rise: 0.9, fear: 0, tint: "#2a3438" })} />
  </Stage>; };
// SF2 · beat 2 · a lonely girl walks the sunset beach with a basket of glowing flowers
const SF2: React.FC = () => { const cam = V(0.8, 1.3, 26), f = 60;
  return <Stage look="sunset" cam={cam} target={V(-0.5, 1.5, 8)} fov={46} vignette={0.5} tint="#e8904a">
    <Backdrop mood="sunset" z={-90} y={12} /><Ocean f={f} color="#3a5a7a" amp={0.2} /><Beach /><ambientLight intensity={0.6} color="#ffc890" />
    <Cliff pos={[-16, -1, -10]} r={8} h={14} seed={5} color="#6a4a4a" />
    <CardActor kind="circe" age="teen" at={[0, 0.05, 21]} heightM={1.65} camPos={cam} light={LIGHTS.SUNSET} pose={{ back: true, walk: f * 0.25, prop: basket(1), armL: [20, 70] }} />
    <Motes f={f} n={50} box={[[-4, 0.3, 14], [4, 4, 25]]} color="#ffd8a0" size={0.05} />
  </Stage>; };
// SF3 · beat 14 · the cove: the sea god drapes sea-glass on Scylla
const SF3: React.FC = () => { const cam = V(0.6, 1.7, -0.4), f = 80;
  return <Stage look="day" cam={cam} target={V(0, 1.8, -4.2)} fov={46} vignette={0.4} tint="#5ab0c0">
    <Backdrop mood="day" z={-90} y={14} /><Ocean f={f} color="#2a7a9a" amp={0.15} y={-0.3} /><Cove f={f} pool={PAL.cove} />
    <Cliff pos={[-9, -1, -14]} r={6} h={12} seed={2} /><Cliff pos={[10, -1, -12]} r={5} h={10} seed={4} />
    <CardCanvas at={[0, 0.8, -4.2]} ppm={1700 / 1.9} camPos={cam} draw={(g) => {
      const sc = { x: 380, y: 1880, s: 1.6 }, gd = { x: 760, y: 1880, s: 1.55 };
      person(g, ON, 1, "scylla", "teen", { ...sc, facing: 0.35, look: [-0.3, 0], mouth: 0.6, brow: -0.2, eye: 0.85, still: true, breathe: f, armL: [-25, -80], handL: "open" }, LIGHTS.DAY);
      person(g, ON, 1, "seagod", "adult", { ...gd, facing: -0.4, look: [-0.7, 0.1], mouth: 0.3, still: true, breathe: f, armR: reachArm("seagod", "adult", "R", gd, [430, 1880 - 880 * 1.6 + 190]), handR: "grip" }, LIGHTS.DAY);
    }} />
  </Stage>; };
// SF4 · beat 17 · the pour: Circe kneels at the black pool and tips the golden sap in (2.5D over the night cove)
const SF4: React.FC = () => <Stage look="night" cam={V(0, 1.2, 2)} target={V(0, 0.6, -4)} fov={46} blur={12} vignette={0.7} tint="#2a3a6a"
  overlay={<Over draw={(g) => { const ci = { x: 360, y: 2060, s: 1.7, kneel: 1 }, vial: [number, number] = [640, 1360];
    g.fillStyle = radGrad(g, 650, 1720, 0, 520, [[0, "rgba(255,210,90,0.5)"], [1, "rgba(0,0,0,0)"]]); g.fillRect(0, 900, W, H - 900);
    for (let k = 0; k < 5; k++) { g.strokeStyle = `rgba(240,192,64,${0.55 - k * 0.09})`; g.lineWidth = 5; g.beginPath(); g.ellipse(650, 1720, 50 + k * 80, 14 + k * 22, 0, 0, 6.283); g.stroke(); }
    g.strokeStyle = PAL.sap; g.lineWidth = 16; g.lineCap = "round"; g.beginPath(); g.moveTo(vial[0] + 30, vial[1] + 40); g.quadraticCurveTo(660, 1560, 650, 1715); g.stroke(); g.strokeStyle = PAL.sapHi; g.lineWidth = 5; g.stroke();
    person(g, ON, 1, "circe", "teen", { ...ci, facing: 0.45, look: [0.6, 0.8], brow: 0.55, eye: 0.85, mouth: -0.35, tear: 0.5, still: true, breathe: 10,
      armR: reachArm("circe", "teen", "R", ci, vial), handR: "grip", armL: reachArm("circe", "teen", "L", ci, [vial[0] - 40, vial[1] + 50]), handL: "open" }, LIGHTS.SAP);
    g.save(); g.translate(vial[0] + 10, vial[1]); g.rotate(-1.0); g.fillStyle = "#b8683a"; g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 34, 52, 0, 0, 6.283); g.fill(); g.stroke(); g.restore();
    particles(g, 20, "sparks", 3, 40, "rgba(255,220,120,0.8)", 1.2); }} />}>
  <Backdrop mood="night" z={-90} y={14} /><Ocean f={20} color="#1a3048" y={-0.3} /><Cove f={20} pool="#0a1418" glow={0.25} />
</Stage>;
// SF5 · beat 20 · six necks burst from the pool
const SF5: React.FC = () => <Stage look="storm" cam={V(0, 0.6, 4)} target={V(0, 3, -6)} fov={50} blur={10} vignette={0.7} tint="#3a5a5a"
  overlay={<Over draw={(g) => { scylla(g, ON, 540, 1640, 1.05, 40, LIGHTS.STORM, { rise: 1, fear: 1, lunge: 0.5, lungeHead: 2 }); particles(g, 40, "rain", 5, 120, "rgba(200,230,240,0.6)"); }} />}>
  <Backdrop mood="night" z={-90} y={14} /><Ocean f={40} storm={0.6} color="#1a3a48" y={-0.3} /><Cove f={40} pool="#2a5a4a" boil={1} /><Cliff pos={[-8, -1, -14]} r={6} h={12} seed={2} color="#4a4440" />
</Stage>;
// SF6 · beat 30 · over her shoulder into the still pool: her own face looks back
const SF6: React.FC = () => <AbsoluteFill><CanvasFrame draw={(g) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#3a4a58"], [1, "#0c1820"]]); g.fillRect(0, 0, W, H);
  // the reflection (mirrored, upside-down, darker) fills the pool
  g.save(); g.globalAlpha = 0.7; g.filter = "blur(1.5px)"; g.translate(W, 0); g.scale(-1, 1); // POV into water: upright, mirrored
  person(g, ON, 1, "circe", "adult", { x: 540, y: 820 + 880 * 3.0, s: 3.0, headOnly: true, facing: 0, look: [0, -0.2], brow: 0.65, eye: 0.9, mouth: -0.25, still: true, breathe: 10 }, LIGHTS.DAWN);
  g.restore(); g.filter = "none";
  g.fillStyle = "rgba(20,40,60,0.35)"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(230,240,250,0.22)"; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(540, 1320, 90 + k * 90, 22 + k * 16, 0, 0, 6.283); g.stroke(); }
  // rock rim + her shoulder and hair at the top edge (over-shoulder)
  g.fillStyle = "#4a4440"; g.strokeStyle = "#1c121c"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 160); g.quadraticCurveTo(700, 260, 540, 200); g.quadraticCurveTo(300, 150, 0, 300); g.closePath(); g.fill(); g.stroke();
  basket(0)(g, "L", 860, 110);
  particles(g, 10, "dust", 4, 30, "rgba(255,240,220,0.5)"); }} /></AbsoluteFill>;

const SFS = [SF1, SF2, SF3, SF4, SF5, SF6];
export const ScyllaStyleframes: React.FC = () => { const S = SFS[Math.min(SFS.length - 1, useCurrentFrame())]; return <S />; };
