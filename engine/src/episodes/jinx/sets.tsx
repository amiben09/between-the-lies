// "Perfect" (Jinx) — dressed 3D sets: a vertical city (golden Piltover above, poisoned Zaun below). Original designs.
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../../btl/core";
import { Inked, canvasTex, gradientMap, toon } from "../../three/kit3d";
import { Neon, NightSky, Tower, brickTex } from "../../three/city";
import { Barrel, Crate, Flame, LightShaft, MistPlane, Motes, Rain3D } from "../../three/props";

type P3 = [number, number, number];

// ============ the monkey bomb (THE object): tin monkey, button eyes, glowing crystal belly ============
export const MonkeyBomb: React.FC<{ pos: P3; f: number; s?: number; glow?: number; rotY?: number }> = ({ pos, f, s = 1, glow = 1, rotY = 0 }) => {
  const pulse = 0.7 + 0.3 * Math.sin(f * 0.3);
  return <group position={pos} scale={[s, s, s]} rotation={[0, rotY, 0]}>
    <Inked geo={new THREE.SphereGeometry(0.08, 14, 10)} mat={toon("#7a5034")} pos={[0, 0.09, 0]} scale={[1, 1.2, 0.85]} outline={0.05} />
    <Inked geo={new THREE.SphereGeometry(0.065, 14, 10)} mat={toon("#7a5034")} pos={[0, 0.215, 0]} outline={0.05} />
    <Inked geo={new THREE.SphereGeometry(0.05, 12, 8)} mat={toon("#f0d8b0")} pos={[0, 0.195, 0.045]} scale={[1.1, 0.85, 0.75]} outline={0.05} />
    {[-1, 1].map((sg) => <group key={sg}>
      <Inked geo={new THREE.CylinderGeometry(0.03, 0.03, 0.012, 12)} mat={toon("#f0d8b0")} pos={[sg * 0.07, 0.215, 0]} rot={[0, 0, Math.PI / 2]} outline={0.05} />
      <mesh position={[sg * 0.024, 0.232, 0.06]}><sphereGeometry args={[0.012, 8, 6]} /><meshBasicMaterial color="#111" /></mesh>
      <Inked geo={new THREE.CylinderGeometry(0.012, 0.012, 0.11, 6)} mat={toon("#7a5034")} pos={[sg * 0.085, 0.1, 0.02]} rot={[0.4, 0, sg * 0.9]} outline={0.05} />
      <Inked geo={new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6)} mat={toon("#7a5034")} pos={[sg * 0.04, 0.01, 0.03]} rot={[1.2, 0, 0]} outline={0.05} />
    </group>)}
    <Inked geo={new THREE.TorusGeometry(0.05, 0.01, 6, 12, Math.PI * 1.4)} mat={toon("#7a5034")} pos={[0, 0.1, -0.09]} rot={[0, Math.PI / 2, 0]} outline={0.05} />
    <mesh position={[0, 0.09, 0.07]}><octahedronGeometry args={[0.03, 0]} /><meshBasicMaterial color="#6ae8ff" toneMapped={false} transparent opacity={0.6 + 0.4 * glow * pulse} /></mesh>
    {glow > 0 && <pointLight position={[0, 0.12, 0.2]} intensity={1.5 * glow * pulse} distance={1.6} decay={1.5} color="#6ae8ff" />}
    <Inked geo={new THREE.CylinderGeometry(0.005, 0.005, 0.07, 5)} mat={toon("#2a2a2a")} pos={[0, 0.3, 0]} outline={0} />
  </group>;
};

const smogTex = () => canvasTex(512, 256, (g, w, h) => { const r = rng(5); for (let i = 0; i < 70; i++) { const cg = g.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, 40 + r() * 90); cg.addColorStop(0, "rgba(150,220,120,0.5)"); cg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = cg; g.fillRect(0, 0, w, h); } });
const DaySky: React.FC = () => {
  const t = useMemo(() => canvasTex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5a8ad0"); gr.addColorStop(0.6, "#e8c890"); gr.addColorStop(1, "#f0d8a8"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,250,240,0.35)"; g.beginPath(); g.ellipse(r() * w, r() * h * 0.6, 40 + r() * 80, 12 + r() * 20, 0, 0, 6.283); g.fill(); } }), []);
  return <mesh position={[0, 120, -260]}><planeGeometry args={[700, 360]} /><meshBasicMaterial map={t} fog={false} depthWrite={false} /></mesh>;
};
/** Brass airship (original): envelope + gondola + fins. */
export const Airship: React.FC<{ pos: P3; f: number; s?: number }> = ({ pos, f, s = 1 }) => (
  <group position={[pos[0] + Math.sin(f * 0.01) * 3, pos[1], pos[2]]} scale={[s, s, s]}>
    <Inked geo={new THREE.SphereGeometry(3, 18, 12)} mat={toon("#d8b878")} pos={[0, 0, 0]} scale={[2.2, 0.9, 0.9]} outline={0.01} />
    <Inked geo={new THREE.BoxGeometry(3, 0.8, 1)} mat={toon("#7a4a2a")} pos={[0, -3, 0]} />
    {[-1, 1].map((sg) => <Inked key={sg} geo={new THREE.BoxGeometry(1.4, 1.8, 0.1)} mat={toon("#b8904a")} pos={[-6, sg * 0.9, 0]} rot={[0, 0, sg * 0.4]} />)}
  </group>
);

// ============ THE VERTICAL CITY: golden Piltover over poisoned Zaun ============
export const VerticalCity: React.FC<{ f: number }> = ({ f }) => {
  const smog = useMemo(smogTex, []);
  const lower = useMemo(() => { const r = rng(41); return Array.from({ length: 70 }, () => { let x = (r() - 0.5) * 130; if (Math.abs(x) < 6) x += 10; return { x, z: -10 - r() * 120, w: 6 + r() * 7, h: 12 + r() * 22, s: Math.floor(r() * 900) }; }); }, []);
  const upper = useMemo(() => { const r = rng(43); return Array.from({ length: 55 }, () => { let x = (r() - 0.5) * 140; if (Math.abs(x) < 8) x += 12; return { x, z: -20 - r() * 130, w: 7 + r() * 8, h: 30 + r() * 50, s: Math.floor(r() * 900) }; }); }, []);
  return <group>
    <DaySky />
    {/* Zaun: dark, below the smog line (y < 30) */}
    {lower.map((t, i) => <Tower key={"l" + i} x={t.x} z={t.z} w={t.w} d={t.w} h={t.h} seed={t.s + 3000} lit={0.45} color="#4a6a4a" glow={0.9} tint="#9aff8a" />)}
    {/* Piltover: golden towers standing on a deck above (y 34) */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 34, -80]}><planeGeometry args={[220, 160]} /><meshToonMaterial color="#c8a878" gradientMap={gradientMap} transparent opacity={0.0} /></mesh>
    {upper.map((t, i) => <group key={"u" + i} position={[0, 34, 0]}><Tower x={t.x} z={t.z} w={t.w} d={t.w} h={t.h} seed={t.s + 5000} facade="#e8d0a0" color="#fff0d0" spire={i % 4 === 0} /></group>)}
    {/* the council tower: a domed spire (target of the rocket) */}
    <group position={[8, 34, -70]}>
      <Inked geo={new THREE.CylinderGeometry(6, 7, 60, 16)} mat={toon("#f0d8a0")} pos={[0, 30, 0]} />
      <Inked geo={new THREE.SphereGeometry(7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)} mat={toon("#d8b060")} pos={[0, 60, 0]} />
    </group>
    {/* bridges between the two levels */}
    {[-20, 18].map((x, i) => <Inked key={i} geo={new THREE.BoxGeometry(4, 1.2, 70)} mat={toon("#a88a5a")} pos={[x, 33, -40]} />)}
    <Airship pos={[-25, 95, -110]} f={f} s={1.2} /><Airship pos={[30, 80, -150]} f={f + 300} s={0.9} />
    {/* the smog layer at the boundary */}
    <mesh position={[0, 28, -60]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[300, 200]} /><meshBasicMaterial map={smog} color="#7ac850" transparent opacity={0.55} depthWrite={false} /></mesh>
    <MistPlane pos={[0, 22, -40]} w={260} h={20} color="#6ab84a" a={0.45} f={f} />
    <MistPlane pos={[0, 8, -20]} w={200} h={14} color="#4a8a3a" a={0.4} f={f + 99} />
    <Motes f={f} n={120} box={[[-20, 0, -40], [20, 25, 0]]} color="#a8f080" size={0.12} rise={0.4} seed={9} />
  </group>;
};

// ============ ZAUN STREET (night, neon, smog) ============
export const ZaunStreet: React.FC<{ f: number; smoke?: number; fire?: boolean; rain?: boolean }> = ({ f, smoke = 0.4, fire, rain }) => {
  const brick = useMemo(() => brickTex("#3a4238", "#1e241e"), []);
  return <group>
    <NightSky storm={0.4} tint="#1a2a20" y={30} z={-80} w={200} h={100} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}><planeGeometry args={[12, 40]} /><meshToonMaterial color="#1e2420" gradientMap={gradientMap} /></mesh>
    {[-1, 1].map((sg) => <mesh key={sg} position={[sg * 5, 7, -10]} rotation={[0, -sg * Math.PI / 2, 0]}><planeGeometry args={[40, 14]} /><meshToonMaterial map={brick} gradientMap={gradientMap} /></mesh>)}
    {[-14, -24, -34].map((z, i) => <Tower key={i} x={i % 2 ? 8 : -8} z={z} w={7} d={7} h={22 + i * 4} seed={3100 + i} lit={0.45} color="#4a6a4a" glow={0.9} tint="#9aff8a" />)}
    {/* pipes overhead and along the walls */}
    {[3.5, 5.0, 6.2].map((y, i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.15 + i * 0.05, 0.15 + i * 0.05, 12, 10)} mat={toon(i === 1 ? "#6a4a2a" : "#4a5448")} pos={[0, y, -6 - i * 5]} rot={[0, 0, Math.PI / 2]} />)}
    {[-1, 1].map((sg) => <Inked key={sg} geo={new THREE.CylinderGeometry(0.12, 0.12, 30, 8)} mat={toon("#4a5448")} pos={[sg * 4.8, 2.2, -10]} rot={[Math.PI / 2, 0, 0]} />)}
    <Neon pos={[-4.95, 4.2, -5]} text="CHEM" f={f} rotY={Math.PI / 2} color="#7aff6a" w={2} />
    <Neon pos={[4.95, 3.6, -9]} text="BAR" f={f + 7} rotY={-Math.PI / 2} color="#ff5aa8" w={1.6} />
    <Neon pos={[-4.95, 5.4, -14]} text="FIGHTS" f={f + 21} rotY={Math.PI / 2} color="#ffb03a" w={2.4} />
    <Barrel pos={[-3.8, 0, -3]} /><Crate pos={[3.6, 0, -4]} rot={0.3} /><Crate pos={[3.8, 0, -12]} rot={1.1} /><Barrel pos={[-3.6, 0, -16]} />
    {[[-1, -3], [1.2, -8], [-0.5, -14]].map(([x, z], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]}><circleGeometry args={[0.8 + i * 0.3, 20]} /><meshBasicMaterial color="#3a6a4a" transparent opacity={0.45} /></mesh>)}
    {smoke > 0 && <><MistPlane pos={[0, 1.2, -6]} w={14} h={3} color="#5a7a50" a={0.5 * smoke} f={f} /><MistPlane pos={[0, 2.5, -14]} w={14} h={6} color="#4a6a44" a={0.6 * smoke} f={f + 50} /></>}
    {fire && <><Flame pos={[-2.6, 0, -9]} f={f} s={3} light={2.5} smoke /><Flame pos={[2.8, 0, -13]} f={f + 5} s={2.4} light={1.5} smoke /></>}
    {rain && <Rain3D f={f} center={[0, 0, -5]} n={900} r={6} />}
    <Motes f={f} n={60} box={[[-4, 0.3, -16], [4, 5, 0]]} color={fire ? "#ffa050" : "#a8f080"} size={0.04} rise={fire ? 1.5 : 0.3} seed={4} />
  </group>;
};

// ============ THE HIDEOUT BAR (warm, family) ============
export const Hideout: React.FC<{ f: number; bench?: boolean }> = ({ f, bench = true }) => {
  const wood = useMemo(() => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#5a3a24"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 3; for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, [4, 2]), []);
  const brick = useMemo(() => brickTex("#6a4434", "#3a241c"), []);
  const draw = useMemo(() => canvasTex(512, 256, (g, w, h) => { g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, w, h); g.lineWidth = 6; g.lineCap = "round"; const cols = ["#ff5aa8", "#5ab8ff", "#ffd040", "#7aff6a"]; const r = rng(3);
    for (let i = 0; i < 9; i++) { g.strokeStyle = cols[i % 4]; const x = 30 + i * 52, y = 60 + (i % 3) * 50; g.beginPath(); if (i % 3 === 0) { g.arc(x, y, 22, 0, 6.283); g.moveTo(x - 30, y - 18); g.arc(x - 30, y - 18, 10, 0, 6.283); g.moveTo(x + 40, y - 18); g.arc(x + 30, y - 18, 10, 0, 6.283); } else if (i % 3 === 1) { g.moveTo(x - 20, y + 20); g.lineTo(x, y - 25); g.lineTo(x + 20, y + 20); g.closePath(); } else { for (let k = 0; k < 5; k++) g.lineTo(x + Math.cos(k * 2.51) * 22, y + Math.sin(k * 2.51) * 22); g.closePath(); } g.stroke(); } }), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 10]} /><meshToonMaterial map={wood} gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 2.5, -3.5]}><planeGeometry args={[12, 5]} /><meshToonMaterial map={brick} gradientMap={gradientMap} /></mesh>
    <mesh position={[-4.5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[10, 5]} /><meshToonMaterial map={brick} gradientMap={gradientMap} /></mesh>
    {/* bar counter + bottles shelf */}
    <Inked geo={new THREE.BoxGeometry(5, 1.1, 0.8)} mat={toon("#4a2a18")} pos={[1.5, 0.55, -2.4]} />
    <Inked geo={new THREE.BoxGeometry(5.2, 0.1, 1.0)} mat={toon("#7a4a2a")} pos={[1.5, 1.12, -2.4]} />
    {[1.8, 2.5].map((y) => <Inked key={y} geo={new THREE.BoxGeometry(5, 0.06, 0.35)} mat={toon("#3a2214")} pos={[1.5, y, -3.3]} />)}
    {Array.from({ length: 16 }, (_, k) => <Inked key={k} geo={new THREE.CylinderGeometry(0.05, 0.06, 0.32, 8)} mat={toon(["#3a7a4a", "#8a3a2a", "#c8a050", "#3a4a8a"][k % 4], undefined, ["#3a7a4a", "#8a3a2a", "#c8a050", "#3a4a8a"][k % 4], 0.25)} pos={[-0.7 + (k % 8) * 0.6, k < 8 ? 2.0 : 2.7, -3.25]} />)}
    {[0.2, 1.4, 2.6].map((x, i) => <group key={i}><Inked geo={new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14)} mat={toon("#8a3a2a")} pos={[x, 0.8, -1.7]} /><Inked geo={new THREE.CylinderGeometry(0.04, 0.04, 0.76, 6)} mat={toon("#2a2a2a")} pos={[x, 0.38, -1.7]} /></group>)}
    {/* hanging warm lamps */}
    {[-1.5, 1.5].map((x, i) => <group key={i} position={[x, 3.6, -1]}><Inked geo={new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4)} mat={toon("#1a1a1a")} pos={[0, 0.6, 0]} /><Inked geo={new THREE.ConeGeometry(0.3, 0.3, 14, 1, true)} mat={toon("#c8a050", undefined, "#ffb060", 0.6)} pos={[0, 0, 0]} /><pointLight position={[0, -0.3, 0]} intensity={2.2} distance={7} decay={1.4} color="#ffb060" /></group>)}
    {/* Powder's chalk drawings + workbench with monkey bombs */}
    <mesh position={[-4.45, 1.6, 0.5]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3, 1.5]} /><meshBasicMaterial map={draw} transparent /></mesh>
    {bench && <group position={[-3.6, 0, 1.6]}>
      <Inked geo={new THREE.BoxGeometry(1.0, 0.08, 1.6)} mat={toon("#6a4a30")} pos={[0, 0.7, 0]} />
      {[[-0.4, -0.7], [0.4, -0.7], [-0.4, 0.7], [0.4, 0.7]].map(([x, z], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.06, 0.7, 0.06)} mat={toon("#3a2a1a")} pos={[x, 0.35, z]} />)}
      <MonkeyBomb pos={[0.05, 0.74, -0.3]} f={f} s={0.9} glow={0} rotY={1.3} />
      <MonkeyBomb pos={[-0.1, 0.74, 0.4]} f={f} s={0.7} glow={0} rotY={1.7} />
      {[0, 1, 2, 3].map((k) => <Inked key={k} geo={new THREE.BoxGeometry(0.15, 0.03, 0.04)} mat={toon("#9aa0a8")} pos={[0.2, 0.75, -0.6 + k * 0.12]} rot={[0, k, 0]} />)}
      <pointLight position={[0.3, 1.3, 0]} intensity={1.2} distance={2.5} decay={1.5} color="#ffd8a0" />
    </group>}
    <Motes f={f} n={50} box={[[-4, 0.5, -3], [4, 3.5, 2]]} color="#ffe0b0" size={0.025} rise={0.15} seed={3} drift={0.2} />
  </group>;
};

// ============ THE TABLE (finale): dark arches, long table, candles ============
export const TableHall: React.FC<{ f: number; candles?: number }> = ({ f, candles = 1 }) => {
  const stone = useMemo(() => brickTex("#3a3440", "#1a161e"), []);
  const n = 7;
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 14]} /><meshToonMaterial color="#1e1a22" gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 4, -5]}><planeGeometry args={[14, 8]} /><meshToonMaterial map={stone} gradientMap={gradientMap} /></mesh>
    {[-4, 0, 4].map((x, i) => <group key={i} position={[x, 0, -4.6]}><Inked geo={new THREE.TorusGeometry(1.4, 0.25, 8, 20, Math.PI)} mat={toon("#2a2430")} pos={[0, 3.2, 0]} /><Inked geo={new THREE.BoxGeometry(0.5, 3.2, 0.5)} mat={toon("#2a2430")} pos={[-1.4, 1.6, 0]} /><Inked geo={new THREE.BoxGeometry(0.5, 3.2, 0.5)} mat={toon("#2a2430")} pos={[1.4, 1.6, 0]} /></group>)}
    {/* long table with cloth, plates, the monkey toy */}
    <Inked geo={new THREE.BoxGeometry(4.4, 0.08, 1.3)} mat={toon("#4a1a2a")} pos={[0, 0.8, -1.5]} />
    {[[-2, -2.0], [2, -2.0], [-2, -1.0], [2, -1.0]].map(([x, z], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.08, 0.8, 0.08)} mat={toon("#2a1a1a")} pos={[x, 0.4, z]} />)}
    {[-1.5, -0.5, 0.5, 1.5].map((x, i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.16, 0.14, 0.03, 14)} mat={toon("#e8e0d0")} pos={[x, 0.86, -1.3]} />)}
    <MonkeyBomb pos={[0.15, 0.84, -1.6]} f={f} s={0.9} glow={0.2} rotY={0.3} />
    {Array.from({ length: n }, (_, k) => { const x = -2 + k * (4 / (n - 1)); const lit = candles * n > k + 0.5; return <group key={k}><Inked geo={new THREE.CylinderGeometry(0.035, 0.04, 0.22, 8)} mat={toon("#efe6d0")} pos={[x, 0.95, -1.75]} />{lit && <Flame pos={[x, 1.06, -1.75]} f={f + k * 3} s={0.3} seed={k} light={k % 2 ? 1.0 : 0} />}</group>; })}
    {/* graffiti on the arches (original): pink clouds + scribbles */}
    {[-4, 4].map((x, i) => <mesh key={i} position={[x, 1.8, -4.3]}><planeGeometry args={[1.8, 1.8]} /><meshBasicMaterial transparent opacity={0.6} color={i ? "#ff5aa8" : "#5ab8ff"} /></mesh>)}
    <LightShaft pos={[0, 5, -2]} rot={[0.2, 0, 0]} len={6} r={1.4} color="#7aff9a" a={0.04} />
    <Motes f={f} n={40} box={[[-3, 0.5, -3], [3, 3.5, 0]]} color="#ffd8a0" size={0.02} rise={0.15} seed={5} />
  </group>;
};

// ============ SILCO'S OFFICE (green glow, big window) ============
export const SilcoOffice: React.FC<{ f: number }> = ({ f }) => {
  const win = useMemo(() => canvasTex(256, 384, (g, w, h) => { g.fillStyle = "#0e2a18"; g.fillRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "#2aff7a" : "#1a5a3a"; g.fillRect(r() * w, r() * h, 4, 8); } g.strokeStyle = "#0a140e"; g.lineWidth = 10; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 10]} /><meshToonMaterial color="#1a1e1a" gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 2.5, -3]}><planeGeometry args={[10, 5]} /><meshToonMaterial color="#2a322c" gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 2.4, -2.97]}><planeGeometry args={[2.4, 3.2]} /><meshBasicMaterial map={win} /></mesh>
    <pointLight position={[0, 2.4, -1.5]} intensity={2.4} distance={8} decay={1.4} color="#5aff9a" />
    <Inked geo={new THREE.BoxGeometry(2.2, 0.1, 1.0)} mat={toon("#3a2a1e")} pos={[0, 0.8, -1.6]} />
    <Inked geo={new THREE.BoxGeometry(2.1, 0.75, 0.9)} mat={toon("#2a1e16")} pos={[0, 0.38, -1.6]} />
    <Inked geo={new THREE.CylinderGeometry(0.08, 0.1, 0.25, 10)} mat={toon("#5ab88a", undefined, "#2aff7a", 0.4)} pos={[0.6, 0.98, -1.5]} />
    <LightShaft pos={[0, 2.4, -2.2]} rot={[1.2, 0, 0]} len={4} r={1.2} color="#5aff9a" a={0.06} />
    <Motes f={f} n={30} box={[[-2, 0.5, -2.5], [2, 3, 0]]} color="#a8ffb0" size={0.02} rise={0.1} seed={2} />
  </group>;
};

// ============ ZAUN ROOFTOP looking up at Piltover (rocket launch) ============
export const RocketRoof: React.FC<{ f: number }> = ({ f }) => (
  <group>
    <VerticalCity f={f} />
    <Inked geo={new THREE.BoxGeometry(10, 0.6, 8)} mat={toon("#2a302a")} pos={[0, 18, 0]} />
    {[[-3, 0], [3.5, -2]].map(([x, z], i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.4, 0.4, 2.4, 10)} mat={toon("#4a5448")} pos={[x, 19.5, z]} />)}
    <Neon pos={[-4.5, 19.6, -3.5]} text="ZAUN" f={f} color="#7aff6a" w={2.4} rotY={0.3} />
  </group>
);

// ============ WAREHOUSE (blast site) ============
export const BlastSite: React.FC<{ f: number; blast?: number; after?: boolean }> = ({ f, blast = 0, after }) => {
  const brick = useMemo(() => brickTex("#4a443c", "#24201c"), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[16, 16]} /><meshToonMaterial color={after ? "#3a3632" : "#2a2622"} gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 4, -6]}><planeGeometry args={[16, 8]} /><meshToonMaterial map={brick} gradientMap={gradientMap} /></mesh>
    {!after && [[-3, -4], [2.5, -3.5], [0, -2]].map(([x, z], i) => <Crate key={i} pos={[x, 0, z]} s={1.4} rot={i} />)}
    {after && [[-2, -3, 0.9], [1.5, -2, 1.2], [3, -4, 0.7], [-0.5, -1, 0.5], [-3.5, -1.5, 1.0]].map(([x, z, s], i) => <Inked key={i} geo={new THREE.DodecahedronGeometry(s, 0)} mat={toon("#4a4440")} pos={[x, s * 0.4, z]} rot={[i, i * 2, 0]} scale={[1.2, 0.6, 1]} />)}
    {after && <><Flame pos={[-2.5, 0, -3.5]} f={f} s={1.6} light={2} smoke /><Flame pos={[2.8, 0, -4.2]} f={f + 9} s={1.2} light={1} smoke /></>}
    {/* the broken high window */}
    <mesh position={[2, 5, -5.95]}><planeGeometry args={[2, 1.4]} /><meshBasicMaterial color={after ? "#2a3a2a" : "#4a6a5a"} /></mesh>
    {blast > 0 && <><mesh position={[0, 2, -3]}><sphereGeometry args={[1 + blast * 7, 24, 16]} /><meshBasicMaterial color="#cfffff" transparent opacity={Math.max(0, 0.9 - blast * 0.8)} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh><pointLight position={[0, 2, -2]} intensity={30 * (1 - blast)} distance={30} decay={1.2} color="#bfffff" /></>}
    <Motes f={f} n={after ? 200 : 30} box={[[-6, 0, -6], [6, 7, 2]]} color={after ? "#c8c0b8" : "#a8f080"} size={after ? 0.05 : 0.03} rise={after ? -0.4 : 0.2} seed={6} drift={0.5} />
    {after && <MistPlane pos={[0, 2, -3]} w={16} h={6} color="#6a6a5a" a={0.5} f={f} />}
  </group>;
};
