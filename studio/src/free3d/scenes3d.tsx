// BETWEEN THE LIES · Episode 1 (Mr. Freeze) · FREE 3D scenes. Ten sets reused across 20 shots; each shot = set + cast +
// lights + a slow 3D camera dolly (the episode editor adds the word-synced reframes on top). Rendered at 10 fps.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { Stage } from "./Stage";
import { Room, Window, Machine, Chamber, Pipe, Box, Card, VaporField, Dust, mat, floorTiles, wallPanels, wood, plaster, frostTex } from "./kit";
import { VICTOR, NORA, FREEZE, BOYLE, GUARD, GUEST } from "../free/Toon";

type SP = { dur: number };
const clamp = (x: number) => Math.max(0, Math.min(1, x));

// ======================= sets =======================
const LabSet: React.FC<{ dark?: number }> = ({ dark = 0 }) => {
  const floor = useMemo(() => mat.std("#fff", 0.5, 0.15, floorTiles("#4a5560", "#1c232b", [10, 10])), []);
  const wall = useMemo(() => mat.std("#fff", 0.75, 0.2, wallPanels("#3c4856", [6, 2])), []);
  const k = 1 - dark;
  return (
    <group>
      <Room w={14} d={12} h={7} floor={floor} wall={wall} />
      <Window pos={[0, 4.4, -5.98]} w={3.2} h={3.6} color="#6f9fe4" intensity={4 * k + 0.4} bars={2} />
      <directionalLight position={[1.5, 6, -5]} intensity={2.2 * k + 0.2} color="#9cc4ff" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0004} shadow-radius={4} />
      <hemisphereLight args={["#4a6a8a", "#141820", 0.9 * k + 0.1]} />
      <pointLight position={[0, 5.5, 2]} color="#6f8fb8" intensity={60 * k + 6} distance={16} decay={2} />
      <pointLight position={[-3, 3.2, 3]} color="#ffb070" intensity={14 * k} distance={9} decay={2} />
      <Machine pos={[-2.9, 0, -4.6]} rotY={0.25} on={k} />
      <Machine pos={[2.9, 0, -4.6]} rotY={-0.25} on={k} />
      <Machine pos={[-5.2, 0, -1.5]} rotY={Math.PI / 2.3} on={k} />
      <Machine pos={[5.2, 0, -1.5]} rotY={-Math.PI / 2.3} on={k} />
      <Pipe from={[-7, 6.2, -5.7]} to={[7, 6.2, -5.7]} r={0.16} />
      <Pipe from={[-7, 5.8, -5.7]} to={[7, 5.8, -5.7]} r={0.1} />
      <Pipe from={[-1.9, 0, -5.6]} to={[-1.9, 7, -5.6]} r={0.12} />
      <Pipe from={[1.9, 0, -5.6]} to={[1.9, 7, -5.6]} r={0.12} />
      <Dust n={220} box={[-6, 0, -5, 6, 6, 4]} fall={0.004} size={0.03} opacity={0.45} />
    </group>
  );
};

const IceCave: React.FC = () => {
  const floor = useMemo(() => mat.std("#fff", 0.25, 0.1, floorTiles("#7fa6c4", "#5b86a8", [4, 4])), []);
  const iceMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9fd6f2", roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: "#1f5a80", emissiveIntensity: 0.4 }), []);
  const spikes = useMemo(() => Array.from({ length: 34 }, (_, i) => {
    const r = (k: number) => { const v = Math.sin(i * 41.3 + k * 17.7) * 9999.1; return v - Math.floor(v); };
    const side = i % 2 ? 1 : -1, top = i % 3 === 0;
    return { x: top ? (r(1) - 0.5) * 12 : side * (3 + r(2) * 3), z: -6 + r(3) * 8, h: 1 + r(4) * 3, top };
  }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floor}><planeGeometry args={[30, 30]} /></mesh>
      {spikes.map((s, i) => (
        <mesh key={i} position={[s.x, s.top ? 6.5 - s.h / 2 : s.h / 2, s.z]} rotation={[s.top ? Math.PI : 0, 0, 0]} material={iceMat} castShadow>
          <coneGeometry args={[0.35 + s.h * 0.12, s.h, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 3, -7]} material={iceMat}><sphereGeometry args={[7, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <hemisphereLight args={["#5aa8e0", "#0a1424", 0.7]} />
      <pointLight position={[0, 5, 2]} color="#7fd6ff" intensity={40} distance={14} decay={2} castShadow />
      <Dust n={300} box={[-5, 0, -6, 5, 6, 3]} fall={0.02} size={0.04} opacity={0.8} />
    </group>
  );
};

/** snow globe with a tiny twirling dancer and snow inside */
const SnowGlobe: React.FC<{ pos: [number, number, number]; r?: number }> = ({ pos, r = 0.32 }) => {
  const f = useCurrentFrame();
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#dff4ff", transparent: true, opacity: 0.22, roughness: 0.02, metalness: 0.6, depthWrite: false }), []);
  const dancer = useMemo(() => new THREE.MeshStandardMaterial({ color: "#cfe4f6", roughness: 0.4, emissive: "#6fa8d8", emissiveIntensity: 0.3 }), []);
  return (
    <group position={pos}>
      <mesh position={[0, r * 0.25, 0]} castShadow material={mat.std("#8a6a4a", 0.4, 0.6)}><cylinderGeometry args={[r * 0.75, r * 0.85, r * 0.5, 32]} /></mesh>
      <group position={[0, r * 0.5, 0]} rotation={[0, f * 0.25, 0]}>
        <mesh position={[0, r * 0.35, 0]} material={dancer}><coneGeometry args={[r * 0.28, r * 0.6, 24]} /></mesh>
        <mesh position={[0, r * 0.75, 0]} material={mat.std("#f3d6be", 0.6)}><sphereGeometry args={[r * 0.1, 16, 12]} /></mesh>
        <mesh position={[0, r * 0.8, -r * 0.03]} material={mat.std("#3a2418", 0.8)}><sphereGeometry args={[r * 0.105, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} /></mesh>
      </group>
      <mesh position={[0, r * 1.15, 0]} material={glass}><sphereGeometry args={[r, 48, 32]} /></mesh>
      <Dust n={70} box={[-r * 0.7, r * 0.55, -r * 0.7, r * 0.7, r * 1.8, r * 0.7]} fall={0.006} size={0.02} color="#ffffff" opacity={0.95} />
      <pointLight position={[0, r * 1.2, r * 0.8]} color="#bfe8ff" intensity={2.5} distance={2} decay={2} />
    </group>
  );
};

const Bedroom: React.FC = () => {
  const floor = useMemo(() => mat.std("#fff", 0.6, 0, wood("#6b4a32", [4, 4])), []);
  const wall = useMemo(() => mat.std("#fff", 0.9, 0, plaster("#8a6a52", "rgba(255,220,170,0.08)", [4, 2])), []);
  return (
    <group>
      <Room w={10} d={9} h={5} floor={floor} wall={wall} />
      <Box pos={[0.2, 0.35, -1.8]} size={[2.4, 0.7, 3.6]} color="#5a3a24" map={wood("#5a3a24")} />
      <Box pos={[0.2, 0.8, -1.8]} size={[2.3, 0.3, 3.5]} color="#efe6d6" rough={0.95} />
      <Box pos={[0.2, 1.05, -3.3]} size={[1.6, 0.25, 0.6]} color="#fbf6ea" rough={0.95} />
      <Box pos={[0.2, 1.3, -3.65]} size={[2.6, 1.6, 0.15]} color="#4a2e1c" map={wood("#4a2e1c")} />
      <Box pos={[-2.1, 0.45, -3.2]} size={[0.8, 0.9, 0.7]} color="#5a3a24" map={wood("#5a3a24")} />
      <mesh position={[-2.1, 1.35, -3.2]} material={mat.glow("#ffc27a", 2.2)}><cylinderGeometry args={[0.18, 0.3, 0.35, 24, 1, true]} /></mesh>
      <pointLight position={[-2.1, 1.4, -2.9]} color="#ffb366" intensity={30} distance={8} decay={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} />
      <hemisphereLight args={["#5a4030", "#140c08", 0.35]} />
      <Window pos={[3.5, 2.6, -4.48]} w={1.6} h={2} color="#2a4a7a" intensity={1.5} bars={1} />
      <Dust n={160} box={[-4, 0.5, -4, 4, 4, 2]} fall={0.002} size={0.025} color="#ffdcae" opacity={0.6} />
    </group>
  );
};

const Study: React.FC = () => {
  const f = useCurrentFrame();
  const floor = useMemo(() => mat.std("#fff", 0.6, 0, wood("#4a3424", [4, 4])), []);
  const wall = useMemo(() => mat.std("#fff", 0.9, 0, plaster("#3a4252", null, [4, 2])), []);
  return (
    <group>
      <Room w={10} d={9} h={5} floor={floor} wall={wall} />
      <Window pos={[0, 2.8, -4.48]} w={3.4} h={2.6} color="#3a6aa8" intensity={1.8 + 0.6 * (f % 37 < 2 ? 1 : 0)} bars={3} />
      <Box pos={[0, 0.85, -1.2]} size={[3.2, 0.12, 1.4]} color="#5a3a24" map={wood("#5a3a24")} />
      {[-1.4, 1.4].map((x, i) => <Box key={i} pos={[x, 0.4, -1.2]} size={[0.12, 0.8, 1.3]} color="#4a2e1c" />)}
      {[[-0.8, -1.1, 0.3], [0, -1.25, -0.1], [0.8, -1.05, 0.2]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.92, z]} rotation={[-Math.PI / 2, 0, r]} material={mat.glow("#9fc8e8", 0.6)}><planeGeometry args={[0.6, 0.45]} /></mesh>
      ))}
      <mesh position={[-1.2, 1.35, -1.5]} material={mat.glow("#ffc27a", 2.5)}><coneGeometry args={[0.25, 0.3, 24, 1, true]} /></mesh>
      <pointLight position={[-1.2, 1.25, -1.3]} color="#ffb366" intensity={9} distance={7} decay={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} />
      <directionalLight position={[0, 4, -8]} color="#6f9fe4" intensity={0.8} />
      <hemisphereLight args={["#2a3a5a", "#0c0a08", 0.3]} />
    </group>
  );
};

/** night city skyline as a canvas texture */
const skylineTex = () => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, 512); grd.addColorStop(0, "#0a0e1c"); grd.addColorStop(1, "#2a1a24");
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let x = 0; x < 1024; x += 30 + r() * 40) {
    const w = 40 + r() * 60, h = 120 + r() * 320;
    g.fillStyle = "#0b0f1c"; g.fillRect(x, 512 - h, w, h);
    for (let y = 512 - h + 10; y < 500; y += 16) for (let wx = x + 6; wx < x + w - 6; wx += 12) if (r() < 0.35) { g.fillStyle = r() < 0.8 ? "#ffd27a" : "#9fd0ff"; g.fillRect(wx, y, 6, 8); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

const Office: React.FC = () => {
  const floor = useMemo(() => mat.std("#fff", 0.35, 0.1, wood("#3a1e14", [5, 5])), []);
  const wall = useMemo(() => mat.std("#fff", 0.8, 0, plaster("#3a1416", "rgba(255,200,120,0.06)", [4, 2])), []);
  const sky = useMemo(() => new THREE.MeshBasicMaterial({ map: skylineTex() }), []);
  return (
    <group>
      <Room w={12} d={10} h={6} floor={floor} wall={wall} />
      <mesh position={[0, 3, -4.95]} material={sky}><planeGeometry args={[9, 5]} /></mesh>
      {[-3, -1, 1, 3].map((x, i) => <Box key={i} pos={[x, 3, -4.9]} size={[0.12, 5, 0.12]} color="#111" metal={0.6} rough={0.3} />)}
      <Box pos={[0, 0.9, -1.4]} size={[3.6, 0.15, 1.6]} color="#3a1e14" map={wood("#4a2414")} rough={0.25} />
      <Box pos={[0, 0.45, -1.4]} size={[3.4, 0.9, 1.4]} color="#2a140c" map={wood("#3a1a0c")} />
      <mesh position={[1.2, 1.4, -1.6]} material={mat.glow("#ffcf7a", 2.2)}><cylinderGeometry args={[0.2, 0.32, 0.3, 24, 1, true]} /></mesh>
      <pointLight position={[1.2, 1.5, -1.2]} color="#ffbf6a" intensity={26} distance={8} decay={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} />
      <mesh position={[-0.6, 0.99, -1.1]} rotation={[-Math.PI / 2, 0, 0.1]} material={mat.std("#f3ead6", 0.9)}><planeGeometry args={[0.6, 0.8]} /></mesh>
      <mesh position={[0.6, 1.08, -1.0]} material={mat.std("#c98a3a", 0.1, 0.2)}><cylinderGeometry args={[0.07, 0.06, 0.16, 16]} /></mesh>
      <hemisphereLight args={["#5a2a20", "#100606", 0.4]} />
      <pointLight position={[0, 4, 1]} color="#ff9a5a" intensity={12} distance={10} decay={2} />
    </group>
  );
};

const Corridor: React.FC = () => {
  const f = useCurrentFrame();
  const floor = useMemo(() => mat.std("#fff", 0.2, 0.2, floorTiles("#6f8ea8", "#3a5068", [3, 12])), []);
  const wall = useMemo(() => mat.std("#fff", 0.6, 0.3, wallPanels("#4a5a6a", [8, 2])), []);
  const ice = useMemo(() => new THREE.MeshStandardMaterial({ color: "#bfe8ff", roughness: 0.1, transparent: true, opacity: 0.55, emissive: "#3a8ac0", emissiveIntensity: 0.3 }), []);
  return (
    <group>
      <group position={[0, 0, -6]}><Room w={5} d={26} h={5} floor={floor} wall={wall} /></group>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[(i % 2 ? 2.3 : -2.3), 1 + (i % 3) * 1.1, -i * 1.8]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.4]} material={ice} castShadow>
          <coneGeometry args={[0.35, 2.2, 6]} />
        </mesh>
      ))}
      {[0, -6, -12].map((z, i) => <pointLight key={i} position={[0, 4.6, z]} color={f % 10 < 5 ? "#ff3030" : "#5a1010"} intensity={30} distance={8} decay={2} />)}
      <hemisphereLight args={["#6aa8d8", "#0a1018", 0.6]} />
      <pointLight position={[0, 3, 3]} color="#9fe0ff" intensity={30} distance={12} decay={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <VaporField area={[-2, -14, 2, 3]} y={0.2} opacity={0.18} size={2.5} speed={0.02} />
    </group>
  );
};

const Chandelier: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={mat.std("#c9a24a", 0.25, 0.9)}><torusGeometry args={[0.8, 0.05, 8, 32]} /></mesh>
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return <mesh key={i} position={[Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8]} material={mat.glow("#fff0c8", 4)}><sphereGeometry args={[0.07, 12, 8]} /></mesh>;
    })}
    <mesh position={[0, 1.2, 0]} material={mat.std("#c9a24a", 0.25, 0.9)}><cylinderGeometry args={[0.02, 0.02, 2.4, 6]} /></mesh>
    <pointLight position={[0, -0.2, 0]} color="#ffd59a" intensity={30} distance={10} decay={2} />
  </group>
);

const Ballroom: React.FC<{ cold?: number }> = ({ cold = 0 }) => {
  const floor = useMemo(() => mat.std("#fff", 0.15, 0.3, floorTiles("#d9c49a", "#5a4020", [8, 8])), []);
  const wall = useMemo(() => mat.std("#fff", 0.8, 0.1, plaster("#5a3220", "rgba(255,210,120,0.12)", [6, 3])), []);
  return (
    <group>
      <Room w={18} d={16} h={8} floor={floor} wall={wall} />
      <Chandelier pos={[-4, 6, -3]} /><Chandelier pos={[4, 6, -3]} /><Chandelier pos={[0, 6.4, 1]} />
      <Box pos={[0, 0.5, -6]} size={[8, 1, 3]} color="#4a2a18" map={wood("#4a2a18")} />
      <Box pos={[0, 4, -7.9]} size={[6, 6, 0.1]} color="#7a1418" rough={0.9} />
      {[-6, -2, 2, 6].map((x, i) => <Box key={i} pos={[x, 4, -7.6]} size={[0.6, 8, 0.6]} color="#d8c08a" rough={0.4} metal={0.3} />)}
      {[[-4, 1], [3.5, 2], [-1.5, 3.5]].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 0.75, z]} castShadow receiveShadow material={mat.std("#f3ead6", 0.9)}><cylinderGeometry args={[0.8, 0.8, 0.05, 32]} /></mesh>
          <mesh position={[x, 0.37, z]} material={mat.std("#2a1a10", 0.6)}><cylinderGeometry args={[0.06, 0.2, 0.75, 12]} /></mesh>
          <mesh position={[x, 0.9, z]} material={mat.glow("#ffd59a", 3)}><cylinderGeometry args={[0.03, 0.03, 0.2, 8]} /></mesh>
        </group>
      ))}
      <hemisphereLight args={["#ffd8a0", "#2a1408", 0.6 * (1 - cold) + 0.1]} />
      <pointLight position={[0, 3, 6]} color="#7fd6ff" intensity={60 * cold} distance={16} decay={2} />
      <spotLight position={[0, 7.5, -3]} angle={0.5} penumbra={0.7} color="#fff1d8" intensity={80} distance={16} decay={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.001} />
    </group>
  );
};

const TvRoom: React.FC = () => {
  const f = useCurrentFrame();
  const floor = useMemo(() => mat.std("#fff", 0.7, 0.1, floorTiles("#2a2e36", "#14161a", [6, 6])), []);
  const wall = useMemo(() => mat.std("#fff", 0.9, 0, plaster("#1c2028", null, [4, 2])), []);
  const screen = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 192;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return { c, t, m: new THREE.MeshBasicMaterial({ map: t }) };
  }, []);
  // grainy security footage (deterministic grain): a suit figure kicks a lab-coat figure into a table, loops every 24 frames
  const g = screen.c.getContext("2d")!;
  const u = (f % 24) / 24;
  g.fillStyle = "#9a9a9a"; g.fillRect(0, 0, 256, 192);
  for (let i = 0; i < 900; i++) {
    const h = Math.sin(i * 12.9898 + f * 78.233) * 43758.5453, v = h - Math.floor(h);
    g.fillStyle = v < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"; g.fillRect((v * 9973) % 256, (v * 7919) % 192, 2, 2);
  }
  g.fillStyle = "#555"; g.fillRect(30, 130, 90, 10);
  g.fillStyle = "#111"; g.beginPath(); g.arc(170, 60, 12, 0, 7); g.fill(); g.fillRect(162, 72, 16, 50);
  g.strokeStyle = "#111"; g.lineWidth = 7; g.beginPath(); g.moveTo(170, 120); g.lineTo(170 - 50 * Math.min(1, u * 3), 115 - 20 * Math.min(1, u * 3)); g.stroke();
  const vx = 110 - 50 * Math.min(1, Math.max(0, u * 3 - 0.3)), vy = 70 + 40 * Math.min(1, Math.max(0, u * 3 - 0.3));
  g.fillStyle = "#eee"; g.beginPath(); g.arc(vx, vy, 11, 0, 7); g.fill(); g.fillRect(vx - 7, vy + 10, 14, 40);
  g.fillStyle = "rgba(0,0,0,0.25)"; for (let y = 0; y < 192; y += 4) g.fillRect(0, y, 256, 1);
  screen.t.needsUpdate = true;
  return (
    <group>
      <Room w={12} d={10} h={6} floor={floor} wall={wall} />
      {Array.from({ length: 12 }, (_, i) => {
        const x = -3.3 + (i % 4) * 2.2, y = 1.1 + Math.floor(i / 4) * 1.6;
        return (
          <group key={i} position={[x, y, -4.6]} rotation={[0, (1.5 - (i % 4)) * 0.06, 0]}>
            <mesh castShadow material={mat.std("#2a2a2a", 0.5, 0.4)}><boxGeometry args={[2, 1.45, 0.9]} /></mesh>
            <mesh position={[0, 0, 0.46]} material={screen.m}><planeGeometry args={[1.7, 1.2]} /></mesh>
          </group>
        );
      })}
      <pointLight position={[0, 3, -2.5]} color="#c8d8ff" intensity={40} distance={10} decay={2} />
      {f % 23 < 2 || f % 31 < 2 ? <pointLight position={[2, 2, 3]} color="#ffffff" intensity={200} distance={12} decay={2} /> : null}
      <hemisphereLight args={["#3a4a6a", "#05070a", 0.3]} />
    </group>
  );
};

const Cell: React.FC = () => {
  const floor = useMemo(() => mat.std("#fff", 0.8, 0, floorTiles("#4a5058", "#2a2e34", [4, 4])), []);
  const wall = useMemo(() => mat.std("#fff", 0.85, 0, wallPanels("#5a6068", [3, 2])), []);
  const frost = useMemo(() => new THREE.MeshBasicMaterial({ map: frostTex([4, 3]), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  return (
    <group>
      <Room w={7} d={7} h={5} floor={floor} wall={wall} />
      <Window pos={[1.6, 3.6, -3.48]} w={1.2} h={1.2} color="#7fb6ff" intensity={2.2} bars={3} />
      <Box pos={[0, 0.45, -2.6]} size={[3.4, 0.2, 1]} color="#6a7078" />
      <Box pos={[0, 0.2, -2.6]} size={[3.2, 0.4, 0.9]} color="#3a4048" />
      <mesh position={[0, 2.5, -3.47]} material={frost}><planeGeometry args={[7, 5]} /></mesh>
      <spotLight position={[0, 4.9, -1.5]} angle={0.55} penumbra={0.8} color="#bfe0ff" intensity={60} distance={8} decay={2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.001} />
      <mesh position={[0, 4.95, -1.5]} material={mat.glow("#dff0ff", 3)}><cylinderGeometry args={[0.25, 0.4, 0.15, 24]} /></mesh>
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => <Box key={i} pos={[x, 2.5, 2.4]} size={[0.08, 5, 0.08]} color="#1a1c20" metal={0.8} rough={0.3} />)}
      <hemisphereLight args={["#2a3a5a", "#05070a", 0.25]} />
    </group>
  );
};

const Exterior: React.FC = () => {
  const stone = useMemo(() => mat.std("#fff", 0.9, 0, wallPanels("#2a303c", [2, 6])), []);
  const sky = useMemo(() => new THREE.MeshBasicMaterial({ map: skylineTex(), color: "#8090c0" }), []);
  return (
    <group>
      <mesh position={[0, 6, -30]} material={sky}><planeGeometry args={[70, 30]} /></mesh>
      <mesh position={[14, 20, -29]} material={mat.glow("#e8f0ff", 2.5)}><sphereGeometry args={[2, 32, 16]} /></mesh>
      <mesh position={[0, 7, -4]} castShadow material={stone}><boxGeometry args={[4, 14, 4]} /></mesh>
      <mesh position={[0, 16, -4]} rotation={[0, Math.PI / 4, 0]} castShadow material={mat.std("#1a1e28", 0.8)}><coneGeometry args={[3.3, 4, 4]} /></mesh>
      <mesh position={[0.4, 8, -1.98]} material={mat.glow("#4fd4ff", 3)}><planeGeometry args={[1, 1.4]} /></mesh>
      {[0, 1, 2].map((i) => <Box key={i} pos={[0.1 + i * 0.3, 8, -1.95]} size={[0.06, 1.4, 0.06]} color="#05070c" />)}
      <pointLight position={[0.4, 8, -1.2]} color="#4fd4ff" intensity={20} distance={6} decay={2} />
      <directionalLight position={[14, 20, 10]} color="#9fb4ff" intensity={2.2} castShadow />
      <hemisphereLight args={["#4a5a8a", "#0a0c14", 0.8]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat.std("#dfe8f4", 0.9)}><planeGeometry args={[80, 80]} /></mesh>
      <Dust n={600} box={[-8, 0, -12, 8, 16, 6]} fall={0.05} size={0.08} opacity={0.9} />
    </group>
  );
};

/** ground frost decal growing (u 0..1) */
const FrostDecal: React.FC<{ pos: [number, number, number]; size: number; u: number }> = ({ pos, size, u }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: frostTex([3, 3]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: "#cfefff" }), []);
  m.opacity = 0.85 * u;
  return <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} scale={[u + 0.01, u + 0.01, 1]} material={m}><planeGeometry args={[size, size]} /></mesh>;
};

/** flying glass shards (t frames since impact) */
const ShardBurst: React.FC<{ pos: [number, number, number]; t: number }> = ({ pos, t }) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: "#bfefff", emissive: "#4fc8ff", emissiveIntensity: 1.5, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.9 }), []);
  if (t < 0) return null;
  return (
    <group position={pos}>
      {Array.from({ length: 40 }, (_, i) => {
        const r = (k: number) => { const v = Math.sin(i * 12.9 + k * 7.7) * 4375.5; return v - Math.floor(v); };
        const a = r(1) * Math.PI * 2, e = r(2) * 1.2, v = 0.12 + 0.2 * r(3);
        const x = Math.cos(a) * Math.cos(e) * v * t, y = Math.sin(e) * v * t - 0.012 * t * t, z = Math.sin(a) * Math.cos(e) * v * t;
        return <mesh key={i} position={[x, Math.max(-pos[1] + 0.02, y), z]} rotation={[t * 0.3 + i, t * 0.2, i]} material={m}><tetrahedronGeometry args={[0.04 + 0.05 * r(4)]} /></mesh>;
      })}
    </group>
  );
};

// ======================= shots =======================
const NIGHT = { color: "#0a1622", density: 0.032 };

export const L01: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Stage dur={dur} cam={{ from: [1.2, 2.0, 8.2], to: [0.7, 1.9, 6.9], look: [0.2, 1.7, -0.6], fov: 50 }} fog={NIGHT} focus={6.8} bokeh={3}>
      <LabSet />
      <Chamber pos={[0.6, 0, -0.4]} h={3.1} r={0.8} frost={0.15 + 0.3 * clamp(f / dur)}>
        <Card opts={{ outfit: NORA, expr: "smile_closed", seed: 7, autoBlink: false }} blink={1} pos={[0, 0.3, 0]} h={2.6} emissive={0.05} />
      </Chamber>
      <Card opts={{ outfit: VICTOR, expr: "longing", facing: 1, seed: 3, overlay: "glasses", wave: 0.6 }} pos={[-0.9, 0, 0.7]} h={3.1} rotY={0.25} />
      <VaporField area={[-5, -3, 5, 3]} y={0.2} opacity={0.1} size={3} />
    </Stage>
  );
};

export const L02: React.FC<SP> = ({ dur }) => (
  <Stage dur={dur} cam={{ from: [0, 1.7, 6.0], to: [0, 1.55, 4.6], look: [0, 1.4, -0.2], fov: 46 }} fog={{ color: "#081426", density: 0.04 }} focus={4.8} bokeh={4} bloom={1.3}>
    <IceCave />
    <Card opts={{ outfit: FREEZE, expr: "longing", mode: "sit", seed: 11, overlay: "dome" }} pos={[0, 0, -0.4]} h={3.4} />
    <SnowGlobe pos={[0, 0.95, 0.35]} r={0.3} />
  </Stage>
);

export const L03: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const closing = f > dur * 0.6;
  return (
    <Stage dur={dur} cam={{ from: [0.6, 2.0, 3.6], to: [0.5, 1.9, 2.8], look: [0.4, 1.2, -1.6], fov: 50 }} fog={{ color: "#140c08", density: 0.04 }} focus={3.8} bokeh={3.5} bloom={1}>
      <Bedroom />
      <Card opts={{ outfit: NORA, expr: closing ? "smile_closed" : "pained", seed: 7, autoBlink: !closing }} blink={closing ? 1 : undefined} pos={[1.25, 1.0, -1.6]} h={2.2} rotZ={Math.PI / 2} emissive={0.12} />
      <Card opts={{ outfit: VICTOR, expr: "grief", mode: "sit", facing: -1, seed: 3, overlay: "glasses" }} pos={[1.9, 0, -0.6]} h={2.8} rotY={-0.6} />
    </Stage>
  );
};

export const L04: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const lift = f > dur * 0.5;
  return (
    <Stage dur={dur} cam={{ from: [0.4, 1.8, 3.6], to: [0.2, 1.6, 2.6], look: [0, 1.2, -1.4], fov: 46 }} fog={{ color: "#0a0e18", density: 0.04 }} focus={3.2} bokeh={3.5}>
      <Study />
      <Card opts={{ outfit: VICTOR, expr: lift ? "restrained_anger" : "hollow", mode: "sit", seed: 3, overlay: "glasses" }} pos={[0, 0, -2.2]} h={2.9} />
    </Stage>
  );
};

export const L05: React.FC<SP> = ({ dur }) => (
  <Stage dur={dur} cam={{ from: [-2.4, 1.6, 4.2], to: [-1.2, 1.7, 3.6], look: [1.5, 1.8, -3], fov: 50 }} fog={NIGHT} focus={5} bokeh={3}>
    <LabSet />
    <Card opts={{ outfit: VICTOR, expr: "stern", facing: 1, seed: 3, overlay: "glasses", wave: 0.7 }} pos={[1.5, 0, -2.6]} h={3.1} rotY={-0.3} />
    <VaporField area={[-5, -5, 5, 2]} y={0.3} opacity={0.2} size={3.5} speed={0.03} />
  </Stage>
);

export const L06: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Stage dur={dur} cam={{ from: [-0.6, 1.9, 4.0], to: [-0.3, 2.0, 5.0], look: [0.4, 1.9, -0.6], fov: 48 }} fog={NIGHT} focus={4.6} bokeh={4}>
      <LabSet dark={0.25} />
      <Chamber pos={[0.5, 0, -0.6]} h={3.3} r={0.85} frost={0.2 + 0.35 * clamp(f / dur)}>
        <Card opts={{ outfit: NORA, expr: "smile_closed", seed: 7, autoBlink: false }} blink={1} pos={[0, 0.3, 0]} h={2.8} emissive={0.05} />
      </Chamber>
      <Card opts={{ outfit: VICTOR, expr: "longing", facing: 1, seed: 3, overlay: "glasses" }} pos={[-1.1, 0, 0.9]} h={3.1} rotY={0.35} />
    </Stage>
  );
};

export const L07: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Stage dur={dur} cam={{ from: [-1.4, 1.7, 3.4], to: [-0.6, 1.6, 2.6], look: [0, 1.4, -2], fov: 46 }} fog={{ color: "#120808", density: 0.03 }} focus={3.4} bokeh={3}>
      <Office />
      <Card opts={{ outfit: BOYLE, expr: f > dur * 0.55 ? "smile" : "cold", mode: "sit", seed: 21 }} pos={[0, 0, -2.4]} h={3.1} />
    </Stage>
  );
};

export const L08: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const open = clamp(f / 6), walk = clamp(f / dur);
  const cast: [number, typeof GUARD, number][] = [[-1.2, GUARD, 22], [1.2, GUARD, 23], [0, BOYLE, 21]];
  return (
    <Stage dur={dur} cam={{ from: [0, 0.9, 6.6], to: [0, 0.9, 5.4], look: [0, 2.2, -2], fov: 52 }} fog={{ color: "#0c1420", density: 0.03 }} focus={4.5} bokeh={2.5} bloom={1.4}>
      <LabSet />
      <mesh position={[0, 2.5, -5.97]} material={mat.glow("#eaf4ff", 6)}><planeGeometry args={[3, 5]} /></mesh>
      <Box pos={[-0.78 - 1.5 * open, 2.5, -5.85]} size={[1.55, 5, 0.2]} color="#55626f" metal={0.7} rough={0.4} />
      <Box pos={[0.78 + 1.5 * open, 2.5, -5.85]} size={[1.55, 5, 0.2]} color="#55626f" metal={0.7} rough={0.4} />
      <pointLight position={[0, 2.5, -5.2]} intensity={120 * open} distance={14} decay={2} color="#eef6ff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      {cast.map(([x, o, s], i) => (
        <Card key={i} opts={{ outfit: o, expr: "stern", mode: "stroll", phase: (f / 6 + i * 0.3) % 1, seed: s }} pos={[x, 0, -4.4 + 3.2 * walk + (i === 2 ? 0.4 : 0)]} h={i === 2 ? 3.2 : 3.1} />
      ))}
      <VaporField area={[-3, -6, 3, 0]} y={0.25} opacity={0.25} size={3} speed={0.05} />
    </Stage>
  );
};

export const L09: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Stage dur={dur} cam={{ from: [0, 1.8, 6.2], to: [0, 1.85, 5.2], look: [0, 1.8, -0.4], fov: 48 }} fog={NIGHT} focus={4.6} bokeh={3}>
      <LabSet />
      <Chamber pos={[0, 0, -1.6]} h={3.1} r={0.8} frost={0.3}>
        <Card opts={{ outfit: NORA, expr: "smile_closed", seed: 7, autoBlink: false }} blink={1} pos={[0, 0.3, 0]} h={2.6} emissive={0.05} />
      </Chamber>
      <Card opts={{ outfit: VICTOR, expr: "pleading", seed: 3, overlay: "glasses", wave: 1, tilt: Math.sin(f * 0.9) * 0.04 }} pos={[0, 0, 0.2]} h={3} />
      <Card opts={{ outfit: GUARD, expr: "stern", facing: 1, seed: 22 }} pos={[-1.8, 0, 1.6]} h={3.2} rotY={0.4} />
      <Card opts={{ outfit: GUARD, expr: "stern", facing: -1, seed: 23 }} pos={[1.8, 0, 1.6]} h={3.2} rotY={-0.4} />
    </Stage>
  );
};

export const L10: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const on = Math.floor(f / 4) % 2 === 0;
  return (
    <Stage dur={dur} cam={{ from: [3.2, 5.5, -1.9], to: [3.6, 5.7, -2.5], look: [4.8, 5.9, -4.0], lookTo: [4.8, 6.0, -4.1], fov: 44 }} fog={NIGHT} focus={3.2} bokeh={5} bloom={1.6}>
      <LabSet dark={0.4} />
      <pointLight position={[3.6, 6.4, -2.6]} color="#9cc4ff" intensity={6} distance={5} decay={2} />
      <group position={[4.8, 6.1, -4.4]} rotation={[0.35, -0.7, 0]}>
        <Box pos={[0, 0.35, 0]} size={[0.12, 0.7, 0.12]} color="#2a2f36" />
        <Box pos={[0, 0, 0.35]} size={[0.55, 0.42, 1.0]} color="#d9dde2" rough={0.5} metal={0.2} />
        <mesh position={[0, 0, 0.88]} rotation={[Math.PI / 2, 0, 0]} material={mat.std("#111", 0.2, 0.6)}><cylinderGeometry args={[0.15, 0.17, 0.12, 24]} /></mesh>
        <mesh position={[0.2, 0.15, 0.86]} material={mat.glow(on ? "#ff2020" : "#300404", 8)}><sphereGeometry args={[0.04, 12, 8]} /></mesh>
        {on ? <pointLight position={[0.2, 0.15, 1.1]} color="#ff2020" intensity={3} distance={2.5} decay={2} /> : null}
      </group>
      <Card opts={{ outfit: VICTOR, expr: "pleading", seed: 3, overlay: "glasses", wave: 1 }} pos={[0.6, 0, -1]} h={3} />
      <Card opts={{ outfit: BOYLE, expr: "cold", seed: 21 }} pos={[2.0, 0, -0.6]} h={3.2} rotY={-0.4} />
    </Stage>
  );
};

export const L11: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const hit = 4, fall = clamp((f - hit) / 6);
  return (
    <Stage dur={dur} cam={{ from: [0.4, 1.6, 5.4], to: [0.1, 1.5, 4.8], look: [-0.3, 1.4, -0.4], fov: 50 }} fog={NIGHT} focus={4.8} bokeh={2.5} bloom={1.5}>
      <LabSet />
      <Box pos={[-1.6, 0.9, -0.6]} size={[2, 0.12, 1]} color="#5b6b7b" metal={0.6} rough={0.4} />
      {[-1, 1].map((s, i) => <Box key={i} pos={[-1.6 + s * 0.9, 0.45, -0.6]} size={[0.1, 0.9, 0.9]} color="#3a4654" />)}
      {f < hit + 1 && [0, 1, 2, 3].map((i) => <mesh key={i} position={[-2.3 + i * 0.45, 1.15, -0.6]} material={mat.glow("#5fe0ff", 1.5)}><cylinderGeometry args={[0.1, 0.12, 0.4, 16]} /></mesh>)}
      <ShardBurst pos={[-1.6, 1.1, -0.6]} t={f - hit} />
      {f >= hit ? <pointLight position={[-1.6, 1.3, -0.2]} color="#bfefff" intensity={60 * Math.max(0, 1 - (f - hit) / 10)} distance={6} decay={2} /> : null}
      <Card opts={{ outfit: BOYLE, expr: "restrained_anger", facing: -1, seed: 21, tilt: -0.12 * clamp(f / hit) }} pos={[0.9, 0, 0]} h={3.2} rotY={-0.3} />
      <Card opts={{ outfit: VICTOR, expr: "shock", mode: fall > 0 ? "fall" : "stand", seed: 3, overlay: "glasses" }} pos={[-0.8 - 0.4 * fall, 0, -0.2]} h={3} rotZ={0.5 * fall} />
      {f >= hit ? <VaporField n={22} area={[-3, -1.5, 0, 0.5]} y={0.8} opacity={0.35 * clamp((f - hit) / 3)} size={2.6} speed={0.08} /> : null}
    </Stage>
  );
};

export const L12: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const u = clamp(f / dur);
  return (
    <Stage dur={dur} cam={{ from: [0, 2.6, 2.4], to: [0, 2.2, 1.8], look: [0, 0.2, -0.6], fov: 48 }} fog={NIGHT} focus={2.6} bokeh={4}>
      <LabSet dark={0.3} />
      <Card opts={{ outfit: { ...VICTOR, skin: u > 0.35 ? "#cfe6f5" : undefined }, expr: "tears", seed: 3, overlay: "glasses" }} pos={[-1.2, 0.05, -0.6]} h={2.8} rotZ={-Math.PI / 2} />
      <FrostDecal pos={[-0.2, 0.02, -0.6]} size={4} u={u * 0.6} />
      <Dust n={120} box={[-2, 0, -2, 2, 2, 1]} fall={0.003} size={0.03} opacity={0.7} />
    </Stage>
  );
};

export const L13: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const on = Math.max(0, 1 - f / (dur * 0.6)) * (f % 3 === 0 ? 0.3 : 1);
  return (
    <Stage dur={dur} cam={{ from: [0, 1.9, 5], to: [0, 1.9, 4.2], look: [0, 1.8, -0.6], fov: 46 }} fog={{ color: "#05080e", density: 0.05 }} focus={4.6} bokeh={3}>
      <LabSet dark={0.85} />
      <Chamber pos={[0, 0, -0.6]} h={3.3} r={0.85} on={on} frost={0.8}>
        <Card opts={{ outfit: NORA, expr: "neutral", seed: 7, autoBlink: false }} blink={1} pos={[0, 0.3, 0]} h={2.8} emissive={0} />
      </Chamber>
    </Stage>
  );
};

export const L14: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Stage dur={dur} cam={{ from: [0, 1.2, 4], to: [0, 1.25, 3.2], look: [0, 1.9, -4], fov: 52 }} fog={{ color: "#0a1420", density: 0.045 }} focus={4.6} bokeh={3} bloom={1.3}>
      <Corridor />
      <Card opts={{ outfit: FREEZE, expr: "cold", mode: "stroll", phase: (f / 7) % 1, seed: 11, overlay: "dome" }} pos={[0, 0, -3.4 + 1.2 * clamp(f / dur)]} h={3.4} />
      <FrostDecal pos={[0, 0.02, -2]} size={5} u={clamp(f / dur + 0.3)} />
    </Stage>
  );
};

export const L15: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const u = clamp(f / dur);
  return (
    <Stage dur={dur} cam={{ from: [1.6, 2.2, 9], to: [1.2, 2.1, 8.1], look: [0, 1.8, -4], fov: 52 }} fog={{ color: "#1a0e08", density: 0.025 }} focus={8.2} bokeh={2.5} bloom={1.4}>
      <Ballroom cold={u} />
      <Card opts={{ outfit: BOYLE, expr: u > 0.4 ? "shock" : "smile", seed: 21 }} pos={[0, 1, -5.6]} h={3.1} />
      {Array.from({ length: 7 }, (_, i) => (
        <Card key={i} opts={{ outfit: GUEST(i), expr: "shock", mode: "stroll", phase: (f / 4 + i * 0.2) % 1, seed: 30 + i }} pos={[-5 + i * 1.6 + (i % 2 ? 1 : -1) * 1.6 * u, 0, -1 + (i % 3) * 1.4]} h={2.9} rotY={(i % 2 ? -1 : 1) * 0.3} />
      ))}
      <Card opts={{ outfit: FREEZE, expr: "cold", seed: 11, overlay: "dome" }} pos={[1.6, 0, 5.2]} h={3.4} rotY={0.2} emissive={0.05} />
      <VaporField n={24} area={[-3, 2, 6, 8]} y={0.3} opacity={0.3 * u + 0.05} size={4} speed={-0.03} />
    </Stage>
  );
};

export const L16: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const ice = clamp(f / (dur * 0.7));
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: "#bfe6ff", roughness: 0.02, metalness: 0.4, transparent: true, opacity: 0.38, emissive: "#1a5a8a", emissiveIntensity: 0.25 }), []);
  return (
    <Stage dur={dur} cam={{ from: [0, 1.9, -0.6], to: [0, 1.95, -1.4], look: [0, 1.9, -5.6], fov: 46 }} fog={{ color: "#120c10", density: 0.03 }} focus={4.4} bokeh={3} bloom={1.4}>
      <Ballroom cold={1} />
      <Card opts={{ outfit: BOYLE, expr: "shock", seed: 21, wave: 1, tilt: Math.sin(f * 2.4) * 0.03 }} pos={[0, 1, -5.6]} h={3.1} />
      <mesh position={[0, 1 + 0.75 * ice, -5.55]} material={m} castShadow><boxGeometry args={[1.5, 1.5 * ice + 0.01, 1]} /></mesh>
      <FrostDecal pos={[0, 1.02, -5.6]} size={4} u={ice * 0.5} />
      <Dust n={160} box={[-3, 0.5, -7, 3, 5, -3]} fall={0.01} size={0.04} opacity={0.8} />
    </Stage>
  );
};

export const L17: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  const cloak = useMemo(() => mat.std("#05060a", 0.9), []);
  return (
    <Stage dur={dur} cam={{ from: [-1.4, 1.9, 3.6], to: [-1.1, 1.85, 2.9], look: [0.8, 1.8, -3], fov: 48 }} fog={{ color: "#0c1220", density: 0.035 }} focus={4.8} bokeh={3.5} bloom={1.3}>
      <Ballroom cold={1} />
      <Card opts={{ outfit: FREEZE, expr: "restrained_anger", seed: 11, overlay: "dome" }} pos={[1.4, 0, -2.6]} h={3.4} rotY={-0.4} />
      {/* original cloaked figure: tall silhouette, cloak sways */}
      <group position={[-0.8, 0, 0.8]} rotation={[0, 0.5, Math.sin(f * 0.4) * 0.02]}>
        <mesh position={[0, 1.25, 0]} castShadow material={cloak}><coneGeometry args={[0.9, 2.5, 24, 1, true]} /></mesh>
        <mesh position={[0, 2.5, 0]} castShadow material={cloak}><cylinderGeometry args={[0.22, 0.3, 0.6, 16]} /></mesh>
        <mesh position={[0, 2.95, 0]} castShadow material={cloak}><sphereGeometry args={[0.28, 24, 16]} /></mesh>
      </group>
      <pointLight position={[2, 5, -4]} intensity={80} distance={16} decay={2} color="#cfe6ff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    </Stage>
  );
};

export const L18: React.FC<SP> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Stage dur={dur} cam={{ from: [0, 1.7, 5.2], to: [0, 1.75, 4.3], look: [0, 2.3, -4], fov: 50 }} fog={{ color: "#05070a", density: 0.03 }} focus={3.4} bokeh={3} bloom={1.2}>
      <TvRoom />
      <Card opts={{ outfit: BOYLE, expr: "shock", seed: 21, wave: 1 }} pos={[0, 0, 1.2]} h={3.2} />
      {[-2.2, -1.4, 1.4, 2.2].map((x, i) => <Card key={i} opts={{ outfit: GUEST(i + 2), expr: "stern", seed: 40 + i }} pos={[x, 0, 2.6]} h={2.9} rotY={x < 0 ? 0.4 : -0.4} />)}
      {f % 23 < 2 ? <pointLight position={[-2, 2.2, 3]} color="#fff" intensity={150} distance={8} decay={2} /> : null}
    </Stage>
  );
};

export const L19: React.FC<SP> = ({ dur }) => (
  <Stage dur={dur} cam={{ from: [0.3, 1.8, 3.2], to: [0.1, 1.6, 2.4], look: [0, 1.2, -2.6], fov: 46 }} fog={{ color: "#060a12", density: 0.04 }} focus={3.4} bokeh={3.5} bloom={1.3}>
    <Cell />
    <Card opts={{ outfit: FREEZE, expr: "tears", mode: "sit", seed: 11, overlay: "dome", headTilt: 0.25 }} pos={[0, 0.3, -2.6]} h={3.3} />
    <SnowGlobe pos={[0, 1.15, -2.05]} r={0.26} />
  </Stage>
);

export const L20: React.FC<SP> = ({ dur }) => (
  <Stage dur={dur} cam={{ from: [0.6, 8.2, 4.5], to: [1.6, 9.0, 10], look: [0.3, 8, -3], lookTo: [0, 9, -8], fov: 46 }} fog={{ color: "#0a1224", density: 0.018 }} focus={6} bokeh={2} bloom={1.3}>
    <Exterior />
  </Stage>
);

export const SCENES3D: Record<number, React.FC<SP>> = {
  1: L01, 2: L02, 3: L03, 4: L04, 5: L05, 6: L06, 7: L07, 8: L08, 9: L09, 10: L10,
  11: L11, 12: L12, 13: L13, 14: L14, 15: L15, 16: L16, 17: L17, 18: L18, 19: L19, 20: L20,
};
