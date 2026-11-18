// Original Japanese-style hidden-village set kit (no franchise emblems/landmarks): wood-and-plaster houses with hip
// roofs, paper lanterns, dirt street, stone walls, gate, pines, cliffs, sky. All low-poly + toon + ink.
import React, { useMemo } from "react";
import * as THREE from "three";
import { rng } from "../btl/core";
import { Inked, canvasTex, gradientMap, toon } from "./kit3d";

export type Mood = "night" | "dawn" | "sunset" | "day";
const PPM = 80;
export function houseTex(seed: number, wM: number, hM: number, mood: Mood, opts: { door?: "open" | "closed"; lit?: number } = {}) {
  const r = rng(seed); const w = Math.round(wM * PPM), h = Math.round(hM * PPM);
  const night = mood === "night";
  return canvasTex(w, h, (g) => {
    const plaster = night ? "#b9b2c8" : "#efe6d2", wood = night ? "#3a2c2a" : "#6a4630", beam = night ? "#241a1c" : "#3e2a1e";
    g.fillStyle = plaster; g.fillRect(0, 0, w, h);
    g.fillStyle = wood; g.fillRect(0, h * 0.62, w, h * 0.38); // wooden lower half
    g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 2; for (let x = 0; x < w; x += 18) { g.beginPath(); g.moveTo(x, h * 0.62); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = beam; g.fillRect(0, h * 0.6, w, 10); g.fillRect(0, 0, w, 10); for (const x of [0, w / 2 - 5, w - 10]) g.fillRect(x, 0, 10, h);
    // sliding paper panels (shoji) on the lower floor
    const lit = opts.lit ?? (night ? (r() < 0.5 ? 1 : 0) : 0.3);
    const pw = w * 0.36, px = w * 0.08, py = h * 0.66, ph = h * 0.3;
    for (const x0 of [px, w - px - pw]) {
      const isDoor = opts.door && x0 !== px;
      if (isDoor && opts.door === "open") { g.fillStyle = "#ffcf80"; g.fillRect(x0, py, pw, ph); continue; }
      const grd = g.createLinearGradient(0, py, 0, py + ph); grd.addColorStop(0, lit > 0.5 ? "#ffe2a8" : "#e8e0cc"); grd.addColorStop(1, lit > 0.5 ? "#f0b060" : "#c8beaa");
      g.fillStyle = night && lit < 0.5 ? "#4a4660" : grd; g.fillRect(x0, py, pw, ph);
      g.strokeStyle = beam; g.lineWidth = 3; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x0 + (k * pw) / 4, py); g.lineTo(x0 + (k * pw) / 4, py + ph); g.stroke(); }
      for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x0, py + (k * ph) / 5); g.lineTo(x0 + pw, py + (k * ph) / 5); g.stroke(); }
      g.lineWidth = 6; g.strokeRect(x0, py, pw, ph);
    }
    // upper window with bars
    const wx = w * 0.3, wy = h * 0.2, ww = w * 0.4, wh = h * 0.2;
    g.fillStyle = night ? (r() < 0.4 ? "#ffcf80" : "#2a2a44") : "#4a3a30"; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = beam; for (let k = 0; k <= 6; k++) g.fillRect(wx + (k * ww) / 6 - 3, wy, 6, wh); g.fillRect(wx - 6, wy + wh, ww + 12, 8);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${0.05 * r()})`; g.fillRect(r() * w, r() * h * 0.6, 2 + r() * 8, 1 + r() * 3); }
  });
}

export const House: React.FC<{ x: number; z: number; w: number; d: number; h: number; face: 1 | -1 | 0; seed: number; mood: Mood; door?: "open" | "closed"; lit?: number; roof?: string }> =
  ({ x, z, w, d, h, face, seed, mood, door, lit, roof = "#3a4250" }) => {
    const mats = useMemo(() => {
      const front = toon("#ffffff", houseTex(seed, face === 0 ? w : d, h, mood, { door, lit }));
      const side = toon(mood === "night" ? "#8a849a" : "#d8ccb4");
      // box faces +x,-x,+y,-y,+z,-z ; face=1 → front faces -x (house on the right of a street running along z), -1 → +x, 0 → +z
      return face === 1 ? [side, front, side, side, side, side] : face === -1 ? [front, side, side, side, side, side] : [side, side, side, side, front, side];
    }, [seed, mood, door, lit, face, w, d, h]);
    const body = useMemo(() => new THREE.BoxGeometry(d, h, w), [d, h, w]);
    const eave = useMemo(() => new THREE.BoxGeometry(d + 1.0, 0.14, w + 1.0), [d, w]);
    const hip = useMemo(() => { const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4); return g; }, []);
    return (
      <group>
        <Inked geo={body} mat={mats} pos={[x, h / 2, z]} outline={0.006} />
        <Inked geo={eave} mat={toon(roof)} pos={[x, h + 0.05, z]} outline={0.01} />
        <Inked geo={hip} mat={toon(roof)} pos={[x, h + 0.75, z]} scale={[(d + 0.8) * 0.71, 1.4, (w + 0.8) * 0.71]} outline={0.01} />
        <Inked geo={new THREE.BoxGeometry(0.16, 0.16, w * 0.55)} mat={toon("#1e2430")} pos={[x, h + 1.42, z]} />
      </group>
    );
  };

/** Paper lantern; `fallen` lies on its side; `out` = extinguished. */
export const Lantern: React.FC<{ pos: [number, number, number]; color?: string; out?: number; fallen?: boolean; light?: boolean; scale?: number }> = ({ pos, color = "#e8483a", out = 0, fallen, light, scale = 1 }) => {
  const glow = 1 - out;
  return (
    <group position={pos} rotation={fallen ? [0, 0.6, Math.PI / 2.2] : [0, 0, 0]} scale={[scale, scale, scale]}>
      <mesh scale={[0.32, 0.42, 0.32]}><sphereGeometry args={[1, 18, 12]} /><meshToonMaterial color={color} gradientMap={gradientMap} emissive={color} emissiveIntensity={0.9 * glow + 0.05} /></mesh>
      <mesh position={[0, 0.44, 0]}><cylinderGeometry args={[0.14, 0.18, 0.08, 12]} /><meshBasicMaterial color="#1a1414" /></mesh>
      <mesh position={[0, -0.44, 0]}><cylinderGeometry args={[0.18, 0.14, 0.08, 12]} /><meshBasicMaterial color="#1a1414" /></mesh>
      {light && glow > 0.05 && <pointLight intensity={4 * glow} distance={7} decay={1.3} color="#ffb070" />}
    </group>
  );
};

export const Street: React.FC<{ len: number; width: number; mood: Mood; z0?: number }> = ({ len, width, mood, z0 = 0 }) => {
  const tex = useMemo(() => canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = mood === "night" ? "#3a3640" : "#a89878"; g.fillRect(0, 0, w, h); const r = rng(5);
    for (let i = 0; i < 260; i++) { const v = mood === "night" ? 50 + r() * 30 : 140 + r() * 40; g.fillStyle = `rgb(${v},${v - 8},${v - 16})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 12, 4 + r() * 8, r() * 3, 0, 6.283); g.fill(); }
  }, [width / 3, len / 3]), [len, width, mood]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z0 - len / 2]}><planeGeometry args={[width, len]} /><meshToonMaterial map={tex} gradientMap={gradientMap} /></mesh>;
};

export const Pine: React.FC<{ pos: [number, number, number]; s?: number; color?: string }> = ({ pos, s = 1, color = "#2f4a36" }) => (
  <group position={pos} scale={[s, s, s]}>
    <Inked geo={new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8)} mat={toon("#4a3426")} pos={[0, 0.8, 0]} />
    {[0, 1, 2].map((k) => <Inked key={k} geo={new THREE.ConeGeometry(1.3 - k * 0.32, 1.6, 9)} mat={toon(color)} pos={[0, 1.8 + k * 0.9, 0]} outline={0.015} />)}
  </group>
);

/** Painted sky + cliffs backdrop (never in focus-blur; references keep sets sharp). */
export const Backdrop: React.FC<{ mood: Mood; moon?: "red" | "white" | null; z?: number; w?: number; h?: number; y?: number; cliffs?: boolean; moonXY?: [number, number] }> = ({ mood, moon = null, z = -90, w = 260, h = 120, y = 30, cliffs = true, moonXY = [0.68, 0.24] }) => {
  const tex = useMemo(() => canvasTex(1024, 512, (g, W, H) => {
    const stops: Record<Mood, string[]> = { night: ["#070814", "#1c1f3c", "#3a2e4e"], dawn: ["#3a5a8a", "#e8a07a", "#ffe0b0"], sunset: ["#4a2e5a", "#e0704a", "#ffc080"], day: ["#5a90c8", "#a8d0f0", "#e8f0f0"] };
    const gr = g.createLinearGradient(0, 0, 0, H); stops[mood].forEach((c, i) => gr.addColorStop(i / 2, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (mood === "night") { const r = rng(9); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(230,230,255,${r() * 0.8})`; g.fillRect(r() * W, r() * H * 0.6, 2, 2); } }
    if (moon) { const mx = W * moonXY[0], my = H * moonXY[1], mr = 46; const rg = g.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.2); rg.addColorStop(0, moon === "red" ? "rgba(255,80,60,0.6)" : "rgba(230,235,255,0.5)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H); g.fillStyle = moon === "red" ? "#e0402e" : "#f4f0e0"; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill(); }
    if (cliffs) {
      g.fillStyle = mood === "night" ? "#141626" : mood === "dawn" ? "#6a6a88" : "#7a5a6a";
      g.beginPath(); g.moveTo(0, H); let x = 0; const r = rng(3);
      while (x <= W) { g.lineTo(x, H * (0.5 + r() * 0.18)); x += 30 + r() * 50; } g.lineTo(W, H); g.fill();
      g.fillStyle = mood === "night" ? "#0c0e1a" : "#4a4a64"; g.beginPath(); g.moveTo(0, H); x = 0; while (x <= W) { g.lineTo(x, H * (0.68 + r() * 0.1)); x += 40 + r() * 60; } g.lineTo(W, H); g.fill();
    }
  }), [mood, moon, cliffs, moonXY[0], moonXY[1]]);
  return <mesh position={[0, y, z]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} fog={false} /></mesh>;
};

export const StoneWall: React.FC<{ x: number; z0: number; z1: number; h?: number }> = ({ x, z0, z1, h = 2.2 }) => {
  const tex = useMemo(() => canvasTex(256, 128, (g, w, hh) => { g.fillStyle = "#8a8478"; g.fillRect(0, 0, w, hh); const r = rng(4); for (let y = 0; y < hh; y += 24) for (let xx = (y / 24) % 2 ? 20 : 0; xx < w; xx += 40) { const v = 110 + r() * 40; g.fillStyle = `rgb(${v},${v - 6},${v - 14})`; g.beginPath(); g.roundRect(xx + 2, y + 2, 36, 20, 6); g.fill(); } }, [Math.abs(z1 - z0) / 2, 1]), [z0, z1]);
  return <Inked geo={new THREE.BoxGeometry(0.6, h, Math.abs(z1 - z0))} mat={toon("#ffffff", tex)} pos={[x, h / 2, (z0 + z1) / 2]} outline={0.004} />;
};

/** Map of the village on parchment with red coup marks (the clan's plan) — original drawing. */
export function mapTexture() {
  return canvasTex(768, 512, (g, w, h) => {
    g.fillStyle = "#e8d8b0"; g.fillRect(0, 0, w, h); const r = rng(12);
    g.strokeStyle = "#6a5030"; g.lineWidth = 3; g.strokeRect(16, 16, w - 32, h - 32);
    g.strokeStyle = "#8a7050"; g.lineWidth = 6; g.beginPath(); g.moveTo(40, h * 0.5); g.bezierCurveTo(w * 0.3, h * 0.3, w * 0.6, h * 0.7, w - 40, h * 0.45); g.stroke();
    g.fillStyle = "#9a8060"; for (let i = 0; i < 60; i++) g.fillRect(40 + r() * (w - 80), 40 + r() * (h - 80), 10 + r() * 16, 8 + r() * 12);
    g.strokeStyle = "#b8141e"; g.lineWidth = 6; for (const [x, y] of [[0.3, 0.35], [0.55, 0.6], [0.72, 0.3]]) { g.beginPath(); g.arc(w * x, h * y, 26, 0, 6.283); g.stroke(); }
    g.beginPath(); g.moveTo(w * 0.3, h * 0.35); g.lineTo(w * 0.55, h * 0.6); g.lineTo(w * 0.72, h * 0.3); g.setLineDash([12, 10]); g.stroke(); g.setLineDash([]);
  });
}
export function tatamiTexture() {
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#b8b078"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,80,40,0.35)"; g.lineWidth = 1; for (let y = 0; y < h; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = "#3a3a2a"; g.fillRect(0, 0, w, 10); g.fillRect(0, h / 2, w, 10); }, [4, 4]);
}
export function shojiWallTexture(lit: boolean) {
  return canvasTex(512, 256, (g, w, h) => { g.fillStyle = lit ? "#f0d8a8" : "#d8d0bc"; g.fillRect(0, 0, w, h); g.strokeStyle = "#3e2a1e"; g.lineWidth = 4; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.lineWidth = 12; g.strokeRect(0, 0, w, h); }, [3, 1]);
}
