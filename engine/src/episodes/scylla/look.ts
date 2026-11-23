// "The Monster She Made" — the episode's single look file (palette, 2D card lights, caption style).
import type { Light } from "../../btl/people";
import type { CaptionLook } from "../../btl/captions";
import { CAPTION as BASE } from "../jinx/look";

export const PAL = { sap: "#f0c040", sapHi: "#fff2a0", sea: "#1e4a6a", storm: "#2a3a5a", cove: "#2e8a9a", plumGuilt: "#5a3a4a", stone: "#8a867e", accent: "#f6c94a" } as const;
export const LIGHTS: Record<"SUNSET" | "DAWN" | "DAY" | "NIGHT" | "STORM" | "SAP" | "HALL", Light> = {
  SUNSET: { x: 150, y: 600, r: 2000, key: "#ffa860", shade: "#2a1a30", keyA: 0.36, shadeA: 0.32 },
  DAWN: { x: 900, y: 400, r: 2000, key: "#ffd0a8", shade: "#2a2a3a", keyA: 0.28, shadeA: 0.3 },
  DAY: { x: 800, y: 200, r: 2100, key: "#fff4e0", shade: "#1a3a4a", keyA: 0.2, shadeA: 0.25 },
  NIGHT: { x: 300, y: 200, r: 1900, key: "#a8c0ff", shade: "#0a0c1a", keyA: 0.28, shadeA: 0.55 },
  STORM: { x: 200, y: 100, r: 2000, key: "#c8d4ff", shade: "#0a0c14", keyA: 0.25, shadeA: 0.55 },
  SAP: { x: 540, y: 1700, r: 1800, key: "#ffd060", shade: "#100a08", keyA: 0.45, shadeA: 0.55 },
  HALL: { x: 540, y: 200, r: 2000, key: "#ffe0a0", shade: "#3a2410", keyA: 0.4, shadeA: 0.35 },
};
export const CAPTION: CaptionLook = { ...BASE, accent: PAL.accent };
export const GRADE = { grainOpacity: 0.06 };
/** the woven basket of yellow flowers (OBJECT; carried on the forearm) */
export const basket = (full = 1) => (g: CanvasRenderingContext2D, hand: "L" | "R", x: number, y: number) => { if (hand !== "L") return;
  g.save(); g.translate(x, y + 30); g.fillStyle = "#a8803e"; g.strokeStyle = "#1c121c"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-60, -10); g.lineTo(60, -10); g.lineTo(46, 60); g.lineTo(-46, 60); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = "rgba(60,40,20,0.6)"; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-56 + k * 4, 6 + k * 14); g.lineTo(56 - k * 4, 6 + k * 14); g.stroke(); }
  g.strokeStyle = "#1c121c"; g.lineWidth = 5; g.beginPath(); g.arc(0, -10, 58, Math.PI, 0); g.stroke();
  if (full > 0) for (let k = 0; k < 7 * full; k++) { const fx = -44 + k * 14, fy = -18 - (k % 2) * 14; g.fillStyle = PAL.sap; g.beginPath(); g.arc(fx, fy, 11, 0, 6.283); g.fill(); g.fillStyle = "#c87a1a"; g.beginPath(); g.arc(fx, fy, 4, 0, 6.283); g.fill(); }
  g.restore(); };
