// "Next Time" — dressed 3D sets (original designs; no franchise emblems/landmarks).
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../../btl/core";
import { Inked, canvasTex, gradientMap, toon } from "../../three/kit3d";
import { Backdrop, House, Lantern, Mood, Pine, StoneWall, Street, mapTexture, shojiWallTexture, tatamiTexture } from "../../three/village";
import { Bamboo, BambooFence, Banner, Barrel, Crate, Flame, Grass, LaundryLine, LeafTree, LightShaft, MistPlane, Motes, Noren, Rain3D, Rock, SignBoard, StoneLantern } from "../../three/props";

type P3 = [number, number, number];

// ======================= CLAN STREET (night / grey day, overgrown) =======================
export const ClanStreet: React.FC<{ f: number; mood: Mood; lanternOut?: (z: number) => number; overgrown?: boolean; moonXY?: [number, number]; fallen?: boolean }> = ({ f, mood, lanternOut = () => 0, overgrown, moonXY = [0.5, 0.6], fallen }) => {
  const night = mood === "night";
  const rows = useMemo(() => {
    const r = rng(17); const out: { side: 1 | -1; z: number; w: number; h: number; seed: number }[] = [];
    for (const side of [1, -1] as const) { let z = 9; while (z > -58) { const w = 4.2 + r() * 1.8; out.push({ side, z: z - w / 2, w, h: 3.0 + r() * 1.4, seed: Math.floor(r() * 900) }); z -= w + 0.08; } }
    return out;
  }, []);
  const dress = useMemo(() => {
    const r = rng(23); const items: React.ReactNode[] = [];
    rows.forEach((h, i) => {
      const x = h.side * 3.45, k = i % 6;
      if (k === 0 || k === 3) items.push(<Barrel key={"b" + i} pos={[x - h.side * 0.15, 0, h.z + h.w * 0.3]} s={0.9} />, <Crate key={"c" + i} pos={[x - h.side * 0.2, 0, h.z + h.w * 0.3 - 0.75]} rot={r()} s={0.9} />);
      if (k === 1) items.push(<StoneLantern key={"s" + i} pos={[x - h.side * 0.3, 0, h.z]} lit={night && !overgrown} s={0.9} />);
      if (k === 2 || k === 5) items.push(<SignBoard key={"g" + i} pos={[x - h.side * 0.05, 0.4, h.z - h.w * 0.35]} rotY={h.side > 0 ? 0 : Math.PI} seed={i} />);
      if (k === 4 && !overgrown) items.push(<Banner key={"n" + i} pos={[x - h.side * 0.25, 0, h.z]} f={f} seed={i} color={i % 2 ? "#e8e0cc" : "#2a3a5a"} />);
    });
    return items;
  }, [rows, night, overgrown, f]);
  const poles = [-2, -8, -14, -20, -26, -32, -38, -44];
  return (
    <group>
      <Backdrop mood={mood} moon={night ? "red" : null} z={-90} y={24} moonXY={moonXY} />
      <Street len={72} width={7} mood={night ? "night" : "day"} z0={10} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -26]}><planeGeometry args={[0.5, 72]} /><meshToonMaterial color={night ? "#2a2830" : "#7a6a58"} gradientMap={gradientMap} /></mesh>
      {rows.map((h, i) => <House key={i} x={h.side * 6} z={h.z} w={h.w} d={5} h={h.h} face={h.side} seed={h.seed} mood={night ? "night" : "day"} lit={overgrown ? 0 : night ? (i % 3 === 0 ? 1 : 0) : 0.2} roof={["#2e3440", "#3a3030", "#2a3a3a"][i % 3]} />)}
      {rows.filter((_, i) => i % 2 === 0 && !overgrown).map((h, i) => <Noren key={"nr" + i} pos={[h.side * 3.48, 2.15, h.z - h.w * 0.15]} w={1.3} f={f} seed={i} />)}
      {dress}
      {!overgrown && poles.map((z, i) => [1, -1].map((s) => {
        const out = lanternOut(z);
        return <group key={i + "_" + s}><Inked geo={new THREE.CylinderGeometry(0.05, 0.06, 2.6, 6)} mat={toon("#1a1416")} pos={[s * 3.0, 1.3, z + s * 1.5]} /><Lantern pos={[s * 3.0, 2.75, z + s * 1.5]} out={out} light={night && out < 0.5 && i % 2 === 0 && s === 1} color={i % 3 === 2 ? "#f0e8d8" : "#e0443a"} /></group>;
      }))}
      {!overgrown && [-5, -17, -29].map((z, i) => <LaundryLine key={i} a={[-3.4, 3.9, z]} b={[3.4, 4.1, z - 0.5]} f={f} />)}
      <StoneWall x={0} z0={-58.5} z1={-59.1} h={3.4} />
      <group position={[0, 0, -58.8]}><Inked geo={new THREE.BoxGeometry(7.4, 3.6, 0.6)} mat={toon(night ? "#3a3440" : "#8a8074")} pos={[0, 1.8, 0]} /><Inked geo={new THREE.BoxGeometry(8.2, 0.3, 1.2)} mat={toon("#2a2e38")} pos={[0, 3.75, 0]} /></group>
      {fallen && <><Lantern pos={[1.0, 0.3, 1.5]} fallen scale={0.9} /><Flame pos={[1.22, 0.32, 1.42]} f={f} s={0.9} light={2} /><Lantern pos={[-1.6, 0.25, -4]} fallen out={1} scale={0.85} /><Crate pos={[2.2, 0, -1.5]} rot={0.7} /></>}
      {overgrown && <><Grass x0={-3.2} x1={3.2} z0={-40} z1={8} n={420} color="#6a7a4a" /><Grass x0={-3.4} x1={-2.4} z0={-50} z1={8} n={160} color="#5a6a3a" seed={8} /><Grass x0={2.4} x1={3.4} z0={-50} z1={8} n={160} color="#5a6a3a" seed={9} /></>}
      {night && !overgrown && <Motes f={f} n={60} box={[[-3, 0.5, -30], [3, 4, 4]]} color="#ffb070" size={0.05} rise={0.6} seed={5} />}
      {night && <MistPlane pos={[0, 1.2, -40]} w={30} h={4} color="#3a3a5a" a={0.35} f={f} />}
    </group>
  );
};

// ======================= HIDDEN VILLAGE VALLEY (dawn / burning night) =======================
export const Valley: React.FC<{ f: number; burning?: boolean }> = ({ f, burning }) => {
  const r = rng(21); const mood: Mood = burning ? "night" : "dawn";
  const houses = useMemo(() => { const out: { x: number; z: number; w: number; d: number; h: number; y: number; i: number }[] = []; for (let i = 0; i < 90; i++) { const x = (r() - 0.5) * 80, z = -14 - r() * 70; if (Math.abs(x) < 3.6) continue; out.push({ x, z, w: 4 + r() * 2, d: 4 + r() * 2, h: 2.8 + r() * 2.4, y: Math.max(0, (-z - 40) * 0.06) + Math.abs(x) * 0.02, i }); } return out; }, []);
  const fires = burning ? houses.filter((_, i) => i % 5 === 0).slice(0, 16) : [];
  return (
    <group>
      <Backdrop mood={mood} z={-130} y={32} w={360} h={160} moon={burning ? null : null} />
      {burning && <mesh position={[0, 20, -125]}><planeGeometry args={[360, 60]} /><meshBasicMaterial color="#ff6a2a" transparent opacity={0.35} fog={false} depthWrite={false} /></mesh>}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -45]}><planeGeometry args={[200, 140]} /><meshToonMaterial color={burning ? "#1e2218" : "#7a8a5a"} gradientMap={gradientMap} /></mesh>
      <Street len={100} width={6} mood={burning ? "night" : "dawn"} z0={12} />
      {houses.map((h) => <group key={h.i} position={[0, h.y, 0]}><House x={h.x} z={h.z} w={h.w} d={h.d} h={h.h} face={0} seed={h.i + 40} mood={burning ? "night" : "dawn"} lit={burning ? 0.6 : 0.3} roof={["#3a4250", "#5a3a32", "#3a5248"][h.i % 3]} /></group>)}
      {fires.map((h, i) => <group key={"f" + i} position={[h.x, h.y + h.h + 0.4, h.z]}><Flame pos={[0, 0, 0]} f={f} s={9 + (i % 3) * 2} seed={i} light={i < 4 ? 3 : 0} smoke /><Flame pos={[2.2, 0, 0.6]} f={f + 7} s={8} seed={i + 9} /><Flame pos={[-1.8, 0, -0.4]} f={f + 3} s={6} seed={i + 4} /></group>)}
      {/* cliffs framing the valley */}
      {[[-46, -60, 1], [48, -70, -1], [-30, -110, 1], [34, -115, -1]].map(([x, z, s], i) => <Inked key={i} geo={new THREE.DodecahedronGeometry(14, 0)} mat={toon(burning ? "#1a1a24" : "#7a6e7a")} pos={[x, 6, z]} scale={[1.2, 1.6 + i * 0.1, 1]} rot={[0, i, 0]} outline={0.01} />)}
      {/* waterfall */}
      {!burning && <mesh position={[42, 12, -66]} rotation={[0, -0.6, 0]}><planeGeometry args={[3, 24]} /><meshBasicMaterial color="#e8f4ff" transparent opacity={0.6} /></mesh>}
      {/* the gate */}
      <Inked geo={new THREE.BoxGeometry(0.8, 7, 0.8)} mat={toon("#7a2a22")} pos={[-4, 3.5, -10]} /><Inked geo={new THREE.BoxGeometry(0.8, 7, 0.8)} mat={toon("#7a2a22")} pos={[4, 3.5, -10]} />
      <Inked geo={new THREE.BoxGeometry(10, 0.7, 1.2)} mat={toon("#7a2a22")} pos={[0, 7.2, -10]} /><Inked geo={new THREE.BoxGeometry(11, 0.4, 2)} mat={toon("#2e3440")} pos={[0, 7.75, -10]} />
      {[[-9, 4], [8, 2], [-14, -2], [13, -4], [-6, 8], [16, 6], [-18, 3]].map(([x, z], i) => <Pine key={i} pos={[x, 0, z]} s={1.5 + (i % 3) * 0.3} color={burning ? "#14201a" : "#2f4a36"} />)}
      {!burning && <><MistPlane pos={[0, 3, -50]} w={200} h={10} color="#fff0e0" a={0.35} f={f} /><MistPlane pos={[0, 6, -80]} w={260} h={14} color="#ffe8d0" a={0.3} f={f + 200} /></>}
      {burning && <><Motes f={f} n={160} box={[[-30, 0, -70], [30, 20, -10]]} color="#ff9a40" size={0.25} rise={3} seed={7} drift={1.2} /><MistPlane pos={[0, 8, -40]} w={200} h={20} color="#2a1a1a" a={0.45} f={f} /></>}
      {/* rooftop ninja silhouettes leaping (dawn) */}
      {!burning && [0, 1, 2].map((k) => { const t = ((f * 0.012 + k * 0.33) % 1); const x = -20 + t * 40; const y = 6 + Math.sin(t * Math.PI * 4) * 1.5 + k; return <mesh key={k} position={[x, y, -30 - k * 6]}><boxGeometry args={[0.35, 0.6, 0.2]} /><meshBasicMaterial color="#1a1a24" /></mesh>; })}
    </group>
  );
};

// ======================= TRAINING YARD (sun / rain) =======================
export function targetTexture() { return canvasTex(256, 256, (g, w, h) => { const c = ["#f2e6c8", "#b8141e", "#f2e6c8", "#1a1a1a"]; for (let i = 0; i < 4; i++) { g.fillStyle = c[i]; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - i * 30, 0, 6.283); g.fill(); } }); }
export const TrainingYard: React.FC<{ f: number; rain?: boolean; crack?: number; knifeFly?: number }> = ({ f, rain, crack = 0, knifeFly }) => {
  const tgt = useMemo(targetTexture, []);
  return (
    <group>
      <Backdrop mood={rain ? "night" : "day"} z={-70} y={20} cliffs />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}><planeGeometry args={[60, 60]} /><meshToonMaterial color={rain ? "#3a3830" : "#b8a070"} gradientMap={gradientMap} /></mesh>
      {[-2.5, 0, 2.5].map((x, i) => <group key={i} position={[x, 0, -6]}>
        <Inked geo={new THREE.CylinderGeometry(0.22, 0.25, 1.9, 10)} mat={toon(rain ? "#4a3a2a" : "#7a5a3a")} pos={[0, 0.95, 0]} />
        <mesh position={[0, 1.25, 0.23]}><circleGeometry args={[0.2, 24]} /><meshToonMaterial map={tgt} gradientMap={gradientMap} /></mesh>
        {[0, 1].map((k) => <mesh key={k} position={[0.05 * (k - 0.5), 1.27 + k * 0.06, 0.38]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.025, 0.3, 4]} /><meshBasicMaterial color="#2a2a30" /></mesh>)}
      </group>)}
      {crack > 0 && <group position={[0, 1.15, -5.76]}>{[[0, 0, 0.5, 0.2], [0.04, 0.12, 0.3, -0.5], [-0.05, -0.1, 0.35, 0.6]].map(([x, y, l, r], i) => <mesh key={i} position={[x, y, 0]} rotation={[0, 0, r]} scale={[1, Math.min(1, crack * 1.5 - i * 0.3), 1]}><planeGeometry args={[0.025, l]} /><meshBasicMaterial color="#1a100a" /></mesh>)}</group>}
      {knifeFly !== undefined && knifeFly > 0 && (() => { const k = Math.min(1, knifeFly); const a: P3 = [-1.0, 1.25, -2.2], b: P3 = [0.02, 1.27, -5.6]; const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 0.25, z = a[2] + (b[2] - a[2]) * k;
        return <group position={[x, y, z]} rotation={[k < 1 ? -k * 14 : Math.PI / 2, 0.1, 0]}><mesh><coneGeometry args={[0.03, 0.22, 4]} /><meshBasicMaterial color="#c8ccd4" /></mesh><mesh position={[0, -0.16, 0]}><cylinderGeometry args={[0.015, 0.015, 0.12, 6]} /><meshBasicMaterial color="#2a1a14" /></mesh></group>; })()}
      <BambooFence a={[-8, 0, -12]} b={[8, 0, -12]} /><BambooFence a={[-8, 0, -12]} b={[-8, 0, 6]} /><BambooFence a={[8, 0, -12]} b={[8, 0, 6]} />
      {[[-11, -16], [10, -15], [-4, -20], [5, -22]].map(([x, z], i) => <LeafTree key={i} pos={[x, 0, z]} s={1.1} color={rain ? "#2a3a2a" : "#4f6a3a"} seed={i + 3} />)}
      {[[-6.5, -9], [6, -10.5]].map(([x, z], i) => <Rock key={i} pos={[x, 0.2, z]} s={1.2} />)}
      <Grass x0={-8} x1={8} z0={-12} z1={6} n={260} color={rain ? "#3a4a2a" : "#7a8a4a"} />
      {rain && <><Rain3D f={f} center={[0, 0, -3]} n={1200} r={10} /><mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.01, -2]}><circleGeometry args={[1.4, 24]} /><meshBasicMaterial color="#5a6a80" transparent opacity={0.5} /></mesh></>}
      {!rain && <LightShaft pos={[3, 6, -6]} rot={[0.3, 0, 0.4]} len={12} r={2.2} a={0.08} />}
    </group>
  );
};

// ======================= CLAN POLICE STATION =======================
export const PoliceHQ: React.FC<{ f: number }> = ({ f }) => (
  <group>
    <Backdrop mood="day" z={-80} y={22} />
    <Street len={40} width={9} mood="day" z0={10} />
    <House x={0} z={-8} w={12} d={6} h={6.5} face={0} seed={301} mood="day" roof="#2a2e38" />
    <Inked geo={new THREE.BoxGeometry(5, 0.3, 1.6)} mat={toon("#8a8478")} pos={[0, 0.15, -4.2]} /><Inked geo={new THREE.BoxGeometry(4, 0.3, 1.0)} mat={toon("#8a8478")} pos={[0, 0.45, -4.6]} />
    {[-5.5, 5.5].map((x, i) => <group key={i}><Inked geo={new THREE.BoxGeometry(0.6, 4, 0.6)} mat={toon("#3a2a22")} pos={[x, 2, -2]} /><Inked geo={new THREE.BoxGeometry(1.4, 0.3, 1.4)} mat={toon("#2a2e38")} pos={[x, 4.15, -2]} /></group>)}
    {[-4, -2.6, 2.6, 4].map((x, i) => <Banner key={i} pos={[x, 0, -3]} f={f} seed={i} color={i % 2 ? "#e8e0cc" : "#2a3a5a"} />)}
    <SignBoard pos={[1.8, 0.4, -4.9]} h={2} seed={1} />
    <House x={-12} z={-6} w={6} d={5} h={3.4} face={0} seed={311} mood="day" /><House x={12} z={-6} w={6} d={5} h={3.6} face={0} seed={312} mood="day" />
    {[[-7.5, -1], [7.5, -1.5]].map(([x, z], i) => <Barrel key={i} pos={[x, 0, z]} />)}
    <LightShaft pos={[-2, 7, -2]} rot={[0.2, 0, -0.5]} len={14} r={2.5} a={0.07} />
  </group>
);

// ======================= COUNCIL CHAMBER =======================
export const Council: React.FC<{ f: number; scroll?: number; file?: number }> = ({ f, scroll, file: fileP = 1 }) => {
  const wall = useMemo(() => shojiWallTexture(false), []), tatami = useMemo(tatamiTexture, []);
  const hangScroll = useMemo(() => canvasTex(128, 280, (g, w, h) => { g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, w, h); g.fillStyle = "#3a2a1e"; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14); g.strokeStyle = "#1a1410"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(64, 50); g.lineTo(60, 120); g.moveTo(40, 90); g.lineTo(88, 84); g.moveTo(54, 150); g.quadraticCurveTo(80, 190, 50, 230); g.stroke(); }), []);
  const file = useMemo(() => canvasTex(256, 180, (g, w, h) => { g.fillStyle = "#c8b48a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#5a4630"; g.lineWidth = 3; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = "#3a2a1e"; for (let i = 0; i < 6; i++) g.fillRect(24, 30 + i * 22, 120 + (i % 3) * 30, 6); g.strokeStyle = "#b8141e"; g.lineWidth = 8; g.beginPath(); g.arc(w * 0.78, h * 0.5, 30, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(w * 0.68, h * 0.25); g.lineTo(w * 0.88, h * 0.75); g.stroke(); }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 10]} /><meshToonMaterial map={tatami} gradientMap={gradientMap} color="#8a8070" /></mesh>
      <mesh position={[0, 1.6, -2.6]}><planeGeometry args={[10, 3.2]} /><meshToonMaterial map={wall} gradientMap={gradientMap} color="#a8a0b8" /></mesh>
      <mesh position={[-3.5, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[10, 3.2]} /><meshToonMaterial map={wall} gradientMap={gradientMap} color="#8a84a0" /></mesh>
      <mesh position={[3.5, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[10, 3.2]} /><meshToonMaterial map={wall} gradientMap={gradientMap} color="#8a84a0" /></mesh>
      <Inked geo={new THREE.BoxGeometry(2.6, 0.1, 1.0)} mat={toon("#3a2416")} pos={[0, 0.36, -1.3]} />
      {[[-1.15, -0.4], [1.15, -0.4], [-1.15, 0.4], [1.15, 0.4]].map(([x, z], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.08, 0.32, 0.08)} mat={toon("#24160e")} pos={[x, 0.16, -1.3 + z]} />)}
      <mesh position={[0.2, 0.415, -1.55 + 0.45 * fileP]} rotation={[-Math.PI / 2, 0, 0.1 + (1 - fileP) * 0.3]}><planeGeometry args={[0.42, 0.3]} /><meshToonMaterial map={file} gradientMap={gradientMap} /></mesh>
      {scroll !== undefined && <group position={[-0.15, 0.46, -1.6 + 0.65 * scroll]} rotation={[0, 0.25, Math.PI / 2]}>
        <Inked geo={new THREE.CylinderGeometry(0.045, 0.045, 0.42, 14)} mat={toon("#e8dcc0")} pos={[0, 0, 0]} />
        <Inked geo={new THREE.CylinderGeometry(0.05, 0.05, 0.06, 14)} mat={toon("#9a1418")} pos={[0, 0, 0]} />
        {[-0.22, 0.22].map((y) => <Inked key={y} geo={new THREE.CylinderGeometry(0.055, 0.055, 0.03, 14)} mat={toon("#3a2416")} pos={[0, y, 0]} />)}
      </group>}
      {[-0.8, 0.9].map((x, i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.05, 0.04, 0.08, 10)} mat={toon("#e8e2d4")} pos={[x, 0.45, -1.15]} />)}
      {/* paper floor lamp */}
      <group position={[2.4, 0, -1.8]}><Inked geo={new THREE.BoxGeometry(0.4, 0.8, 0.4)} mat={toon("#f0d8a0", undefined, "#ffb060", 0.6)} pos={[0, 0.6, 0]} /><pointLight position={[0, 0.8, 0.3]} intensity={2.2} distance={6} decay={1.5} color="#ffb060" /></group>
      <LightShaft pos={[-1.5, 2.2, -1]} rot={[0.6, 0, 0.5]} len={5} r={0.5} color="#a8b8ff" a={0.045} />
      {/* elders' cushions, hanging scroll, tea set, incense */}
      {[-0.9, 0, 0.9].map((x, i) => <Inked key={i} geo={new THREE.BoxGeometry(0.55, 0.08, 0.55)} mat={toon(["#5a2a2a", "#3a2a4a", "#5a2a2a"][i])} pos={[x, 0.04, -2.1]} />)}
      <mesh position={[0, 1.9, -2.58]}><planeGeometry args={[0.7, 1.5]} /><meshToonMaterial map={hangScroll} gradientMap={gradientMap} /></mesh>
      <Inked geo={new THREE.CylinderGeometry(0.09, 0.07, 0.12, 12)} mat={toon("#3a3a3a")} pos={[-0.5, 0.47, -1.45]} />
      <Inked geo={new THREE.CylinderGeometry(0.035, 0.03, 0.06, 10)} mat={toon("#d8d0c0")} pos={[-0.3, 0.44, -1.2]} />
      <mesh position={[-2.6, 0.3, -2.2]}><cylinderGeometry args={[0.12, 0.14, 0.12, 12]} /><meshToonMaterial color="#5a4a3a" gradientMap={gradientMap} /></mesh>
      <Motes f={f} n={24} box={[[-2.75, 0.4, -2.3], [-2.45, 2.2, -2.1]]} color="#b0b0c0" size={0.03} rise={1.2} seed={8} drift={0.08} />
      <Motes f={f} n={50} box={[[-2.5, 0.3, -2.4], [2.5, 2.8, 1.5]]} color="#ffe0b0" size={0.02} rise={0.2} seed={3} drift={0.2} />
    </group>
  );
};

// ======================= MAP ROOM (the coup) =======================
export const MapRoom: React.FC<{ f: number; knife: number }> = ({ f, knife }) => {
  const map = useMemo(mapTexture, []), tatami = useMemo(tatamiTexture, []), wall = useMemo(() => shojiWallTexture(true), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 9]} /><meshToonMaterial map={tatami} gradientMap={gradientMap} /></mesh>
      <mesh position={[0, 1.5, -3]}><planeGeometry args={[9, 3]} /><meshToonMaterial map={wall} gradientMap={gradientMap} /></mesh>
      <mesh position={[-3.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[9, 3]} /><meshToonMaterial map={wall} gradientMap={gradientMap} /></mesh>
      <Inked geo={new THREE.BoxGeometry(1.9, 0.1, 1.3)} mat={toon("#4a2e1e")} pos={[0, 0.35, -0.4]} />
      {[[-0.85, -0.55], [0.85, -0.55], [-0.85, 0.55], [0.85, 0.55]].map(([x, z], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.08, 0.32, 0.08)} mat={toon("#2a1a12")} pos={[x, 0.16, -0.4 + z]} />)}
      <mesh position={[0, 0.405, -0.4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.7, 1.1]} /><meshToonMaterial map={map} gradientMap={gradientMap} /></mesh>
      <Inked geo={new THREE.BoxGeometry(0.03, 0.26, 0.03)} mat={toon("#c8ccd4")} pos={[0.12, 0.52 + (1 - knife) * 0.6, -0.48]} rot={[0.1, 0, 0.12]} />
      {[[-0.7, -0.9], [0.75, 0.1], [-0.6, 0.2], [0.55, -0.85]].map(([x, z], i) => <group key={i}><Inked geo={new THREE.CylinderGeometry(0.035, 0.04, 0.18, 10)} mat={toon("#efe6d0")} pos={[x, 0.5, -0.4 + z]} /><Flame pos={[x, 0.59, -0.4 + z]} f={f} s={0.25} seed={i} light={i < 3 ? 1.5 : 0} /></group>)}
      {/* scroll rack */}
      <group position={[2.6, 0, -2.6]}><Inked geo={new THREE.BoxGeometry(1.4, 1.8, 0.4)} mat={toon("#3a2416")} pos={[0, 0.9, 0]} />{[0.4, 0.9, 1.4].map((y) => [-0.45, -0.15, 0.15, 0.45].map((x) => <mesh key={x + "_" + y} position={[x, y, 0.15]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 0.28, 8]} /><meshToonMaterial color="#d8c8a0" gradientMap={gradientMap} /></mesh>))}</group>
      <Motes f={f} n={40} box={[[-2, 0.4, -2], [2, 2.6, 1]]} color="#ffd0a0" size={0.018} rise={0.25} seed={6} drift={0.15} />
    </group>
  );
};

// ======================= FAMILY PORCH + GARDEN (sunset) =======================
export const Porch: React.FC<{ f: number }> = ({ f }) => (
  <group>
    <Backdrop mood="sunset" z={-70} y={20} moon={null} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[40, 40]} /><meshToonMaterial color="#6a7a3a" gradientMap={gradientMap} /></mesh>
    <House x={0} z={-5} w={9} d={6} h={3.4} face={0} seed={505} mood="sunset" lit={0.8} roof="#3a3030" />
    <Inked geo={new THREE.BoxGeometry(6.4, 0.18, 1.3)} mat={toon("#8a6440")} pos={[0, 0.45, -1.6]} />
    {[-3, -1.5, 0, 1.5, 3].map((x) => <Inked key={x} geo={new THREE.BoxGeometry(0.12, 0.45, 0.12)} mat={toon("#5a3e26")} pos={[x, 0.2, -1.05]} />)}
    {/* garden */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.8, 0.01, 2.2]}><circleGeometry args={[1.5, 32]} /><meshToonMaterial color="#4a6a8a" gradientMap={gradientMap} /></mesh>
    {[[-1.6, 0.2], [-0.8, 1.3], [0.1, 2.4], [0.9, 3.5]].map(([x, z], i) => <mesh key={i} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.32, 9]} /><meshToonMaterial color="#9a948a" gradientMap={gradientMap} /></mesh>)}
    <StoneLantern pos={[-3.2, 0, 1.4]} lit /><LeafTree pos={[4.6, 0, -1.2]} s={0.9} color="#b84a2a" seed={8} /><LeafTree pos={[-5.6, 0, -2]} s={0.8} color="#c8682a" seed={9} />
    <Rock pos={[3.9, 0.15, 3.2]} s={0.8} /><Rock pos={[1.8, 0.12, 3.4]} s={0.5} /><Bamboo pos={[-6.5, 0, 0.5]} />
    <BambooFence a={[-7, 0, 5]} b={[7, 0, 5]} />
    <Grass x0={-7} x1={7} z0={-0.5} z1={5} n={220} color="#7a8a3a" />
    <Motes f={f} n={50} box={[[-6, 0.3, -1], [6, 3, 5]]} color="#ffe8a0" size={0.04} rise={0.3} seed={2} />
    <LightShaft pos={[-4, 5, 1]} rot={[0.5, 0, 0.9]} len={12} r={2.4} color="#ffc070" a={0.08} />
  </group>
);

// ======================= FOREST CLEARING =======================
export const Forest: React.FC<{ f: number }> = ({ f }) => {
  const tgt = useMemo(targetTexture, []); const r = rng(44);
  const trunks = useMemo(() => Array.from({ length: 26 }, () => { const a = r() * 6.283, d = 6 + r() * 12; return [Math.cos(a) * d, Math.sin(a) * d - 3, 0.3 + r() * 0.35] as const; }).filter(([x, z]) => !(z > -3 && Math.abs(x) < 7)), []);
  return (
    <group>
      <Backdrop mood="day" z={-60} y={20} cliffs={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><meshToonMaterial color="#5a6a32" gradientMap={gradientMap} /></mesh>
      {trunks.map(([x, z, rr], i) => <group key={i}><Inked geo={new THREE.CylinderGeometry(rr * 0.8, rr, 14, 9)} mat={toon("#4a3a2a")} pos={[x, 7, z]} /><Inked geo={new THREE.IcosahedronGeometry(3, 1)} mat={toon(i % 2 ? "#3f5a2a" : "#4f6a32")} pos={[x, 13 + (i % 3), z]} scale={[1.2, 0.7, 1.2]} outline={0.01} /></group>)}
      <mesh position={[trunks[0][0] * 0 + 2.2, 1.5, -6.3]}><circleGeometry args={[0.35, 24]} /><meshToonMaterial map={tgt} gradientMap={gradientMap} /></mesh>
      <Inked geo={new THREE.CylinderGeometry(0.45, 0.5, 14, 10)} mat={toon("#4a3a2a")} pos={[2.2, 7, -6.8]} />
      {[[-3, -2], [3.5, 1], [-1.5, 3], [4, -3.5]].map(([x, z], i) => <Rock key={i} pos={[x, 0.15, z]} s={0.7 + (i % 2) * 0.4} color="#6a6a5a" />)}
      <Grass x0={-8} x1={8} z0={-8} z1={6} n={380} color="#6a8a3a" />
      {[[-2, 1], [1.5, 2.5], [-4, -1]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>{[0, 1, 2, 3].map((k) => <mesh key={k} position={[0, 0.3, 0]} rotation={[0.9, k * 1.57, 0]}><coneGeometry args={[0.12, 0.9, 4]} /><meshToonMaterial color="#4a7a2a" gradientMap={gradientMap} /></mesh>)}</group>)}
      {[[-2, 0.5], [2.5, -1], [0.5, 2]].map(([x, z], i) => <LightShaft key={i} pos={[x, 6, z]} rot={[0.15, 0, 0.25]} len={13} r={0.9 + i * 0.2} a={0.1} />)}
      <Motes f={f} n={70} box={[[-6, 0.3, -6], [6, 5, 5]]} color="#fff8c0" size={0.04} rise={0.2} seed={11} />
    </group>
  );
};

// ======================= ROOFTOPS (night spy) =======================
export const Rooftops: React.FC<{ f: number }> = ({ f }) => {
  const court = useMemo(() => canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, "#ffc070"); gr.addColorStop(0.6, "#a8602a"); gr.addColorStop(1, "#20140e"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), []);
  return (
    <group>
      <Backdrop mood="night" moon="white" z={-80} y={20} moonXY={[0.3, 0.3]} />
      {/* the roof we crouch on (foreground), tiled ridge */}
      <Inked geo={new THREE.BoxGeometry(6, 0.35, 3.2)} mat={toon("#262c38")} pos={[0, 3.4, 3.0]} rot={[0.12, 0, 0]} />
      {Array.from({ length: 9 }, (_, i) => <Inked key={i} geo={new THREE.CylinderGeometry(0.07, 0.07, 3.2, 6)} mat={toon("#323a48")} pos={[-2.8 + i * 0.7, 3.62, 3.0]} rot={[Math.PI / 2 + 0.12, 0, 0]} />)}
      {/* courtyard below, lit by the meeting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2.4]}><planeGeometry args={[7, 5]} /><meshBasicMaterial map={court} /></mesh>
      {[[-1.1, -2.6], [0, -3.1], [1.1, -2.5], [-0.5, -1.7], [0.7, -1.8]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.18, 0.26, 0.9, 8]} /><meshBasicMaterial color="#1a100c" /></mesh><mesh position={[0, 1.0, 0]}><sphereGeometry args={[0.15, 10, 8]} /><meshBasicMaterial color="#1a100c" /></mesh></group>)}
      <Flame pos={[0, 0.02, -2.4]} f={f} s={0.9} light={2.5} />
      {/* the meeting house across the yard, lit shoji */}
      <House x={0} z={-7.6} w={8} d={5} h={3.4} face={0} seed={611} mood="night" lit={1} />
      <House x={-7} z={-3} w={5} d={6} h={3.2} face={1} seed={612} mood="night" lit={0} /><House x={7} z={-3} w={5} d={6} h={3.6} face={-1} seed={613} mood="night" lit={1} />
      {[[-9, -16], [0, -18], [9, -17], [-14, -9], [14, -10]].map(([x, z], i) => <House key={i} x={x} z={z} w={6} d={5} h={3.2 + (i % 2)} face={0} seed={620 + i} mood="night" lit={i % 2} />)}
      <Lantern pos={[-3, 2.4, -4.9]} light={false} /><Lantern pos={[3, 2.4, -4.9]} />
      <Motes f={f} n={40} box={[[-6, 0.5, -6], [6, 3, 0]]} color="#ffb070" size={0.04} rise={0.5} seed={21} />
      <MistPlane pos={[0, 2, -20]} w={40} h={4} color="#2a2a4a" a={0.4} f={f} />
    </group>
  );
};

// ======================= CLIFF TOP over the village lights =======================
export const CliffTop: React.FC<{ f: number }> = ({ f }) => {
  const lights = useMemo(() => { const r = rng(55); const g = new THREE.BufferGeometry(); const a = new Float32Array(900 * 3); for (let i = 0; i < 900; i++) { a.set([(r() - 0.5) * 120, -18 + r() * 2, -30 - r() * 90], i * 3); } g.setAttribute("position", new THREE.BufferAttribute(a, 3)); return g; }, []);
  return (
    <group>
      <Backdrop mood="night" moon="white" z={-150} y={10} w={400} h={180} moonXY={[0.72, 0.3]} />
      <Inked geo={new THREE.BoxGeometry(14, 2, 8)} mat={toon("#2a2e2a")} pos={[0, -1, 2]} outline={0.005} />
      <Grass x0={-6} x1={6} z0={-1.8} z1={5} n={300} color="#3a4a32" />
      <Rock pos={[-2.5, 0.1, -1.2]} s={1.2} color="#4a4a52" /><Rock pos={[3, 0.1, -0.8]} s={0.8} color="#4a4a52" />
      <points geometry={lights}><pointsMaterial color="#ffc070" size={0.45} sizeAttenuation transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></points>
      <mesh position={[0, -19, -80]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[300, 200]} /><meshBasicMaterial color="#0a0c14" /></mesh>
      <MistPlane pos={[0, -12, -60]} w={300} h={12} color="#3a3a5a" a={0.4} f={f} />
      <Motes f={f} n={40} box={[[-5, 0.2, -2], [5, 2, 4]]} color="#d8ffb0" size={0.05} rise={0.1} seed={31} />
    </group>
  );
};

// ======================= RUINED HALL in the storm =======================
export const RuinedHall: React.FC<{ f: number; flash?: number }> = ({ f, flash = 0 }) => {
  const floorT = useMemo(() => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#4a4a52"; g.fillRect(0, 0, w, h); const r = rng(7); for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < w; x += 64) { const v = 64 + r() * 30; g.fillStyle = `rgb(${v},${v},${v + 8})`; g.fillRect(x + 2, y + 2, 60, 60); } g.strokeStyle = "#20202a"; g.lineWidth = 3; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.stroke(); } }, [4, 4]), []);
  const relief = useMemo(() => canvasTex(512, 384, (g, w, h) => { g.fillStyle = "#5a5a64"; g.fillRect(0, 0, w, h); g.strokeStyle = "#3a3a44"; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h / 2, 120, 0, 6.283); g.stroke(); g.lineWidth = 5; g.beginPath(); g.arc(w / 2, h / 2, 80, 0, 6.283); g.stroke(); g.strokeStyle = "#24242c"; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.62, 0); g.lineTo(w * 0.52, h * 0.45); g.lineTo(w * 0.6, h); g.stroke(); }), []);
  const cols: [number, number, number, number][] = [[-2.4, -1.5, 5.5, 0], [2.4, -1.5, 2.4, 0.3], [-2.4, 2.5, 3.2, -0.2], [2.4, 2.5, 5.5, 0], [-2.4, -5.5, 5.5, 0], [2.4, -5.5, 1.5, 0.5]];
  return (
    <group>
      <Backdrop mood="night" z={-80} y={20} cliffs moon={null} />
      <mesh position={[0, 20, -79]}><planeGeometry args={[300, 140]} /><meshBasicMaterial color="#c8d8ff" transparent opacity={0.6 * flash} fog={false} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 30]} /><meshToonMaterial map={floorT} gradientMap={gradientMap} /></mesh>
      {cols.map(([x, z, h, tilt], i) => <group key={i}><Inked geo={new THREE.CylinderGeometry(0.4, 0.45, h, 10)} mat={toon("#6a6a72")} pos={[x, h / 2, z]} rot={[0, 0, tilt * 0.1]} /><Inked geo={new THREE.BoxGeometry(1.1, 0.3, 1.1)} mat={toon("#5a5a62")} pos={[x, 0.15, z]} />{h > 5 && <Inked geo={new THREE.BoxGeometry(1.0, 0.3, 1.0)} mat={toon("#5a5a62")} pos={[x, h, z]} />}</group>)}
      {/* broken roof beams (one fallen diagonally) */}
      <Inked geo={new THREE.BoxGeometry(5.6, 0.4, 0.5)} mat={toon("#3a2e28")} pos={[0, 5.6, -1.5]} />
      <Inked geo={new THREE.BoxGeometry(5.2, 0.35, 0.45)} mat={toon("#3a2e28")} pos={[0.6, 2.2, 2.4]} rot={[0, 0.3, -0.75]} />
      <Inked geo={new THREE.BoxGeometry(0.4, 0.4, 7)} mat={toon("#3a2e28")} pos={[-2.4, 5.6, -2]} />
      {/* back wall with a cracked circular relief (original motif) and a broken gap */}
      <mesh position={[0, 2.5, -7.2]}><planeGeometry args={[8, 5]} /><meshToonMaterial map={relief} gradientMap={gradientMap} /></mesh>
      <Inked geo={new THREE.BoxGeometry(3.5, 5, 0.5)} mat={toon("#54545e")} pos={[-4.6, 2.5, -7.4]} /><Inked geo={new THREE.BoxGeometry(3, 3, 0.5)} mat={toon("#54545e")} pos={[4.4, 1.5, -7.4]} />
      {/* steps to a dais */}
      {[0, 1, 2].map((k) => <Inked key={k} geo={new THREE.BoxGeometry(4.5 - k * 0.6, 0.18, 1.0)} mat={toon("#62626c")} pos={[0, 0.09 + k * 0.18, -4.8 - k * 0.5]} />)}
      {[[-1.2, 0.6, 0.5], [1.4, 1.6, 0.8], [0.4, -3.4, 0.4], [-1.8, 3.6, 0.7], [1.7, -2.6, 0.5], [-0.6, 1.8, 0.3]].map(([x, z, k], i) => <Rock key={i} pos={[x, 0.1, z]} s={k} color="#5a5a64" />)}
      <Rain3D f={f} center={[0, 0, 0]} n={1600} r={9} />
      {[[-0.6, 0.8], [1.2, -0.6], [-1.4, 3]].map(([x, z], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]}><circleGeometry args={[0.8 + i * 0.3, 24]} /><meshBasicMaterial color="#7a8aa8" transparent opacity={0.4 + flash * 0.3} /></mesh>)}
      <MistPlane pos={[0, 1, -10]} w={40} h={5} color="#5a6a8a" a={0.35} f={f} />
      <Motes f={f} n={50} box={[[-3, 0.2, -6], [3, 4, 4]]} color="#a8b8d8" size={0.02} rise={-1} seed={44} />
    </group>
  );
};

// ======================= NOTICE BOARD at the gate (rain) =======================
export function wantedPoster() {
  return canvasTex(400, 560, (g, w, h) => {
    g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#5a4630"; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = "#2a1e16"; g.font = "bold 70px Georgia, serif"; g.textAlign = "center"; g.fillText("TRAITOR", w / 2, 100);
    // sketch portrait (original): long hair, headband, under-eye lines
    g.strokeStyle = "#2a1e16"; g.lineWidth = 5; g.beginPath(); g.ellipse(w / 2, 280, 80, 100, 0, 0, 6.283); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 85, 250); g.quadraticCurveTo(w / 2, 150, w / 2 + 85, 250); g.stroke();
    g.fillStyle = "#2a1e16"; g.fillRect(w / 2 - 85, 215, 170, 18); g.strokeRect(w / 2 - 30, 210, 60, 26); g.beginPath(); g.moveTo(w / 2 - 28, 223); g.lineTo(w / 2 + 28, 223); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 35, 280, 16, 7, 0, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(w / 2 + s * 28, 296); g.lineTo(w / 2 + s * 24, 322); g.stroke(); }
    g.beginPath(); g.moveTo(w / 2 - 20, 345); g.lineTo(w / 2 + 20, 345); g.stroke();
    g.font = "26px Georgia, serif"; g.fillText("Wanted for the murder", w / 2, 430); g.fillText("of his clan", w / 2, 462);
  });
}
export const NoticeBoard: React.FC<{ f: number }> = ({ f }) => {
  const poster = useMemo(wantedPoster, []);
  return (
    <group>
      <Backdrop mood="night" z={-60} y={18} />
      <Street len={30} width={8} mood="night" z0={10} />
      <group position={[0, 0, -2]}>
        {[-1.3, 1.3].map((x) => <Inked key={x} geo={new THREE.BoxGeometry(0.2, 2.6, 0.2)} mat={toon("#3a2a1e")} pos={[x, 1.3, 0]} />)}
        <Inked geo={new THREE.BoxGeometry(2.8, 1.6, 0.1)} mat={toon("#5a4430")} pos={[0, 1.6, 0]} />
        <Inked geo={new THREE.BoxGeometry(3.2, 0.12, 0.7)} mat={toon("#2a2e38")} pos={[0, 2.65, 0]} rot={[0.15, 0, 0]} />
        <mesh position={[-0.2, 1.6, 0.07]} rotation={[0, 0, -0.03]}><planeGeometry args={[0.8, 1.12]} /><meshToonMaterial map={poster} gradientMap={gradientMap} /></mesh>
        {[[0.75, 1.9, 0.6, 0.5], [0.8, 1.25, 0.45, 0.6]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0.06]} rotation={[Math.sin(f * 0.2 + i) * 0.25, 0, 0.1]}><planeGeometry args={[w, h]} /><meshToonMaterial color="#d8ccb0" gradientMap={gradientMap} /></mesh>)}
      </group>
      <House x={-7} z={-4} w={6} d={5} h={3.2} face={0} seed={801} mood="night" /><House x={7} z={-4} w={6} d={5} h={3.4} face={0} seed={802} mood="night" />
      <Rain3D f={f} center={[0, 0, 1]} n={1000} r={8} />
      <pointLight position={[0, 2.4, 1.2]} intensity={1.8} distance={5} decay={1.5} color="#a8b8e0" />
    </group>
  );
};
