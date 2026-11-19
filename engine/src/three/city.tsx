// Noir city kit (original designs): art-deco towers with lit windows, street, neon, searchlights, gargoyles.
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../btl/core";
import { Inked, canvasTex, gradientMap, toon } from "./kit3d";

const WIN_TEX = new Map<string, THREE.Texture>();
/** Tower facade: dark stone with a grid of windows, some lit (cached per seed/lit level). */
export function towerTex(seed: number, lit = 0.3, tint = "#ffcf80") {
  const k = `${seed}|${lit}|${tint}`; const hit = WIN_TEX.get(k); if (hit) return hit;
  const t = canvasTex(256, 512, (g, w, h) => {
    const r = rng(seed); g.fillStyle = "#2a2e3a"; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 8; y += 22) for (let x = 8; x < w - 8; x += 20) {
      const on = r() < lit; g.fillStyle = on ? (r() < 0.2 ? "#bfe0ff" : tint) : r() < 0.5 ? "#14161e" : "#1c202a"; g.fillRect(x, y, 12, 14);
    }
    g.fillStyle = "rgba(0,0,0,0.25)"; for (let x = 0; x < w; x += 60) g.fillRect(x, 0, 6, h);
  }, [1, 1]);
  WIN_TEX.set(k, t); return t;
}
const TOWER_MAT = new Map<string, THREE.Material>();
/** Facade material: the lit windows glow (emissive), so the night city reads at a distance. */
function towerMat(seed: number, lit: number, color?: string) {
  const k = `${seed}|${lit}|${color}`; const hit = TOWER_MAT.get(k); if (hit) return hit;
  const t = towerTex(seed, lit);
  const m = new THREE.MeshToonMaterial({ color: color ?? "#ffffff", map: t, emissiveMap: t, emissive: "#ffffff", emissiveIntensity: 0.7, gradientMap });
  TOWER_MAT.set(k, m); return m;
}
/** Art-deco tower: stacked set-backs + spire. */
export const Tower: React.FC<{ x: number; z: number; w: number; d: number; h: number; seed: number; lit?: number; spire?: boolean; color?: string }> = ({ x, z, w, d, h, seed, lit = 0.3, spire, color }) => {
  const mat = useMemo(() => towerMat(seed, lit, color), [seed, lit, color]);
  const tiers = [[1, 0.6], [0.78, 0.25], [0.55, 0.15]];
  let y = 0; const out: React.ReactNode[] = [];
  tiers.forEach(([s, f], i) => { const th = h * f; out.push(<Inked key={i} geo={new THREE.BoxGeometry(w * s, th, d * s)} mat={mat} pos={[x, y + th / 2, z]} outline={0.006} />); y += th; });
  return <group>{out}{spire && <Inked geo={new THREE.ConeGeometry(w * 0.12, h * 0.25, 4)} mat={toon("#3a3e4a")} pos={[x, y + h * 0.12, z]} outline={0.01} />}</group>;
};
/** A field of towers on a grid (city blocks), leaving a canyon along x≈0 for the camera. */
export const Skyline: React.FC<{ seed?: number; n?: number; gap?: number; zMin?: number; zMax?: number; spread?: number; lit?: number }> = ({ seed = 3, n = 70, gap = 7, zMin = -160, zMax = -10, spread = 120, lit = 0.3 }) => {
  const items = useMemo(() => { const r = rng(seed); const out: { x: number; z: number; w: number; d: number; h: number; s: number; sp: boolean }[] = [];
    for (let i = 0; i < n; i++) { let x = (r() - 0.5) * spread; if (Math.abs(x) < gap) x += Math.sign(x || 1) * gap; const w = 6 + r() * 8; out.push({ x, z: zMin + r() * (zMax - zMin), w, d: 6 + r() * 8, h: 20 + r() * 60 * (1 - Math.abs(x) / spread), s: Math.floor(r() * 900), sp: r() < 0.25 }); }
    return out; }, [seed, n, gap, zMin, zMax, spread]);
  return <group>{items.map((t, i) => <Tower key={i} x={t.x} z={t.z} w={t.w} d={t.d} h={t.h} seed={t.s} spire={t.sp} lit={lit} />)}</group>;
};
/** Night sky dome with clouds and an optional moon. */
export const NightSky: React.FC<{ z?: number; w?: number; h?: number; y?: number; storm?: number; moon?: boolean; tint?: string }> = ({ z = -220, w = 600, h = 300, y = 60, storm = 0.5, moon = false, tint = "#1a2236" }) => {
  const tex = useMemo(() => canvasTex(1024, 512, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#05070e"); gr.addColorStop(0.7, tint); gr.addColorStop(1, "#3a3040"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const r = rng(77); for (let i = 0; i < 80; i++) { const cg = g.createRadialGradient(r() * W, r() * H * 0.8, 0, r() * W, r() * H * 0.8, 60 + r() * 160); cg.addColorStop(0, `rgba(70,80,110,${0.2 + storm * 0.3})`); cg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = cg; g.fillRect(0, 0, W, H); }
    if (moon) { const mg = g.createRadialGradient(W * 0.72, H * 0.25, 0, W * 0.72, H * 0.25, 90); mg.addColorStop(0, "#f4f0e0"); mg.addColorStop(0.3, "#e8e4d0"); mg.addColorStop(0.32, "rgba(200,210,230,0.25)"); mg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = mg; g.fillRect(0, 0, W, H); }
  }), [storm, moon, tint]);
  return <mesh position={[0, y, z]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} fog={false} depthWrite={false} /></mesh>;
};
/** Searchlight beam from the ground, sweeping. */
export const Searchlight: React.FC<{ pos: [number, number, number]; f: number; phase?: number; len?: number }> = ({ pos, f, phase = 0, len = 140 }) => {
  const a = Math.sin(f * 0.02 + phase) * 0.5;
  return <group position={pos} rotation={[0, 0, a]}><mesh position={[0, len / 2, 0]}><coneGeometry args={[6, len, 16, 1, true]} /><meshBasicMaterial color="#c8d8ff" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} /></mesh></group>;
};
/** Neon sign: emissive text plate (original wording supplied by caller), flickers. */
export const Neon: React.FC<{ pos: [number, number, number]; text: string; color?: string; f: number; rotY?: number; w?: number }> = ({ pos, text, color = "#ff4fa0", f, rotY = 0, w = 2.4 }) => {
  const tex = useMemo(() => canvasTex(512, 160, (g, W, H) => { g.fillStyle = "#0a0a10"; g.fillRect(0, 0, W, H); g.font = "bold 96px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = color; g.shadowBlur = 24; g.fillStyle = color; g.fillText(text, W / 2, H / 2 + 4); }), [text, color]);
  const fl = 0.75 + 0.25 * (Math.sin(f * 1.7) > -0.85 ? 1 : 0);
  return <group position={pos} rotation={[0, rotY, 0]}><mesh><planeGeometry args={[w, w * 0.31]} /><meshBasicMaterial map={tex} toneMapped={false} transparent opacity={fl} /></mesh><pointLight position={[0, 0, 0.6]} intensity={1.6 * fl} distance={7} decay={1.5} color={color} /></group>;
};
/** Stone gargoyle perched on a ledge (original sculpt from primitives). */
export const Gargoyle: React.FC<{ pos: [number, number, number]; rotY?: number; s?: number }> = ({ pos, rotY = 0, s = 1 }) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={[s, s, s]}>
    <Inked geo={new THREE.BoxGeometry(1.4, 0.3, 1.8)} mat={toon("#5a5e66")} pos={[0, -0.15, 0.2]} />
    <Inked geo={new THREE.SphereGeometry(0.42, 10, 8)} mat={toon("#6a6e76")} pos={[0, 0.35, 0]} scale={[1, 1.2, 1.1]} />
    <Inked geo={new THREE.SphereGeometry(0.26, 10, 8)} mat={toon("#6a6e76")} pos={[0, 0.8, 0.32]} />
    <Inked geo={new THREE.ConeGeometry(0.08, 0.3, 5)} mat={toon("#5a5e66")} pos={[-0.15, 1.05, 0.28]} rot={[0, 0, 0.3]} />
    <Inked geo={new THREE.ConeGeometry(0.08, 0.3, 5)} mat={toon("#5a5e66")} pos={[0.15, 1.05, 0.28]} rot={[0, 0, -0.3]} />
    {[-1, 1].map((sg) => <Inked key={sg} geo={new THREE.BoxGeometry(0.08, 0.6, 0.7)} mat={toon("#545860")} pos={[sg * 0.48, 0.55, -0.15]} rot={[0.4, 0, sg * 0.5]} />)}
  </group>
);
/** Wet asphalt street with lane marks and puddle reflections. */
export const CityStreet: React.FC<{ len?: number; width?: number; z0?: number }> = ({ len = 80, width = 14, z0 = 10 }) => {
  const tex = useMemo(() => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#1e2028"; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${60 + r() * 40},${60 + r() * 40},${80 + r() * 40},0.15)`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3); } g.fillStyle = "rgba(210,190,120,0.6)"; for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 4, y, 8, 32); }, [1, len / 14]), [len]);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z0 - len / 2]}><planeGeometry args={[width, len]} /><meshToonMaterial map={tex} gradientMap={gradientMap} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * (width / 2 + 1.5), 0.15, z0 - len / 2]}><planeGeometry args={[3, len]} /><meshToonMaterial color="#3a3c44" gradientMap={gradientMap} /></mesh>)}
  </group>;
};
/** Brick wall plane (alleys, cell). */
export function brickTex(base = "#4a3a36", mortar = "#2a2220") {
  return canvasTex(512, 512, (g, w, h) => { g.fillStyle = mortar; g.fillRect(0, 0, w, h); const r = rng(11); for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -32 : 0; x < w; x += 64) { const v = r() * 20 - 10; g.fillStyle = base; g.globalAlpha = 0.85 + r() * 0.15; g.fillRect(x + 3, y + 3, 58, 26); g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 200})`; g.fillRect(x + 3, y + 3, 58, 26); } g.globalAlpha = 1; }, [3, 3]);
}
