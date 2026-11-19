// "Snow Globe" — character reference sheet (original renditions). Frame 0: full bodies; frame 1: faces.
import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad } from "../../btl/core";
import { Light, person } from "../../btl/people";
const L: Light = { x: 300, y: 200, r: 2000, key: "#ffffff", shade: "#20283a", keyA: 0.18, shadeA: 0.3 };
const draw = (g: Ctx, f: number) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#9aa6b8"], [1, "#5a6478"]]); g.fillRect(0, 0, W, H);
  const cam = { x: 0, y: 0, zoom: 1 };
  if (f === 0) {
    person(g, cam, 1, "victor", "adult", { x: 190, y: 900, s: 0.62, facing: 0.2, mouth: 0.2, breathe: 10 }, L);
    person(g, cam, 1, "nora", "adult", { x: 420, y: 900, s: 0.6, facing: -0.2, mouth: 0.4, breathe: 10 }, L);
    person(g, cam, 1, "boyle", "adult", { x: 680, y: 900, s: 0.62, facing: -0.2, mouth: 0.3, brow: -0.2, breathe: 10 }, L);
    person(g, cam, 1, "freeze", "adult", { x: 300, y: 1850, s: 0.75, facing: 0.1, mouth: -0.2, brow: -0.3, breathe: 10 }, L);
    person(g, cam, 1, "batman", "adult", { x: 760, y: 1850, s: 0.72, facing: -0.15, mouth: -0.3, breathe: 10 }, L);
  } else {
    const row = (kind: "victor" | "nora" | "boyle" | "freeze" | "batman", y: number) => [[-0.3, 0.4, 0.3], [0.2, -0.6, -0.3], [0.9, 0.0, -0.4]].forEach(([brow, mouth, f2], i) =>
      person(g, cam, 1, kind, "adult", { x: 200 + i * 340, y: y + 1000 * 1.05, s: 1.05, facing: f2, brow, mouth, still: true, breathe: 0, tear: kind === "nora" && i === 2 ? 1 : 0 }, L));
    row("victor", -820); row("freeze", -420); row("nora", -20); row("boyle", 380); row("batman", 780);
  }
};
export const FreezeCharRefs: React.FC = () => { const f = useCurrentFrame(); const d = useCallback((g: Ctx) => draw(g, f), [f]); return <AbsoluteFill><CanvasFrame draw={d} /></AbsoluteFill>; };
