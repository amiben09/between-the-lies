// Draws one engine character (toon.ts bean-head card) into a 600x1000 canvas every frame, plus BETWEEN THE LIES
// overlays: round glasses (Victor), the glass dome helmet + cyan coolant tubes (the ice man).
// Head geometry for an adult standing card: head centre ~(300, 309), half-width 118 (see toon.ts BUILD / headBlob).
import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { Pen, bodyFront, Expr, FrontOpts, Outfit } from "../videos/bridge/toon";

export type Overlay = "glasses" | "dome" | "none";
export type ToonProps = {
  outfit: Outfit; expr?: Expr; mode?: FrontOpts["mode"]; facing?: -1 | 0 | 1; seed?: number;
  x: number; y: number; h: number;          // placement in the 1080x1920 scene: x centre, y = feet, h = card height
  rot?: number; flip?: boolean; blink?: number; phase?: number; tilt?: number; headTilt?: number; wave?: number;
  overlay?: Overlay; opacity?: number; tint?: string;  // tint: CSS filter colour wash for lighting (e.g. "brightness(.7)")
  autoBlink?: boolean;
};

const HEAD = { x: 300, y: 309, r: 118 };

export const Toon: React.FC<ToonProps> = (p) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  const seed = p.seed ?? 3;
  // blink every ~2 s for 4 frames, offset by seed (eyes stay shut if blink=1 is passed)
  const auto = p.autoBlink !== false && ((f + seed * 17) % 64) < 4 ? 1 : 0;
  const blink = p.blink ?? auto;
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, 600, 1000);
    const pen = new Pen(g);
    bodyFront(pen, p.outfit, {
      expr: p.expr ?? "neutral", mode: p.mode ?? "stand", facing: p.facing ?? 0, seed, blink,
      phase: p.phase ?? 0, tilt: p.tilt ?? 0, headTilt: p.headTilt ?? 0, wave: p.wave,
    });
    if (p.overlay === "glasses") {
      g.lineWidth = 5; g.strokeStyle = "#2a2230";
      const fx = (p.facing ?? 0) * 16;
      for (const dx of [-31, 31]) { g.beginPath(); g.arc(HEAD.x + fx + dx, HEAD.y + 2, 19, 0, Math.PI * 2); g.stroke(); }
      g.beginPath(); g.moveTo(HEAD.x + fx - 12, HEAD.y); g.lineTo(HEAD.x + fx + 12, HEAD.y); g.stroke();
    }
    if (p.overlay === "dome") {
      // coolant tubes on the chest
      for (const dx of [-38, 0, 38]) {
        const grd = g.createLinearGradient(0, 470, 0, 600);
        grd.addColorStop(0, "#7ff3ff"); grd.addColorStop(1, "#1fb6d6");
        g.fillStyle = grd; g.strokeStyle = "#241726"; g.lineWidth = 5;
        g.beginPath(); g.roundRect(HEAD.x + dx - 13, 470, 26, 120, 12); g.fill(); g.stroke();
      }
      // glass dome
      const dg = g.createRadialGradient(HEAD.x - 50, HEAD.y - 70, 10, HEAD.x, HEAD.y, 170);
      dg.addColorStop(0, "rgba(255,255,255,0.45)"); dg.addColorStop(0.5, "rgba(190,235,255,0.16)"); dg.addColorStop(1, "rgba(150,210,240,0.30)");
      g.fillStyle = dg; g.beginPath(); g.ellipse(HEAD.x, HEAD.y - 10, 158, 168, 0, 0, Math.PI * 2); g.fill();
      g.lineWidth = 7; g.strokeStyle = "rgba(220,245,255,0.9)"; g.stroke();
      g.lineWidth = 4; g.strokeStyle = "#241726"; g.beginPath(); g.ellipse(HEAD.x, HEAD.y - 10, 162, 172, 0, 0, Math.PI * 2); g.stroke();
      // collar ring
      g.fillStyle = "#8d97a3"; g.beginPath(); g.ellipse(HEAD.x, HEAD.y + 150, 120, 26, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      // highlight streak
      g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 9; g.lineCap = "round";
      g.beginPath(); g.arc(HEAD.x, HEAD.y - 10, 135, Math.PI * 1.1, Math.PI * 1.35); g.stroke();
    }
  });
  const w = p.h * 0.6;
  // lying down (|rot| > 45): (x, y) is the body centre and we rotate about the card centre; otherwise (x, y) = feet
  const lying = Math.abs(p.rot ?? 0) > 45;
  return (
    <canvas ref={ref} width={600} height={1000} style={{
      position: "absolute", left: p.x - w / 2, top: lying ? p.y - p.h * 0.62 : p.y - p.h, width: w, height: p.h,
      transform: `${p.flip ? "scaleX(-1) " : ""}rotate(${p.rot ?? 0}deg)`, transformOrigin: lying ? "50% 62%" : "50% 97%",
      opacity: p.opacity ?? 1, filter: p.tint,
    }} />
  );
};

// ---------------- the cast (original designs, matching the character sheet palette) ----------------
export const VICTOR: Outfit = { jacket: "#ece8df", pants: "#6b6f78", boots: "#4a3a30", hat: "hair", hair: "#efe3bf", buttons: "#c9c4b8" };
export const FREEZE: Outfit = { jacket: "#c3ced9", pants: "#aab5c2", boots: "#5d6773", hat: "hair", hair: "#e9f1f7", skin: "#bfdcef", belt: "#5d6773" };
export const NORA: Outfit = { jacket: "#9fc4e8", pants: "#9fc4e8", boots: "#5a4a40", hat: "hair", hair: "#3a2418", dress: "#9fc4e8" };
export const BOYLE: Outfit = { jacket: "#1f2a4f", pants: "#1f2a4f", boots: "#141414", hat: "hair", hair: "#1c1b20", buttons: "#e8c45a", build: "stout" };
export const GUARD: Outfit = { jacket: "#6b6f75", pants: "#5a5e64", boots: "#202020", hat: "cap", cap: "#4a4e54", belt: "#2a2a2a", build: "stout" };
export const GUEST = (v: number): Outfit => {
  const c = ["#7a2f4a", "#2f4a7a", "#b08a3a", "#3a6a5a", "#5a3a7a", "#8a4a2a"][v % 6];
  return v % 2 ? { jacket: c, pants: c, boots: "#222", hat: "hair", hair: ["#3a2418", "#c9a46a", "#1c1b20"][v % 3], dress: c }
    : { jacket: "#1c1c22", pants: "#1c1c22", boots: "#111", hat: "hair", hair: ["#1c1b20", "#5a3b2a", "#9a9a9a"][v % 3] };
};
