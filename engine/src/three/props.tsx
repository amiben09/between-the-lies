// Set-dressing + atmosphere library (original designs). Everything is deterministic in `f` (frame) so renders are repeatable.
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../btl/core";
import { Inked, canvasTex, gradientMap, toon } from "./kit3d";

type P3 = [number, number, number];
const geoCache = new Map<string, THREE.BufferGeometry>();
const G = (k: string, make: () => THREE.BufferGeometry) => { if (!geoCache.has(k)) geoCache.set(k, make()); return geoCache.get(k)!; };

export const Barrel: React.FC<{ pos: P3; s?: number }> = ({ pos, s = 1 }) => (
  <group position={pos} scale={[s, s, s]}>
    <Inked geo={G("barrel", () => new THREE.CylinderGeometry(0.32, 0.28, 0.8, 14))} mat={toon("#7a5232")} pos={[0, 0.4, 0]} outline={0.03} />
    {[0.15, 0.65].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.325, 0.325, 0.05, 14]} /><meshToonMaterial color="#2a2a2e" gradientMap={gradientMap} /></mesh>)}
  </group>
);
export const Crate: React.FC<{ pos: P3; s?: number; rot?: number }> = ({ pos, s = 1, rot = 0 }) => (
  <Inked geo={G("crate", () => new THREE.BoxGeometry(0.6, 0.5, 0.6))} mat={toon("#9a7244")} pos={[pos[0], pos[1] + 0.25 * s, pos[2]]} rot={[0, rot, 0]} scale={[s, s, s]} outline={0.03} />
);
/** Stone garden lantern (tōrō-like, original proportions). */
export const StoneLantern: React.FC<{ pos: P3; lit?: boolean; s?: number }> = ({ pos, lit, s = 1 }) => (
  <group position={pos} scale={[s, s, s]}>
    <Inked geo={G("sl_base", () => new THREE.CylinderGeometry(0.28, 0.34, 0.18, 6))} mat={toon("#8a8680")} pos={[0, 0.09, 0]} />
    <Inked geo={G("sl_post", () => new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6))} mat={toon("#8a8680")} pos={[0, 0.53, 0]} />
    <Inked geo={G("sl_box", () => new THREE.BoxGeometry(0.34, 0.3, 0.34))} mat={toon(lit ? "#ffd890" : "#7a766e", undefined, lit ? "#ffb060" : undefined, lit ? 0.8 : 0)} pos={[0, 1.03, 0]} />
    <Inked geo={G("sl_roof", () => { const g = new THREE.ConeGeometry(0.42, 0.26, 6); return g; })} mat={toon("#6e6a64")} pos={[0, 1.31, 0]} />
  </group>
);
/** Shop curtain (noren) that sways; `seed` changes the colour and pattern. */
export const Noren: React.FC<{ pos: P3; w?: number; rotY?: number; f: number; seed?: number }> = ({ pos, w = 1.4, rotY = 0, f, seed = 0 }) => {
  const tex = useMemo(() => canvasTex(256, 192, (g, W, H) => {
    g.fillStyle = ["#2a3a6a", "#7a2a2a", "#2a5a4a", "#4a3a5a"][seed % 4]; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(W / 2, H * 0.45, H * 0.18, 0, 6.283); g.lineWidth = 10; g.strokeStyle = "rgba(255,255,255,0.85)"; g.stroke();
    g.fillRect(W / 2 - 4, H * 0.3, 8, H * 0.3);
  }), [seed]);
  const panels = 3;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {Array.from({ length: panels }, (_, i) => {
        const sway = Math.sin(f * 0.05 + i * 1.3 + seed) * 0.12;
        return <mesh key={i} position={[0, -0.35, (i - (panels - 1) / 2) * (w / panels)]} rotation={[0, Math.PI / 2, sway]}><planeGeometry args={[w / panels - 0.03, 0.7]} /><meshToonMaterial map={tex} gradientMap={gradientMap} side={THREE.DoubleSide} /></mesh>;
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, w + 0.2, 6]} /><meshBasicMaterial color="#2a1e18" /></mesh>
    </group>
  );
};
/** Vertical wooden sign board with abstract brush marks (no real text). */
export const SignBoard: React.FC<{ pos: P3; rotY?: number; h?: number; seed?: number }> = ({ pos, rotY = 0, h = 1.4, seed = 0 }) => {
  const tex = useMemo(() => canvasTex(64, 256, (g, W, H) => {
    g.fillStyle = ["#d8c49a", "#2a2420", "#8a2a22"][seed % 3]; g.fillRect(0, 0, W, H);
    g.strokeStyle = seed % 3 === 1 ? "#e8d8b0" : "#1a1210"; g.lineWidth = 7; g.lineCap = "round"; const r = rng(seed + 5);
    for (let k = 0; k < 4; k++) { const y = 30 + k * 55; g.beginPath(); g.moveTo(18 + r() * 8, y); g.lineTo(46 - r() * 8, y + 8); g.moveTo(32, y - 10); g.lineTo(30 + r() * 6, y + 26); g.stroke(); }
  }), [seed]);
  return <group position={pos} rotation={[0, rotY, 0]}><Inked geo={G("sign" + h, () => new THREE.BoxGeometry(0.06, h, 0.36))} mat={[toon("#3a2a1e"), toon("#ffffff", tex), toon("#3a2a1e"), toon("#3a2a1e"), toon("#3a2a1e"), toon("#3a2a1e")]} pos={[0, h / 2, 0]} outline={0.02} /></group>;
};
/** Tall cloth banner on a pole (nobori-like), fluttering. */
export const Banner: React.FC<{ pos: P3; f: number; color?: string; seed?: number }> = ({ pos, f, color = "#e8e0cc", seed = 0 }) => {
  const flutter = Math.sin(f * 0.09 + seed) * 0.15;
  return (
    <group position={pos}>
      <Inked geo={G("bpole", () => new THREE.CylinderGeometry(0.03, 0.03, 3.2, 6))} mat={toon("#2a2420")} pos={[0, 1.6, 0]} />
      <mesh position={[0.22, 2.2, 0]} rotation={[0, flutter, 0]}><planeGeometry args={[0.42, 1.6]} /><meshToonMaterial color={color} gradientMap={gradientMap} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0.22, 2.2, 0.002]} rotation={[0, flutter, 0]}><planeGeometry args={[0.1, 1.3]} /><meshBasicMaterial color="#8a2a22" side={THREE.DoubleSide} /></mesh>
    </group>
  );
};
export const LaundryLine: React.FC<{ a: P3; b: P3; f: number }> = ({ a, b, f }) => {
  const mid: P3 = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 0.15, (a[2] + b[2]) / 2];
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]); const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const cols = ["#e8e0d0", "#6a8ab8", "#c86a5a", "#e8d8a0"];
  return (
    <group position={mid} rotation={[0, yaw, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.008, 0.008, len, 4]} /><meshBasicMaterial color="#1a1414" /></mesh>
      {cols.map((c, i) => <mesh key={i} position={[0, -0.28, (i - 1.5) * (len / 5)]} rotation={[Math.sin(f * 0.06 + i) * 0.12, Math.PI / 2, 0]}><planeGeometry args={[0.45, 0.55]} /><meshToonMaterial color={c} gradientMap={gradientMap} side={THREE.DoubleSide} /></mesh>)}
    </group>
  );
};
export const Bamboo: React.FC<{ pos: P3; n?: number; seed?: number }> = ({ pos, n = 7, seed = 1 }) => {
  const r = rng(seed);
  return <group position={pos}>{Array.from({ length: n }, (_, i) => { const x = (r() - 0.5) * 1.2, z = (r() - 0.5) * 1.2, h = 3 + r() * 2.5; return (
    <group key={i}><Inked geo={G("bam" + Math.round(h * 4), () => new THREE.CylinderGeometry(0.05, 0.06, h, 6))} mat={toon("#6a8a3a")} pos={[x, h / 2, z]} outline={0.04} />
      <mesh position={[x + 0.2, h * 0.85, z]} scale={[0.5, 0.15, 0.25]}><sphereGeometry args={[1, 6, 4]} /><meshToonMaterial color="#5a7a2a" gradientMap={gradientMap} /></mesh></group>); })}</group>;
};
export const Rock: React.FC<{ pos: P3; s?: number; color?: string }> = ({ pos, s = 1, color = "#7a7670" }) => (
  <Inked geo={G("rock", () => new THREE.DodecahedronGeometry(0.5, 0))} mat={toon(color)} pos={pos} scale={[s * 1.3, s * 0.7, s]} outline={0.04} />
);
/** Grass tufts scattered in a rectangle (instanced for speed). */
export const Grass: React.FC<{ x0: number; x1: number; z0: number; z1: number; n?: number; color?: string; seed?: number }> = ({ x0, x1, z0, z1, n = 200, color = "#5a7a3a", seed = 3 }) => {
  const mesh = useMemo(() => {
    const N = n * 3; const geo = new THREE.ConeGeometry(0.022, 0.26, 3); const m = new THREE.InstancedMesh(geo, toon(color) as THREE.Material, N);
    const r = rng(seed); const o = new THREE.Object3D();
    for (let i = 0; i < N; i++) { o.position.set(x0 + r() * (x1 - x0), 0.11, z0 + r() * (z1 - z0)); o.rotation.set((r() - 0.5) * 0.7, r() * 6, (r() - 0.5) * 0.7); const s = 0.5 + r() * 1.0; o.scale.set(s, s, s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }
    return m;
  }, [x0, x1, z0, z1, n, color, seed]);
  return <primitive object={mesh} />;
};
/** Leafy tree (maple/oak-like) with clustered canopy. */
export const LeafTree: React.FC<{ pos: P3; s?: number; color?: string; seed?: number }> = ({ pos, s = 1, color = "#4f6a3a", seed = 2 }) => {
  const r = rng(seed); const blobs = Array.from({ length: 9 }, () => [(r() - 0.5) * 2.2, 3.2 + r() * 1.6, (r() - 0.5) * 2.2, 0.8 + r() * 0.6] as const);
  return <group position={pos} scale={[s, s, s]}>
    <Inked geo={G("trunk", () => new THREE.CylinderGeometry(0.16, 0.26, 3.4, 8))} mat={toon("#4a3426")} pos={[0, 1.7, 0]} />
    {blobs.map(([x, y, z, k], i) => <Inked key={i} geo={G("blob", () => new THREE.IcosahedronGeometry(1, 1))} mat={toon(i % 3 ? color : "#6a8a4a")} pos={[x, y, z]} scale={[k, k * 0.85, k]} outline={0.025} />)}
  </group>;
};
export const BambooFence: React.FC<{ a: P3; b: P3 }> = ({ a, b }) => {
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]); const n = Math.max(2, Math.round(len / 0.12)); const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  return <group position={a} rotation={[0, yaw, 0]}>
    {Array.from({ length: n }, (_, i) => <mesh key={i} position={[0, 0.6, (i / (n - 1)) * len]}><cylinderGeometry args={[0.04, 0.04, 1.2, 5]} /><meshToonMaterial color="#b89a5a" gradientMap={gradientMap} /></mesh>)}
    {[0.35, 0.95].map((y) => <mesh key={y} position={[0, y, len / 2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, len, 5]} /><meshBasicMaterial color="#5a4a2a" /></mesh>)}
  </group>;
};

// ---------- atmosphere ----------
/** Deterministic point particles: fireflies, embers, dust, petals. */
export const Motes: React.FC<{ f: number; n: number; box: [P3, P3]; color: string; size?: number; rise?: number; seed?: number; drift?: number }> = ({ f, n, box, color, size = 0.06, rise = 0, seed = 1, drift = 0.4 }) => {
  const base = useMemo(() => { const r = rng(seed); return Array.from({ length: n }, () => [r(), r(), r(), r() * 6.283]); }, [n, seed]);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; }, [n]);
  const arr = geo.attributes.position.array as Float32Array; const [a, b] = box;
  base.forEach(([u, v, w, ph], i) => {
    const h = b[1] - a[1]; const y = a[1] + ((v * h + f * rise * 0.02) % h + h) % h;
    arr[i * 3] = a[0] + u * (b[0] - a[0]) + Math.sin(f * 0.03 + ph) * drift; arr[i * 3 + 1] = y + Math.sin(f * 0.05 + ph * 2) * 0.1; arr[i * 3 + 2] = a[2] + w * (b[2] - a[2]) + Math.cos(f * 0.025 + ph) * drift;
  });
  geo.attributes.position.needsUpdate = true;
  return <points geometry={geo}><pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
};
/** Falling rain as streaks around the camera. */
export const Rain3D: React.FC<{ f: number; center: P3; n?: number; r?: number; seed?: number; color?: string }> = ({ f, center, n = 900, r: R = 9, seed = 4, color = "#b8c8e8" }) => {
  const base = useMemo(() => { const r = rng(seed); return Array.from({ length: n }, () => [r() * 2 - 1, r(), r() * 2 - 1, 0.7 + r() * 0.6]); }, [n, seed]);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 6), 3)); return g; }, [n]);
  const arr = geo.attributes.position.array as Float32Array;
  base.forEach(([u, v, w, sp], i) => {
    const y = 8 - ((v * 8 + f * 0.55 * sp) % 8); const x = center[0] + u * R, z = center[2] + w * R;
    arr.set([x, y, z, x - 0.03, y - 0.45, z], i * 6);
  });
  geo.attributes.position.needsUpdate = true;
  return <lineSegments geometry={geo}><lineBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} /></lineSegments>;
};
/** Soft light shaft (additive cone) — sun through trees, moon through windows. */
export const LightShaft: React.FC<{ pos: P3; rot?: P3; len?: number; r?: number; color?: string; a?: number }> = ({ pos, rot = [0, 0, 0], len = 6, r = 0.8, color = "#fff2c0", a = 0.12 }) => (
  <mesh position={pos} rotation={rot}><coneGeometry args={[r, len, 20, 1, true]} /><meshBasicMaterial color={color} transparent opacity={a} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} /></mesh>
);
export const MistPlane: React.FC<{ pos: P3; w: number; h: number; color?: string; a?: number; f?: number }> = ({ pos, w, h, color = "#e8e0f0", a = 0.25, f = 0 }) => {
  const tex = useMemo(() => canvasTex(512, 128, (g, W, H) => { const r = rng(9); for (let i = 0; i < 60; i++) { const gr = g.createRadialGradient(r() * W, H / 2, 0, r() * W, H / 2, 40 + r() * 80); gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); } }), []);
  tex.offset.x = (f * 0.0008) % 1; tex.wrapS = THREE.RepeatWrapping;
  return <mesh position={pos}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} color={color} transparent opacity={a} depthWrite={false} /></mesh>;
};
/** Flickering flame (two additive cones) + optional light. */
export const Flame: React.FC<{ pos: P3; f: number; s?: number; light?: number; seed?: number; smoke?: boolean }> = ({ pos, f, s = 1, light = 0, seed = 0, smoke }) => {
  const fl = 1 + Math.sin(f * 0.9 + seed) * 0.12 + Math.sin(f * 2.3 + seed * 2) * 0.06;
  const glow = useMemo(() => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,200,120,0.9)"); gr.addColorStop(0.4, "rgba(255,120,40,0.35)"); gr.addColorStop(1, "rgba(255,80,20,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), []);
  const tongues = [[0, 0, 1, 0.14], [0.09, 0.04, 0.7, 0.1], [-0.08, -0.03, 0.78, 0.1], [0.03, -0.08, 0.6, 0.08], [-0.04, 0.08, 0.55, 0.08]];
  return <group position={pos} scale={[s, s, s]}>
    {tongues.map(([x, z, h, r], i) => { const k = 1 + Math.sin(f * (1.1 + i * 0.37) + seed + i * 1.7) * 0.22; const hh = 0.42 * h * k * fl; const sway = Math.sin(f * 0.6 + i + seed) * 0.12;
      return <group key={i} position={[x, 0, z]} rotation={[sway * 0.5, 0, sway]}>
        <mesh position={[0, hh / 2, 0]}><coneGeometry args={[r, hh, 8]} /><meshBasicMaterial color={i ? "#ff6a1a" : "#ff8a2a"} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>
        {i < 2 && <mesh position={[0, hh * 0.32, 0]}><coneGeometry args={[r * 0.5, hh * 0.6, 8]} /><meshBasicMaterial color="#fff0a0" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>}
      </group>; })}
    <sprite position={[0, 0.2, 0]} scale={[1.3 * fl, 1.3 * fl, 1]}><spriteMaterial map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></sprite>
    {smoke && [0, 1, 2, 3].map((k) => { const t = ((f * 0.01 + k * 0.25) % 1); return <sprite key={"s" + k} position={[Math.sin(t * 3 + seed) * 0.3, 0.6 + t * 3.2, 0]} scale={[0.8 + t * 1.8, 0.8 + t * 1.8, 1]}><spriteMaterial map={glow} color="#1a1010" transparent opacity={0.55 * (1 - t)} depthWrite={false} /></sprite>; })}
    {light > 0 && <pointLight position={[0, 0.3, 0]} intensity={light * fl} distance={6} decay={1.4} color="#ff9a40" />}
  </group>;
};
