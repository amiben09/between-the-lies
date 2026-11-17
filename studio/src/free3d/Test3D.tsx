import React from "react";
import { AbsoluteFill } from "remotion";
import { SCENES3D } from "./scenes3d";
/** one 3D shot rendered on its own (10 fps, 540x960); the episode editor upsamples it */
export const Shot3D: React.FC<{ id: number; dur: number }> = ({ id, dur }) => {
  const Scene = SCENES3D[id];
  return <AbsoluteFill style={{ background: "#000" }}>{Scene ? <Scene dur={dur} /> : null}</AbsoluteFill>;
};
export const Test3D: React.FC = () => <Shot3D id={1} dur={30} />;

/** look check: frame i shows scene i+1 frozen at its 15th frame */
import { Freeze, useCurrentFrame } from "remotion";
import { SCENES3D as ALL } from "./scenes3d";
export const Preview3D: React.FC = () => {
  const f = useCurrentFrame();
  const Scene = ALL[f + 1];
  return <AbsoluteFill style={{ background: "#000" }}>{Scene ? <Freeze frame={15}><Scene dur={30} /></Freeze> : null}</AbsoluteFill>;
};
