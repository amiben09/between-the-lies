// "The Scroll That Was Always Empty" — character reference sheet (original channel designs).
// Frame 0: full cast · frame 1: expression sheet (head close-ups).
import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { CanvasFrame } from "../../btl/CanvasFrame";
import { Ctx, H, W, linGrad } from "../../btl/core";
import { Light, person } from "../../btl/people";
const L: Light = { x: 300, y: 200, r: 2000, key: "#ffffff", shade: "#20283a", keyA: 0.18, shadeA: 0.3 };
const c = { x: 0, y: 0, zoom: 1 };
const cast = (g: Ctx) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#9aa49a"], [1, "#55605a"]]); g.fillRect(0, 0, W, H);
  person(g, c, 1, "tailung", "child", { x: 190, y: 900, s: 1.0, facing: 0.2, mouth: 0.6, look: [0.3, -0.4], breathe: 10, armR: [-60, -40], handR: "open" }, L);
  person(g, c, 1, "shifu", "teen", { x: 470, y: 900, s: 1.0, facing: -0.2, mouth: 0.5, breathe: 10 }, L);
  person(g, c, 1, "tailung", "teen", { x: 800, y: 900, s: 0.78, facing: -0.2, mouth: 0.4, look: [-0.2, -0.3], breathe: 10 }, L);
  person(g, c, 1, "tailung", "adult", { x: 290, y: 1850, s: 0.78, facing: 0.25, mouth: -0.4, brow: -0.6, breathe: 10, handL: "fist", handR: "fist" }, L);
  person(g, c, 1, "shifu", "adult", { x: 650, y: 1850, s: 1.0, facing: -0.2, mouth: -0.1, brow: 0.3, breathe: 10 }, L);
  person(g, c, 1, "oogway", "adult", { x: 900, y: 1850, s: 0.9, facing: -0.3, mouth: 0.15, eye: 0.7, breathe: 10 }, L);
};
const faces = (g: Ctx) => {
  g.fillStyle = linGrad(g, 0, 0, 0, H, [[0, "#3a3440"], [1, "#16121a"]]); g.fillRect(0, 0, W, H);
  const row = (k: "tailung" | "shifu", age: "child" | "teen" | "adult", y: number, s: number, ex: { brow: number; mouth: number; eye?: number; open?: number; tear?: number }[]) =>
    ex.forEach((e, i) => person(g, c, 1, k, age, { x: 180 + i * 360, y, s, headOnly: true, still: true, ...e }, L));
  row("tailung", "child", 700 + 520 * 1.1, 1.1, [{ brow: 0.2, mouth: 0.8 }, { brow: 0.5, mouth: -0.3, eye: 1.15 }, { brow: 0.9, mouth: -0.6, tear: 1 }]);
  row("tailung", "adult", 1150 + 1100 * 0.8, 0.8, [{ brow: -0.8, mouth: -0.5, open: 0.6 }, { brow: 0.7, mouth: -0.3, eye: 1.1 }, { brow: 0.9, mouth: -0.5, tear: 0.8 }]);
  row("shifu", "adult", 1650 + 600 * 1.1, 1.1, [{ brow: 0.6, mouth: -0.2, eye: 0.8 }, { brow: 0.9, mouth: 0.1, tear: 1 }, { brow: -0.4, mouth: -0.3 }]);
};
export const TaiLungCharRefs: React.FC<{ sheet?: number }> = () => { const d = useCallback((g: Ctx, f: number) => (f === 0 ? cast(g) : faces(g)), []); return <AbsoluteFill><CanvasFrame draw={d} /></AbsoluteFill>; };
