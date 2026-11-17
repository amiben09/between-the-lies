// 3D stage for the free episode: ThreeCanvas + per-frame camera (slow dolly for real parallax) + soft shadows +
// "render look" post stack: N8AO ambient occlusion -> depth of field -> bloom -> ACES filmic tone map -> vignette -> grain.
import React, { useLayoutEffect } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, DepthOfField, N8AO, ToneMapping, Vignette, Noise } from "@react-three/postprocessing";
import { ToneMappingMode, BlendFunction } from "postprocessing";
import { useCurrentFrame, useVideoConfig, getInputProps } from "remotion";

export type V3 = [number, number, number];
export type CamMove = { from: V3; to: V3; look: V3; lookTo?: V3; fov?: number };
export type StageProps = {
  dur: number; cam: CamMove; fog?: { color: string; density: number }; bg?: string;
  focus?: number;            // focus distance in world units from the camera (DOF)
  bokeh?: number;            // blur amount (0 = off)
  bloom?: number;            // bloom intensity
  exposure?: number;
  children: React.ReactNode;
};

const ease = (u: number) => u * u * (3 - 2 * u);

const CameraRig: React.FC<{ cam: CamMove; dur: number; fog?: StageProps["fog"]; bg?: string; exposure?: number }> = ({ cam, dur, fog, bg, exposure = 1 }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl } = useThree();
  useLayoutEffect(() => {
    const u = ease(Math.min(1, Math.max(0, f / Math.max(1, dur))));
    const p = cam.from.map((v, i) => v + (cam.to[i] - v) * u) as V3;
    const lt = cam.lookTo ?? cam.look;
    const l = cam.look.map((v, i) => v + (lt[i] - v) * u) as V3;
    camera.position.set(...p);
    camera.lookAt(...l);
    const pc = camera as THREE.PerspectiveCamera;
    pc.fov = cam.fov ?? 38; pc.near = 0.05; pc.far = 120; pc.updateProjectionMatrix();
    scene.fog = fog ? new THREE.FogExp2(fog.color, fog.density) : null;
    scene.background = new THREE.Color(bg ?? fog?.color ?? "#05070c");
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.NoToneMapping; // tone mapping happens in the post stack
    gl.toneMappingExposure = exposure;
  });
  return null;
};

export const Stage: React.FC<StageProps> = ({ dur, cam, fog, bg, focus = 6, bokeh = 3, bloom = 1.1, exposure = 1, children }) => {
  const { width, height } = useVideoConfig();
  const post = (getInputProps() as { post?: boolean }).post !== false;
  return (
    <ThreeCanvas width={width} height={height} shadows gl={{ antialias: false, powerPreference: "high-performance" }} camera={{ fov: cam.fov ?? 38, position: cam.from }}>
      <CameraRig cam={cam} dur={dur} fog={fog} bg={bg} exposure={exposure} />
      {children}
      {post ? (
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.9} intensity={2.4} distanceFalloff={1} halfRes quality="performance" />
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={bokeh} worldFocusDistance={focus} worldFocusRange={2.5} />
          <Bloom intensity={bloom} luminanceThreshold={0.75} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.28} darkness={0.62} />
          <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      ) : <></>}
    </ThreeCanvas>
  );
};
