// Shared caption box with the studio motion grammar (CLAUDE.md → "Motion grammar").
// Entrance: plate fades + rises + scales 0.94→1 + blur→sharp (ease-out-expo); words ripple in 1 frame apart (a 3-frame
// stagger left a big empty plate on 2-line captions — found in frame QA); the highlight word turns accent + pops when spoken. Exit is ~33 % shorter than the entrance (ease-in) and, when the next caption
// follows immediately, finishes exactly as the last word ends so two plates never share the screen.
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export type Cap = { text: string; s: number; e: number; hl: number[] };
export type CaptionLook = {
  top: number; left: number; right: number; maxWidth: number;
  font: string; size: number; weight: number; lineHeight: number;
  ink: string; accent: string; plate: string; ring: string; shadow: string; textShadow: string;
  radius: number; pad: string;
};
/** all timing in seconds → frames via fps (no magic frame numbers) */
export const CAPTION_MOTION = { enter: 0.2, exit: 0.133, stagger: 1 / 30, staggerCap: 0.2, word: 0.13, lead: 0.04 };

const c01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(t)));
export const easeInCubic = (t: number) => c01(t) ** 3;

/** Frame-exact state of one caption — pure, so QA tools and demos can reuse it. */
export function captionState(caps: Cap[], i: number, f: number, fps: number) {
  const m = CAPTION_MOTION, c = caps[i], next = caps[i + 1];
  const s = Math.round((c.s - m.lead) * fps), e = Math.round(c.e * fps);
  const enter = Math.round(m.enter * fps), exit = Math.round(m.exit * fps);
  const gapToNext = next ? Math.round((next.s - m.lead) * fps) - e : Infinity;
  // exit after the last word when there is room, otherwise end exactly on it; never eat into the entrance
  const x0 = gapToNext >= exit ? e : Math.max(s + enter, e - exit);
  const x1 = x0 + exit;
  if (f < s || f >= x1) return null;
  const kin = easeOutExpo((f - s) / enter), kout = easeInCubic((f - x0) / exit);
  return { local: f - s, kin, kout };
}

export const CaptionBox: React.FC<{ caps: Cap[]; look: CaptionLook }> = ({ caps, look }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), m = CAPTION_MOTION;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < caps.length; i++) {
    const st = captionState(caps, i, f, fps); if (!st) continue;
    const { kin, kout, local } = st, c = caps[i];
    const op = kin * (1 - kout), y = (1 - kin) * 18 - kout * 10, sc = (0.94 + 0.06 * kin) * (1 - 0.02 * kout), blur = (1 - kin) * 6 + kout * 3;
    const words = c.text.split(" "), stg = Math.round(m.stagger * fps), cap = Math.round(m.staggerCap * fps), wd = Math.round(m.word * fps);
    out.push(<div key={i} style={{ position: "absolute", left: look.left, right: look.right, top: look.top, display: "flex", justifyContent: "center",
      opacity: op, transform: `translateY(${y}px) scale(${sc})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      <div style={{ background: look.plate, borderRadius: look.radius, padding: look.pad, boxShadow: `${look.ring}, ${look.shadow}`, fontFamily: look.font,
        fontWeight: look.weight, fontSize: look.size, lineHeight: look.lineHeight, color: look.ink, textAlign: "center", textWrap: "balance", maxWidth: look.maxWidth, textShadow: look.textShadow }}>
        {words.map((w, j) => { const d = Math.min(j * stg, cap), k = easeOutExpo((local - d) / wd), hl = c.hl.includes(j);
          // highlight fires when the word is SPOKEN (estimated by character position inside the caption's time span)
          const said = Math.round(((c.s + (c.e - c.s) * (words.slice(0, j).join(" ").length / c.text.length)) - c.s + m.lead) * fps);
          const lit = hl ? c01((local - said) / 3) : 0;
          const pk = hl && local >= said ? 1 - spring({ frame: local - said, fps, config: { damping: 10, mass: 0.5 } }) : 0, pop = 1 + 0.08 * pk; // ≤ 8 %: more collides with neighbours (QA)
          // the space stays OUTSIDE the inline-block so text-wrap: balance still sees normal word breaks
          return <React.Fragment key={j}><span style={{ display: "inline-block", opacity: k, color: lit > 0.5 ? look.accent : undefined,
            transformOrigin: "50% 100%", transform: `translateY(${(1 - k) * 10 - pk * 8}px) scale(${pop})` }}>{w.replace(/-/g, "‑")}</span>{j < words.length - 1 ? " " : null}</React.Fragment>; })}
      </div></div>);
  }
  return <>{out}</>;
};
