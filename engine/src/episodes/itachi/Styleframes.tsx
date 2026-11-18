// "Next Time" — 6 storyboard styleframes (beats 1, 4, 10, 14, 21, 29). Frame index = styleframe.
import React, { useCallback } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad, particles, post, radGrad, rng } from "../../btl/core";
import { layer } from "../../btl/envs";
import { Light, person, reachArm } from "../../btl/people";
import { CameraRig, CardActor, Inked, V, canvasTex, gradientMap, toon } from "../../three/kit3d";
import { Backdrop, House, Lantern, Pine, StoneWall, Street, mapTexture, shojiWallTexture, tatamiTexture } from "../../three/village";

const NIGHT_KEY: Light = { x: 900, y: 200, r: 1900, key: "#9fb0e8", shade: "#0a0a1a", keyA: 0.3, shadeA: 0.55 };
const blade = (g: CanvasRenderingContext2D, hand: "L" | "R", x: number, y: number) => { if (hand !== "R") return; g.strokeStyle = "#c8ccd4"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30, y + 150); g.stroke(); };
const Vignette: React.FC<{ a?: number }> = ({ a = 0.55 }) => <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(6,4,12,${a}) 100%)` }} />;

// ---------- SF1 · beat 1 · hook: the empty clan street under a red moon ----------
const SF1: React.FC = () => {
  const cam = V(0.7, 4.2, 6);
  const houses = [];
  for (let i = 0; i < 7; i++) { const z = 1 - i * 5.2; houses.push(<House key={"r" + i} x={6.5} z={z} w={5} d={5} h={3.4} face={1} seed={i * 7 + 1} mood="night" lit={i % 3 === 0 ? 1 : 0} />, <House key={"l" + i} x={-6.5} z={z - 2.4} w={5} d={5} h={3.4} face={-1} seed={i * 11 + 3} mood="night" lit={0} />); }
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }}>
        <CameraRig pos={cam} look={V(0, 1.4, -16)} fov={42} />
        <fog attach="fog" args={["#141428", 12, 60]} />
        <hemisphereLight args={["#6a7ac0", "#2a1830", 0.95]} /><directionalLight position={[10, 20, -40]} intensity={1.0} color="#ff6a5a" /><directionalLight position={[-6, 12, 14]} intensity={0.45} color="#9ab0ff" /><ambientLight intensity={0.25} />
        <Backdrop mood="night" moon="red" z={-80} y={22} moonXY={[0.5, 0.6]} />
        <Street len={60} width={8} mood="night" z0={6} />
        {houses}
        {[-3, -9, -15, -21].map((z, i) => <group key={i}><Inked geo={new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8)} mat={toon("#1a1416")} pos={[3.4, 1.2, z]} /><Lantern pos={[3.4, 2.5, z]} out={i % 2 ? 1 : 0} light={i % 2 === 0} /></group>)}
        <Lantern pos={[1.0, 0.3, 1.5]} fallen light scale={0.9} />
        <mesh position={[1.25, 0.55, 1.4]}><coneGeometry args={[0.12, 0.45, 10]} /><meshBasicMaterial color="#ffb040" /></mesh>
        <CardActor kind="itachi" age="adult" at={[0, 0, -16]} heightM={1.75} camPos={cam} light={NIGHT_KEY} pose={{ back: true, armR: [-10, -5], prop: blade, breathe: 40, headband: "scratched" }} />
      </ThreeCanvas>
      <Vignette />
    </AbsoluteFill>
  );
};

// ---------- SF2 · beat 4 · world: the hidden village at dawn ----------
const SF2: React.FC = () => {
  const cam = V(0, 24, 22); const r = rng(21);
  const houses = [];
  for (let i = 0; i < 60; i++) { const x = (r() - 0.5) * 70, z = -14 - r() * 60; if (Math.abs(x) < 3.5) continue; houses.push(<House key={i} x={x} z={z} w={4 + r() * 2} d={4 + r() * 2} h={2.8 + r() * 2.4} face={0} seed={i + 40} mood="dawn" roof={["#3a4250", "#5a3a32", "#3a5248"][i % 3]} />); }
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }}>
        <CameraRig pos={cam} look={V(0, 0, -36)} fov={46} />
        <fog attach="fog" args={["#e8b898", 30, 110]} />
        <hemisphereLight args={["#ffd8b0", "#5a4a3a", 0.9]} /><directionalLight position={[30, 25, -60]} intensity={1.2} color="#ffb070" /><ambientLight intensity={0.2} />
        <Backdrop mood="dawn" z={-110} y={30} w={320} h={140} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]}><planeGeometry args={[160, 120]} /><meshToonMaterial color="#7a8a5a" gradientMap={gradientMap} /></mesh>
        <Street len={90} width={6} mood="dawn" z0={10} />
        {houses}
        {/* the great gate */}
        <Inked geo={new THREE.BoxGeometry(0.8, 7, 0.8)} mat={toon("#7a2a22")} pos={[-4, 3.5, -10]} /><Inked geo={new THREE.BoxGeometry(0.8, 7, 0.8)} mat={toon("#7a2a22")} pos={[4, 3.5, -10]} />
        <Inked geo={new THREE.BoxGeometry(10, 0.7, 1.2)} mat={toon("#7a2a22")} pos={[0, 7.2, -10]} /><Inked geo={new THREE.BoxGeometry(11, 0.4, 2)} mat={toon("#2e3440")} pos={[0, 7.75, -10]} />
        {[[-9, 4], [8, 2], [-14, -2], [13, -4], [-6, 8]].map(([x, z], i) => <Pine key={i} pos={[x, 0, z]} s={1.6} />)}
        <mesh position={[0, 3, -55]}><planeGeometry args={[200, 14]} /><meshBasicMaterial color="#fff0e0" transparent opacity={0.35} depthWrite={false} /></mesh>
      </ThreeCanvas>
      <Vignette a={0.35} />
    </AbsoluteFill>
  );
};

// ---------- SF3 · beat 10 · world rules: the coup map by candlelight ----------
const SF3: React.FC = () => {
  const cam = V(0.4, 3.1, 2.6);
  const map = React.useMemo(mapTexture, []), tatami = React.useMemo(tatamiTexture, []), wall = React.useMemo(() => shojiWallTexture(true), []);
  const L: Light = { x: 540, y: 1400, r: 1600, key: "#ffb060", shade: "#100808", keyA: 0.4, shadeA: 0.6 };
  const men: [number, number][] = [[-1.4, -0.4], [-0.9, -1.4], [0.5, -1.6], [1.5, -0.6]];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }}>
        <CameraRig pos={cam} look={V(0, 0.4, -0.4)} fov={50} />
        <ambientLight intensity={0.12} /><hemisphereLight args={["#6a4a3a", "#100808", 0.3]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[8, 8]} /><meshToonMaterial map={tatami} gradientMap={gradientMap} /></mesh>
        <mesh position={[0, 1.5, -3]}><planeGeometry args={[8, 3]} /><meshToonMaterial map={wall} gradientMap={gradientMap} /></mesh>
        <mesh position={[-3.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[8, 3]} /><meshToonMaterial map={wall} gradientMap={gradientMap} /></mesh>
        <Inked geo={new THREE.BoxGeometry(1.9, 0.1, 1.3)} mat={toon("#4a2e1e")} pos={[0, 0.35, -0.4]} />
        {[[-0.85, -0.55], [0.85, -0.55], [-0.85, 0.55], [0.85, 0.55]].map(([x, z], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.08, 0.32, 0.08)} mat={toon("#2a1a12")} pos={[x, 0.16, -0.4 + z]} />)}
        <mesh position={[0, 0.405, -0.4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.7, 1.1]} /><meshToonMaterial map={map} gradientMap={gradientMap} /></mesh>
        <Inked geo={new THREE.BoxGeometry(0.03, 0.22, 0.03)} mat={toon("#c8ccd4")} pos={[0.32, 0.5, -0.55]} rot={[0.3, 0, 0.2]} />
        {[[-0.7, -0.9], [0.75, 0.1], [-0.6, 0.2]].map(([x, z], i) => <group key={i}><Inked geo={new THREE.CylinderGeometry(0.035, 0.04, 0.18, 10)} mat={toon("#efe6d0")} pos={[x, 0.5, -0.4 + z]} /><mesh position={[x, 0.63, -0.4 + z]}><coneGeometry args={[0.025, 0.08, 8]} /><meshBasicMaterial color="#ffcc66" /></mesh><pointLight position={[x, 0.75, -0.4 + z]} intensity={1.6} distance={4} decay={1.2} color="#ffa050" /></group>)}
        {men.map(([x, z], i) => <CardActor key={i} kind="bully" age="adult" at={[x, 0, z - 0.4]} heightM={1.1} camPos={cam} spherical light={L} pose={{ coat: "#262428", coatHi: "#3a363e", robe: true, trim: null, kneel: 1, look: [0, 0.9], brow: -0.6, mouth: -0.3, breathe: 30 + i * 9, armR: i === 1 ? [-150, -20] : [-20, -30], handR: i === 1 ? "fist" : "mitt" }} />)}
      </ThreeCanvas>
      <Vignette a={0.65} />
    </AbsoluteFill>
  );
};

// ---------- SF4 · beat 14 · relationship: the forehead poke (2.5D close-up) ----------
const forest = (g: Ctx, w: number, h: number) => {
  g.fillStyle = linGrad(g, 0, 0, 0, h, [[0, "#a8c878"], [1, "#4a6a3a"]]); g.fillRect(-300, -300, w + 600, h + 600);
  const r = rng(31); for (let i = 0; i < 18; i++) { const x = r() * w; g.fillStyle = `rgba(60,46,30,${0.4 + r() * 0.4})`; g.fillRect(x, -300, 30 + r() * 40, h + 600); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${120 + r() * 60},${160 + r() * 60},${80 + r() * 40},0.5)`; g.beginPath(); g.ellipse(r() * w, r() * h * 0.7, 80 + r() * 140, 60 + r() * 100, 0, 0, 6.283); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,250,210,0.25)"; g.beginPath(); g.arc(r() * w, r() * h, 10 + r() * 30, 0, 6.283); g.fill(); }
};
const SF4draw = (g: Ctx, f: number) => {
  const cam = { x: 0, y: 0, zoom: 1 };
  layer(g, cam, "itf_forest", 0.3, forest, 14);
  const L: Light = { x: 900, y: 300, r: 1700, key: "#fff0c8", shade: "#2a3018", keyA: 0.3, shadeA: 0.35 };
  person(g, cam, 1, "sasuke", "child", { x: 330, y: 880 + 556 * 3.0, s: 3.0, facing: 0.45, look: [0.6, -0.7], brow: 0.5, eye: 0.6, mouth: -0.4, nod: -0.04, tilt: -6, breathe: f }, L);
  const it4 = { x: 900, y: 450 + 801 * 2.4, s: 2.4 };
  person(g, cam, 1, "itachi", "teen", { ...it4, facing: -0.55, look: [-0.8, 0.6], brow: 0.35, mouth: 0.45, tilt: 5, headband: "plain", armL: reachArm("itachi", "teen", "L", it4, [445, 735]), handL: "point", still: true, breathe: f }, L);
  particles(g, f, "dust", 61, 30, "rgba(255,250,210,0.7)");
  post(g, f, { tint: "#ffd080", tintAlpha: 0.25, vignette: 0.35, lift: "#141008", glow: { x: 900, y: 300, r: 800, color: "#fff0c0", a: 0.3 } });
};

// ---------- SF5 · beat 21 · "Except one": Sasuke in the lit doorway ----------
const SF5: React.FC = () => {
  const cam = V(1.0, 1.0, 5.6);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }}>
        <CameraRig pos={cam} look={V(1.1, 1.2, 0.5)} fov={36} />
        <fog attach="fog" args={["#141428", 8, 40]} />
        <hemisphereLight args={["#3a4a8a", "#100c18", 0.45]} /><ambientLight intensity={0.1} />
        <Backdrop mood="night" moon="red" z={-60} y={18} />
        <Street len={30} width={14} mood="night" z0={8} />
        <House x={0} z={-3} w={7} d={5} h={3.6} face={0} seed={77} mood="night" door="open" lit={0} />
        <House x={-8} z={-4} w={6} d={5} h={3.2} face={0} seed={78} mood="night" lit={0} />
        <House x={8} z={-4} w={6} d={5} h={3.4} face={0} seed={79} mood="night" lit={0} />
        <mesh position={[1.25, 1.0, 0.53]}><planeGeometry args={[1.25, 2.0]} /><meshBasicMaterial color="#ffc070" /></mesh>
        <mesh position={[1.25, 0.01, 1.4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.3, 1.8]} /><meshBasicMaterial color="#c8823a" transparent opacity={0.45} depthWrite={false} /></mesh>
        <pointLight position={[1.25, 1.5, 1.6]} intensity={2.2} distance={5} decay={1.6} color="#ffb060" />
        <Lantern pos={[-2.6, 2.4, 0.2]} out={1} /><Lantern pos={[3.3, 2.4, 0.2]} out={1} />
        <CardActor kind="sasuke" age="child" at={[1.25, 0, 0.75]} heightM={1.2} camPos={cam} light={{ x: 540, y: 600, r: 1500, key: "#ffc070", shade: "#0a0a1c", keyA: 0.35, shadeA: 0.5 }} pose={{ facing: -0.1, look: [0.1, 0.0], brow: 0.8, eye: 1.15, mouth: -0.3, open: 0.12, handL: "grip", handR: "grip", breathe: 50 }} />
      </ThreeCanvas>
      <Vignette a={0.6} />
    </AbsoluteFill>
  );
};

// ---------- SF6 · beat 29 · revelation: the last forehead poke, in the rain (2.5D) ----------
const wetWall = (g: Ctx, w: number, h: number) => {
  g.fillStyle = linGrad(g, 0, 0, 0, h, [[0, "#3a4250"], [1, "#1a1e28"]]); g.fillRect(-300, -300, w + 600, h + 600);
  const r = rng(41); for (let y = -300; y < h + 300; y += 90) for (let x = -300 + (y / 90 % 2) * 60; x < w + 300; x += 120) { g.fillStyle = `rgba(${70 + r() * 30},${76 + r() * 30},${90 + r() * 30},0.9)`; g.beginPath(); g.roundRect(x + 4, y + 4, 112, 82, 10); g.fill(); }
  g.strokeStyle = "rgba(200,220,255,0.12)"; g.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = r() * w; g.beginPath(); g.moveTo(x, r() * h); g.lineTo(x + 4, r() * h); g.stroke(); }
};
const SF6draw = (g: Ctx, f: number) => {
  const cam = { x: 0, y: 0, zoom: 1 };
  layer(g, cam, "itf_wall", 0.3, wetWall, 10);
  const L: Light = { x: 540, y: 100, r: 1800, key: "#c0d0f0", shade: "#060810", keyA: 0.3, shadeA: 0.6 };
  person(g, cam, 1, "sasuke", "teen", { x: 330, y: 800 + 801 * 2.7, s: 2.7, facing: 0.45, look: [0.7, -0.5], brow: 0.9, eye: 1.15, mouth: -0.5, open: 0.15, shoulders: -0.7, tilt: -4, breathe: f }, L);
  const it6 = { x: 900, y: 470 + 925 * 2.3, s: 2.3 };
  person(g, cam, 1, "itachi", "adult", { ...it6, facing: -0.55, look: [-0.8, 0.5], brow: 0.5, eye: 0.6, mouth: 0.4, tilt: 8, headband: "scratched", armL: reachArm("itachi", "adult", "L", it6, [432, 690]), handL: "point", still: true, breathe: f * 0.5 }, L);
  particles(g, f, "rain", 71, 120, "rgba(200,215,240,0.55)", 1.1);
  post(g, f, { tint: "#4a6a9a", tintAlpha: 0.4, vignette: 0.55, lift: "#080a10" });
};

export const ItachiStyleframes: React.FC = () => {
  const f = useCurrentFrame();
  const d4 = useCallback((g: Ctx, fr: number) => SF4draw(g, fr + 40), []);
  const d6 = useCallback((g: Ctx, fr: number) => SF6draw(g, fr + 40), []);
  if (f === 0) return <SF1 />;
  if (f === 1) return <SF2 />;
  if (f === 2) return <SF3 />;
  if (f === 3) return <AbsoluteFill style={{ background: "#000" }}><CanvasFrame draw={d4} /></AbsoluteFill>;
  if (f === 4) return <SF5 />;
  return <AbsoluteFill style={{ background: "#000" }}><CanvasFrame draw={d6} /></AbsoluteFill>;
};
