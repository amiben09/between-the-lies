// Sea kit (ORIGINAL designs) for the Circe/Scylla episode: animated ocean, sea cliffs, the bathing-pool cove,
// a beach, a small Greek ship, Circe's island house and golden cloud halls of the gods. Geometry cached per shape.
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../btl/core";
import { Inked, canvasTex, toon } from "./kit3d";

type P3 = [number, number, number];
const cache = new Map<string, THREE.BufferGeometry>();
const G = (k: string, make: () => THREE.BufferGeometry) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k)!; };

export const SEA = { deep: "#1e4a6a", shallow: "#2e8a9a", foam: "#e8f4f4", rock: "#6a6058", rockDk: "#3e3832", sand: "#d8c49a", gold: "#f0c860", wood: "#6a4a2e" } as const;

/** Animated ocean: a displaced grid (two crossing swells + chop), rebuilt per frame from `f`. */
export const Ocean: React.FC<{ f: number; size?: number; color?: string; amp?: number; y?: number; seg?: number; storm?: number }> = ({ f, size = 160, color = SEA.deep, amp = 0.35, y = 0, seg = 70, storm = 0 }) => {
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); return g; }, [size, seg]);
  const pos = geo.attributes.position as THREE.BufferAttribute; const t = f / 30, a = amp * (1 + storm * 2.5);
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, Math.sin(x * 0.18 + t * 1.1) * a + Math.sin(z * 0.23 - t * 0.9) * a * 0.8 + Math.sin((x + z) * 0.6 + t * 2.3) * a * 0.18); }
  pos.needsUpdate = true; geo.computeVertexNormals();
  return <mesh geometry={geo} position={[0, y, 0]}><meshToonMaterial color={color} /></mesh>;
};

/** Jagged sea cliff / sea stack (lathe with noisy radius). */
export const Cliff: React.FC<{ pos: P3; r: number; h: number; seed?: number; color?: string; rotY?: number }> = ({ pos, r, h, seed = 1, color = SEA.rock, rotY = 0 }) => {
  const geo = G(`cliff${r}${h}${seed}`, () => { const rr = rng(seed), pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector2(Math.max(0.3, r * (1 - 0.55 * t) * (0.8 + rr() * 0.35)), t * h)); }
    pts.push(new THREE.Vector2(0, h)); const g = new THREE.LatheGeometry(pts, 9); g.computeVertexNormals(); return g; });
  return <Inked geo={geo} mat={toon(color)} pos={pos} rot={[0, rotY, 0]} outline={0.008} />;
};

/** The bathing-pool cove: a ring of rocks around a still pool (its own colour/glow), with the sea beyond. */
export const Cove: React.FC<{ f: number; pool?: string; glow?: number; boil?: number }> = ({ f, pool = SEA.shallow, glow = 0, boil = 0 }) => {
  const rocks = useMemo(() => { const r = rng(4); return Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return { p: [Math.cos(a) * (4.2 + r() * 0.8), 0, Math.sin(a) * (3 + r() * 0.6) - 4] as P3, s: 0.7 + r() * 0.9 }; }); }, []);
  return <group>
    {rocks.map((k, i) => <Inked key={i} geo={G("crock", () => new THREE.DodecahedronGeometry(1, 0))} mat={toon(i % 3 ? SEA.rock : SEA.rockDk)} pos={k.p} scale={[k.s * 1.3, k.s, k.s]} outline={0.03} />)}
    <mesh position={[0, 0.15 + Math.sin(f * 0.4) * 0.03 * boil, -4]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3.9, 40]} />
      <meshToonMaterial color={pool} emissive={glow > 0 ? "#f0c040" : "#000000"} emissiveIntensity={glow} /></mesh>
    {boil > 0 && Array.from({ length: 24 }, (_, i) => { const r = rng(i + 1), a = r() * 6.28, d = r() * 3.2, ph = ((f * 0.06 + r()) % 1);
      return <mesh key={i} position={[Math.cos(a) * d, 0.2 + ph * 0.6 * boil, Math.sin(a) * d - 4]}><sphereGeometry args={[0.08 + 0.12 * (1 - ph), 8, 6]} /><meshBasicMaterial color="#f8f0c0" transparent opacity={0.8 * (1 - ph) * boil} /></mesh>; })}
  </group>;
};

export const Beach: React.FC<{ size?: number }> = ({ size = 80 }) =>
  <mesh position={[0, 0.05, 20]} rotation={[-Math.PI / 2 + 0.03, 0, 0]}><planeGeometry args={[size, 40]} /><meshToonMaterial color={SEA.sand} /></mesh>;

/** Small Greek ship: hull, mast, square sail, oars, one lantern. */
export const Ship: React.FC<{ pos: P3; rotY?: number; f: number; lantern?: boolean; sail?: string }> = ({ pos, rotY = 0, f, lantern = true, sail = "#d8c8a8" }) => {
  const roll = Math.sin(f * 0.07) * 0.08, pitch = Math.sin(f * 0.05 + 1) * 0.05;
  return <group position={pos} rotation={[pitch, rotY, roll]}>
    <Inked geo={G("hull2", () => { const g = new THREE.CylinderGeometry(0.85, 0.35, 6, 8); g.rotateZ(Math.PI / 2); g.scale(1, 0.7, 1); return g; })} mat={toon(SEA.wood)} pos={[0, 0.45, 0]} outline={0.02} />
    <Inked geo={G("deck", () => new THREE.BoxGeometry(5.6, 0.12, 1.3))} mat={toon("#8a6a44")} pos={[0, 0.95, 0]} outline={0.02} />
    <Inked geo={G("mast", () => new THREE.CylinderGeometry(0.06, 0.08, 4.5, 6))} mat={toon(SEA.wood)} pos={[0, 2.6, 0]} />
    <mesh position={[0, 3.2, 0.05]}><planeGeometry args={[2.6, 2]} /><meshToonMaterial color={sail} side={THREE.DoubleSide} /></mesh>
    {[-2, -1, 0, 1, 2].map((x) => <mesh key={x} position={[x, 0.3, 0.95]} rotation={[0.9, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 1.6, 4]} /><meshBasicMaterial color="#3a2a1a" /></mesh>)}
    {lantern && <><mesh position={[2.6, 1.4, 0]}><sphereGeometry args={[0.14, 10, 8]} /><meshBasicMaterial color="#ffc070" /></mesh><pointLight position={[2.6, 1.4, 0.3]} intensity={2} distance={6} color="#ffb060" /></>}
  </group>;
};

/** Circe's island house: rough stone walls, flat roof, a lit doorway, herb pots. */
export const IslandHouse: React.FC<{ pos: P3; rotY?: number; lit?: number }> = ({ pos, rotY = 0, lit = 0.4 }) => <group position={pos} rotation={[0, rotY, 0]}>
  <Inked geo={G("ihw", () => new THREE.BoxGeometry(5, 3, 4))} mat={toon("#b8aa94")} pos={[0, 1.5, 0]} outline={0.01} />
  <Inked geo={G("ihr", () => new THREE.BoxGeometry(5.6, 0.35, 4.6))} mat={toon("#7a6a54")} pos={[0, 3.15, 0]} outline={0.015} />
  <mesh position={[0, 1.1, 2.01]}><planeGeometry args={[1.1, 2.1]} /><meshBasicMaterial color={lit > 0 ? "#ffc880" : "#2a2018"} /></mesh>
  {lit > 0 && <pointLight position={[0, 1.2, 2.6]} intensity={2 * lit} distance={5} color="#ffb070" />}
  {[-1.8, -1.3, 1.5].map((x, i) => <Inked key={i} geo={G("pot", () => new THREE.CylinderGeometry(0.25, 0.18, 0.4, 10))} mat={toon("#a8583a")} pos={[x, 0.2, 2.3]} outline={0.04} />)}
</group>;

/** The gods' golden halls on clouds: colonnades + glowing domes floating over a cloud bank. */
export const CloudHalls: React.FC<{ f: number; y?: number; z?: number }> = ({ f, y = 18, z = -40 }) => {
  const clouds = useMemo(() => { const r = rng(12); return Array.from({ length: 26 }, () => [(r() - 0.5) * 70, y - 2 + r() * 2, z + (r() - 0.5) * 20, 2 + r() * 4] as const); }, [y, z]);
  const cloudTex = useMemo(() => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,248,230,1)"); gr.addColorStop(0.6, "rgba(255,236,200,0.8)"); gr.addColorStop(1, "rgba(255,230,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), []);
  return <group>
    {clouds.map(([x, cy, cz, s], i) => <sprite key={i} position={[x + Math.sin(f * 0.01 + i) * 0.5, cy, cz]} scale={[s * 3, s * 1.6, 1]}><spriteMaterial map={cloudTex} transparent depthWrite={false} /></sprite>)}
    {[-14, 0, 14].map((x, k) => <group key={k} position={[x, y + 1, z - 4 - Math.abs(x) * 0.3]}>
      <Inked geo={G("cbase", () => new THREE.BoxGeometry(10, 0.6, 6))} mat={toon(SEA.gold, undefined, "#ffd070", 0.4)} pos={[0, 0, 0]} outline={0.01} />
      {[-4, -2, 0, 2, 4].map((cx) => <Inked key={cx} geo={G("ccol", () => new THREE.CylinderGeometry(0.25, 0.3, 4, 12))} mat={toon("#fff0c8", undefined, "#ffe0a0", 0.5)} pos={[cx, 2.3, 2.5]} outline={0.03} />)}
      <Inked geo={G("cdome", () => new THREE.SphereGeometry(3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2))} mat={toon(SEA.gold, undefined, "#ffc850", 0.6)} pos={[0, 4.3, 0]} outline={0.01} />
    </group>)}
  </group>;
};
