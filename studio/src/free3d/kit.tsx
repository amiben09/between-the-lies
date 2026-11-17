// BETWEEN THE LIES · free 3D kit (three.js inside Remotion): procedural PBR-ish materials, set pieces, lit character
// cards that cast real shadows, vapor and dust. Everything is generated in code (no downloaded assets, no credits).
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { drawToon, DrawOpts } from "../free/Toon";

// ---------------- procedural textures ----------------
const texCache = new Map<string, THREE.Texture>();
const canvasTex = (key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D, r: () => number) => void, repeat: [number, number] = [1, 1], color = true) => {
  const k = `${key}|${repeat}`;
  const hit = texCache.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  let s = 1234567 + key.length * 99991;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  paint(c.getContext("2d")!, r);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(k, t);
  return t;
};
const noise = (g: CanvasRenderingContext2D, r: () => number, w: number, h: number, n: number, a: number, light = false) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = light ? `rgba(255,255,255,${a * r()})` : `rgba(0,0,0,${a * r()})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
};
/** worn concrete / tile floor */
export const floorTiles = (base: string, line: string, rep: [number, number] = [6, 6]) => canvasTex(`tiles${base}${line}`, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  noise(g, r, 512, 512, 9000, 0.12); noise(g, r, 512, 512, 3000, 0.06, true);
  for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + 0.08 * r()})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + 80 * r(), 20 + 60 * r(), r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = line; g.lineWidth = 4; g.strokeRect(2, 2, 508, 508); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
}, rep);
/** wall panels with rivets and grime */
export const wallPanels = (base: string, rep: [number, number] = [4, 2]) => canvasTex(`panel${base}`, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  noise(g, r, 512, 512, 7000, 0.1);
  const grd = g.createLinearGradient(0, 300, 0, 512); grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(0,0,0,0.35)");
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 5; g.strokeRect(4, 4, 504, 504);
  g.fillStyle = "rgba(255,255,255,0.25)";
  for (const [x, y] of [[20, 20], [492, 20], [20, 492], [492, 492], [256, 20], [256, 492]]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
}, rep);
/** dark wood */
export const wood = (base: string, rep: [number, number] = [2, 2]) => canvasTex(`wood${base}`, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(0,0,0,${0.08 * r() + 0.04 * Math.sin(y * 0.05 + r())})`; g.fillRect(0, y, 512, 2); }
  for (let x = 0; x < 512; x += 128) { g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(x, 0, 3, 512); }
}, rep);
/** wallpaper / plaster */
export const plaster = (base: string, pattern: string | null, rep: [number, number] = [3, 2]) => canvasTex(`plaster${base}${pattern}`, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  noise(g, r, 512, 512, 6000, 0.08); noise(g, r, 512, 512, 2000, 0.05, true);
  if (pattern) { g.fillStyle = pattern; for (let y = 32; y < 512; y += 96) for (let x = (y / 96) % 2 ? 48 : 0; x < 512; x += 96) { g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 12, y); g.lineTo(x, y + 16); g.lineTo(x - 12, y); g.fill(); } }
}, rep);
/** soft radial sprite for vapor / glows */
export const softDot = () => canvasTex("softdot", 256, 256, (g) => {
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.4, "rgba(255,255,255,0.45)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
});
/** frost / ice */
export const frostTex = (rep: [number, number] = [1, 1]) => canvasTex("frost", 512, 512, (g, r) => {
  g.fillStyle = "rgba(220,240,255,0.0)"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(240,250,255,0.55)"; g.lineWidth = 1.2;
  for (let i = 0; i < 160; i++) {
    const x = r() * 512, y = r() * 512, L = 6 + 22 * r(), a0 = r() * 6.28;
    for (let k = 0; k < 6; k++) { const a = a0 + k * 1.047; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  }
  noise(g, r, 512, 512, 4000, 0.4, true);
}, rep);

// ---------------- materials ----------------
export const mat = {
  std: (color: string, rough = 0.7, metal = 0.0, map?: THREE.Texture) => new THREE.MeshStandardMaterial({ color: map ? "#ffffff" : color, roughness: rough, metalness: metal, map }), // the map carries the colour
  glow: (color: string, intensity = 3) => new THREE.MeshStandardMaterial({ color: "#000", emissive: color, emissiveIntensity: intensity, roughness: 1 }),
  glass: (tint = "#bfefff", opacity = 0.18) => new THREE.MeshStandardMaterial({ color: tint, transparent: true, opacity, roughness: 0.05, metalness: 0.5, depthWrite: false, side: THREE.FrontSide }),
};

// ---------------- set pieces ----------------
export const Room: React.FC<{ w: number; d: number; h: number; floor: THREE.Material; wall: THREE.Material; ceiling?: THREE.Material; open?: boolean }> = ({ w, d, h, floor, wall, ceiling, open }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floor}><planeGeometry args={[w, d]} /></mesh>
    <mesh position={[0, h / 2, -d / 2]} receiveShadow material={wall}><planeGeometry args={[w, h]} /></mesh>
    <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow material={wall}><planeGeometry args={[d, h]} /></mesh>
    <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow material={wall}><planeGeometry args={[d, h]} /></mesh>
    {open ? null : <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} material={ceiling ?? wall}><planeGeometry args={[w, d]} /></mesh>}
  </group>
);

/** glowing window (light source look) + frame bars */
export const Window: React.FC<{ pos: [number, number, number]; w: number; h: number; color?: string; intensity?: number; bars?: number; rotY?: number; frame?: string }> = ({ pos, w, h, color = "#5d8fd0", intensity = 1.6, bars = 2, rotY = 0, frame = "#0b0f16" }) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh material={mat.glow(color, intensity)}><planeGeometry args={[w, h]} /></mesh>
    {Array.from({ length: bars }, (_, i) => (
      <mesh key={i} position={[-w / 2 + (w / (bars + 1)) * (i + 1), 0, 0.03]} material={mat.std(frame, 0.6, 0.4)} castShadow><boxGeometry args={[0.08, h, 0.08]} /></mesh>
    ))}
    <mesh position={[0, 0, 0.03]} material={mat.std(frame, 0.6, 0.4)} castShadow><boxGeometry args={[w, 0.08, 0.08]} /></mesh>
    <mesh position={[0, 0, -0.02]} material={mat.std(frame, 0.6, 0.4)}><boxGeometry args={[w + 0.3, h + 0.3, 0.05]} /></mesh>
  </group>
);

/** cryogenic machine: housing + glowing coolant tubes + dials */
export const Machine: React.FC<{ pos: [number, number, number]; h?: number; rotY?: number; glow?: string; on?: number }> = ({ pos, h = 3.2, rotY = 0, glow = "#38e1ff", on = 1 }) => {
  const f = useCurrentFrame();
  const pulse = on * (2.2 + 0.8 * Math.sin(f * 0.15 + pos[0]));
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={mat.std("#3a4654", 0.45, 0.7, wallPanels("#55626f", [1, 2]))}><boxGeometry args={[1.4, h, 1]} /></mesh>
      {[-0.4, 0, 0.4].map((x, i) => (
        <mesh key={i} position={[x, h * 0.55, 0.52]} material={mat.glow(glow, pulse)}><cylinderGeometry args={[0.11, 0.11, h * 0.55, 16]} /></mesh>
      ))}
      <mesh position={[0, h * 0.18, 0.52]} rotation={[Math.PI / 2, 0, 0]} material={mat.std("#9aa6b2", 0.3, 0.9)}><cylinderGeometry args={[0.18, 0.18, 0.06, 24]} /></mesh>
      <mesh position={[0.45, h * 0.18, 0.52]} material={mat.glow(f % 30 < 15 ? "#ff4a3a" : "#3a0a08", 3)}><boxGeometry args={[0.12, 0.06, 0.02]} /></mesh>
      <pointLight position={[0, h * 0.55, 0.9]} color={glow} intensity={on * 6} distance={4} decay={2} />
    </group>
  );
};

/** upright glass cryo chamber (glass shell, caps, inner glow light, frost) */
export const Chamber: React.FC<{ pos: [number, number, number]; h?: number; r?: number; on?: number; frost?: number; children?: React.ReactNode }> = ({ pos, h = 3, r = 0.75, on = 1, frost = 0.3, children }) => {
  const f = useCurrentFrame();
  const g = on * (1 + 0.1 * Math.sin(f * 0.2));
  const fm = useMemo(() => new THREE.MeshBasicMaterial({ map: frostTex([3, 2]), transparent: true, opacity: frost * 0.55, depthWrite: false, color: "#d8f0ff", blending: THREE.AdditiveBlending }), [frost]);
  const inner = useMemo(() => new THREE.MeshBasicMaterial({ color: "#2fc6ff", transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide }), []);
  return (
    <group position={pos}>
      {children}
      <mesh position={[0, h / 2 + 0.25, 0]} material={mat.glass("#bfefff", 0.12 + 0.1 * g)}><cylinderGeometry args={[r, r, h, 48, 1, true]} /></mesh>
      <mesh position={[0, h / 2 + 0.25, 0]} material={fm}><cylinderGeometry args={[r * 1.01, r * 1.01, h, 48, 1, true]} /></mesh>
      <mesh position={[0, h / 2 + 0.25, 0]} material={inner}><cylinderGeometry args={[r * 0.96, r * 0.96, h, 32, 1, true]} /></mesh>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow material={mat.std("#4a5868", 0.35, 0.8)}><cylinderGeometry args={[r * 1.25, r * 1.35, 0.26, 48]} /></mesh>
      <mesh position={[0, h + 0.38, 0]} castShadow material={mat.std("#4a5868", 0.35, 0.8)}><cylinderGeometry args={[r * 1.2, r * 1.2, 0.26, 48]} /></mesh>
      <mesh position={[0, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat.glow("#53e6ff", 2.5 * g)}><torusGeometry args={[r * 1.02, 0.03, 8, 64]} /></mesh>
      <pointLight position={[0, h * 0.75, r * 1.6]} color="#62e8ff" intensity={5 * g} distance={6} decay={2} castShadow={false} />
    </group>
  );
};

export const Pipe: React.FC<{ from: [number, number, number]; to: [number, number, number]; r?: number; color?: string }> = ({ from, to, r = 0.09, color = "#59646f" }) => {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const mid = a.clone().add(b).multiplyScalar(0.5), len = a.distanceTo(b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return <mesh position={mid} quaternion={q} castShadow material={mat.std(color, 0.4, 0.8)}><cylinderGeometry args={[r, r, len, 16]} /></mesh>;
};

export const Box: React.FC<{ pos: [number, number, number]; size: [number, number, number]; color: string; rough?: number; metal?: number; map?: THREE.Texture; rot?: [number, number, number] }> = ({ pos, size, color, rough = 0.7, metal = 0, map, rot }) => (
  <mesh position={pos} rotation={rot} castShadow receiveShadow material={mat.std(color, rough, metal, map)}><boxGeometry args={size} /></mesh>
);

// ---------------- character card (2D engine character standing in 3D, lit, casting a shadow) ----------------
export const Card: React.FC<{ opts: DrawOpts; pos: [number, number, number]; h: number; rotZ?: number; rotY?: number; blink?: number; lift?: number; emissive?: number }> = ({ opts, pos, h, rotZ = 0, rotY = 0, blink, emissive = 0.18 }) => {
  const f = useCurrentFrame();
  const seed = opts.seed ?? 3;
  const b = blink ?? (opts.autoBlink !== false && ((f + seed * 17) % 64) < 4 ? 1 : 0);
  const { canvas, tex, material, depth } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 1000;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const material = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, roughness: 0.85,
      emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: emissive });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    return { canvas, tex, material, depth };
  }, [emissive]);
  useLayoutEffect(() => {
    const g = canvas.getContext("2d")!;
    drawToon(g, opts, b);
    tex.needsUpdate = true;
  });
  const w = h * 0.6;
  // pivot at the feet (soles at y = 975/1000 of the card)
  return (
    <group position={pos} rotation={[0, rotY, rotZ]}>
      <mesh position={[0, h * 0.475, 0]} castShadow receiveShadow material={material} customDepthMaterial={depth}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
};

// ---------------- atmosphere ----------------
/** drifting vapor sprites near the floor */
export const VaporField: React.FC<{ n?: number; area: [number, number, number, number]; y?: number; color?: string; opacity?: number; size?: number; speed?: number }> = ({ n = 18, area, y = 0.3, color = "#dff4ff", opacity = 0.22, size = 3, speed = 0.01 }) => {
  const f = useCurrentFrame();
  const m = useMemo(() => new THREE.SpriteMaterial({ map: softDot(), color, transparent: true, opacity, depthWrite: false }), [color, opacity]);
  const [x0, z0, x1, z1] = area;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const h1 = Math.sin(i * 12.9898) * 43758.5453, h2 = Math.sin(i * 78.233) * 12345.678;
        const fx = h1 - Math.floor(h1), fz = h2 - Math.floor(h2);
        const x = x0 + ((fx * (x1 - x0) + f * speed * (0.5 + fz)) % (x1 - x0));
        const z = z0 + fz * (z1 - z0);
        const s = size * (0.6 + fx);
        return <sprite key={i} position={[x, y + 0.2 * fz, z]} scale={[s, s * 0.45, 1]} material={m} />;
      })}
    </group>
  );
};

/** floating dust / snow points */
export const Dust: React.FC<{ n?: number; box: [number, number, number, number, number, number]; fall?: number; size?: number; color?: string; opacity?: number }> = ({ n = 300, box, fall = 0.01, size = 0.035, color = "#e8f4ff", opacity = 0.8 }) => {
  const f = useCurrentFrame();
  const [x0, y0, z0, x1, y1, z1] = box;
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const base = useMemo(() => Array.from({ length: n }, (_, i) => {
    const r = (k: number) => { const v = Math.sin(i * 91.7 + k * 47.3) * 43758.5453; return v - Math.floor(v); };
    return [r(1), r(2), r(3), r(4)];
  }), [n]);
  const pos = new Float32Array(n * 3);
  base.forEach(([a, b, c, d], i) => {
    pos[i * 3] = x0 + a * (x1 - x0) + Math.sin(f * 0.03 + d * 6) * 0.08;
    pos[i * 3 + 1] = y0 + (((b * (y1 - y0) - f * fall * (0.5 + d)) % (y1 - y0)) + (y1 - y0)) % (y1 - y0);
    pos[i * 3 + 2] = z0 + c * (z1 - z0);
  });
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = useMemo(() => new THREE.PointsMaterial({ map: softDot(), size, color, transparent: true, opacity, depthWrite: false, sizeAttenuation: true }), [size, color, opacity]);
  return <points geometry={geo} material={m} />;
};
