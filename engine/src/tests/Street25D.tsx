// 3D-necessity test — renderer A: our existing Canvas2D 2.5D engine, best-effort version of the SAME shot spec.
// The street is a painted one-point-perspective layer (fixed viewpoint); "camera" = zoom/pan of layers; the window
// entry has to be a zoom + crossfade into a separately painted room.
import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { CanvasFrame } from "../btl/CanvasFrame";
import { Ctx, camAt, clamp, glide, lerp, linGrad, post, radGrad, ramp, rng, W, H } from "../btl/core";
import { layer } from "../btl/envs";
import { person } from "../btl/people";
import { BEATS, LETTER_TEXT, SHOP_SIGNS } from "./streetSpec";

// one-point perspective helper for the painted street (viewpoint fixed at x=3.4, y=1.9, looking down -z)
const VP = { x: W * 0.40, y: H * 0.47 }, FOCAL = 1250;
const pj = (x: number, y: number, z: number) => ({ x: VP.x + ((x - 3.4) / z) * FOCAL, y: VP.y - ((y - 1.9) / z) * FOCAL });
function quad(g: Ctx, a: number[], b: number[], c: number[], d: number[], fill: string | CanvasGradient) {
  const p = [a, b, c, d].map(([x, y, z]) => pj(x, y, z)); g.beginPath(); g.moveTo(p[0].x, p[0].y); p.slice(1).forEach((q) => g.lineTo(q.x, q.y)); g.closePath(); g.fillStyle = fill; g.fill();
  g.strokeStyle = "rgba(20,16,26,0.8)"; g.lineWidth = 2; g.stroke();
}
const WALLS = ["#b5654a", "#d9c7a0", "#6f8fa8", "#c98f5a", "#8a6f9a", "#a8b58a"];

const paintStreet = (g: Ctx, w: number, h: number) => {
  const sky = linGrad(g, 0, 0, 0, h * 0.5, [[0, "#2a2350"], [0.7, "#8a4f7a"], [1, "#f0946a"]]); g.fillStyle = sky; g.fillRect(-300, -300, w + 600, h + 600);
  // road + pavement
  quad(g, [-3, 0, 1.2], [3, 0, 1.2], [3, 0, 60], [-3, 0, 60], "#4a4652");
  quad(g, [3, 0.15, 1.2], [5.5, 0.15, 1.2], [5.5, 0.15, 60], [3, 0.15, 60], "#9a948a");
  quad(g, [-5.5, 0.15, 1.2], [-3, 0.15, 1.2], [-3, 0.15, 60], [-5.5, 0.15, 60], "#8a847a");
  for (let z = 1.5; z < 60; z *= 1.18) { const a = pj(3, 0.15, z), b = pj(5.5, 0.15, z); g.strokeStyle = "rgba(60,56,50,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  // facades, far to near so near ones overlap
  const r = rng(5); const blocks: { z0: number; z1: number; h: number; k: number }[] = [];
  let z = 1.2, k = 0; while (z < 50) { const wz = 3.6 + r() * 2.4; blocks.push({ z0: z, z1: z + wz, h: 6.5 + r() * 4, k }); z += wz; k++; }
  for (const side of [1, -1]) for (const b of [...blocks].reverse()) {
    const X = side * 5.5;
    quad(g, [X, 0, b.z0], [X, b.h, b.z0], [X, b.h, b.z1], [X, 0, b.z1], WALLS[(b.k + (side < 0 ? 3 : 0)) % WALLS.length]);
    for (let fl = 0; fl < 2; fl++) for (let c = 0; c < 2; c++) { // windows
      const zz = b.z0 + (c + 0.3) * (b.z1 - b.z0) / 2, y0 = 3.4 + fl * 2.6; const lit = (b.k + fl + c) % 3 === 0;
      quad(g, [X, y0, zz], [X, y0 + 1.4, zz], [X, y0 + 1.4, zz + 0.9], [X, y0, zz + 0.9], lit ? "#ffcf80" : "#2b3552");
    }
    quad(g, [X, 0, b.z0 + 0.4], [X, 2.2, b.z0 + 0.4], [X, 2.2, b.z0 + 1.35], [X, 0, b.z0 + 1.35], "#3a2a24");
    if (side === 1 && b.k % 2 === 0) { quad(g, [X, 2.45, b.z0 + 0.2], [X, 3.0, b.z0 + 0.2], [X, 3.0, b.z1 - 0.2], [X, 2.45, b.z1 - 0.2], "#24302a"); const m = pj(X, 2.72, (b.z0 + b.z1) / 2); g.fillStyle = "#f2e2b4"; g.font = `bold ${Math.min(46, Math.max(6, 900 / ((b.z0 + b.z1) / 2)))}px Georgia`; g.textAlign = "center"; g.fillText(SHOP_SIGNS[b.k % SHOP_SIGNS.length], m.x, m.y + 4); }
  }
  // THE lit window on the right at z = 7 (target)
  quad(g, [5.5, 0.85, 6.4], [5.5, 2.25, 6.4], [5.5, 2.25, 7.6], [5.5, 0.85, 7.6], radGrad(g, pj(5.5, 1.5, 7).x, pj(5.5, 1.5, 7).y, 0, 120, [[0, "#ffe6b0"], [1, "#e09a4a"]]));
  const t = pj(5.5, 1.5, 7); g.fillStyle = "rgba(120,40,40,0.5)"; g.fillRect(t.x - 30, t.y - 4, 60, 30); // hint of table inside
};
const paintProps = (g: Ctx) => { // lamp posts + pillar box at their depths
  for (const [x, z] of [[3.3, 6.6], [3.3, 12], [-3.3, 9], [3.3, 24]] as [number, number][]) {
    const a = pj(x, 0.15, z), b = pj(x, 3.6, z); g.strokeStyle = "#1f2a2a"; g.lineWidth = Math.max(2, 160 / z); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    g.fillStyle = "#ffd890"; g.fillRect(b.x - 70 / z, b.y - 100 / z, 140 / z, 100 / z);
    g.fillStyle = radGrad(g, b.x, b.y, 0, 900 / z, [[0, "rgba(255,190,110,0.45)"], [1, "rgba(255,190,110,0)"]]); g.fillRect(b.x - 900 / z, b.y - 900 / z, 1800 / z, 1800 / z);
  }
  const p = pj(3.6, 0.15, 11.5), q = pj(3.6, 1.45, 11.5); g.fillStyle = "#c0261f"; g.fillRect(p.x - 330 / 11.5, q.y, 660 / 11.5, p.y - q.y);
};
const paintRoom = (g: Ctx, w: number, h: number) => {
  g.fillStyle = "#e8d6b8"; g.fillRect(-300, -300, w + 600, h + 600);
  g.fillStyle = "#c9a07a"; for (let y = 0; y < h * 0.62; y += 70) for (let x = (y / 70) % 2 ? 35 : 0; x < w; x += 70) { g.beginPath(); g.arc(x, y, 10, 0, 6.283); g.fill(); }
  g.fillStyle = "#6a4a32"; g.fillRect(-300, h * 0.62, w + 600, h);
  // table in perspective + checked cloth
  g.fillStyle = "#b8342a"; g.beginPath(); g.moveTo(w * 0.12, h * 0.6); g.lineTo(w * 0.88, h * 0.6); g.lineTo(w * 1.05, h * 0.92); g.lineTo(-w * 0.05, h * 0.92); g.closePath(); g.fill();
  g.save(); g.clip(); g.fillStyle = "#f4f0ea"; for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) { g.fillRect(i * w / 16 - w * 0.05, h * 0.6 + j * h * 0.04, w / 16, h * 0.04); } g.restore();
  g.fillStyle = "#ffe0a0"; g.beginPath(); g.moveTo(w * 0.18, h * 0.42); g.lineTo(w * 0.32, h * 0.42); g.lineTo(w * 0.28, h * 0.35); g.lineTo(w * 0.22, h * 0.35); g.closePath(); g.fill();
  g.fillStyle = "#c9a95a"; g.fillRect(w * 0.245, h * 0.42, w * 0.03, h * 0.18);
};
function letterInsert(g: Ctx, cx: number, cy: number, s: number) {
  g.save(); g.translate(cx, cy); g.rotate(-0.06); g.scale(s, s);
  g.fillStyle = "#fbf6ea"; g.fillRect(-170, -120, 340, 240); g.strokeStyle = "#c8c0b0"; g.lineWidth = 2;
  for (let y = -70; y < 120; y += 46) { g.beginPath(); g.moveTo(-150, y + 10); g.lineTo(150, y + 10); g.stroke(); }
  g.fillStyle = "#2a3a7a"; g.font = "italic 32px 'DejaVu Serif', Georgia, serif"; LETTER_TEXT.forEach((t, i) => g.fillText(t, -140, -76 + i * 46));
  g.restore();
}

function walkerScreen(f: number) { // world z (distance from fixed viewpoint) as she walks away: 2.6 → 6.6 m
  const t = clamp((f - BEATS.follow[0]) / (BEATS.follow[1] - BEATS.follow[0])); const z = lerp(2.6, 6.6, 0.85 * t + 0.15 * glide(t));
  const feet = pj(4.4, 0.15, z); return { x: feet.x, y: feet.y, s: (1.75 / z) * 0.72, walking: t < 0.97 };
}

const draw = (g: Ctx, f: number) => {
  const cam = camAt([
    { f: 0, c: { x: 0, y: 0, zoom: 1.0 } }, { f: BEATS.follow[1], c: { x: 60, y: 20, zoom: 1.12 } },
    { f: BEATS.stop[1], c: { x: 270, y: 15, zoom: 1.6 } }, { f: BEATS.through[1], c: { x: 315, y: 15, zoom: 3.6 } }], f);
  const inRoom = ramp(f, BEATS.through[0] + 6, BEATS.through[1]);
  layer(g, cam, "t25_street", 0.85, paintStreet, 0);
  layer(g, cam, "t25_props", 0.9, (gg) => paintProps(gg), 0);
  const wk = walkerScreen(f);
  person(g, cam, 0.9, "lily", "adult", { x: wk.x, y: wk.y, s: wk.s, back: true, coat: "#3f5a7a", coatHi: "#5a7a9a", walk: wk.walking ? f * 0.36 : undefined, tilt: f > BEATS.stop[0] + 10 ? 4 : 0, breathe: f },
    { x: 900, y: 300, r: 1900, key: "#ffc890", shade: "#1a1430", keyA: 0.3, shadeA: 0.45 });
  post(g, f, { tint: "#8a5a8a", tintAlpha: 0.2, vignette: 0.45, lift: "#0c0a12" });
  if (inRoom > 0) { // crossfade into the separately painted room, then the letter insert
    g.save(); g.globalAlpha = inRoom;
    const rc = { x: 0, y: lerp(0, 160, ramp(f, BEATS.insert[0], BEATS.insert[1])), zoom: lerp(1.0, 1.25, ramp(f, BEATS.through[1] - 10, BEATS.insert[1])) };
    layer(g, rc, "t25_room", 1, paintRoom, 0);
    const ins = ramp(f, BEATS.insert[0] - 6, BEATS.insert[1]);
    g.save(); g.translate(W / 2, H / 2); g.scale(rc.zoom, rc.zoom); g.translate(-W / 2, -H / 2 - rc.y);
    letterInsert(g, W * 0.47, H * 0.74, lerp(0.75, 1.9, ins)); g.restore();
    post(g, f, { tint: "#ffb070", tintAlpha: 0.2, vignette: 0.4, lift: "#100a08" });
    g.restore();
  }
};

export const Street25D: React.FC = () => {
  const d = useCallback((g: Ctx, f: number) => draw(g, f), []);
  return <AbsoluteFill style={{ background: "#000" }}><CanvasFrame draw={d} /></AbsoluteFill>;
};
