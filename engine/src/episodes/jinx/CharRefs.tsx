// "Perfect" — character reference sheet (original renditions). Frame 0: full cast.
import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad } from "../../btl/core";
import { Light, person } from "../../btl/people";
const L: Light = { x: 300, y: 200, r: 2000, key: "#ffffff", shade: "#20283a", keyA: 0.18, shadeA: 0.3 };
const draw = (g: Ctx) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#8a9a90"], [1, "#4a5a54"]]); g.fillRect(0, 0, W, H);
  const c = { x: 0, y: 0, zoom: 1 };
  person(g, c, 1, "jinx", "child", { x: 170, y: 900, s: 0.85, facing: 0.2, mouth: 0.5, breathe: 10 }, L);
  person(g, c, 1, "vi", "child", { x: 390, y: 900, s: 0.85, facing: -0.1, mouth: 0.3, brow: -0.2, breathe: 10 }, L);
  person(g, c, 1, "mylo", "teen", { x: 620, y: 900, s: 0.65, facing: -0.2, mouth: -0.2, brow: -0.4, breathe: 10 }, L);
  person(g, c, 1, "vander", "adult", { x: 880, y: 900, s: 0.66, facing: -0.3, mouth: 0.3, breathe: 10 }, L);
  person(g, c, 1, "vi", "teen", { x: 190, y: 1850, s: 0.75, facing: 0.2, mouth: -0.2, brow: -0.3, breathe: 10 }, L);
  person(g, c, 1, "jinx", "teen", { x: 520, y: 1850, s: 0.78, facing: 0.0, mouth: 0.7, open: 0.2, brow: 0.2, breathe: 10 }, L);
  person(g, c, 1, "silco", "adult", { x: 860, y: 1850, s: 0.72, facing: -0.25, mouth: 0.1, brow: -0.2, breathe: 10 }, L);
};
export const JinxCharRefs: React.FC = () => { const d = useCallback((g: Ctx) => draw(g), []); return <AbsoluteFill><CanvasFrame draw={d} /></AbsoluteFill>; };
