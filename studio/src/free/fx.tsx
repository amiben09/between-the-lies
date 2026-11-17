// Atmosphere helpers for the free episode scenes (pure SVG/CSS, deterministic per frame).
import React from "react";
import { useCurrentFrame } from "remotion";

export const W = 1080, H = 1920;
const hash = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

/** falling snow / dust. area = [x0, y0, x1, y1] */
export const Snow: React.FC<{ n?: number; area?: [number, number, number, number]; speed?: number; size?: number; color?: string; drift?: number }> =
  ({ n = 90, area = [0, 0, W, H], speed = 2.2, size = 5, color = "rgba(235,245,255,0.85)", drift = 0.6 }) => {
    const f = useCurrentFrame();
    const [x0, y0, x1, y1] = area, hh = y1 - y0;
    return (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: n }, (_, i) => {
          const sp = speed * (0.5 + hash(i, 1));
          const y = y0 + ((hash(i, 2) * hh + f * sp) % hh);
          const x = x0 + hash(i, 3) * (x1 - x0) + Math.sin(f * 0.04 + i) * 14 * drift;
          return <circle key={i} cx={x} cy={y} r={size * (0.4 + hash(i, 4))} fill={color} />;
        })}
      </svg>
    );
  };

/** low drifting vapor / fog banks */
export const Vapor: React.FC<{ y?: number; color?: string; opacity?: number; n?: number; speed?: number; h?: number }> =
  ({ y = 1500, color = "230,245,255", opacity = 0.5, n = 9, speed = 1.2, h = 260 }) => {
    const f = useCurrentFrame();
    return (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: "blur(28px)" }}>
        {Array.from({ length: n }, (_, i) => {
          const x = ((hash(i, 5) * (W + 600) + f * speed * (0.5 + hash(i, 6))) % (W + 600)) - 300;
          const yy = y + (hash(i, 7) - 0.5) * h;
          return <ellipse key={i} cx={x} cy={yy} rx={220 + 160 * hash(i, 8)} ry={70 + 50 * hash(i, 9)} fill={`rgba(${color},${opacity * (0.5 + 0.5 * hash(i, 10))})`} />;
        })}
      </svg>
    );
  };

/** frost crystals growing from a point (u: 0..1 growth) */
export const Frost: React.FC<{ cx: number; cy: number; r: number; u: number; color?: string; seed?: number }> = ({ cx, cy, r, u, color = "rgba(225,245,255,0.9)", seed = 1 }) => {
  const arms = 14;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <circle cx={cx} cy={cy} r={r * u} fill={`rgba(200,235,255,${0.18 * u})`} />
      {Array.from({ length: arms }, (_, i) => {
        const a = (i / arms) * Math.PI * 2 + hash(i, seed) * 0.4;
        const L = r * u * (0.6 + 0.4 * hash(i, seed + 1));
        const x2 = cx + Math.cos(a) * L, y2 = cy + Math.sin(a) * L;
        const b1 = a + 0.5, b2 = a - 0.5, m = 0.55;
        const mx = cx + Math.cos(a) * L * m, my = cy + Math.sin(a) * L * m;
        return (
          <g key={i} stroke={color} strokeWidth={3} strokeLinecap="round">
            <line x1={cx} y1={cy} x2={x2} y2={y2} />
            <line x1={mx} y1={my} x2={mx + Math.cos(b1) * L * 0.25} y2={my + Math.sin(b1) * L * 0.25} />
            <line x1={mx} y1={my} x2={mx + Math.cos(b2) * L * 0.25} y2={my + Math.sin(b2) * L * 0.25} />
          </g>
        );
      })}
    </svg>
  );
};

/** soft light pool / glow */
export const Glow: React.FC<{ cx: number; cy: number; r: number; color: string; opacity?: number }> = ({ cx, cy, r, color, opacity = 1 }) => (
  <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: "50%", opacity,
    background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: "screen", pointerEvents: "none" }} />
);

/** flicker 0..1 */
export const flicker = (f: number, seed = 1, depth = 0.25) => 1 - depth * (0.5 + 0.5 * Math.sin(f * 0.9 + seed) * Math.sin(f * 0.37 + seed * 3));

/** full-frame colour wash (lighting mood) */
export const Wash: React.FC<{ color: string; mode?: React.CSSProperties["mixBlendMode"]; opacity?: number }> = ({ color, mode = "multiply", opacity = 1 }) => (
  <div style={{ position: "absolute", inset: 0, background: color, mixBlendMode: mode, opacity, pointerEvents: "none" }} />
);

/** rain streaks inside a rect */
export const Rain: React.FC<{ area: [number, number, number, number]; n?: number }> = ({ area, n = 70 }) => {
  const f = useCurrentFrame();
  const [x0, y0, x1, y1] = area, hh = y1 - y0;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const y = y0 + ((hash(i, 2) * hh + f * (18 + 10 * hash(i, 1))) % hh);
        const x = x0 + hash(i, 3) * (x1 - x0);
        return <line key={i} x1={x} y1={y} x2={x - 4} y2={Math.min(y1, y + 34)} stroke="rgba(190,215,255,0.45)" strokeWidth={2} />;
      })}
    </svg>
  );
};

/** shards flying from a point after t0 (frames) */
export const Shards: React.FC<{ cx: number; cy: number; t0: number; n?: number; color?: string }> = ({ cx, cy, t0, n = 40, color = "#bfeaff" }) => {
  const f = useCurrentFrame();
  const t = f - t0;
  if (t < 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const a = hash(i, 1) * Math.PI * 2, v = 14 + 26 * hash(i, 2);
        const x = cx + Math.cos(a) * v * t, y = cy + Math.sin(a) * v * t + 0.9 * t * t;
        const s = 8 + 16 * hash(i, 3), r = (f * 9 + i * 40) % 360;
        return <polygon key={i} points={`${-s},0 0,${-s * 0.6} ${s},0 0,${s * 0.8}`} transform={`translate(${x},${y}) rotate(${r})`}
          fill={color} stroke="#ffffff" strokeWidth={1.5} opacity={Math.max(0, 1 - t / 40)} />;
      })}
    </svg>
  );
};
