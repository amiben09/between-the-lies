// "Perfect" — 6 styleframes for approval (beats 1, 3-4, 8, 11, 21, 31). Frame index = styleframe.
import React from "react";
import { useCurrentFrame } from "remotion";
import { Light, person } from "../../btl/people";
import { CardActor, CardCanvas, V } from "../../three/kit3d";
import { Stage } from "../itachi/stage";
import { BlastSite, Hideout, MonkeyBomb, TableHall, VerticalCity, ZaunStreet } from "./sets";

const ON = { x: 0, y: 0, zoom: 1 };
const SMOKE: Light = { x: 900, y: 600, r: 1900, key: "#ffa860", shade: "#0a140e", keyA: 0.3, shadeA: 0.5 };
const WARM: Light = { x: 700, y: 200, r: 1900, key: "#ffc070", shade: "#2a1a14", keyA: 0.3, shadeA: 0.35 };
const CANDLE: Light = { x: 540, y: 1500, r: 1500, key: "#ffa050", shade: "#08040a", keyA: 0.38, shadeA: 0.6 };
export const JinxStyleframes: React.FC = () => {
  const i = useCurrentFrame(); const f = 40;
  if (i === 0) { const cam = V(0.4, 0.75, 2.4); return <Stage look="fire" cam={cam} target={V(0, 1.2, -8)} fov={44} vignette={0.6} tint="#2a5a3a" fogScale={0.3}>
    <ZaunStreet f={f} smoke={1} fire />
    <CardActor kind="vi" age="child" at={[0.6, 0, -6]} heightM={1.45} camPos={cam} light={SMOKE} pose={{ back: true, shoulders: 0.4, walk: f * 0.3, breathe: f }} />
    <CardActor kind="jinx" age="child" at={[-0.15, 0, -1.6]} heightM={1.2} camPos={cam} res={0.8} light={SMOKE} pose={{ back: true, kneel: 1, armR: [-150, -10], handR: "open", breathe: f }} />
  </Stage>; }
  if (i === 1) return <Stage look="day" cam={V(0, 42, 95)} target={V(0, 36, -80)} fov={50} vignette={0.4} tint="#e8c890" fogScale={4}><VerticalCity f={f} /></Stage>;
  if (i === 2) { const cam = V(1.2, 1.4, 3.6); return <Stage look="interior" cam={cam} target={V(0.4, 1.2, -1.2)} fov={42} vignette={0.45} tint="#ffa040">
    <Hideout f={f} />
    <CardCanvas at={[0.4, 0, -1.0]} ppm={650} camPos={cam} draw={(g) => {
      person(g, ON, 1, "vander", "adult", { x: 560, y: 1880, s: 1.08, facing: 0, mouth: 0.8, open: 0.2, eye: 0.6, armL: [-150, -20], armR: [150, 20], breathe: f }, WARM);
      person(g, ON, 1, "vi", "child", { x: 300, y: 1880 - 760, s: 1.05, facing: 0.3, mouth: 1, open: 0.4, eye: 0.6, armL: [-60, -40], breathe: f }, WARM);
      person(g, ON, 1, "jinx", "child", { x: 820, y: 1880 - 760, s: 1.0, facing: -0.3, mouth: 1, open: 0.45, eye: 0.6, armR: [60, 40], breathe: f }, WARM);
    }} />
  </Stage>; }
  if (i === 3) return <Stage look="interior" cam={V(-2.75, 1.15, 0.9)} target={V(-3.55, 0.8, 1.35)} fov={36} vignette={0.5} tint="#ffa040"><Hideout f={f} /></Stage>;
  if (i === 4) { const cam = V(1.6, 1.1, 1.4); return <Stage look="fire" cam={cam} target={V(0, 1.0, -2.5)} fov={40} vignette={0.6} tint="#2a5a3a" fogScale={0.3}>
    <ZaunStreet f={f} smoke={1} fire />
    <CardCanvas at={[0, 0, -2.2]} ppm={700} camPos={cam} draw={(g) => {
      person(g, ON, 1, "silco", "adult", { x: 620, y: 1880, s: 1.2, kneel: 1, facing: -0.4, look: [-0.5, 0.4], brow: 0.1, mouth: 0.05, armL: [-70, -60], armR: [-60, -80], breathe: f }, SMOKE);
      person(g, ON, 1, "jinx", "child", { x: 470, y: 1880, s: 1.25, facing: 0.6, look: [0.5, -0.6], brow: 0.9, eye: 0.5, mouth: -0.5, open: 0.2, tear: 1, armL: [105, 45], armR: [125, 30], breathe: f * 2 }, SMOKE);
    }} />
  </Stage>; }
  const cam = V(0.9, 1.25, 0.9); return <Stage look="candle" cam={cam} target={V(0, 1.0, -1.7)} fov={40} vignette={0.65} tint="#7a2a3a">
    <TableHall f={f} candles={0.6} />
    <CardCanvas at={[0, 0, -2.25]} ppm={700} camPos={cam} draw={(g) => {
      person(g, ON, 1, "silco", "adult", { x: 330, y: 1880, s: 1.2, kneel: 1, rot: -14, facing: 0.4, look: [0.6, -0.3], eye: 0.5, mouth: 0.35, armR: [-120, -30], handR: "open", breathe: f * 0.3 }, CANDLE);
      person(g, ON, 1, "jinx", "teen", { x: 700, y: 1880, s: 1.32, kneel: 1, facing: -0.5, look: [-0.7, 0.3], brow: 0.9, eye: 0.6, mouth: -0.5, open: 0.2, tear: 1, armL: [40, 60], breathe: f * 1.5 }, CANDLE);
    }} />
  </Stage>;
};
