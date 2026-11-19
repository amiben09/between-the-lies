// "Snow Globe" (Mr. Freeze) — dressed 3D sets. Original designs; no studio model sheets, no trademark logos.
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../../btl/core";
import { Inked, canvasTex, gradientMap, toon } from "../../three/kit3d";
import { CityStreet, Gargoyle, Neon, NightSky, Searchlight, Skyline, Tower, brickTex, towerTex } from "../../three/city";
import { Barrel, Crate, LightShaft, MistPlane, Motes, Rain3D } from "../../three/props";

type P3 = [number, number, number];
const steelTex = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#4a5260"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2a3038"; g.lineWidth = 4; for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) g.strokeRect(x + 2, y + 2, 124, 124); g.fillStyle = "#6a7280"; for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) for (const [dx, dy] of [[10, 10], [118, 10], [10, 118], [118, 118]]) { g.beginPath(); g.arc(x + dx, y + dy, 3, 0, 6.283); g.fill(); } }, [3, 2]);
const tileTex = () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#3a4048"; g.fillRect(0, 0, w, h); g.strokeStyle = "#262a30"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, [6, 6]);
export function screenTex(kind: "graph" | "tape" | "news", seed = 1) {
  return canvasTex(256, 192, (g, w, h) => {
    g.fillStyle = kind === "graph" ? "#06221e" : "#101418"; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    if (kind === "graph") { g.strokeStyle = "#5fffd0"; g.lineWidth = 3; g.beginPath(); for (let x = 0; x < w; x += 6) g.lineTo(x, h / 2 + Math.sin(x * 0.08 + seed) * 30 * r()); g.stroke(); g.fillStyle = "#5fffd0"; g.font = "16px monospace"; g.fillText("CRYO  -196°C", 10, 22); }
    else { // grainy security-footage still: lab, two figures, a kick (silhouettes), timestamp
      g.fillStyle = "#3a4450"; g.fillRect(0, h * 0.6, w, h * 0.4); g.fillStyle = "#1a1e24"; g.fillRect(w * 0.62, h * 0.18, 30, 80);
      g.fillRect(w * 0.3, h * 0.35, 18, 60); g.save(); g.translate(w * 0.42, h * 0.5); g.rotate(-0.6); g.fillRect(0, 0, 16, 55); g.restore();
      g.fillStyle = "#e8e8e8"; g.font = "14px monospace"; g.fillText(kind === "news" ? "LIVE · GOTHCORP TAPE" : "CAM 2  REC ●", 8, 18);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2, 1); }
    }
  });
}

// ============ the snow globe (THE object): glass sphere, wooden base, a tiny skater ============
export const SnowGlobe: React.FC<{ pos: P3; f: number; s?: number; spin?: number; glow?: number }> = ({ pos, f, s = 1, spin = 1, glow = 0 }) => {
  const r = rng(9); const flakes = useMemo(() => Array.from({ length: 40 }, () => [r() - 0.5, r(), r() - 0.5, r() * 6.283] as const), []);
  return <group position={pos} scale={[s, s, s]}>
    <Inked geo={new THREE.CylinderGeometry(0.11, 0.13, 0.08, 20)} mat={toon("#5a3a24")} pos={[0, 0.04, 0]} outline={0.04} />
    <Inked geo={new THREE.CylinderGeometry(0.035, 0.05, 0.01, 12)} mat={toon("#e8eef4")} pos={[0, 0.085, 0]} outline={0} />
    <group position={[0, 0.1, 0]} rotation={[0, f * 0.05 * spin, 0]}>
      <Inked geo={new THREE.ConeGeometry(0.022, 0.05, 10)} mat={toon("#c8d8ee")} pos={[0, 0.03, 0]} outline={0.05} />
      <Inked geo={new THREE.SphereGeometry(0.01, 8, 6)} mat={toon("#f0e0d0")} pos={[0, 0.065, 0]} outline={0.05} />
      <Inked geo={new THREE.BoxGeometry(0.06, 0.004, 0.008)} mat={toon("#c8d8ee")} pos={[0, 0.045, 0]} outline={0} />
    </group>
    {flakes.map(([x, y, z, ph], i) => { const yy = 0.1 + ((y * 0.17 - f * 0.002 * (1 + (i % 3))) % 0.17 + 0.17) % 0.17; return <mesh key={i} position={[x * 0.16 + Math.sin(f * 0.05 + ph) * 0.01, yy, z * 0.16]}><sphereGeometry args={[0.0025, 4, 3]} /><meshBasicMaterial color="#ffffff" /></mesh>; })}
    <mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.12, 24, 18]} /><meshPhysicalMaterial color="#dff2ff" transparent opacity={0.22} roughness={0.05} metalness={0} /></mesh>
    {glow > 0 && <pointLight position={[0, 0.2, 0.2]} intensity={glow} distance={1.5} decay={1.5} color="#cfe8ff" />}
  </group>;
};

// ============ CRYO LAB ============
export const CryoLab: React.FC<{ f: number; chamber?: number; frost?: number; alarm?: number; vapor?: number; shattered?: boolean; noraCard?: React.ReactNode; globe?: boolean }> = ({ f, chamber = 1, frost = 0.6, alarm = 0, vapor = 0, shattered, noraCard, globe = true }) => {
  const steel = useMemo(steelTex, []), tile = useMemo(tileTex, []), scr = useMemo(() => screenTex("graph", 3), []);
  const blink = alarm > 0 && Math.sin(f * 0.5) > 0 ? alarm : 0;
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 12]} /><meshToonMaterial map={tile} gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 3, -5]}><planeGeometry args={[14, 6]} /><meshToonMaterial map={steel} gradientMap={gradientMap} /></mesh>
    <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[12, 6]} /><meshToonMaterial map={steel} gradientMap={gradientMap} color="#9aa4b4" /></mesh>
    <mesh position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[12, 6]} /><meshToonMaterial map={steel} gradientMap={gradientMap} color="#9aa4b4" /></mesh>
    <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[14, 12]} /><meshToonMaterial color="#1e232a" gradientMap={gradientMap} /></mesh>
    {/* pipes along the back wall and ceiling */}
    {[1.2, 4.6, 5.2].map((y, i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.09, 0.09, 13, 10)} mat={toon(i ? "#6a7482" : "#8a5a3a")} pos={[0, y, -4.85]} rot={[0, 0, Math.PI / 2]} />)}
    {[-4.5, -2.5, 2.5, 4.5].map((x, i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.07, 0.07, 6, 8)} mat={toon("#6a7482")} pos={[x, 3, -4.8]} />)}
    {/* THE CHAMBER: base, glass cylinder, cap, coolant pipes, glow */}
    <group position={[0, 0, -2.6]}>
      <Inked geo={new THREE.CylinderGeometry(0.85, 0.95, 0.35, 24)} mat={toon("#3a4250")} pos={[0, 0.17, 0]} />
      <Inked geo={new THREE.CylinderGeometry(0.85, 0.85, 0.3, 24)} mat={toon("#3a4250")} pos={[0, 2.85, 0]} />
      {[-1, 1].map((s) => <Inked key={s} geo={new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8)} mat={toon("#8a96a6")} pos={[s * 0.6, 4.0, -0.2]} rot={[0.25, 0, s * 0.2]} />)}
      {noraCard}
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.72, 0.72, 2.4, 32, 1, true]} /><meshBasicMaterial color={shattered ? "#5a6a7a" : "#bfe6ff"} transparent opacity={0.14 + frost * 0.35} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.7, 0.7, 2.36, 32, 1, true]} /><meshBasicMaterial color="#7fd8ff" transparent opacity={0.25 * chamber} blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false} /></mesh>
      {chamber > 0 && <pointLight position={[0, 1.6, 1.0]} intensity={3.5 * chamber} distance={7} decay={1.4} color="#8adfff" />}
      <Motes f={f} n={30} box={[[-0.55, 0.4, -0.55], [0.55, 2.6, 0.55]]} color="#e8f8ff" size={0.03} rise={0.2 * chamber} seed={5} drift={0.1} />
    </group>
    {/* consoles with screens + the lever panel (right) */}
    {[-3.6, -2.2].map((x, i) => <group key={i} position={[x, 0, -4.2]}><Inked geo={new THREE.BoxGeometry(1.2, 1.1, 0.7)} mat={toon("#3a4250")} pos={[0, 0.55, 0]} /><mesh position={[0, 1.55, -0.1]} rotation={[-0.2, 0, 0]}><planeGeometry args={[1.0, 0.7]} /><meshBasicMaterial map={scr} toneMapped={false} /></mesh>{[0, 1, 2, 3].map((k) => <mesh key={k} position={[-0.4 + k * 0.25, 1.11, 0.2]}><boxGeometry args={[0.1, 0.03, 0.1]} /><meshBasicMaterial color={["#ff5040", "#50ff90", "#ffd040", "#50c0ff"][k]} /></mesh>)}</group>)}
    <group position={[3.4, 0, -4.4]}>
      <Inked geo={new THREE.BoxGeometry(1.6, 2.2, 0.5)} mat={toon("#2e3540")} pos={[0, 1.1, 0]} />
      <Inked geo={new THREE.BoxGeometry(0.12, 0.8, 0.12)} mat={toon("#c8c8c8")} pos={[0.3, 1.5 + (chamber > 0.5 ? 0.25 : -0.25), 0.35]} rot={[chamber > 0.5 ? -0.5 : 0.5, 0, 0]} />
      <mesh position={[0.3, 1.9 + (chamber > 0.5 ? 0.25 : -0.55), 0.55]}><sphereGeometry args={[0.1, 10, 8]} /><meshToonMaterial color="#c8202a" gradientMap={gradientMap} /></mesh>
    </group>
    {/* chemical shelf (left) */}
    <group position={[-5.3, 0, -1]}>
      <Inked geo={new THREE.BoxGeometry(0.8, 2.6, 2.6)} mat={toon("#2a3038")} pos={[0, 1.3, 0]} />
      {!shattered && [0.6, 1.4, 2.1].map((y) => [-0.8, -0.25, 0.3, 0.85].map((z, k) => <Inked key={y + "_" + z} geo={new THREE.CylinderGeometry(0.13, 0.13, 0.45, 10)} mat={toon(["#5ac8ff", "#aef0ff", "#7a9aff", "#c8f8ff"][k], undefined, "#3a8aaa", 0.4)} pos={[0.45, y + 0.22, z]} />))}
      {shattered && [[0.9, 0.05, -0.6], [1.3, 0.05, 0.4], [0.7, 0.05, 0.9], [1.6, 0.05, -0.2]].map(([x, y, z], i) => <Inked key={i} geo={new THREE.TetrahedronGeometry(0.15)} mat={toon("#bfe6ff")} pos={[x, y, z]} rot={[i, i * 2, 0]} />)}
    </group>
    {/* Victor's desk: lamp + the snow globe */}
    <group position={[3.8, 0, -1.2]}>
      <Inked geo={new THREE.BoxGeometry(1.8, 0.08, 0.9)} mat={toon("#4a3a2e")} pos={[0, 0.82, 0]} />
      {[[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].map(([x, z], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.06, 0.8, 0.06)} mat={toon("#2a2018")} pos={[x, 0.4, z]} />)}
      <Inked geo={new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6)} mat={toon("#2a2a2a")} pos={[0.6, 1.1, -0.2]} rot={[0, 0, 0.3]} />
      <Inked geo={new THREE.ConeGeometry(0.15, 0.18, 12, 1, true)} mat={toon("#2a5a40")} pos={[0.5, 1.35, -0.2]} />
      <pointLight position={[0.5, 1.2, -0.1]} intensity={1.3} distance={3} decay={1.5} color="#ffc070" />
      {globe && <SnowGlobe pos={[-0.2, 0.86, 0.05]} f={f} s={1.4} />}
      {[0, 1, 2].map((k) => <mesh key={k} position={[-0.6 + k * 0.05, 0.87 + k * 0.004, 0.1]} rotation={[-Math.PI / 2, 0, 0.1 * k]}><planeGeometry args={[0.3, 0.4]} /><meshToonMaterial color="#e8e4d8" gradientMap={gradientMap} /></mesh>)}
    </group>
    {/* door (front left), alarm light */}
    <Inked geo={new THREE.BoxGeometry(1.6, 2.6, 0.2)} mat={toon("#2a3038")} pos={[-4.2, 1.3, 2.5]} rot={[0, Math.PI / 2, 0]} />
    {alarm > 0 && <><mesh position={[0, 5.6, -4.8]}><sphereGeometry args={[0.18, 10, 8]} /><meshBasicMaterial color={blink ? "#ff2020" : "#401010"} /></mesh><pointLight position={[0, 5, -3]} intensity={blink * 3} distance={14} decay={1.2} color="#ff2a2a" /></>}
    {vapor > 0 && <><MistPlane pos={[-3, 0.6, -0.5]} w={10} h={2.4} color="#e8f6ff" a={0.55 * vapor} f={f * 3} /><MistPlane pos={[0, 0.3, 1.2]} w={14} h={1.2} color="#e8f6ff" a={0.45 * vapor} f={f * 2 + 99} /></>}
    <LightShaft pos={[0, 5.2, -2.6]} len={5} r={1.0} color="#9adfff" a={0.06 * chamber} />
  </group>;
};

// ============ GOTHAM (skyline, rain, searchlights) ============
export const Gotham: React.FC<{ f: number; rain?: boolean; snow?: boolean; storm?: number }> = ({ f, rain = true, snow, storm = 0.6 }) => (
  <group>
    <NightSky storm={storm} />
    <Skyline seed={3} n={90} gap={8} lit={0.42} />
    <Skyline seed={9} n={50} gap={14} zMin={-220} zMax={-150} spread={260} lit={0.2} />
    <CityStreet len={200} width={14} z0={20} />
    <Searchlight pos={[-30, 0, -90]} f={f} /><Searchlight pos={[40, 0, -120]} f={f} phase={2} />
    {rain && <Rain3D f={f} center={[0, 0, -10]} n={1400} r={20} />}
    {snow && <Motes f={f} n={500} box={[[-20, 0, -40], [20, 40, 10]]} color="#ffffff" size={0.14} rise={-3} seed={12} drift={1.5} />}
    <MistPlane pos={[0, 6, -80]} w={300} h={18} color="#3a3e5a" a={0.35} f={f} />
  </group>
);

// ============ ALLEY ============
export const Alley: React.FC<{ f: number }> = ({ f }) => {
  const brick = useMemo(() => brickTex(), []);
  return <group>
    <NightSky storm={0.7} y={30} z={-60} w={120} h={80} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}><planeGeometry args={[6, 30]} /><meshToonMaterial color="#1e2028" gradientMap={gradientMap} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 3, 6, -8]} rotation={[0, -s * Math.PI / 2, 0]}><planeGeometry args={[30, 12]} /><meshToonMaterial map={brick} gradientMap={gradientMap} /></mesh>)}
    {[2, 4.5, 7].map((y) => <group key={y}><Inked geo={new THREE.BoxGeometry(0.9, 0.06, 3)} mat={toon("#1a1a1e")} pos={[2.5, y, -6]} />{[-1.4, 1.4].map((z) => <Inked key={z} geo={new THREE.CylinderGeometry(0.02, 0.02, 1, 4)} mat={toon("#1a1a1e")} pos={[2.1, y + 0.5, -6 + z]} />)}</group>)}
    <Inked geo={new THREE.BoxGeometry(1.6, 1.1, 0.9)} mat={toon("#2a4030")} pos={[-2.1, 0.55, -4]} />
    <Barrel pos={[-2.3, 0, -6.5]} /><Crate pos={[2.2, 0, -2.5]} rot={0.4} /><Crate pos={[2.3, 0.45, -2.6]} s={0.7} rot={1} />
    <Neon pos={[-2.95, 3.2, -7]} text="LOANS" f={f} rotY={Math.PI / 2} color="#ff4fa0" />
    <Neon pos={[2.95, 4.2, -11]} text="HOTEL" f={f + 13} rotY={-Math.PI / 2} color="#4fe8ff" />
    {[[-0.8, -3], [0.6, -6.5], [-0.2, -10]].map(([x, z], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]}><circleGeometry args={[0.7 + i * 0.2, 20]} /><meshBasicMaterial color="#4a5a7a" transparent opacity={0.45} /></mesh>)}
    <Rain3D f={f} center={[0, 0, -5]} n={900} r={6} />
    <MistPlane pos={[0, 1, -14]} w={8} h={3} color="#3a3a5a" a={0.4} f={f} />
  </group>;
};

// ============ ROOFTOP with gargoyle ============
export const Rooftop: React.FC<{ f: number }> = ({ f }) => (
  <group>
    <Gotham f={f} rain />
    <group position={[0, 40, 0]}>
      <Inked geo={new THREE.BoxGeometry(10, 1, 8)} mat={toon("#3a3e48")} pos={[0, -0.5, -2]} />
      <Inked geo={new THREE.BoxGeometry(10, 0.6, 0.6)} mat={toon("#4a4e58")} pos={[0, 0.3, 1.7]} />
      <Gargoyle pos={[0.6, 0.6, 2.0]} rotY={0.2} s={1.1} />
      <Inked geo={new THREE.BoxGeometry(1.2, 2.4, 1.2)} mat={toon("#3a3e48")} pos={[-3.5, 1.2, -3]} />
      <Inked geo={new THREE.CylinderGeometry(0.6, 0.6, 1.8, 12)} mat={toon("#4a3a30")} pos={[3.2, 2.0, -4]} />
    </group>
  </group>
);

// ============ GOTHCORP TOWER (exterior) ============
export const GothCorpTower: React.FC<{ f: number }> = ({ f }) => {
  const sign = useMemo(() => canvasTex(512, 128, (g, w, h) => { g.fillStyle = "#0a0c12"; g.fillRect(0, 0, w, h); g.font = "bold 84px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "#7fd8ff"; g.shadowBlur = 20; g.fillStyle = "#cfefff"; g.fillText("GOTHCORP", w / 2, h / 2 + 4); }), []);
  return <group>
    <Gotham f={f} rain />
    <Tower x={0} z={-30} w={22} d={18} h={110} seed={500} lit={0.45} spire />
    <mesh position={[0, 62, -20.9]}><planeGeometry args={[16, 4]} /><meshBasicMaterial map={sign} toneMapped={false} /></mesh>
    <mesh position={[3.5, 40, -20.95]}><planeGeometry args={[1.4, 1.4]} /><meshBasicMaterial color="#9adfff" toneMapped={false} /></mesh>
  </group>;
};

// ============ APARTMENT (memory, warm) ============
export const Apartment: React.FC<{ f: number; globe?: boolean }> = ({ f, globe = true }) => {
  const wall = useMemo(() => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#7a5a48"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,220,180,0.15)"; g.lineWidth = 6; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }, [4, 2]), []);
  const snowView = useMemo(() => canvasTex(256, 384, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1a2240"); gr.addColorStop(1, "#4a5a80"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 30; i++) { g.fillStyle = "#14182a"; const bw = 20 + r() * 40, bh = 80 + r() * 200; g.fillRect(r() * w, h - bh, bw, bh); } }), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 10]} /><meshToonMaterial color="#5a3e2e" gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 2, -3]}><planeGeometry args={[10, 4]} /><meshToonMaterial map={wall} gradientMap={gradientMap} /></mesh>
    <mesh position={[-4, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[10, 4]} /><meshToonMaterial map={wall} gradientMap={gradientMap} /></mesh>
    {/* window with snow outside */}
    <mesh position={[1.4, 2.0, -2.98]}><planeGeometry args={[1.6, 2.0]} /><meshBasicMaterial map={snowView} /></mesh>
    <Inked geo={new THREE.BoxGeometry(1.8, 0.1, 0.2)} mat={toon("#e8e0d0")} pos={[1.4, 3.05, -2.9]} /><Inked geo={new THREE.BoxGeometry(1.8, 0.1, 0.3)} mat={toon("#e8e0d0")} pos={[1.4, 0.95, -2.85]} />
    <Inked geo={new THREE.BoxGeometry(0.06, 2.0, 0.1)} mat={toon("#e8e0d0")} pos={[1.4, 2.0, -2.92]} />
    <Motes f={f} n={60} box={[[0.6, 1.0, -2.97], [2.2, 3.0, -2.96]]} color="#ffffff" size={0.03} rise={-1.5} seed={3} drift={0.2} />
    {/* sofa, side table, lamp, the globe */}
    <Inked geo={new THREE.BoxGeometry(2.2, 0.5, 0.9)} mat={toon("#6a3a3a")} pos={[-1.2, 0.45, -2.2]} />
    <Inked geo={new THREE.BoxGeometry(2.2, 0.7, 0.25)} mat={toon("#6a3a3a")} pos={[-1.2, 0.85, -2.6]} />
    <Inked geo={new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16)} mat={toon("#4a3020")} pos={[0.6, 0.7, -2.0]} /><Inked geo={new THREE.CylinderGeometry(0.04, 0.06, 0.7, 8)} mat={toon("#3a2418")} pos={[0.6, 0.35, -2.0]} />
    {globe && <SnowGlobe pos={[0.55, 0.73, -1.95]} f={f} s={1.3} glow={0.6} />}
    <group position={[-2.6, 0, -2.4]}><Inked geo={new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6)} mat={toon("#2a2a2a")} pos={[0, 0.8, 0]} /><Inked geo={new THREE.ConeGeometry(0.3, 0.35, 14, 1, true)} mat={toon("#f0d090", undefined, "#ffb060", 0.6)} pos={[0, 1.7, 0]} /><pointLight position={[0, 1.6, 0.3]} intensity={2.2} distance={6} decay={1.4} color="#ffb060" /></group>
    {/* framed picture on wall (original: a couple, abstract) */}
    <Inked geo={new THREE.BoxGeometry(0.7, 0.9, 0.05)} mat={toon("#3a2a1a")} pos={[-1.2, 2.4, -2.95]} />
    <mesh position={[-1.2, 2.4, -2.92]}><planeGeometry args={[0.55, 0.75]} /><meshToonMaterial color="#c8b898" gradientMap={gradientMap} /></mesh>
  </group>;
};

// ============ WORKSHOP (building the suit) ============
export const Workshop: React.FC<{ f: number }> = ({ f }) => {
  const steel = useMemo(steelTex, []);
  const spark = Math.sin(f * 0.9) > 0.3;
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 12]} /><meshToonMaterial color="#22262e" gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 3, -4]}><planeGeometry args={[12, 6]} /><meshToonMaterial map={steel} gradientMap={gradientMap} color="#5a6474" /></mesh>
    {[[-3, -3.2], [3.2, -3.0]].map(([x, z], i) => <group key={i}><Inked geo={new THREE.BoxGeometry(2, 0.1, 1)} mat={toon("#3a3e46")} pos={[x, 0.9, z]} />{[0, 1, 2].map((k) => <Inked key={k} geo={new THREE.BoxGeometry(0.2 + k * 0.1, 0.1, 0.15)} mat={toon("#7a8090")} pos={[x - 0.6 + k * 0.5, 1.0, z]} rot={[0, k, 0]} />)}</group>)}
    <Inked geo={new THREE.CylinderGeometry(0.4, 0.4, 1.4, 12)} mat={toon("#5ac8ff", undefined, "#2a7aaa", 0.5)} pos={[-4, 0.7, -2]} />
    <Inked geo={new THREE.CylinderGeometry(0.4, 0.4, 1.4, 12)} mat={toon("#5ac8ff", undefined, "#2a7aaa", 0.5)} pos={[-4.9, 0.7, -2.3]} />
    {spark && <><Motes f={f} n={20} box={[[0.3, 1.0, -0.6], [0.8, 1.6, -0.2]]} color="#ffd080" size={0.04} rise={2} seed={f % 7} /><pointLight position={[0.5, 1.3, -0.3]} intensity={2.5} distance={4} decay={1.5} color="#ffd8a0" /></>}
    <LightShaft pos={[0, 5.5, -1]} len={6} r={1.4} color="#9adfff" a={0.06} />
    <MistPlane pos={[0, 0.4, 0]} w={12} h={1} color="#cfe8ff" a={0.25} f={f} />
  </group>;
};

// ============ WAREHOUSE DOCK (frozen) ============
export const Warehouse: React.FC<{ f: number; ice?: number; alarm?: number }> = ({ f, ice = 1, alarm = 1 }) => {
  const blink = Math.sin(f * 0.45) > 0 ? alarm : 0;
  const shards = useMemo(() => { const r = rng(31); return Array.from({ length: 26 }, () => [(r() - 0.5) * 10, r() * 0.5, -2 - r() * 8, 0.3 + r() * 0.7, r() * 6] as const); }, []);
  return <group>
    <NightSky storm={0.5} z={-60} w={160} h={80} y={30} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}><planeGeometry args={[30, 24]} /><meshToonMaterial color="#2a2e36" gradientMap={gradientMap} /></mesh>
    <Inked geo={new THREE.BoxGeometry(24, 8, 0.6)} mat={toon("#3a3e48", towerTex(77, 0.15))} pos={[0, 4, -12]} outline={0.004} />
    <Neon pos={[0, 6.6, -11.6]} text="GOTHCORP" f={f} color="#7fd8ff" w={6} />
    {/* trucks */}
    {[-4, 3.5].map((x, i) => <group key={i} position={[x, 0, -7 + i]}>
      <Inked geo={new THREE.BoxGeometry(2.4, 2.4, 5)} mat={toon(i ? "#8a8e98" : "#a8acb4")} pos={[0, 1.6, 0]} />
      <Inked geo={new THREE.BoxGeometry(2.3, 1.6, 1.6)} mat={toon("#3a5a8a")} pos={[0, 1.1, 3.2]} />
      {[[-1.1, 2.6], [1.1, 2.6], [-1.1, -1.5], [1.1, -1.5]].map(([wx, wz], k) => <Inked key={k} geo={new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14)} mat={toon("#1a1a1a")} pos={[wx, 0.42, wz]} rot={[0, 0, Math.PI / 2]} />)}
      {i === 0 && ice > 0 && <Inked geo={new THREE.IcosahedronGeometry(2.0, 1)} mat={toon("#cfefff", undefined, "#6ac8ff", 0.35)} pos={[0, 1.6, 0.6]} scale={[1.5 * ice, 1.4 * ice, 2.2 * ice]} outline={0.01} />}
    </group>)}
    {ice > 0 && shards.map(([x, y, z, s, r], i) => <Inked key={i} geo={new THREE.OctahedronGeometry(s, 0)} mat={toon("#d8f4ff", undefined, "#6ac8ff", 0.3)} pos={[x, y, z]} rot={[r, r * 2, 0]} scale={[0.6 * ice, 1.4 * ice, 0.6 * ice]} />)}
    {[-8, 8].map((x, i) => <group key={i}><mesh position={[x, 7.2, -11.6]}><sphereGeometry args={[0.25, 10, 8]} /><meshBasicMaterial color={blink ? "#ff2020" : "#401010"} /></mesh><pointLight position={[x, 6.5, -10]} intensity={blink * 4} distance={18} decay={1.2} color="#ff3030" /></group>)}
    <MistPlane pos={[0, 0.8, -4]} w={30} h={2} color="#dff4ff" a={0.4} f={f} />
    <Motes f={f} n={120} box={[[-8, 0, -12], [8, 6, 2]]} color="#ffffff" size={0.05} rise={-0.8} seed={8} drift={0.6} />
  </group>;
};

// ============ GALA HALL ============
export const GalaHall: React.FC<{ f: number; ice?: number }> = ({ f, ice = 1 }) => {
  const banner = useMemo(() => canvasTex(512, 160, (g, w, h) => { g.fillStyle = "#1a2a4a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#d8b860"; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = "#f0e0b0"; g.font = "bold 40px Georgia, serif"; g.textAlign = "center"; g.fillText("HUMANITARIAN", w / 2, 70); g.fillText("OF THE YEAR", w / 2, 120); }), []);
  const floor = useMemo(() => canvasTex(512, 512, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#2a2a34" : "#cfc8b8"; g.fillRect(x * 64, y * 64, 64, 64); } }, [4, 4]), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[20, 20]} /><meshToonMaterial map={floor} gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 4, -6]}><planeGeometry args={[20, 8]} /><meshToonMaterial color="#3a2a40" gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 5, -5.9]}><planeGeometry args={[6, 1.9]} /><meshToonMaterial map={banner} gradientMap={gradientMap} /></mesh>
    {[-6, -3, 3, 6].map((x, i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.35, 0.4, 8, 14)} mat={toon("#d8d0c0")} pos={[x, 4, -5.2]} />)}
    {[-3, 0, 3].map((x, i) => <group key={i} position={[x, 6.5, -1.5]}><Inked geo={new THREE.ConeGeometry(0.7, 0.8, 12, 1, true)} mat={toon("#d8b860", undefined, "#ffd890", 0.4)} pos={[0, 0, 0]} rot={[Math.PI, 0, 0]} /><pointLight position={[0, -0.6, 0]} intensity={1.8} distance={9} decay={1.3} color="#ffe0b0" /><Motes f={f} n={12} box={[[-0.6, -0.6, -0.6], [0.6, -0.2, 0.6]]} color="#fff4d0" size={0.03} seed={i} /></group>)}
    {[[-4.5, 1.5], [4.5, 1.0], [-4, -2.5], [4.2, -3]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Inked geo={new THREE.CylinderGeometry(0.9, 0.9, 0.06, 20)} mat={toon("#f0ece4")} pos={[0, 0.78, 0]} /><Inked geo={new THREE.CylinderGeometry(0.08, 0.12, 0.76, 8)} mat={toon("#3a3a3a")} pos={[0, 0.38, 0]} /><Inked geo={new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8)} mat={toon("#cfe8ff")} pos={[0.3, 0.87, 0.1]} /></group>)}
    {/* podium */}
    <Inked geo={new THREE.BoxGeometry(1.2, 1.3, 0.7)} mat={toon("#4a2a2a")} pos={[0, 0.65, -3.8]} />
    {ice > 0 && [[0.5, -3.2, 1.6], [-1.6, -1, 0.9], [2.0, 0.2, 1.1], [-0.3, 1.0, 0.7]].map(([x, z, s], i) => <Inked key={i} geo={new THREE.IcosahedronGeometry(s as number, 0)} mat={toon("#d8f4ff", undefined, "#6ac8ff", 0.3)} pos={[x as number, 0.05, z as number]} scale={[1.2 * ice, 0.35 * ice, 1.2 * ice]} outline={0.01} />)}
    <Motes f={f} n={80} box={[[-6, 0.2, -5], [6, 6, 4]]} color="#e8f6ff" size={0.04} rise={-0.6} seed={14} />
  </group>;
};

// ============ STREET with TVs in a shop window ============
export const TvWindow: React.FC<{ f: number }> = ({ f }) => {
  const news = useMemo(() => screenTex("news", 7), []);
  return <group>
    <NightSky storm={0.6} y={20} z={-50} w={120} h={60} />
    <CityStreet len={40} width={10} z0={10} />
    <Inked geo={new THREE.BoxGeometry(12, 7, 1)} mat={toon("#3a3440", towerTex(21, 0.2))} pos={[0, 3.5, -6]} outline={0.004} />
    <mesh position={[0, 1.6, -5.45]}><planeGeometry args={[6, 2.4]} /><meshBasicMaterial color="#0a0c12" /></mesh>
    {[[-1.8, 1.9], [0, 1.9], [1.8, 1.9], [-0.9, 0.9], [0.9, 0.9]].map(([x, y], i) => <group key={i} position={[x, y, -5.4]}><Inked geo={new THREE.BoxGeometry(1.4, 1.05, 0.5)} mat={toon("#2a2620")} pos={[0, 0, -0.2]} /><mesh position={[0, 0, 0.06]}><planeGeometry args={[1.15, 0.85]} /><meshBasicMaterial map={news} toneMapped={false} /></mesh></group>)}
    <pointLight position={[0, 1.6, -4]} intensity={2.5} distance={7} decay={1.4} color="#c8e0ff" />
    <Neon pos={[0, 4.4, -5.45]} text="RADIO · TV" f={f} color="#ffd040" w={3.2} />
    <Rain3D f={f} center={[0, 0, -2]} n={1100} r={7} />
  </group>;
};

// ============ THE CELL ============
export const Cell: React.FC<{ f: number }> = ({ f }) => {
  const brick = useMemo(() => brickTex("#8a98a8", "#5a6878"), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6, 6]} /><meshToonMaterial color="#6a7886" gradientMap={gradientMap} /></mesh>
    <mesh position={[0, 2, -2]}><planeGeometry args={[6, 4]} /><meshToonMaterial map={brick} gradientMap={gradientMap} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 2.5, 2, 0]} rotation={[0, -s * Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><meshToonMaterial map={brick} gradientMap={gradientMap} color="#a8b4c4" /></mesh>)}
    {/* small barred window with snow outside */}
    <mesh position={[0.9, 2.9, -1.98]}><planeGeometry args={[0.9, 0.6]} /><meshBasicMaterial color="#5a6a9a" /></mesh>
    {[-0.3, -0.1, 0.1, 0.3].map((x) => <Inked key={x} geo={new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6)} mat={toon("#2a2e36")} pos={[0.9 + x, 2.9, -1.96]} />)}
    <LightShaft pos={[0.9, 2.6, -1.4]} rot={[0.9, 0, 0.3]} len={3.4} r={0.5} color="#cfe0ff" a={0.08} />
    <Motes f={f} n={30} box={[[0.5, 2.6, -1.97], [1.3, 3.2, -1.96]]} color="#ffffff" size={0.02} rise={-1} seed={6} />
    {/* bench + frost on the walls */}
    <Inked geo={new THREE.BoxGeometry(2.2, 0.5, 0.8)} mat={toon("#5a6470")} pos={[-0.6, 0.25, -1.5]} />
    {[[-2.4, 0.3, -1.6], [2.3, 0.2, -1.2], [-1.8, 3.5, -1.9], [2.0, 3.6, -1.8]].map(([x, y, z], i) => <Inked key={i} geo={new THREE.OctahedronGeometry(0.22, 0)} mat={toon("#e8f8ff", undefined, "#8adfff", 0.3)} pos={[x, y, z]} scale={[1, 1.8, 0.5]} rot={[0, i, 0.3]} />)}
    {/* glass front of the cell (we look through it) */}
    <mesh position={[0, 2, 2.5]}><planeGeometry args={[6, 4]} /><meshBasicMaterial color="#cfe8ff" transparent opacity={0.08} depthWrite={false} /></mesh>
    <pointLight position={[0, 3.5, 0.5]} intensity={1.4} distance={7} decay={1.4} color="#a8c8ff" />
    <MistPlane pos={[0, 0.3, 0]} w={6} h={0.8} color="#e8f6ff" a={0.3} f={f} />
  </group>;
};

// ============ ASYLUM EXTERIOR in snow ============
export const AsylumExterior: React.FC<{ f: number }> = ({ f }) => (
  <group>
    <Gotham f={f} rain={false} snow storm={0.4} />
    <group position={[0, 0, -8]}>
      <Inked geo={new THREE.BoxGeometry(18, 14, 8)} mat={toon("#4a4652", towerTex(301, 0.08, "#9adfff"))} pos={[0, 7, -4]} outline={0.004} />
      {[-7, 7].map((x) => <group key={x}><Inked geo={new THREE.CylinderGeometry(1.6, 1.8, 18, 12)} mat={toon("#3e3a46")} pos={[x, 9, 0]} /><Inked geo={new THREE.ConeGeometry(2.2, 4, 12)} mat={toon("#2a2632")} pos={[x, 20, 0]} /></group>)}
      <mesh position={[1.5, 6.5, 0.02]}><planeGeometry args={[0.9, 0.6]} /><meshBasicMaterial color="#cfe8ff" toneMapped={false} /></mesh>
      <pointLight position={[1.5, 6.5, 1.5]} intensity={2} distance={6} decay={1.4} color="#cfe8ff" />
      <Inked geo={new THREE.BoxGeometry(30, 3, 0.8)} mat={toon("#3a3640")} pos={[0, 1.5, 8]} />
    </group>
  </group>
);
