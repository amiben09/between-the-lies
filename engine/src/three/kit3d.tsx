// Reusable 3D kit (from the necessity test): toon materials, ink outlines, canvas textures, camera rig, and our
// 2D-rig characters as camera-facing cards (identity + facial acting preserved inside the 3D world).
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Ctx, makeCanvas } from "../btl/core";
import { BEAST, figH, Age, Kind, Light, Pose, person } from "../btl/people";

export const gradientMap = (() => { const d = new Uint8Array([60, 140, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const matCache = new Map<string, THREE.Material>();
export const toon = (color: string, map?: THREE.Texture, emissive?: string, ei = 1) => {
  const k = `${color}|${emissive}|${ei}|${map?.uuid ?? ""}`;
  if (map) { if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color, map, gradientMap, emissive: emissive ?? "#000000", emissiveIntensity: ei })); return matCache.get(k)!; }
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color, gradientMap, emissive: emissive ?? "#000000", emissiveIntensity: ei }));
  return matCache.get(k)!;
};
export const INK = new THREE.MeshBasicMaterial({ color: "#120e16", side: THREE.BackSide });
export function canvasTex(w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) {
  const [c, g] = makeCanvas(w, h); paint(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
/** Geometry interning: sets build `new THREE.XGeometry(...)` inline every frame; reuse one GPU-resident copy per shape
 *  (otherwise every frame re-uploads and leaks geometry — measured ~20 s/frame vs a few seconds). */
const GEO = new Map<string, THREE.BufferGeometry>();
export function intern(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const params = (geo as unknown as { parameters?: object }).parameters;
  if (!params || geo.userData.noIntern) return geo;
  const k = geo.type + JSON.stringify(params);
  const hit = GEO.get(k); if (hit) { if (hit !== geo) geo.dispose(); return hit; }
  GEO.set(k, geo); return geo;
}
/** Mesh with an inverted-hull ink outline. */
export const Inked: React.FC<{ geo: THREE.BufferGeometry; mat: THREE.Material | THREE.Material[]; pos: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number]; outline?: number }> =
  ({ geo: geo0, mat, pos, rot, scale, outline = 0.02 }) => { const geo = intern(geo0); return (
    <group position={pos} rotation={rot ?? [0, 0, 0]} scale={scale ?? [1, 1, 1]}>
      <mesh geometry={geo} material={mat} />
      {outline > 0 && <mesh geometry={geo} material={INK} scale={[1 + outline, 1 + outline, 1 + outline]} />}
    </group>
  ); };

/** Deterministic camera: position, look-at target and lens per frame. */
export const CameraRig: React.FC<{ pos: THREE.Vector3; look: THREE.Vector3; fov: number; roll?: number }> = ({ pos, look, fov, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.copy(pos); camera.near = 0.05; camera.far = 220; camera.fov = fov; camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(look); camera.updateProjectionMatrix();
  });
  return null;
};

/** Any 2D drawing (in 1080x1920 card space, ground line at y=1880) on a camera-facing card in the 3D world.
 *  `ppm` = card pixels per metre. `res` < 1 renders the texture at reduced resolution (cheaper upload). */
export const CardCanvas: React.FC<{ draw: (g: Ctx) => void; at: [number, number, number]; ppm: number; camPos: THREE.Vector3; spherical?: boolean; res?: number; shadow?: number }> =
  ({ draw, at, ppm, camPos, spherical, res = 0.5, shadow = 0.35 }) => {
    const card = useMemo(() => { const [c, g] = makeCanvas(Math.round(1080 * res), Math.round(1920 * res)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, g, t }; }, [res]);
    useEffect(() => () => { card.t.dispose(); card.c.width = card.c.height = 0; }, [card]);
    card.g.setTransform(1, 0, 0, 1, 0, 0); card.g.clearRect(0, 0, card.c.width, card.c.height);
    card.g.setTransform(res, 0, 0, res, 0, 0); draw(card.g); card.t.needsUpdate = true;
    const hM = 1920 / ppm, wM = 1080 / ppm;
    const yaw = Math.atan2(camPos.x - at[0], camPos.z - at[2]);
    const pitch = spherical ? -Math.atan2(camPos.y - (at[1] + 1.0), Math.hypot(camPos.x - at[0], camPos.z - at[2])) : 0;
    return (
      <group position={at} rotation={[0, yaw, 0]}>
        <group rotation={[pitch, 0, 0]}>
          <mesh position={[0, hM / 2 - 40 / ppm, 0]}><planeGeometry args={[wM, hM]} /><meshBasicMaterial map={card.t} transparent alphaTest={0.05} side={THREE.DoubleSide} /></mesh>
        </group>
        {shadow > 0 && <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[Math.min(0.5, 300 / ppm), 24]} /><meshBasicMaterial color="#000000" transparent opacity={shadow} depthWrite={false} /></mesh>}
      </group>
    );
  };

/** One of our 2D characters as a card standing in the 3D world. `heightM` = real height in metres. */
export const CardActor: React.FC<{ kind: Kind; age: Age; pose: Partial<Pose>; light: Light; at: [number, number, number]; heightM: number; camPos: THREE.Vector3; spherical?: boolean; res?: number }> =
  ({ kind, age, pose, light, at, heightM, camPos, spherical, res }) => {
    const refH = BEAST(kind) ? figH(kind, age) /* animals: real drawn height */ : kind === "dumbledore" || kind === "voldemort" ? 1060 : age === "child" ? 640 : age === "teen" ? 880 : 1000;
    const s = 1700 / refH;
    return <CardCanvas at={at} ppm={1700 / heightM} camPos={camPos} spherical={spherical} res={res}
      draw={(g) => person(g, { x: 0, y: 0, zoom: 1 }, 1, kind, age, { x: 540, y: 1880, s, ...pose } as Pose, light)} />;
  };

export const ease = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
