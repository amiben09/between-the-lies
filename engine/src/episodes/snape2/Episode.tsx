import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx } from "../../btl/core";
import { drawEpisode } from "./shots";
import CAPS from "./captions.json";

type Cap = { text: string; s: number; e: number; hl: number[] };
/** Phrase captions on a dark translucent plate: legible on every background, never merging with clothing. */
const Captions: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const c = (CAPS as Cap[]).find((x) => t >= x.s - 0.04 && t < x.e);
  if (!c) return null;
  const k = Math.min(1, (t - c.s + 0.04) / 0.1);
  return (
    <div style={{ position: "absolute", left: 56, right: 120, top: 1330, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>
      <div style={{ background: "rgba(8,6,12,0.62)", borderRadius: 22, padding: "14px 30px 18px", boxShadow: "0 0 0 2px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.55)",
        fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: 58, lineHeight: 1.2, color: "#fbf7ef", textAlign: "center", textWrap: "balance", maxWidth: 860,
        textShadow: "0 2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 -2px 0 #000, 0 0 12px rgba(0,0,0,0.9)" }}>
        {c.text.split(" ").map((w, i) => <span key={i} style={{ color: c.hl.includes(i) ? "#8af0b6" : undefined }}>{w}{" "}</span>)}
      </div>
    </div>
  );
};

export const SnapeEpisodeV2: React.FC = () => {
  const draw = useCallback((g: Ctx, f: number) => drawEpisode(g, f), []);
  return (<AbsoluteFill style={{ background: "#000" }}><CanvasFrame draw={draw} /><Captions /></AbsoluteFill>);
};
