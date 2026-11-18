import React from "react";
import { AbsoluteFill } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad } from "../../btl/core";
import { person } from "../../btl/people";
const CAM = { x: 0, y: 0, zoom: 1 };
const L = { x: 200, y: 300, r: 1600, key: "#ffe2b8", shade: "#2a2440", keyA: 0.15, shadeA: 0.3 };
const draw = (g: Ctx, f: number) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#6b6470"], [1, "#3b3640"]]); g.fillRect(0, 0, W, H);
  person(g, CAM, 1, "itachi", "teen", { x: 170, y: 900, s: 0.75, facing: 0.2, mouth: 0.25, headband: "plain", breathe: f }, L);
  person(g, CAM, 1, "itachi", "adult", { x: 420, y: 900, s: 0.68, facing: -0.2, eyesRed: 1, brow: -0.2, headband: "scratched", breathe: f }, L);
  person(g, CAM, 1, "sasuke", "child", { x: 650, y: 900, s: 0.85, facing: 0.3, mouth: 0.6, breathe: f }, L);
  person(g, CAM, 1, "sasuke", "teen", { x: 900, y: 900, s: 0.75, facing: -0.3, brow: -0.6, mouth: -0.3, breathe: f }, L);
  person(g, CAM, 1, "itachi", "teen", { x: 280, y: 2900, s: 1.9, facing: 0.15, look: [0.2, 0.3], brow: 0.3, mouth: 0.2, headband: "plain", breathe: f }, L);
  person(g, CAM, 1, "itachi", "adult", { x: 800, y: 3050, s: 1.9, facing: -0.15, eyesRed: 1, brow: -0.1, eye: 0.8, headband: "scratched", breathe: f }, L);
};
export const ItachiCharRefs: React.FC = () => <AbsoluteFill style={{ background: "#000" }}><CanvasFrame draw={draw} /></AbsoluteFill>;
