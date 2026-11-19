// "Snow Globe" — 6 styleframes for approval (beats 1, 4, 6, 13, 24, 30). Frame index = styleframe.
import React from "react";
import { useCurrentFrame } from "remotion";
import { Light } from "../../btl/people";
import { CardActor, V } from "../../three/kit3d";
import { Stage } from "../itachi/stage";
import { Cell, CryoLab, Gotham, Rooftop, SnowGlobe, Warehouse } from "./sets";

const LAB: Light = { x: 540, y: 900, r: 1600, key: "#9adfff", shade: "#0a1018", keyA: 0.35, shadeA: 0.5 };
const COLD: Light = { x: 300, y: 300, r: 1900, key: "#cfe8ff", shade: "#0a0e18", keyA: 0.3, shadeA: 0.5 };
export const FreezeStyleframes: React.FC = () => {
  const i = useCurrentFrame(); const f = 40;
  if (i === 0) { const cam = V(2.3, 1.6, 2.2); return <Stage look="interior" cam={cam} target={V(0.2, 1.45, -2.4)} fov={40} vignette={0.6} tint="#2a4a6a">
    <CryoLab f={f} frost={0.7} noraCard={<CardActor kind="nora" age="adult" at={[0, 0.35, -0.05]} heightM={1.68} camPos={cam} light={LAB} pose={{ eye: 0.05, mouth: 0.1, armL: [6, 4], armR: [-6, -4], still: true }} />} />
    <CardActor kind="victor" age="adult" at={[0.95, 0, -1.75]} heightM={1.8} camPos={cam} light={LAB} pose={{ facing: -0.7, look: [-0.9, -0.2], brow: 0.6, mouth: 0.15, armL: [100, 30], handL: "open", breathe: f }} />
  </Stage>; }
  if (i === 1) return <Stage look="night" cam={V(0, 100, 70)} target={V(0, 25, -130)} fov={46} fogScale={4} vignette={0.5} tint="#2a2a5a"><Gotham f={f} /></Stage>;
  if (i === 2) { const cam = V(2.4, 41.0, 5.6); return <Stage look="storm" cam={cam} target={V(-0.2, 41.7, 1.8)} fov={42} vignette={0.6} tint="#2a3050" flash={0.4} fogScale={3}>
    <Rooftop f={f} />
    <CardActor kind="batman" age="adult" at={[-0.8, 40.6, 1.8]} heightM={1.9} camPos={cam} light={COLD} pose={{ kneel: 1, facing: -0.3, look: [-0.5, 0.4], brow: -0.5, mouth: -0.4, armL: [30, 40], armR: [-40, -60], breathe: f }} />
  </Stage>; }
  if (i === 3) return <Stage look="interior" cam={V(3.25, 1.12, -0.5)} target={V(3.6, 1.04, -1.15)} fov={34} vignette={0.6} tint="#5a4a3a">
    <CryoLab f={f} frost={0.7} />
  </Stage>;
  if (i === 4) { const cam = V(0.6, 0.5, 2.6); return <Stage look="storm" cam={cam} target={V(0, 1.9, -3)} fov={44} vignette={0.6} tint="#2a4a6a">
    <Warehouse f={f} />
    <CardActor kind="freeze" age="adult" at={[0, 0, -1.2]} heightM={1.95} camPos={cam} spherical light={{ ...COLD, x: 540, y: 200 }} pose={{ facing: 0.05, look: [0, 0.3], brow: -0.4, mouth: -0.3, armR: [-70, -20], handR: "grip", walk: f * 0.25, breathe: f }} />
  </Stage>; }
  const cam = V(0.4, 1.3, 2.2); return <Stage look="interior" cam={cam} target={V(-0.5, 1.0, -1.5)} fov={40} vignette={0.6} tint="#2a3a6a">
    <Cell f={f} />
    <CardActor kind="freeze" age="adult" at={[-0.6, 0.45, -1.35]} heightM={1.95} camPos={cam} light={COLD} pose={{ kneel: 1, facing: 0.2, look: [0.2, 0.9], brow: 0.7, mouth: -0.25, nod: 0.05, armL: [18, 80], armR: [-18, -80], handL: "grip", handR: "grip", breathe: f }} />
    <SnowGlobe pos={[-0.6, 1.0, -1.15]} f={f} s={1.5} glow={1.2} />
  </Stage>;
};
