// Shared 3D stage: canvas + camera + per-mood lighting/fog + grade overlays.
import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { Light } from "../../btl/people";
import { CameraRig } from "../../three/kit3d";

export type Look = "nightRed" | "night" | "dawn" | "day" | "sunset" | "interior" | "candle" | "storm" | "fire" | "rainDay";
const LOOKS: Record<Look, { fog: [string, number, number]; hemi: [string, string, number]; key: [number[], number, string]; fill: [number[], number, string]; amb: number; bg: string }> = {
  nightRed: { fog: ["#141428", 12, 70], hemi: ["#6a7ac0", "#2a1830", 0.95], key: [[10, 20, -40], 1.0, "#ff6a5a"], fill: [[-6, 12, 14], 0.45, "#9ab0ff"], amb: 0.25, bg: "#0a0a18" },
  night: { fog: ["#141a2e", 14, 70], hemi: ["#6a80c8", "#1a1a28", 0.9], key: [[-10, 20, -30], 0.9, "#b8c8ff"], fill: [[6, 10, 14], 0.35, "#8090c0"], amb: 0.25, bg: "#0a0c18" },
  dawn: { fog: ["#e8b898", 30, 120], hemi: ["#ffd8b0", "#5a4a3a", 0.9], key: [[30, 25, -60], 1.2, "#ffb070"], fill: [[-10, 10, 20], 0.3, "#b0b8ff"], amb: 0.2, bg: "#e8b898" },
  day: { fog: ["#c8d8e8", 30, 110], hemi: ["#e8f0ff", "#6a5a40", 0.95], key: [[20, 30, 10], 1.2, "#fff0d8"], fill: [[-10, 10, 10], 0.35, "#a8c0ff"], amb: 0.25, bg: "#c8d8e8" },
  sunset: { fog: ["#e89870", 20, 90], hemi: ["#ffc890", "#4a3048", 0.9], key: [[-30, 10, -20], 1.3, "#ff9a50"], fill: [[10, 8, 20], 0.3, "#8a90d0"], amb: 0.2, bg: "#e89870" },
  interior: { fog: ["#1a1420", 6, 22], hemi: ["#8a80b8", "#2a1a14", 0.6], key: [[-3, 4, 2], 0.6, "#b8c0ff"], fill: [[3, 3, 3], 0.25, "#ffb070"], amb: 0.2, bg: "#100c14" },
  candle: { fog: ["#140c0a", 5, 16], hemi: ["#a87050", "#1a0c08", 0.5], key: [[2, 4, 2], 0.35, "#ffa050"], fill: [[-3, 3, -2], 0.15, "#6070c0"], amb: 0.15, bg: "#0c0806" },
  storm: { fog: ["#2a3040", 8, 45], hemi: ["#8090b8", "#1a1a22", 0.8], key: [[-8, 20, -10], 0.7, "#c8d4ff"], fill: [[6, 8, 12], 0.3, "#7080a8"], amb: 0.25, bg: "#1a1e28" },
  fire: { fog: ["#2a1410", 20, 110], hemi: ["#ff8a50", "#1a0a0a", 0.8], key: [[0, 15, -50], 1.4, "#ff6a2a"], fill: [[-10, 10, 20], 0.3, "#5060a0"], amb: 0.2, bg: "#2a1410" },
  rainDay: { fog: ["#5a6474", 10, 55], hemi: ["#a0aac0", "#2a2a2a", 0.85], key: [[-10, 20, 5], 0.6, "#c8d0e0"], fill: [[6, 8, 12], 0.3, "#8090a8"], amb: 0.3, bg: "#5a6474" },
};
// Light for the 2D rig drawn onto cards, per look.
export const CARD_LIGHT: Record<Look, Light> = {
  nightRed: { x: 900, y: 200, r: 1900, key: "#ff8a7a", shade: "#0a0a1a", keyA: 0.25, shadeA: 0.55 },
  night: { x: 200, y: 200, r: 1900, key: "#9fb0e8", shade: "#0a0a1a", keyA: 0.3, shadeA: 0.5 },
  dawn: { x: 900, y: 300, r: 2000, key: "#ffc890", shade: "#2a1a2a", keyA: 0.3, shadeA: 0.3 },
  day: { x: 800, y: 200, r: 2100, key: "#fff0d0", shade: "#2a2a3a", keyA: 0.2, shadeA: 0.25 },
  sunset: { x: 150, y: 500, r: 2000, key: "#ffa860", shade: "#2a1a30", keyA: 0.38, shadeA: 0.35 },
  interior: { x: 200, y: 400, r: 1700, key: "#b8c0ff", shade: "#0c0812", keyA: 0.22, shadeA: 0.5 },
  candle: { x: 700, y: 1200, r: 1500, key: "#ffa050", shade: "#08040a", keyA: 0.35, shadeA: 0.62 },
  storm: { x: 300, y: 100, r: 2000, key: "#c8d4ff", shade: "#0a0c14", keyA: 0.25, shadeA: 0.5 },
  fire: { x: 540, y: 1600, r: 1900, key: "#ff7a3a", shade: "#140808", keyA: 0.35, shadeA: 0.5 },
  rainDay: { x: 300, y: 200, r: 2000, key: "#c8d0e0", shade: "#1a1e28", keyA: 0.2, shadeA: 0.4 },
};

export const Stage: React.FC<{ look: Look; cam: THREE.Vector3; target: THREE.Vector3; fov?: number; roll?: number; fogScale?: number; flash?: number; children: React.ReactNode; vignette?: number; tint?: string }> =
  ({ look, cam, target, fov = 42, roll = 0, fogScale = 1, flash = 0, children, vignette = 0.5, tint }) => {
    const L = LOOKS[look];
    return (
      <AbsoluteFill style={{ background: L.bg }}>
        <ThreeCanvas width={1080} height={1920} gl={{ antialias: true }}>
          <CameraRig pos={cam} look={target} fov={fov} roll={roll} />
          <fog attach="fog" args={[L.fog[0], L.fog[1] * fogScale, L.fog[2] * fogScale]} />
          <hemisphereLight args={[L.hemi[0], L.hemi[1], L.hemi[2] + flash * 1.5]} />
          <directionalLight position={L.key[0] as [number, number, number]} intensity={L.key[1] + flash * 2} color={L.key[2]} />
          <directionalLight position={L.fill[0] as [number, number, number]} intensity={L.fill[1]} color={L.fill[2]} />
          <ambientLight intensity={L.amb} />
          {children}
        </ThreeCanvas>
        {tint && <AbsoluteFill style={{ background: tint, mixBlendMode: "soft-light" }} />}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 52%, rgba(6,4,12,${vignette}) 100%)` }} />
      </AbsoluteFill>
    );
  };
