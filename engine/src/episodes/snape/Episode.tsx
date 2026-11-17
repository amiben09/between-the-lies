import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx } from "../../btl/core";
import { drawEpisode } from "./shots";
import CAPS from "./captions.json";

/** Phrase captions: lower-middle (y ≈ 63-70 %), clear of the top bar, right-side buttons and bottom description. */
const Captions: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const c = (CAPS as { text: string; s: number; e: number; hl: number[] }[]).find((x) => t >= x.s - 0.05 && t < x.e + 0.05);
  if (!c) return null;
  const k = Math.min(1, (t - c.s + 0.05) / 0.12);
  return (
    <div style={{ position: "absolute", left: 90, right: 150, top: 1330, display: "flex", justifyContent: "center", textAlign: "center",
      opacity: k, transform: `translateY(${(1 - k) * 10}px)` }}>
      <div style={{ fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif", fontWeight: 800, fontSize: 62, lineHeight: 1.18, color: "#f4efe6",
        textShadow: "0 3px 0 #0b0810, 0 0 18px rgba(0,0,0,0.85), 3px 0 0 #0b0810, -3px 0 0 #0b0810, 0 -3px 0 #0b0810" }}>
        {c.text.split(" ").map((w, i) => (
          <span key={i} style={{ color: c.hl.includes(i) ? "#7fe0a8" : undefined }}>{w}{" "}</span>
        ))}
      </div>
    </div>
  );
};

export const SnapeEpisode: React.FC = () => {
  const draw = useCallback((g: Ctx, f: number) => drawEpisode(g, f), []);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <CanvasFrame draw={draw} />
      <Captions />
    </AbsoluteFill>
  );
};
