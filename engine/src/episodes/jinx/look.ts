// "Perfect" (Jinx) — the episode's single look file: palette, 2D card lights, caption style, grade.
// Beat code imports from here; no new inline hex values in Episode.tsx.
import type { Light } from "../../btl/people";
import type { CaptionLook } from "../../btl/captions";

export const PAL = {
  zaunGreen: "#2a5a3a", shimmer: "#8aff9a", pinkAccent: "#ff7ac0", hextechBlue: "#5ab8ff",
  candle: "#ffa050", warmMemory: "#ffc070", betrayalPlum: "#7a2a3a", ink: "#fbf7ef", night: "#08040a",
} as const;

export const LIGHTS: Record<"SMOKE" | "WARM" | "CANDLE" | "GREEN", Light> = {
  SMOKE: { x: 900, y: 600, r: 1900, key: "#ffa860", shade: "#0a140e", keyA: 0.3, shadeA: 0.5 },
  WARM: { x: 700, y: 200, r: 1900, key: PAL.warmMemory, shade: "#2a1a14", keyA: 0.3, shadeA: 0.35 },
  CANDLE: { x: 540, y: 1500, r: 1500, key: PAL.candle, shade: PAL.night, keyA: 0.38, shadeA: 0.6 },
  GREEN: { x: 540, y: 300, r: 1800, key: PAL.shimmer, shade: "#06100a", keyA: 0.25, shadeA: 0.55 },
};

export const CAPTION: CaptionLook = {
  top: 1330, left: 56, right: 120, maxWidth: 860, // right inset keeps clear of the Shorts/TikTok button rail
  font: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif", size: 58, weight: 800, lineHeight: 1.2,
  ink: PAL.ink, accent: PAL.pinkAccent, plate: "rgba(8,6,12,0.62)",
  ring: "0 0 0 2px rgba(255,255,255,0.06)", shadow: "0 10px 40px rgba(0,0,0,0.55)",
  textShadow: "0 2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 0 0 12px rgba(0,0,0,0.9)",
  radius: 22, pad: "14px 30px 18px",
};

export const GRADE = { grainOpacity: 0.06, endFade: 28 / 30 /* seconds */ };
