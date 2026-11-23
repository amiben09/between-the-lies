// "The Monster She Made" — character reference sheet (ORIGINAL imagined designs). Frame 0: cast · 1: Scylla's monster form + stone.
import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad } from "../../btl/core";
import { Light, person } from "../../btl/people";
import { scylla } from "../../btl/myth";
const L: Light = { x: 300, y: 200, r: 2000, key: "#ffffff", shade: "#20283a", keyA: 0.18, shadeA: 0.3 };
const c = { x: 0, y: 0, zoom: 1 };
const cast = (g: Ctx) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#9aa8b0"], [1, "#55606a"]]); g.fillRect(0, 0, W, H);
  person(g, c, 1, "circe", "teen", { x: 190, y: 900, s: 0.8, facing: 0.2, mouth: 0.2, brow: 0.3, look: [0.2, 0.2], breathe: 10 }, L);
  person(g, c, 1, "glaucos", "adult", { x: 540, y: 900, s: 0.75, facing: -0.1, mouth: 0.6, breathe: 10, armR: [-40, -60], handR: "open" }, L);
  person(g, c, 1, "seagod", "adult", { x: 880, y: 900, s: 0.7, facing: -0.3, mouth: 0.1, brow: -0.2, eye: 0.85, breathe: 10 }, L);
  person(g, c, 1, "scylla", "teen", { x: 220, y: 1850, s: 0.82, facing: 0.25, mouth: 0.7, brow: -0.3, eye: 0.85, breathe: 10, armR: [-150, -20], handR: "open" }, L);
  person(g, c, 1, "circe", "adult", { x: 560, y: 1850, s: 0.75, facing: -0.1, mouth: -0.2, brow: 0.5, breathe: 10 }, L);
};
const monster = (g: Ctx) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#3a4a5a"], [0.6, "#1a2430"], [1, "#0a1018"]]); g.fillRect(0, 0, W, H);
  scylla(g, c, 300, 1000, 0.42, 30, L, { rise: 1, fear: 1 });
  scylla(g, c, 800, 1000, 0.42, 60, L, { rise: 1, fear: 0.6, stone: 0.6, eyesClosed: 0.6 });
  scylla(g, c, 540, 1880, 0.6, 90, L, { rise: 1, lunge: 0.8, lungeHead: 4, fear: 0.9 });
};
export const ScyllaCharRefs: React.FC = () => { const d = useCallback((g: Ctx, f: number) => (f === 0 ? cast(g) : monster(g)), []); return <AbsoluteFill><CanvasFrame draw={d} /></AbsoluteFill>; };
