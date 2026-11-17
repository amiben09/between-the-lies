// BETWEEN THE LIES · Episode 1 (Mr. Freeze) · FREE version: 20 hand-built 2D scenes (SVG sets + engine characters +
// atmosphere). Every scene takes the frame count since the shot started (local) and the shot length (dur, frames).
// Sets are original; characters are our own bean-head designs. No paid generation.
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { Toon, VICTOR, FREEZE, NORA, BOYLE, GUARD, GUEST } from "./Toon";
import { Snow, Vapor, Frost, Glow, flicker, Wash, Rain, Shards, W, H } from "./fx";

type SP = { dur: number };
const S: React.CSSProperties = { position: "absolute", inset: 0 };
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const useLocal = () => useCurrentFrame();

// ---------------- reusable set pieces ----------------
const Gradient: React.FC<{ top: string; bottom: string }> = ({ top, bottom }) => (
  <div style={{ ...S, background: `linear-gradient(180deg, ${top}, ${bottom})` }} />
);

const LabBack: React.FC<{ dark?: number }> = ({ dark = 0 }) => {
  const f = useLocal();
  return (
    <svg width={W} height={H} style={S}>
      <defs>
        <linearGradient id="lw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f1d2b" /><stop offset="1" stopColor="#1d3344" /></linearGradient>
        <linearGradient id="tube" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1aa7c4" /><stop offset=".5" stopColor="#9ff6ff" /><stop offset="1" stopColor="#1aa7c4" /></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#lw)" />
      {/* tall arched window with frost */}
      <path d="M380 220 Q540 80 700 220 V760 H380 Z" fill="#26476a" stroke="#0a0f18" strokeWidth={10} />
      <path d="M540 120 V760 M380 480 H700" stroke="#0a0f18" strokeWidth={8} />
      {/* machines */}
      {[60, 820].map((x, i) => (
        <g key={i}>
          <rect x={x} y={520} width={200} height={900} rx={18} fill="#2c3d4d" stroke="#0a0f18" strokeWidth={8} />
          {[0, 1, 2].map((k) => <rect key={k} x={x + 30 + k * 52} y={600} width={34} height={360} rx={16} fill="url(#tube)" opacity={0.55 + 0.45 * flicker(f, k + i * 3, 0.4)} stroke="#0a0f18" strokeWidth={5} />)}
          <circle cx={x + 100} cy={1050} r={40} fill="#5b6b7b" stroke="#0a0f18" strokeWidth={6} />
          <rect x={x + 40} y={1140} width={120} height={14} fill={i ? "#ff5a4a" : "#62ffb0"} opacity={0.5 + 0.5 * flicker(f, i, 0.8)} />
        </g>
      ))}
      {/* pipes */}
      <path d="M0 470 H1080 M0 430 H1080" stroke="#3b4e60" strokeWidth={22} />
      <rect x={0} y={1420} width={W} height={500} fill="#162430" />
      <path d="M0 1420 H1080" stroke="#0a0f18" strokeWidth={8} />
      {dark ? <rect width={W} height={H} fill="#000" opacity={dark} /> : null}
    </svg>
  );
};

/** upright glass chamber with someone sleeping inside */
const Chamber: React.FC<{ x: number; y: number; w: number; h: number; on?: number; frost?: number; children?: React.ReactNode }> = ({ x, y, w, h, on = 1, frost = 0.3, children }) => {
  const f = useLocal();
  const glow = on * flicker(f, 2, 0.15);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: w / 2, overflow: "hidden",
        background: `radial-gradient(ellipse at 50% 55%, rgba(120,240,255,${0.55 * glow}) 0%, rgba(20,90,120,${0.5 * glow + 0.2}) 70%)` }}>
        {children}
        <div style={{ position: "absolute", inset: 0, background: `rgba(225,245,255,${frost})`, mixBlendMode: "screen" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: w / 2, border: "10px solid #0a0f18", boxShadow: `0 0 ${120 * glow}px rgba(90,230,255,${0.8 * glow})` }} />
      <div style={{ position: "absolute", left: -20, right: -20, top: -40, height: 70, background: "#3b4e60", border: "8px solid #0a0f18", borderRadius: 14 }} />
      <div style={{ position: "absolute", left: -20, right: -20, bottom: -50, height: 80, background: "#3b4e60", border: "8px solid #0a0f18", borderRadius: 14 }} />
      <div style={{ position: "absolute", left: w * 0.18, top: h * 0.08, width: 18, height: h * 0.7, borderRadius: 9, background: "rgba(255,255,255,0.35)" }} />
    </div>
  );
};

const SnowGlobe: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => {
  const f = useLocal();
  const spin = Math.cos(f * 0.12);
  return (
    <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r * 1.25 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 2 * r, height: 2 * r, borderRadius: "50%", overflow: "hidden",
        background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.55), rgba(140,200,240,0.35) 45%, rgba(40,80,130,0.55))",
        border: "6px solid rgba(230,248,255,0.95)", boxShadow: "0 0 60px rgba(160,230,255,0.6)" }}>
        {/* tiny dancer: a twirling figure (dark hair, pale blue dress) */}
        <svg width={2 * r} height={2 * r} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${r},${r * 1.25}) scale(${spin},1)`}>
            <path d={`M0 ${-r * 0.55} L${-r * 0.32} 0 H${r * 0.32} Z`} fill="#bcd9f2" stroke="#2a2a3a" strokeWidth={3} />
            <circle cx={0} cy={-r * 0.66} r={r * 0.12} fill="#f3d6be" stroke="#2a2a3a" strokeWidth={3} />
            <path d={`M${-r * 0.12} ${-r * 0.7} q${r * 0.12} ${-r * 0.16} ${r * 0.24} 0 q${r * 0.05} ${r * 0.18} ${r * 0.1} ${r * 0.22}`} fill="#3a2418" />
            <line x1={0} y1={-r * 0.5} x2={-r * 0.3} y2={-r * 0.8} stroke="#2a2a3a" strokeWidth={4} />
            <line x1={0} y1={-r * 0.5} x2={r * 0.3} y2={-r * 0.8} stroke="#2a2a3a" strokeWidth={4} />
          </g>
          {Array.from({ length: 26 }, (_, i) => {
            const y = ((i * 37 + f * (1.5 + (i % 3))) % (2 * r));
            const x = (i * 53) % (2 * r) + Math.sin(f * 0.05 + i) * 8;
            return <circle key={i} cx={x} cy={y} r={3 + (i % 3)} fill="#fff" opacity={0.9} />;
          })}
        </svg>
      </div>
      <div style={{ position: "absolute", left: r * 0.25, top: 2 * r - 10, width: r * 1.5, height: r * 0.45, background: "linear-gradient(#cfd8e2,#7d8a98)", border: "5px solid #2a2a3a", borderRadius: 12 }} />
    </div>
  );
};

const IceWalls: React.FC = () => (
  <svg width={W} height={H} style={S}>
    <rect width={W} height={H} fill="#0a1426" />
    {Array.from({ length: 14 }, (_, i) => {
      const x = (i * 97) % W, h2 = 260 + (i * 71) % 420;
      return <polygon key={i} points={`${x},0 ${x + 60},0 ${x + 30},${h2}`} fill="#6fb6e0" opacity={0.35 + (i % 3) * 0.15} stroke="#cdeeff" strokeWidth={2} />;
    })}
    <path d="M0 1450 Q540 1380 1080 1450 V1920 H0 Z" fill="#1d3a5a" />
  </svg>
);

const City: React.FC<{ y: number; lit?: boolean }> = ({ y, lit = true }) => (
  <svg width={W} height={H} style={S}>
    {Array.from({ length: 16 }, (_, i) => {
      const x = i * 72 - 20, h2 = 180 + ((i * 131) % 380);
      return (
        <g key={i}>
          <rect x={x} y={y - h2} width={66} height={h2 + 600} fill="#0d1424" />
          {lit && Array.from({ length: 10 }, (_, k) => ((i * 7 + k * 3) % 4 === 0 ? <rect key={k} x={x + 10 + (k % 3) * 18} y={y - h2 + 20 + Math.floor(k / 3) * 34} width={10} height={14} fill="#ffd27a" opacity={0.85} /> : null))}
        </g>
      );
    })}
  </svg>
);

// ---------------- scenes ----------------
export const S01: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  const u = clamp(f / dur);
  return (
    <div style={S}>
      <LabBack />
      <Chamber x={560} y={1500} w={420} h={760} frost={0.15 + 0.35 * u}>
        <Toon outfit={NORA} expr="smile_closed" blink={1} x={210} y={720} h={700} seed={7} autoBlink={false} />
      </Chamber>
      <Frost cx={520} cy={1020} r={260} u={u} />
      <Toon outfit={VICTOR} expr="longing" facing={1} x={250} y={1820} h={1100} seed={3} overlay="glasses" wave={0.6} />
      <Vapor y={1700} opacity={0.55} />
      <Glow cx={560} cy={1100} r={520} color="rgba(90,220,255,0.35)" />
    </div>
  );
};

export const S02: React.FC<SP> = () => (
  <div style={S}>
    <IceWalls />
    <Toon outfit={FREEZE} expr="longing" mode="sit" x={540} y={1900} h={1500} seed={11} overlay="dome" />
    <SnowGlobe cx={540} cy={1330} r={170} />
    <Snow n={60} speed={1.2} size={4} />
    <Glow cx={540} cy={1250} r={420} color="rgba(150,220,255,0.45)" />
  </div>
);

export const S03: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  const closing = f > dur * 0.6 ? 1 : 0;
  return (
    <div style={S}>
      <Gradient top="#3a2618" bottom="#1a110c" />
      <Glow cx={820} cy={520} r={560} color="rgba(255,190,110,0.55)" />
      <svg width={W} height={H} style={S}>
        <rect x={120} y={1220} width={900} height={520} rx={30} fill="#e9dfcf" stroke="#2a1d14" strokeWidth={10} />
        <rect x={100} y={1080} width={130} height={700} rx={20} fill="#6b4a32" stroke="#2a1d14" strokeWidth={10} />
        <rect x={250} y={1150} width={260} height={120} rx={40} fill="#fffaf0" stroke="#2a1d14" strokeWidth={8} />
        <line x1={820} y1={520} x2={820} y2={900} stroke="#2a1d14" strokeWidth={10} />
        <path d="M720 520 L920 520 L870 420 L770 420 Z" fill="#f2c27a" stroke="#2a1d14" strokeWidth={8} />
      </svg>
      <Toon outfit={NORA} expr={closing ? "smile_closed" : "pained"} blink={closing} x={560} y={1330} h={800} rot={-90} seed={7} autoBlink={!closing} />
      <Toon outfit={VICTOR} expr="grief" mode="sit" facing={-1} x={820} y={1860} h={1050} seed={3} overlay="glasses" />
      <Wash color="rgba(255,200,140,0.25)" mode="soft-light" />
    </div>
  );
};

export const S04: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  return (
    <div style={S}>
      <Gradient top="#0c1424" bottom="#1a1410" />
      <svg width={W} height={H} style={S}>
        <rect x={140} y={200} width={800} height={700} fill="#1c3354" stroke="#0a0f18" strokeWidth={12} />
        <path d="M540 200 V900 M140 550 H940" stroke="#0a0f18" strokeWidth={10} />
      </svg>
      <Rain area={[150, 210, 930, 890]} />
      <Glow cx={250} cy={1150} r={420} color="rgba(255,190,110,0.55)" />
      <Toon outfit={VICTOR} expr={f > dur * 0.5 ? "restrained_anger" : "hollow"} mode="sit" x={560} y={1700} h={1100} seed={3} overlay="glasses" headTilt={f > dur * 0.5 ? 0 : 0.2} />
      <svg width={W} height={H} style={S}>
        <rect x={60} y={1480} width={960} height={60} fill="#5a3a24" stroke="#2a1d14" strokeWidth={8} />
        {[0, 1, 2].map((i) => <rect key={i} x={140 + i * 230} y={1420} width={180} height={70} fill="#9fb6c8" stroke="#2a1d14" strokeWidth={5} transform={`rotate(${(i - 1) * 6} ${230 + i * 230} 1455)`} />)}
        <path d="M200 1480 L250 1250 L330 1250" stroke="#2a1d14" strokeWidth={10} fill="none" />
        <path d="M290 1230 L380 1230 L360 1290 L310 1290 Z" fill="#f2c27a" stroke="#2a1d14" strokeWidth={6} />
      </svg>
    </div>
  );
};

export const S05: React.FC<SP> = () => {
  const f = useLocal();
  return (
    <div style={S}>
      <LabBack />
      <svg width={W} height={H} style={S}>
        <circle cx={780} cy={1080} r={90} fill="none" stroke="#c7d3de" strokeWidth={16} transform={`rotate(${f * 6} 780 1080)`} />
        <path d="M780 990 V1170 M690 1080 H870" stroke="#c7d3de" strokeWidth={10} transform={`rotate(${f * 6} 780 1080)`} />
      </svg>
      <Toon outfit={VICTOR} expr="stern" facing={1} x={500} y={1800} h={1050} seed={3} overlay="glasses" wave={0.7} />
      <Vapor y={1500} opacity={0.7} speed={3} />
      <Vapor y={1150} opacity={0.35} speed={2} n={6} />
      <Wash color="rgba(170,255,220,0.12)" mode="screen" />
    </div>
  );
};

export const S06: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  return (
    <div style={S}>
      <LabBack dark={0.35} />
      <Chamber x={620} y={1640} w={480} h={1250} frost={0.2 + 0.3 * clamp(f / dur)}>
        <Toon outfit={NORA} expr="smile_closed" blink={1} x={240} y={1180} h={1050} seed={7} autoBlink={false} />
      </Chamber>
      <Toon outfit={VICTOR} expr="longing" facing={1} x={170} y={1900} h={1100} seed={3} overlay="glasses" />
      <Frost cx={430} cy={1100} r={220} u={clamp(f / dur)} />
      <Vapor y={1700} opacity={0.5} />
    </div>
  );
};

export const S07: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  return (
    <div style={S}>
      <Gradient top="#0a0e1c" bottom="#2a1410" />
      <City y={1050} />
      <svg width={W} height={H} style={S}>
        <rect x={0} y={0} width={110} height={H} fill="#5a1418" /><rect x={970} y={0} width={110} height={H} fill="#5a1418" />
      </svg>
      <Glow cx={260} cy={900} r={520} color="rgba(255,200,90,0.5)" />
      <Toon outfit={BOYLE} expr={f > dur * 0.55 ? "smile" : "cold"} mode="sit" x={540} y={1650} h={1150} seed={21} />
      <svg width={W} height={H} style={S}>
        <rect x={40} y={1420} width={1000} height={500} fill="#3a1e14" stroke="#120806" strokeWidth={10} />
        <rect x={360} y={1380} width={300} height={50} fill="#f3ead6" stroke="#120806" strokeWidth={5} />
        <line x1={460} y1={1395} x2={460 + 160 * clamp(f / (dur * 0.5))} y2={1410} stroke="#a31d1d" strokeWidth={8} />
        <rect x={760} y={1350} width={60} height={70} fill="rgba(220,160,90,0.7)" stroke="#120806" strokeWidth={5} />
      </svg>
      <Wash color="rgba(255,190,90,0.15)" mode="soft-light" />
    </div>
  );
};

export const S08: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  const open = clamp(f / 8);
  const walk = clamp(f / dur);
  return (
    <div style={S}>
      <div style={{ ...S, background: "radial-gradient(circle at 50% 40%, #ffffff 0%, #9fb4c8 35%, #1a2430 80%)" }} />
      {[1, -1, 0].map((side, i) => (
        <Toon key={i} outfit={i === 2 ? BOYLE : GUARD} expr="stern" mode="stroll" phase={(f / 18 + i * 0.3) % 1}
          x={540 + side * (260 + 120 * walk)} y={1500 + 300 * walk} h={(i === 2 ? 900 : 820) + 500 * walk} seed={21 + i} tint="brightness(0.55)" />
      ))}
      <svg width={W} height={H} style={S}>
        <rect x={-540 * open} y={0} width={560} height={H} fill="#3b4e60" stroke="#0a0f18" strokeWidth={14} />
        <rect x={520 + 540 * open} y={0} width={560} height={H} fill="#3b4e60" stroke="#0a0f18" strokeWidth={14} />
      </svg>
      <Vapor y={1750} opacity={0.6} speed={4} />
    </div>
  );
};

export const S09: React.FC<SP> = () => {
  const f = useLocal();
  return (
    <div style={S}>
      <LabBack />
      <Chamber x={540} y={1300} w={360} h={900} frost={0.3}>
        <Toon outfit={NORA} expr="smile_closed" blink={1} x={180} y={860} h={780} seed={7} autoBlink={false} />
      </Chamber>
      <Toon outfit={VICTOR} expr="pleading" x={540} y={1880} h={1000} seed={3} overlay="glasses" wave={1} tilt={Math.sin(f * 0.3) * 0.04} />
      <Toon outfit={GUARD} expr="stern" x={120} y={1960} h={1150} seed={22} facing={1} />
      <Toon outfit={GUARD} expr="stern" x={960} y={1960} h={1150} seed={23} facing={-1} />
      <Vapor y={1750} opacity={0.5} />
    </div>
  );
};

export const S10: React.FC<SP> = () => {
  const f = useLocal();
  const on = Math.floor(f / 12) % 2 === 0;
  return (
    <div style={S}>
      <LabBack dark={0.6} />
      <Toon outfit={VICTOR} expr="pleading" x={430} y={1700} h={360} seed={3} overlay="glasses" wave={1} />
      <Toon outfit={BOYLE} expr="cold" x={640} y={1700} h={380} seed={21} />
      <svg width={W} height={H} style={S}>
        <rect x={500} y={0} width={60} height={240} fill="#2a2f36" />
        <g transform="rotate(18 600 330)">
          <rect x={380} y={250} width={520} height={200} rx={30} fill="#d9dde2" stroke="#0a0f18" strokeWidth={12} />
          <rect x={880} y={280} width={70} height={140} fill="#2a2f36" stroke="#0a0f18" strokeWidth={10} />
          <circle cx={430} cy={350} r={78} fill="#111" stroke="#0a0f18" strokeWidth={10} />
          <circle cx={430} cy={350} r={40} fill="#1c3a5a" />
          <circle cx={830} cy={300} r={18} fill={on ? "#ff2a2a" : "#4a1010"} />
        </g>
      </svg>
      {on ? <Glow cx={800} cy={420} r={160} color="rgba(255,40,40,0.8)" /> : null}
    </div>
  );
};

export const S11: React.FC<SP> = () => {
  const f = useLocal();
  const hit = 14;
  const fall = clamp((f - hit) / 18);
  return (
    <div style={S}>
      <LabBack />
      <Toon outfit={BOYLE} expr="restrained_anger" facing={-1} x={740} y={1700} h={940} seed={21} tilt={-0.12 * clamp(f / hit)} />
      <Toon outfit={VICTOR} expr="shock" mode={fall > 0 ? "fall" : "stand"} x={430 - 40 * fall} y={1700} h={900} seed={3} overlay="glasses" rot={-25 * fall} />
      <svg width={W} height={H} style={S}>
        <rect x={40} y={1560} width={520} height={60} fill="#5b6b7b" stroke="#0a0f18" strokeWidth={8} />
        {f < hit && [0, 1, 2, 3].map((i) => <rect key={i} x={90 + i * 110} y={1440} width={60} height={120} rx={20} fill="#6fe0ff" stroke="#0a0f18" strokeWidth={6} />)}
      </svg>
      <Shards cx={300} cy={1500} t0={hit} n={50} />
      {f >= hit ? <Vapor y={1700} opacity={0.55 * clamp((f - hit) / 6)} speed={8} n={10} h={300} /> : null}
      {f >= hit && f < hit + 4 ? <div style={{ ...S, background: "#fff", opacity: 0.8 }} /> : null}
    </div>
  );
};

export const S12: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  const u = clamp(f / dur);
  return (
    <div style={S}>
      <Gradient top="#14243a" bottom="#0a1424" />
      <Toon outfit={{ ...VICTOR, skin: u > 0.3 ? "#cfe6f5" : undefined }} expr="tears" x={560} y={1250} h={1300} rot={-88} seed={3} overlay="glasses" />
      <Frost cx={300} cy={1280} r={600} u={u} />
      <div style={{ ...S, background: `linear-gradient(90deg, rgba(160,220,255,${0.45 * u}), rgba(0,0,0,0) ${30 + 50 * u}%)`, mixBlendMode: "screen" }} />
      <Vapor y={1150} opacity={0.4 + 0.2 * Math.sin(f * 0.2)} n={4} speed={0.6} h={80} />
      <Snow n={40} speed={0.6} size={3} />
    </div>
  );
};

export const S13: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  const on = Math.max(0, 1 - f / (dur * 0.6)) * (f % 7 < 2 ? 0.3 : 1);
  return (
    <div style={S}>
      <LabBack dark={0.7} />
      <Chamber x={540} y={1650} w={480} h={1250} on={on} frost={0.75}>
        <Toon outfit={NORA} expr="neutral" blink={1} x={240} y={1180} h={1050} seed={7} autoBlink={false} opacity={0.35} tint="brightness(0.4)" />
      </Chamber>
      <Snow n={30} speed={0.4} size={3} color="rgba(180,210,240,0.5)" />
    </div>
  );
};

export const S14: React.FC<SP> = () => {
  const f = useLocal();
  const alarm = Math.floor(f / 10) % 2 === 0;
  return (
    <div style={S}>
      <IceWalls />
      <svg width={W} height={H} style={S}>
        <path d="M0 0 L380 700 L380 1300 L0 1920 Z" fill="#26476a" opacity={0.8} />
        <path d="M1080 0 L700 700 L700 1300 L1080 1920 Z" fill="#26476a" opacity={0.8} />
      </svg>
      {alarm ? <Wash color="rgba(255,40,40,0.25)" mode="screen" /> : null}
      <Toon outfit={FREEZE} expr="cold" mode="stroll" phase={(f / 20) % 1} x={540} y={1600 + f * 1.2} h={1200 + f * 4} seed={11} overlay="dome" />
      <Frost cx={120} cy={900} r={300} u={clamp(f / 40)} /><Frost cx={960} cy={1000} r={300} u={clamp((f - 10) / 40)} seed={4} />
      <Vapor y={1800} opacity={0.6} speed={2} />
    </div>
  );
};

export const S15: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  const u = clamp(f / dur);
  return (
    <div style={S}>
      <Gradient top="#2a1a10" bottom="#3a2414" />
      <svg width={W} height={H} style={S}>
        {[200, 540, 880].map((x, i) => (
          <g key={i}>
            <line x1={x} y1={0} x2={x} y2={180} stroke="#c9a24a" strokeWidth={6} />
            <path d={`M${x - 120} 200 Q${x} 330 ${x + 120} 200`} fill="none" stroke="#ffe3a0" strokeWidth={10} />
            {[-90, -45, 0, 45, 90].map((d, k) => <circle key={k} cx={x + d} cy={230 + Math.abs(d) * -0.3 + 40} r={9} fill="#fff6d0" />)}
          </g>
        ))}
        <rect x={300} y={720} width={480} height={320} fill="#4a2a18" stroke="#120806" strokeWidth={8} />
      </svg>
      <Glow cx={540} cy={300} r={600} color="rgba(255,210,120,0.55)" />
      <Toon outfit={BOYLE} expr={u > 0.4 ? "shock" : "smile"} x={540} y={1000} h={380} seed={21} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Toon key={i} outfit={GUEST(i)} expr="shock" mode="stroll" phase={(f / 10 + i * 0.2) % 1} x={120 + i * 170 + (i % 2 ? 1 : -1) * 120 * u} y={1350 + (i % 3) * 60} h={560} seed={30 + i} flip={i % 2 === 0} />
      ))}
      <Toon outfit={FREEZE} expr="cold" x={880} y={2050} h={1150} seed={11} overlay="dome" tint="brightness(0.4)" />
      <Vapor y={1700} opacity={0.75} speed={3} n={12} h={400} />
      <Wash color={`rgba(110,210,255,${0.25 * u})`} mode="screen" />
    </div>
  );
};

export const S16: React.FC<SP> = ({ dur }) => {
  const f = useLocal();
  const ice = clamp(f / (dur * 0.7));
  return (
    <div style={S}>
      <Gradient top="#0f2034" bottom="#2a1a10" />
      <Glow cx={540} cy={200} r={500} color="rgba(255,220,140,0.4)" />
      <Toon outfit={BOYLE} expr="shock" x={540} y={1750} h={1300} seed={21} wave={1} tilt={Math.sin(f * 0.8) * 0.03} />
      <div style={{ position: "absolute", left: 160, right: 160, bottom: 0, height: 170 + 620 * ice,
        background: "linear-gradient(180deg, rgba(200,240,255,0.85), rgba(90,180,230,0.9))", border: "8px solid #e8f8ff",
        clipPath: "polygon(0% 12%, 12% 0%, 30% 8%, 46% 0%, 62% 10%, 80% 0%, 100% 9%, 100% 100%, 0% 100%)" }} />
      <Frost cx={540} cy={1920 - 170 - 620 * ice} r={300} u={ice} />
      <Snow n={40} speed={0.8} size={3} />
    </div>
  );
};

export const S17: React.FC<SP> = () => {
  const f = useLocal();
  const sway = Math.sin(f * 0.15) * 30;
  return (
    <div style={S}>
      <Gradient top="#0c1830" bottom="#1d3046" />
      <Glow cx={700} cy={600} r={700} color="rgba(200,230,255,0.45)" />
      <Toon outfit={FREEZE} expr="restrained_anger" x={760} y={1400} h={900} seed={11} overlay="dome" />
      {/* original cloaked figure: pure silhouette, no emblem */}
      <svg width={W} height={H} style={S}>
        <path d={`M120 1920 L180 ${900} Q260 620 330 560 L330 470 Q330 400 380 400 Q430 400 430 470 L430 560 Q520 620 600 ${900 + sway} L700 1920 Z`} fill="#06070c" />
        <path d={`M600 ${900 + sway} Q680 1300 760 1920 L700 1920 Z`} fill="#0d1018" />
      </svg>
      <Vapor y={1650} opacity={0.6} speed={2} />
    </div>
  );
};

export const S18: React.FC<SP> = () => {
  const f = useLocal();
  const flash = f % 23 < 2 || f % 31 < 2;
  const kick = (Math.floor(f / 6) % 4) / 3;
  return (
    <div style={S}>
      <Gradient top="#0a0c12" bottom="#151a22" />
      <svg width={W} height={H} style={S}>
        {Array.from({ length: 9 }, (_, i) => {
          const x = 70 + (i % 3) * 320, y = 120 + Math.floor(i / 3) * 300;
          return (
            <g key={i}>
              <rect x={x} y={y} width={300} height={270} rx={26} fill="#2a2a2a" stroke="#050505" strokeWidth={10} />
              <rect x={x + 20} y={y + 20} width={260} height={200} rx={18} fill={`rgb(${150 + (f * 7 + i * 30) % 40},${150 + (f * 7 + i * 30) % 40},${150 + (f * 7 + i * 30) % 40})`} />
              {/* grainy footage: suit figure kicks lab-coat figure */}
              <g stroke="#111" strokeWidth={6} strokeLinecap="round" fill="#111">
                <circle cx={x + 190} cy={y + 80} r={16} /><line x1={x + 190} y1={y + 96} x2={x + 190} y2={y + 160} />
                <line x1={x + 190} y1={y + 160} x2={x + 190 - 50 * kick} y2={y + 150 - 20 * kick} />
                <circle cx={x + 100 - 20 * kick} cy={y + 90 + 10 * kick} r={14} fill="#eee" /><line x1={x + 100 - 20 * kick} y1={y + 104} x2={x + 90 - 30 * kick} y2={y + 170} stroke="#eee" />
              </g>
            </g>
          );
        })}
      </svg>
      <Toon outfit={BOYLE} expr="shock" x={540} y={1960} h={1100} seed={21} wave={1} />
      {flash ? <div style={{ ...S, background: "#fff", opacity: 0.6 }} /> : null}
      <Wash color="rgba(140,170,220,0.15)" mode="screen" />
    </div>
  );
};

export const S19: React.FC<SP> = () => (
  <div style={S}>
    <Gradient top="#0b1626" bottom="#05090f" />
    <svg width={W} height={H} style={S}>
      <rect x={680} y={260} width={260} height={300} fill="#2a4a70" stroke="#05070c" strokeWidth={12} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={700 + i * 62} y={260} width={14} height={300} fill="#05070c" />)}
      <rect x={60} y={1500} width={960} height={120} fill="#2c3d4d" stroke="#05070c" strokeWidth={10} />
      <path d="M440 0 L540 120 L640 0" fill="#1a2430" />
    </svg>
    <div style={{ ...S, background: "radial-gradient(ellipse at 50% 10%, rgba(170,220,255,0.35), rgba(0,0,0,0) 55%)" }} />
    <Toon outfit={FREEZE} expr="tears" mode="sit" x={540} y={1650} h={1300} seed={11} overlay="dome" headTilt={0.25} />
    <SnowGlobe cx={540} cy={1240} r={150} />
    <Frost cx={80} cy={900} r={260} u={1} /><Frost cx={1000} cy={1300} r={240} u={1} seed={5} />
  </div>
);

export const S20: React.FC<SP> = () => (
  <div style={S}>
    <Gradient top="#050a18" bottom="#16243c" />
    <City y={1800} lit={false} />
    <svg width={W} height={H} style={S}>
      <circle cx={860} cy={260} r={90} fill="#e8f0ff" />
      <path d="M240 1920 V560 L420 360 L600 560 V1920 Z" fill="#141a26" stroke="#05070c" strokeWidth={10} />
      <rect x={350} y={820} width={140} height={190} fill="#4fd4ff" opacity={0.75} />
      {[0, 1, 2].map((i) => <rect key={i} x={370 + i * 45} y={820} width={10} height={190} fill="#05070c" />)}
    </svg>
    <Glow cx={420} cy={915} r={260} color="rgba(80,220,255,0.6)" />
    <Snow n={140} speed={1.6} size={4} />
  </div>
);

export const SCENES: Record<number, React.FC<SP>> = {
  1: S01, 2: S02, 3: S03, 4: S04, 5: S05, 6: S06, 7: S07, 8: S08, 9: S09, 10: S10,
  11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16, 17: S17, 18: S18, 19: S19, 20: S20,
};
export { interpolate };
