// 3D-necessity test — renderer B: a real Three.js set (original design) + our 2D characters as camera-facing cards.
// Toon shading + inverted-hull ink outlines keep the graphic look; backgrounds stay in focus (like the references).
import React, { useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BEATS, LETTER_TEXT, SHOP_SIGNS, TEST_H, TEST_W } from "./streetSpec";
import { person } from "../btl/people";
import { clamp, lerp, makeCanvas, rng, smooth } from "../btl/core";

// ---------- shared materials / textures ----------
const gradientMap = (() => { const d = new Uint8Array([70, 150, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (color: string, map?: THREE.Texture, emissive?: string) => new THREE.MeshToonMaterial({ color, map, gradientMap, emissive: emissive ?? "#000000" });
const INK = new THREE.MeshBasicMaterial({ color: "#14101a", side: THREE.BackSide });
function canvasTex(w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) {
  const [c, g] = makeCanvas(w, h); paint(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
/** Mesh + ink outline (inverted hull). */
const Inked: React.FC<{ geo: THREE.BufferGeometry; mat: THREE.Material | THREE.Material[]; pos: [number, number, number]; rot?: [number, number, number]; outline?: number }> = ({ geo, mat, pos, rot, outline = 0.025 }) => (
  <group position={pos} rotation={rot ?? [0, 0, 0]}>
    <mesh geometry={geo} material={mat} />
    {outline > 0 && <mesh geometry={geo} material={INK} scale={[1 + outline, 1 + outline, 1 + outline]} />}
  </group>
);

// ---------- facade painter ----------
const WALLS = ["#b5654a", "#d9c7a0", "#6f8fa8", "#c98f5a", "#8a6f9a", "#a8b58a", "#c7a07a"];
function facade(seed: number, wM: number, hM: number, shop: string | null, holeWindow = false) {
  const r = rng(seed); const ppm = 96; const w = Math.round(wM * ppm), h = Math.round(hM * ppm);
  return canvasTex(w, h, (g) => {
    const wall = WALLS[seed % WALLS.length];
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 2;
    for (let y = 0; y < h; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},0,${0.04 * r()})`; g.fillRect(r() * w, r() * h, 3 + r() * 9, 2 + r() * 4); }
    const floors = Math.max(1, Math.floor((hM - 3.2) / 2.6)), cols = Math.max(1, Math.round(wM / 1.8));
    for (let fl = 0; fl < floors; fl++) for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) / cols) * w - 0.45 * ppm, y = h - (3.4 + fl * 2.6 + 1.5) * ppm;
      const lit = r() < 0.45;
      const grd = g.createLinearGradient(0, y, 0, y + 1.4 * ppm);
      grd.addColorStop(0, lit ? "#ffd68a" : "#2b3552"); grd.addColorStop(1, lit ? "#e09a4a" : "#1a2034");
      g.fillStyle = grd; g.fillRect(x, y, 0.9 * ppm, 1.4 * ppm);
      g.strokeStyle = "#1f1a1c"; g.lineWidth = 6; g.strokeRect(x, y, 0.9 * ppm, 1.4 * ppm);
      g.lineWidth = 3; g.beginPath(); g.moveTo(x + 0.45 * ppm, y); g.lineTo(x + 0.45 * ppm, y + 1.4 * ppm); g.moveTo(x, y + 0.7 * ppm); g.lineTo(x + 0.9 * ppm, y + 0.7 * ppm); g.stroke();
      g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x - 6, y + 1.4 * ppm, 0.9 * ppm + 12, 8);
    }
    // ground floor: door + shop window + sign
    const doorX = w * (r() < 0.5 ? 0.12 : 0.7);
    g.fillStyle = "#3a2a24"; g.fillRect(doorX, h - 2.2 * ppm, 0.95 * ppm, 2.2 * ppm); g.strokeStyle = "#1a1210"; g.lineWidth = 6; g.strokeRect(doorX, h - 2.2 * ppm, 0.95 * ppm, 2.2 * ppm);
    g.fillStyle = "#d8b25a"; g.beginPath(); g.arc(doorX + 0.8 * ppm, h - 1.1 * ppm, 5, 0, 6.283); g.fill();
    if (!holeWindow) {
      const sx = doorX < w / 2 ? doorX + 1.3 * ppm : w * 0.08, sw = Math.min(w * 0.5, 2.0 * ppm);
      const grd = g.createLinearGradient(0, h - 2.0 * ppm, 0, h - 0.6 * ppm); grd.addColorStop(0, shop ? "#ffe0a0" : "#2b3552"); grd.addColorStop(1, shop ? "#c9853f" : "#1a2034");
      g.fillStyle = grd; g.fillRect(sx, h - 2.0 * ppm, sw, 1.4 * ppm); g.strokeStyle = "#1f1a1c"; g.lineWidth = 7; g.strokeRect(sx, h - 2.0 * ppm, sw, 1.4 * ppm);
      if (shop) { // shelves of goods silhouettes
        g.fillStyle = "rgba(90,50,30,0.55)"; for (let k = 0; k < 9; k++) g.fillRect(sx + 10 + k * (sw - 20) / 9, h - 1.2 * ppm - (k % 3) * 18, (sw - 40) / 9, 26 + (k % 3) * 18);
      }
    }
    if (shop) {
      g.fillStyle = "#24302a"; g.fillRect(w * 0.06, h - 3.0 * ppm, w * 0.88, 0.55 * ppm); g.strokeStyle = "#c9a95a"; g.lineWidth = 4; g.strokeRect(w * 0.06 + 6, h - 3.0 * ppm + 6, w * 0.88 - 12, 0.55 * ppm - 12);
      g.fillStyle = "#f2e2b4"; g.font = `bold ${Math.round(0.34 * ppm)}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(shop, w / 2, h - 2.72 * ppm);
    }
    g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, h - 0.25 * ppm, w, 0.25 * ppm); // plinth
  });
}

type Bld = { x: number; z: number; w: number; h: number; d: number; side: 1 | -1; seed: number; shop: string | null; roof: string };
function buildRows(): Bld[] {
  const out: Bld[] = []; const r = rng(7);
  for (const side of [1, -1] as const) {
    let z = 8;
    let k = side === 1 ? 0 : 3;
    while (z > -46) {
      const w = 3.6 + r() * 2.4, h = 6.5 + r() * 4, d = 6;
      out.push({ x: side * (5.5 + d / 2), z: z - w / 2, w, h, d, side, seed: Math.floor(r() * 1000) + k, shop: r() < 0.55 ? SHOP_SIGNS[k % SHOP_SIGNS.length] : null, roof: ["#7a3a32", "#3f5a66", "#5a4a6a", "#6a5a3a"][k % 4] });
      z -= w + 0.05; k++;
    }
  }
  return out;
}

const Building: React.FC<{ b: Bld }> = ({ b }) => {
  const mats = useMemo(() => {
    const front = toon("#ffffff", facade(b.seed, b.w, b.h, b.shop));
    const side = toon(WALLS[b.seed % WALLS.length]);
    // box faces: +x, -x, +y, -y, +z, -z — front faces the street
    return b.side === 1 ? [side, front, side, side, side, side] : [front, side, side, side, side, side];
  }, [b]);
  const geo = useMemo(() => new THREE.BoxGeometry(b.d, b.h, b.w), [b]);
  const roofGeo = useMemo(() => { const gg = new THREE.ConeGeometry(Math.hypot(b.d, b.w) / 2 * 1.02, 2.2, 4); gg.rotateY(Math.PI / 4); gg.scale(b.d / Math.hypot(b.d, b.w) * 1.42, 1, b.w / Math.hypot(b.d, b.w) * 1.42); return gg; }, [b]);
  const awning = b.shop ? <Inked geo={new THREE.BoxGeometry(0.9, 0.08, b.w * 0.8)} mat={toon(["#9b2a22", "#2a5a4a", "#c9a95a"][b.seed % 3])} pos={[b.x - b.side * (b.d / 2 + 0.45), 2.6, b.z]} rot={[0, 0, b.side * 0.35]} /> : null;
  return (
    <group>
      <Inked geo={geo} mat={mats} pos={[b.x, b.h / 2, b.z]} outline={0.006} />
      <Inked geo={roofGeo} mat={toon(b.roof)} pos={[b.x, b.h + 1.1, b.z]} outline={0.01} />
      <Inked geo={new THREE.BoxGeometry(0.5, 1.4, 0.5)} mat={toon("#6a4a3a")} pos={[b.x + 1, b.h + 1.6, b.z + b.w * 0.25]} />
      {awning}
    </group>
  );
};

/** The house with the real window opening and the lit room behind it. Front plane at x = 5.5, window at z = -4. */
const WindowHouse: React.FC<{ glassA: number }> = ({ glassA }) => {
  const wall = useMemo(() => toon("#ffffff", facade(4242, 6, 8, null, true)), []);
  const solid = toon("#c98f5a");
  const X = 5.5, Z = -4, W = 6, H = 8, D = 6, wx0 = Z - 0.6, wx1 = Z + 0.6, wy0 = 0.85, wy1 = 2.25;
  const pieces: { z0: number; z1: number; y0: number; y1: number }[] = [
    { z0: Z - W / 2, z1: wx0, y0: 0, y1: H }, { z0: wx1, z1: Z + W / 2, y0: 0, y1: H }, { z0: wx0, z1: wx1, y0: 0, y1: wy0 }, { z0: wx0, z1: wx1, y0: wy1, y1: H }];
  const wallTex = useMemo(() => canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#e8d6b8"; g.fillRect(0, 0, w, h); g.fillStyle = "#c9a07a"; for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < w; x += 64) { g.beginPath(); g.arc(x, y, 9, 0, 6.283); g.fill(); } }, [3, 2]), []);
  const cloth = useMemo(() => canvasTex(256, 256, (g, w, h) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = (x + y) % 2 ? "#f4f0ea" : "#b8342a"; g.fillRect(x * 16, y * 16, 16, 16); } }), []);
  const letter = useMemo(() => canvasTex(512, 360, (g, w, h) => {
    g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, w, h); g.strokeStyle = "#c8c0b0"; g.lineWidth = 2;
    for (let y = 70; y < h; y += 70) { g.beginPath(); g.moveTo(24, y + 14); g.lineTo(w - 24, y + 14); g.stroke(); }
    g.fillStyle = "#2a3a7a"; g.font = "italic 46px 'DejaVu Serif', Georgia, serif"; LETTER_TEXT.forEach((t, i) => g.fillText(t, 40, 70 + i * 70));
  }), []);
  return (
    <group>
      {pieces.map((p, i) => <mesh key={i} position={[X + 0.1, (p.y0 + p.y1) / 2, (p.z0 + p.z1) / 2]} material={i < 2 ? wall : solid}><boxGeometry args={[0.2, p.y1 - p.y0, p.z1 - p.z0]} /></mesh>)}
      <mesh position={[X + D / 2 + 0.2, H / 2, Z]}><boxGeometry args={[D - 0.2, H, W]} /><meshToonMaterial color="#b5654a" gradientMap={gradientMap} transparent opacity={0} /></mesh>
      {/* window frame + sill */}
      <Inked geo={new THREE.BoxGeometry(0.3, 0.12, 1.5)} mat={toon("#e8e2d4")} pos={[X - 0.05, wy0 - 0.06, Z]} />
      <Inked geo={new THREE.BoxGeometry(0.22, 0.1, 1.3)} mat={toon("#3a2a24")} pos={[X, wy1 + 0.05, Z]} />
      <Inked geo={new THREE.BoxGeometry(0.22, 1.4, 0.08)} mat={toon("#3a2a24")} pos={[X, (wy0 + wy1) / 2, Z]} />
      <Inked geo={new THREE.BoxGeometry(0.22, 0.06, 1.2)} mat={toon("#3a2a24")} pos={[X, (wy0 + wy1) / 2, Z]} />
      <Inked geo={new THREE.BoxGeometry(0.4, 2.3, 1.0)} mat={toon("#3a2a24")} pos={[X - 0.1, 1.15, Z + 2.0]} />
      {/* glass: fades as the camera arrives so we pass through it */}
      <mesh position={[X + 0.12, (wy0 + wy1) / 2, Z]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.2, 1.4]} /><meshBasicMaterial color="#ffd89a" transparent opacity={0.22 * glassA} depthWrite={false} /></mesh>
      {/* room (inside faces) */}
      <mesh position={[X + 2.2, 1.5, Z]}><boxGeometry args={[4, 3, 4]} /><meshToonMaterial map={wallTex} gradientMap={gradientMap} side={THREE.BackSide} /></mesh>
      <mesh position={[X + 2.2, 0.01, Z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4, 4]} /><meshToonMaterial color="#6a4a32" gradientMap={gradientMap} /></mesh>
      {/* curtains */}
      {[-0.75, 0.75].map((dz, i) => <Inked key={i} geo={new THREE.BoxGeometry(0.06, 1.7, 0.35)} mat={toon("#7a2a3a")} pos={[X + 0.3, 1.55, Z + dz]} />)}
      {/* table with checked cloth, the letter, a lamp and a cup */}
      <Inked geo={new THREE.BoxGeometry(1.3, 0.06, 1.0)} mat={toon("#ffffff", cloth)} pos={[X + 1.9, 0.76, Z]} />
      {[[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]].map(([dx, dz], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.06, 0.74, 0.06)} mat={toon("#4a3020")} pos={[X + 1.9 + dx, 0.37, Z + dz]} />)}
      <mesh position={[X + 1.75, 0.795, Z - 0.05]} rotation={[-Math.PI / 2, 0, -Math.PI / 2 - 0.12]}><planeGeometry args={[0.34, 0.24]} /><meshBasicMaterial map={letter} /></mesh>
      <Inked geo={new THREE.CylinderGeometry(0.05, 0.04, 0.09, 16)} mat={toon("#e8e2d4")} pos={[X + 2.15, 0.835, Z + 0.28]} />
      <Inked geo={new THREE.CylinderGeometry(0.03, 0.05, 0.32, 12)} mat={toon("#c9a95a")} pos={[X + 2.3, 0.95, Z - 0.3]} />
      <mesh position={[X + 2.3, 1.16, Z - 0.3]}><coneGeometry args={[0.16, 0.18, 16, 1, true]} /><meshBasicMaterial color="#ffe0a0" side={THREE.DoubleSide} /></mesh>
      <pointLight position={[X + 2.3, 1.3, Z - 0.3]} intensity={6} distance={6} decay={1.4} color="#ffc070" />
      <Inked geo={new THREE.BoxGeometry(0.5, 0.9, 0.45)} mat={toon("#5a3a2a")} pos={[X + 2.9, 0.45, Z + 0.9]} />
    </group>
  );
};

const Street: React.FC = () => {
  const cobbles = useMemo(() => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#4a4652"; g.fillRect(0, 0, w, h); const r = rng(3);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) { const v = 70 + r() * 30; g.fillStyle = `rgb(${v},${v - 6},${v + 8})`; g.beginPath(); g.roundRect(x + 2, y + 2, 28, 28, 7); g.fill(); }
  }, [3, 24]), []);
  const paving = useMemo(() => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#9a948a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#6a645c"; g.lineWidth = 3; for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }, [2, 24]), []);
  const rows = useMemo(buildRows, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]}><planeGeometry args={[6, 64]} /><meshToonMaterial map={cobbles} gradientMap={gradientMap} /></mesh>
      {[1, -1].map((s) => <Inked key={s} geo={new THREE.BoxGeometry(2.5, 0.15, 64)} mat={toon("#ffffff", paving)} pos={[s * 4.25, 0.075, -18]} outline={0.002} />)}
      {rows.filter((b) => !(b.side === 1 && b.z < -1 && b.z > -7)).map((b, i) => <Building key={i} b={b} />)}
      {/* lamp posts */}
      {[[3.3, -6.6], [3.3, -12], [-3.3, -6], [-3.3, -18], [3.3, -24]].map(([x, z], i) => (
        <group key={i}>
          <Inked geo={new THREE.CylinderGeometry(0.06, 0.09, 3.6, 10)} mat={toon("#1f2a2a")} pos={[x, 1.8, z]} />
          <mesh position={[x, 3.75, z]}><boxGeometry args={[0.32, 0.4, 0.32]} /><meshBasicMaterial color="#ffd890" /></mesh>
          {i < 4 && <pointLight position={[x, 3.6, z]} intensity={5} distance={9} decay={1.2} color="#ffb860" />}
        </group>
      ))}
      {/* pillar box, bench, trees, crates */}
      <Inked geo={new THREE.CylinderGeometry(0.28, 0.3, 1.3, 20)} mat={toon("#c0261f")} pos={[3.6, 0.8, -8.5]} />
      <Inked geo={new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)} mat={toon("#c0261f")} pos={[3.6, 1.45, -8.5]} />
      <Inked geo={new THREE.BoxGeometry(0.5, 0.08, 1.6)} mat={toon("#6a4a2a")} pos={[-3.7, 0.6, -3]} />
      {[[-3.6, -10], [3.7, -16], [-3.6, -26]].map(([x, z], i) => (
        <group key={i}><Inked geo={new THREE.CylinderGeometry(0.1, 0.14, 2.2, 8)} mat={toon("#5a4030")} pos={[x, 1.25, z]} /><Inked geo={new THREE.IcosahedronGeometry(1.1, 1)} mat={toon("#4f6a3a")} pos={[x, 2.9, z]} outline={0.02} /></group>
      ))}
      {[[-3.9, -7.5], [-3.6, -7.0]].map(([x, z], i) => <Inked key={i} geo={new THREE.BoxGeometry(0.5, 0.45, 0.5)} mat={toon("#8a6a3a")} pos={[x, 0.38 + i * 0.45, z]} />)}
    </group>
  );
};

const Sky: React.FC = () => {
  const tex = useMemo(() => canvasTex(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2a2350"); gr.addColorStop(0.55, "#8a4f7a"); gr.addColorStop(0.8, "#f0946a"); gr.addColorStop(1, "#ffc98a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#fff4d8"; g.beginPath(); g.arc(w * 0.7, h * 0.22, 14, 0, 6.283); g.fill();
    g.fillStyle = "#3a2a4a"; let x = 0; const r = rng(11); while (x < w) { const bw = 18 + r() * 30, bh = 30 + r() * 70; g.fillRect(x, h - bh, bw, bh); x += bw; }
  }), []);
  return <mesh position={[0, 12, -48]}><planeGeometry args={[110, 50]} /><meshBasicMaterial map={tex} fog={false} /></mesh>;
};

// ---------- character as a camera-facing card ----------
const CARD_PX_PER_M = 1029;
function useCharacterCard() {
  return useMemo(() => {
    const [c, g] = makeCanvas(1080, 1920);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return { c, g, t };
  }, []);
}

// ---------- the shot: camera + character keyed to BEATS ----------
const ease = smooth;
function walkerZ(f: number) { const [a, b] = BEATS.follow; const t = clamp((f - a) / (b - a)); return lerp(2, -3, 0.85 * t + 0.15 * ease(t)) - (t > 0.85 ? 0 : 0); }
const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function cameraAt(f: number): { pos: THREE.Vector3; look: THREE.Vector3; fov: number } {
  const wz = walkerZ(f), wx = 4.4;
  if (f < BEATS.stop[0]) return { pos: P(wx - 0.95, 1.95, wz + 4.4), look: P(wx - 0.35, 1.3, wz - 7), fov: 44 };
  if (f < BEATS.through[0]) { const t = ease((f - BEATS.stop[0]) / (BEATS.stop[1] - BEATS.stop[0]));
    const a = P(wx - 0.95, 1.95, -3 + 4.4), b = P(3.55, 1.72, -0.75);
    return { pos: a.lerp(b, t), look: P(lerp(wx - 0.35, 5.0, t), lerp(1.3, 1.45, t), lerp(-10, -3.6, t)), fov: lerp(44, 42, t) }; }
  if (f < BEATS.insert[0]) { const t = (f - BEATS.through[0]) / (BEATS.through[1] - BEATS.through[0]);
    const curve = new THREE.CatmullRomCurve3([P(3.55, 1.72, -0.75), P(4.7, 1.55, -3.7), P(5.5, 1.52, -4.0), P(6.05, 1.55, -4.0)]);
    return { pos: curve.getPoint(0.45 * t + 0.55 * ease(t)), look: P(lerp(5.5, 7.4, ease(t)), lerp(1.5, 0.85, ease(t)), -4.0), fov: 40 }; }
  const t = ease((f - BEATS.insert[0]) / (BEATS.insert[1] - BEATS.insert[0]));
  return { pos: P(lerp(6.05, 6.6, t), lerp(1.55, 1.38, t), -4.0), look: P(lerp(7.4, 7.25, t), lerp(0.85, 0.79, t), -4.05), fov: lerp(40, 36, t) };
}

const Rig: React.FC<{ f: number; card: ReturnType<typeof useCharacterCard> }> = ({ f, card }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { pos, look, fov } = cameraAt(f);
  useLayoutEffect(() => { camera.position.copy(pos); camera.near = 0.05; camera.far = 120; camera.fov = fov; camera.lookAt(look); camera.updateProjectionMatrix(); });
  // draw the walker into the card canvas (our 2D rig), then face the card toward the camera (cylindrical billboard)
  const walking = f < BEATS.follow[1] - 4;
  card.g.setTransform(1, 0, 0, 1, 0, 0); card.g.clearRect(0, 0, 1080, 1920);
  person(card.g, { x: 0, y: 0, zoom: 1 }, 1, "lily", "adult", { x: 540, y: 1880, s: 1.75, back: true, coat: "#3f5a7a", coatHi: "#5a7a9a", walk: walking ? f * 0.36 : undefined, tilt: f > BEATS.stop[0] + 10 ? 4 : 0, breathe: f },
    { x: 900, y: 300, r: 1900, key: "#ffc890", shade: "#1a1430", keyA: 0.3, shadeA: 0.45 });
  card.t.needsUpdate = true;
  const wz = walkerZ(f), cx = 4.4;
  const yaw = Math.atan2(pos.x - cx, pos.z - wz);
  const hM = 1920 / CARD_PX_PER_M, wM = 1080 / CARD_PX_PER_M;
  return (
    <group position={[cx, 0.15, wz]} rotation={[0, yaw, 0]}>
      <mesh position={[0, hM / 2 - 40 / CARD_PX_PER_M, 0]}><planeGeometry args={[wM, hM]} /><meshBasicMaterial map={card.t} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.32, 24]} /><meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} /></mesh>
    </group>
  );
};

export const Street3D: React.FC = () => {
  const f = useCurrentFrame();
  const card = useCharacterCard();
  const camX = cameraAt(f).pos.x;
  const glassA = clamp((5.35 - camX) / 0.6);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={TEST_W} height={TEST_H} gl={{ antialias: true }}>
        <fog attach="fog" args={["#6a4a6a", 14, 52]} />
        <hemisphereLight args={["#8a7ab8", "#4a2a2a", 0.75]} />
        <directionalLight position={[-20, 10, 6]} intensity={0.85} color="#ffa060" />
        <ambientLight intensity={0.25} color="#6a5a98" />
        <Sky />
        <Street />
        <WindowHouse glassA={glassA} />
        <Rig f={f} card={card} />
      </ThreeCanvas>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 55%, rgba(10,6,16,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
