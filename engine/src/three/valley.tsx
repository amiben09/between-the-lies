// Kung-fu valley kit (original designs): curved tile roofs, palace halls on a mountain, long stairs, peach trees,
// the scroll hall interior and a mountain prison cavern. Geometry is cached (one geometry per shape) — see STUDIO_MEMORY §6.
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../btl/core";
import { Inked, canvasTex, toon } from "./kit3d";
import { Flame, LeafTree, LightShaft } from "./props";

type P3 = [number, number, number];
const cache = new Map<string, THREE.BufferGeometry>();
const G = (k: string, make: () => THREE.BufferGeometry) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k)!; };
const texCache = new Map<string, THREE.Texture>();
const T = (k: string, make: () => THREE.Texture) => { if (!texCache.has(k)) texCache.set(k, make()); return texCache.get(k)!; };

export const PAL = { pillar: "#a8302a", pillarHi: "#c8483a", tile: "#3a4a5a", tileHi: "#4a6070", ridge: "#c8a040", stone: "#8a8478", stoneDk: "#5a564e",
  wall: "#e8d8b8", wood: "#5a3a24", rock: "#6a6660", rockDk: "#3a3834", peach: "#f0a8b8", gold: "#e8c060" } as const;

/** Curved roof: concave profile extruded along the building width, gold ridge, upturned corner tips. */
export const Roof: React.FC<{ pos: P3; w: number; d: number; h: number; color?: string; rotY?: number }> = ({ pos, w, d, h, color = PAL.tile, rotY = 0 }) => {
  const geo = G(`roof${w}_${d}_${h}`, () => {
    const s = new THREE.Shape(), hw = d / 2 + 0.5;
    s.moveTo(-hw, 0); s.quadraticCurveTo(-hw * 0.45, h * 0.15, 0, h); s.quadraticCurveTo(hw * 0.45, h * 0.15, hw, 0);
    s.lineTo(hw - 0.05, -0.18); s.quadraticCurveTo(hw * 0.45, h * 0.15 - 0.2, 0, h - 0.25); s.quadraticCurveTo(-hw * 0.45, h * 0.15 - 0.2, -hw + 0.05, -0.18); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: w + 0.8, bevelEnabled: false }); g.translate(0, 0, -(w + 0.8) / 2); g.rotateY(Math.PI / 2); return g; });
  return <group position={pos} rotation={[0, rotY, 0]}>
    <Inked geo={geo} mat={toon(color)} pos={[0, 0, 0]} outline={0.01} />
    <Inked geo={G(`ridge${w}`, () => new THREE.BoxGeometry(w + 0.9, 0.22, 0.26))} mat={toon(PAL.ridge)} pos={[0, h - 0.02, 0]} outline={0.02} />
    {[-1, 1].map((sx) => [-1, 1].map((sz) => <Inked key={`${sx}${sz}`} geo={G("tip", () => new THREE.ConeGeometry(0.12, 0.7, 6))} mat={toon(PAL.ridge)}
      pos={[sx * (w / 2 + 0.4), 0.15, sz * (d / 2 + 0.45)]} rot={[sz * 0.5, 0, -sx * 0.5]} outline={0.02} />))}
  </group>;
};

const latticeTex = (lit: boolean) => T("lattice" + lit, () => canvasTex(256, 256, (g, W, H) => {
  g.fillStyle = lit ? "#f6d89a" : PAL.wall; g.fillRect(0, 0, W, H); g.strokeStyle = PAL.wood; g.lineWidth = 7;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * W / 8, 0); g.lineTo(i * W / 8, H); g.stroke(); g.beginPath(); g.moveTo(0, i * H / 8); g.lineTo(W, i * H / 8); g.stroke(); }
  g.lineWidth = 14; g.strokeRect(0, 0, W, H);
}));
export const stoneTex = () => T("stone", () => canvasTex(512, 512, (g, W, H) => {
  const r = rng(5); g.fillStyle = PAL.stone; g.fillRect(0, 0, W, H);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 0.85 + r() * 0.3; g.fillStyle = `rgba(${138 * v | 0},${132 * v | 0},${120 * v | 0},1)`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
  g.strokeStyle = "rgba(40,36,30,0.6)"; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, H); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(W, i * 64); g.stroke(); }
}, [6, 6]));

/** A palace hall: stone platform, red pillars, lattice walls (lit or not), two-tier roof. */
export const PalaceHall: React.FC<{ pos: P3; w?: number; d?: number; h?: number; lit?: boolean; rotY?: number; tiers?: 1 | 2 }> = ({ pos, w = 10, d = 7, h = 4, lit = false, rotY = 0, tiers = 2 }) => {
  const cols = 6;
  return <group position={pos} rotation={[0, rotY, 0]}>
    <Inked geo={G(`plat${w}${d}`, () => new THREE.BoxGeometry(w + 2, 1, d + 2))} mat={toon(PAL.stone)} pos={[0, 0.5, 0]} outline={0.01} />
    <mesh position={[0, 1 + h / 2, d / 2 - 0.6]}><planeGeometry args={[w - 0.6, h - 0.2]} /><meshToonMaterial map={latticeTex(lit)} emissive={lit ? "#ffb860" : "#000000"} emissiveIntensity={lit ? 0.35 : 0} gradientMap={undefined} /></mesh>
    <Inked geo={G(`core${w}${d}${h}`, () => new THREE.BoxGeometry(w - 0.7, h, d - 1.4))} mat={toon(PAL.wall)} pos={[0, 1 + h / 2, -0.1]} outline={0.005} />
    {Array.from({ length: cols }, (_, i) => -w / 2 + 0.4 + i * (w - 0.8) / (cols - 1)).map((x, i) =>
      <Inked key={i} geo={G("pillar" + h, () => new THREE.CylinderGeometry(0.22, 0.26, h, 12))} mat={toon(PAL.pillar)} pos={[x, 1 + h / 2, d / 2 - 0.2]} outline={0.03} />)}
    <Inked geo={G(`beam${w}`, () => new THREE.BoxGeometry(w + 0.4, 0.35, 0.5))} mat={toon(PAL.wood)} pos={[0, 1 + h, d / 2 - 0.2]} outline={0.02} />
    <Roof pos={[0, 1 + h + 0.1, 0]} w={w} d={d + 1} h={2.4} />
    {tiers === 2 && <><Inked geo={G(`core2${w}`, () => new THREE.BoxGeometry(w * 0.6, 1.6, d * 0.55))} mat={toon(PAL.pillar)} pos={[0, 1 + h + 2.2, 0]} outline={0.01} />
      <Roof pos={[0, 1 + h + 2.9, 0]} w={w * 0.62} d={d * 0.6} h={1.8} /></>}
  </group>;
};

/** Straight stone stairs climbing toward -z. */
export const Stairs: React.FC<{ pos: P3; n: number; w?: number; rise?: number; run?: number }> = ({ pos, n, w = 4, rise = 0.25, run = 0.45 }) =>
  <group position={pos}>{Array.from({ length: n }, (_, i) =>
    <Inked key={i} geo={G(`step${w}`, () => new THREE.BoxGeometry(w, 0.25, 0.48))} mat={toon(i % 2 ? PAL.stone : "#948e82")} pos={[0, rise * i + 0.12, -run * i]} outline={0.01} />)}</group>;

/** A mountain (lathe profile) with a flat summit for the palace. */
export const Mountain: React.FC<{ pos: P3; r: number; h: number; top?: number; seed?: number; color?: string }> = ({ pos, r, h, top = 0.18, seed = 1, color = PAL.rock }) => {
  const geo = G(`mtn${r}${h}${top}${seed}`, () => { const rr = rng(seed), pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(Math.max(r * top, r * (1 - t) * (0.85 + rr() * 0.25)), t * h)); }
    pts.push(new THREE.Vector2(0, h)); const g = new THREE.LatheGeometry(pts, 11); g.computeVertexNormals(); return g; });
  return <Inked geo={geo} mat={toon(color)} pos={pos} outline={0.006} />;
};

export const PeachTree: React.FC<{ pos: P3; s?: number; seed?: number }> = ({ pos, s = 1, seed = 4 }) => <LeafTree pos={pos} s={s} color={PAL.peach} seed={seed} />;

/** Small village house: whitewashed walls, wooden door, curved roof. */
export const ValleyHouse: React.FC<{ pos: P3; w?: number; d?: number; rotY?: number; seed?: number }> = ({ pos, w = 4, d = 3.5, rotY = 0, seed = 1 }) => {
  const r = rng(seed); const roofC = r() > 0.5 ? PAL.tile : "#5a3a3a";
  return <group position={pos} rotation={[0, rotY, 0]}>
    <Inked geo={G(`vh${w}${d}`, () => new THREE.BoxGeometry(w, 2.6, d))} mat={toon(PAL.wall)} pos={[0, 1.3, 0]} outline={0.01} />
    <mesh position={[0, 1, d / 2 + 0.01]}><planeGeometry args={[0.9, 1.8]} /><meshToonMaterial color={PAL.wood} /></mesh>
    <Roof pos={[0, 2.6, 0]} w={w} d={d} h={1.4} color={roofC} />
  </group>;
};

/** The scroll hall interior: stone floor, two pillar rows, lit lattice back wall, a carved beam holding the scroll case. */
export const ScrollHall: React.FC<{ f: number; scroll?: boolean; shafts?: number; broken?: number }> = ({ f, scroll = true, shafts = 1, broken = 0 }) => <group>
  <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 40]} /><meshToonMaterial map={stoneTex()} /></mesh>
  {[-1, 1].map((sx) => [0, 1, 2, 3, 4].map((k) => <Inked key={`${sx}${k}`} geo={G("hp", () => new THREE.CylinderGeometry(0.35, 0.4, 9, 14))} mat={toon(PAL.pillar)}
    pos={[sx * 4.2, 4.5, 2 - k * 4.5]} rot={broken && sx === 1 && k === 1 ? [0, 0, -0.06 * broken] : undefined} outline={0.025} />))}
  <mesh position={[0, 4.5, -18.5]}><planeGeometry args={[14, 9]} /><meshToonMaterial map={latticeTex(true)} emissive="#ffb060" emissiveIntensity={0.3} /></mesh>
  <mesh position={[-7.5, 4.5, -8]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[24, 9]} /><meshToonMaterial color="#4a2a22" /></mesh>
  <mesh position={[7.5, 4.5, -8]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[24, 9]} /><meshToonMaterial color="#4a2a22" /></mesh>
  <mesh position={[0, 9, -8]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[16, 24]} /><meshToonMaterial color="#2a1a16" /></mesh>
  <Inked geo={G("hbeam", () => new THREE.BoxGeometry(9, 0.6, 0.8))} mat={toon(PAL.wood)} pos={[0, 7.6, -12]} outline={0.02} />
  {scroll && <ScrollCase pos={[0, 7.0, -12]} f={f} />}
  {shafts > 0 && <><LightShaft pos={[-2.5, 5.5, -9]} rot={[0.35, 0, 0.25]} len={11} r={1.6} a={0.07 * shafts} /><LightShaft pos={[2.2, 5.5, -6]} rot={[0.35, 0, -0.2]} len={11} r={1.4} a={0.06 * shafts} /></>}
  {/* incense bowl */}
  <Inked geo={G("bowl", () => new THREE.CylinderGeometry(0.5, 0.35, 0.5, 14))} mat={toon("#6a5030")} pos={[0, 0.25, -8]} outline={0.03} />
</group>;

/** The scroll case: lacquered tube with gold caps, hanging on cords; a soft glow pulses. */
export const ScrollCase: React.FC<{ pos: P3; f: number; open?: boolean }> = ({ pos, f }) => <group position={pos}>
  <Inked geo={G("sc", () => new THREE.CylinderGeometry(0.22, 0.22, 1.3, 16))} mat={toon("#8a1a1a")} pos={[0, 0, 0]} rot={[0, 0, Math.PI / 2]} outline={0.04} />
  {[-1, 1].map((s) => <Inked key={s} geo={G("cap", () => new THREE.CylinderGeometry(0.26, 0.26, 0.16, 16))} mat={toon(PAL.gold, undefined, "#ffcc66", 0.4)} pos={[s * 0.7, 0, 0]} rot={[0, 0, Math.PI / 2]} outline={0.04} />)}
  {[-1, 1].map((s) => <mesh key={"c" + s} position={[s * 0.45, 0.3, 0]}><cylinderGeometry args={[0.015, 0.015, 0.6, 4]} /><meshBasicMaterial color="#c8a040" /></mesh>)}
  <pointLight position={[0, -0.4, 0.6]} intensity={1.2 + Math.sin(f * 0.08) * 0.3} distance={5} color="#ffcc70" />
</group>;

/** Mountain prison cavern: rock walls (inside a lathe), a stone ring in the floor, chains to the walls, torches. */
export const PrisonCavern: React.FC<{ f: number }> = ({ f }) => {
  const wall = G("cave", () => { const pts: THREE.Vector2[] = []; const r = rng(7); for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector2(9 + r() * 1.5 - (i > 7 ? (i - 7) * 2.2 : 0), i * 1.6)); const g = new THREE.LatheGeometry(pts, 14); g.computeVertexNormals(); return g; });
  const links = useMemo(() => { const out: { p: P3; r: P3 }[] = []; for (const [ax, az, wx] of [[-8, -3, -0.75], [8, -3, 0.75], [-7, 4, -0.75], [7, 4, 0.75]] as const) for (let k = 0; k < 44; k++) { const t = k / 44;
    out.push({ p: [ax * (1 - t) + wx * t, 2.6 * (1 - t) + 1.25 * t - Math.sin(t * Math.PI) * 0.7, az * (1 - t) - 0.35 * t], r: [0, Math.atan2(wx - ax, -0.35 - az), k % 2 ? Math.PI / 2 : 0] }); } return out; }, []);
  return <group>
    <mesh geometry={wall}><meshToonMaterial color={PAL.rockDk} side={THREE.BackSide} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[10, 24]} /><meshToonMaterial color="#3a3a3e" /></mesh>
    <Inked geo={G("ring", () => new THREE.CylinderGeometry(2.2, 2.4, 0.4, 24))} mat={toon("#55555a")} pos={[0, 0.2, -0.5]} outline={0.02} />
    {links.map((l, i) => <Inked key={i} geo={G("link", () => new THREE.TorusGeometry(0.09, 0.028, 6, 10))} mat={toon("#6a6a70")} pos={l.p} rot={l.r} outline={0.05} />)}
    {[[-4.5, 2.6, -5], [4.5, 2.6, -5]].map((p, i) => <group key={i}><Inked geo={G("tb", () => new THREE.CylinderGeometry(0.06, 0.08, 0.7, 6))} mat={toon(PAL.wood)} pos={[p[0], p[1] - 0.4, p[2]]} /><Flame pos={p as P3} f={f} s={0.7} light={3} seed={i * 3} smoke /></group>)}
  </group>;
};
