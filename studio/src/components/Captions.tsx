// BETWEEN THE LIES caption layer: 1-2 words at a time from words.json, hard swap per group, white bold with a dark
// outline, one accent colour for words marked *like this* in the script (tts.py writes accent: true).
// Measured mechanics (references/production_mechanics.md): centred, ~68 % of frame height, swap on each word.
// Safe zones: nothing in the bottom 18 % (platform UI) or the right 12 % (like/comment rail).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// bundled caption font (Inter Display Black, OFL 1.1): public/fonts/InterDisplay-Black.otf
const FONT_FACE = `@font-face { font-family: 'BTL Caption'; src: url('${staticFile("fonts/InterDisplay-Black.otf")}') format('opentype'); font-weight: 900; }`;
let fontHandle: number | null = null;
if (typeof document !== "undefined" && !document.getElementById("btl-caption-font")) {
  const el = document.createElement("style");
  el.id = "btl-caption-font";
  el.textContent = FONT_FACE;
  document.head.appendChild(el);
  fontHandle = delayRender("captions: font");
  document.fonts.load("900 64px 'BTL Caption'").catch(() => undefined).finally(() => { if (fontHandle !== null) continueRender(fontHandle); fontHandle = null; });
}

export type Word = { word: string; start: number; end: number; line?: number; accent?: boolean };
export type CaptionStyle = {
  y: number;            // vertical centre, fraction of height
  size: number;         // font size in px at 1080 width
  color: string;
  accent: string;
  stroke: string;
  strokePx: number;     // at 1080 width
  maxChars: number;     // max characters per group
  maxWords: number;
  lead: number;         // frames the caption appears before its word (0-3)
  font: string;
};
export const DEFAULT_CAPTION: CaptionStyle = {
  y: 0.68, size: 104, color: "#ffffff", accent: "#f2b544", stroke: "#120d16", strokePx: 11,
  maxChars: 14, maxWords: 2, lead: 2, font: "'BTL Caption', 'Arial Black', 'Helvetica Neue', Arial, sans-serif",
};

export type Group = { words: Word[]; start: number; end: number };

/** group words into 1-2 word captions: break after punctuation, on pauses > 0.25 s, or past maxChars */
export const groupWords = (words: Word[], st: CaptionStyle = DEFAULT_CAPTION): Group[] => {
  const out: Group[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end }); cur = []; };
  words.forEach((w, i) => {
    const len = cur.reduce((n, c) => n + c.word.length + 1, 0) + w.word.length;
    if (cur.length && (cur.length >= st.maxWords || len > st.maxChars || w.start - cur[cur.length - 1].end > 0.25 || w.accent || cur[cur.length - 1].accent)) flush();
    cur.push(w);
    if (/[.,!?;:—…]$/.test(w.word) || i === words.length - 1) flush();
  });
  for (let i = 0; i < out.length - 1; i++) out[i].end = Math.min(Math.max(out[i].end, out[i + 1].start), out[i].end + 0.6);
  return out;
};

const useWords = (src?: string, words?: Word[]) => {
  const [data, setData] = useState<Word[] | null>(words ?? null);
  const [handle] = useState(() => (words ? null : delayRender("captions: loading words.json")));
  useEffect(() => {
    if (words || !src || handle === null) return;
    fetch(staticFile(src)).then((r) => r.json()).then((j: Word[]) => { setData(j); continueRender(handle); })
      .catch((e) => { console.error("captions:", e); setData([]); continueRender(handle); });
  }, [src, words, handle]);
  return data ?? [];
};

export const Captions: React.FC<{ src?: string; words?: Word[]; style?: Partial<CaptionStyle> }> = ({ src, words, style }) => {
  const st = { ...DEFAULT_CAPTION, ...style };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const k = width / 1080;
  const all = useWords(src, words);
  const gs = React.useMemo(() => groupWords(all, st), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = (frame + st.lead) / fps;
  const g = gs.find((x) => t >= x.start && t < x.end + 0.15);
  if (!g) return null;
  const age = frame - Math.round(g.start * fps - st.lead);
  const pop = interpolate(age, [0, 3], [1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 0.1 * width, width: 0.78 * width, top: st.y * height, transform: `translate(0, -50%) scale(${pop})`,
        textAlign: "center", fontFamily: st.font, fontWeight: 900, fontSize: st.size * k, lineHeight: 1.05,
        letterSpacing: -0.5 * k, textTransform: "none", maxHeight: 0.14 * height,
      }}>
        {g.words.map((w, i) => (
          <span key={i} style={{
            color: w.accent ? st.accent : st.color,
            WebkitTextStroke: `${st.strokePx * k}px ${st.stroke}`, paintOrder: "stroke fill",
            textShadow: `0 ${4 * k}px ${10 * k}px rgba(0,0,0,0.45)`,
          }}>{w.word.replace(/^\*|\*$/g, "")}{i < g.words.length - 1 ? " " : ""}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
