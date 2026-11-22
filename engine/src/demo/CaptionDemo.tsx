// Captions-only overlay (transparent) for before/after demos: mode "old" = pre-22-Nov caption box, "new" = CaptionBox.
import React from "react";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { Cap, CaptionBox } from "../btl/captions";
import { CAPTION } from "../episodes/jinx/look";
import CAPS from "../episodes/jinx/captions.json";

const Legacy: React.FC = () => { const L = CAPTION;
  const t = useCurrentFrame() / 30; const c = (CAPS as Cap[]).find((x) => t >= x.s - 0.04 && t < x.e); if (!c) return null;
  const k = Math.min(1, (t - c.s + 0.04) / 0.1);
  return <div style={{ position: "absolute", left: L.left, right: L.right, top: L.top, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>
    <div style={{ background: L.plate, borderRadius: L.radius, padding: L.pad, boxShadow: `${L.ring}, ${L.shadow}`, fontFamily: L.font, fontWeight: L.weight, fontSize: L.size, lineHeight: L.lineHeight, color: L.ink, textAlign: "center", textWrap: "balance", maxWidth: L.maxWidth, textShadow: L.textShadow }}>
      {c.text.split(" ").map((w, i) => <span key={i} style={{ color: c.hl.includes(i) ? L.accent : undefined }}>{w}{" "}</span>)}
    </div></div>; };

export const CaptionDemo: React.FC = () => { const mode = (getInputProps() as { mode?: string }).mode ?? "new";
  return <AbsoluteFill>{mode === "old" ? <Legacy /> : <CaptionBox caps={CAPS as Cap[]} look={CAPTION} />}</AbsoluteFill>; };
