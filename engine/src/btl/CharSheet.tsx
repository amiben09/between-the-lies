import React from "react";
import { AbsoluteFill } from "remotion";
import { CanvasFrame } from "./CanvasFrame";
import { Ctx, H, W, linGrad } from "./core";
import { person, Kind, Age, Pose } from "./people";

const CAM = { x: 0, y: 0, zoom: 1 };
const LIGHT = { x: 200, y: 300, r: 1600, key: "#ffe2b8", shade: "#2a2440", keyA: 0.15, shadeA: 0.3 };
const rows: [Kind, Age, Partial<Pose>][][] = [
  [["snape", "child", { facing: 0.3 }], ["lily", "child", { facing: -0.3, mouth: 0.8 }], ["snape", "teen", { brow: -0.6, mouth: -0.4 }], ["lily", "teen", { brow: 0.6, mouth: -0.3 }]],
  [["snape", "adult", { brow: -0.5, mouth: -0.3, look: [0.4, 0.3] }], ["harry", "child", { brow: -0.3 }], ["neville", "teen", { brow: 0.8, eye: 1.15, mouth: -0.5 }], ["dumbledore", "adult", { mouth: 0.3 }]],
  [["voldemort", "adult", {}], ["harry", "teen", { brow: 0.6, mouth: -0.4 }], ["snape", "adult", { brow: 0.9, eye: 0.8, mouth: -0.5, tear: 1 }], ["snape", "adult", { brow: 0, eye: 1.2, open: 0.5 }]],
];
const draw = (g: Ctx, f: number) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#6b6470"], [1, "#3b3640"]]);
  g.fillRect(0, 0, W, H);
  rows.forEach((row, ri) => row.forEach(([k, a, p], ci) => {
    const s = 0.5;
    person(g, CAM, 1, k, a, { x: 140 + ci * 268, y: 560 + ri * 620, s, breathe: f, ...p }, LIGHT);
  }));
};
export const CharSheet: React.FC = () => <AbsoluteFill style={{ background: "#000" }}><CanvasFrame draw={draw} /></AbsoluteFill>;
