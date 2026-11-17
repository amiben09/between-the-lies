// Toolchain proof (not episode content): layered 2.5D street at dusk, one original silhouette card,
// warm window light vs cool exterior, motivated slow push-in with parallax. 6 s @ 30 fps.
import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import * as THREE from "three";

export const PROOF_FRAMES = 180;

/** Painted-plane texture drawn with Canvas2D (graphic-novel surface). */
function usePainted(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d")!;
    draw(g, w, h);
    // tactile grain
    const img = g.getImageData(0, 0, w, h);
    let s = 1234567;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 16807) % 2147483647;
      const n = ((s / 2147483647) - 0.5) * 14;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

const Sky: React.FC = () => {
  const tex = usePainted(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#1b2233"); gr.addColorStop(0.55, "#3a4660"); gr.addColorStop(1, "#6b5a6e");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  return <mesh position={[0, 4, -30]}><planeGeometry args={[60, 60]} /><meshBasicMaterial map={tex} /></mesh>;
};

/** Far skyline layer. */
const Skyline: React.FC = () => {
  const tex = usePainted(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#2a3043";
    let x = 0, s = 7;
    while (x < w) {
      s = (s * 48271) % 2147483647;
      const bw = 50 + (s % 90), bh = 140 + (s % 260);
      g.fillRect(x, h - bh, bw, bh);
      g.fillStyle = "rgba(255,190,120,0.55)";
      for (let wy = h - bh + 20; wy < h - 20; wy += 34) for (let wx = x + 10; wx < x + bw - 12; wx += 22)
        if ((wx * 7 + wy * 13 + s) % 5 === 0) g.fillRect(wx, wy, 8, 12);
      g.fillStyle = "#2a3043";
      x += bw + 4;
    }
  });
  return <mesh position={[0, 1.5, -18]}><planeGeometry args={[40, 20]} /><meshBasicMaterial map={tex} transparent /></mesh>;
};

/** Mid layer: brick wall with one warm window (memory light). */
const Wall: React.FC = () => {
  const tex = usePainted(1024, 1024, (g, w, h) => {
    g.fillStyle = "#3b3240"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(15,10,18,0.55)"; g.lineWidth = 3;
    for (let y = 0; y < h; y += 40) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (let x = (y / 40) % 2 ? 0 : 40; x < w; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 40); g.stroke(); }
    }
    const wg = g.createRadialGradient(560, 430, 10, 560, 430, 260);
    wg.addColorStop(0, "#ffd79a"); wg.addColorStop(0.4, "#e8a35a"); wg.addColorStop(1, "rgba(232,163,90,0)");
    g.fillStyle = wg; g.fillRect(300, 170, 520, 520);
    g.fillStyle = "#ffcf8a"; g.fillRect(470, 330, 180, 220);
    g.strokeStyle = "#1a1418"; g.lineWidth = 12; g.strokeRect(470, 330, 180, 220);
    g.beginPath(); g.moveTo(560, 330); g.lineTo(560, 550); g.moveTo(470, 440); g.lineTo(650, 440); g.stroke();
  });
  return <mesh position={[0.6, 3.5, -6]}><planeGeometry args={[9, 7]} /><meshStandardMaterial map={tex} roughness={1} /></mesh>;
};

/** Character card: original silhouette, coat + scarf, restrained plum outline; gentle breathing. */
const Character: React.FC<{ frame: number }> = ({ frame }) => {
  const tex = usePainted(600, 1000, (g) => {
    g.lineJoin = "round"; g.lineWidth = 10; g.strokeStyle = "#241726";
    g.fillStyle = "#4a3a52"; // coat
    g.beginPath(); g.moveTo(200, 360); g.quadraticCurveTo(300, 320, 400, 360); g.lineTo(440, 880); g.lineTo(160, 880); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#9b3b45"; // scarf
    g.beginPath(); g.moveTo(215, 350); g.quadraticCurveTo(300, 390, 385, 350); g.lineTo(380, 395); g.quadraticCurveTo(300, 430, 220, 395); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#d9b49a"; // head
    g.beginPath(); g.ellipse(300, 250, 82, 98, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#2b1e24"; // hair
    g.beginPath(); g.ellipse(300, 200, 90, 60, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#1f1a22"; // legs
    g.fillRect(215, 880, 60, 100); g.fillRect(325, 880, 60, 100);
  });
  const breathe = 1 + Math.sin(frame / 30 * Math.PI * 0.5) * 0.008;
  return (
    <mesh position={[-0.9, 0.05 + 1.4 * breathe, -2]} scale={[1, breathe, 1]}>
      <planeGeometry args={[1.7, 2.83]} />
      <meshStandardMaterial map={tex} transparent alphaTest={0.05} roughness={1} />
    </mesh>
  );
};

/** Foreground framing: dark railing post, out of the character's face. */
const Foreground: React.FC = () => (
  <mesh position={[1.35, 0.6, 0.6]}><boxGeometry args={[0.18, 3, 0.18]} /><meshStandardMaterial color="#121016" /></mesh>
);

const Ground: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}><planeGeometry args={[30, 20]} /><meshStandardMaterial color="#1c1d26" roughness={0.35} metalness={0.2} /></mesh>
);

const Rain: React.FC<{ frame: number }> = ({ frame }) => {
  const geo = useMemo(() => {
    const n = 400, pos = new Float32Array(n * 6);
    let s = 42;
    for (let i = 0; i < n; i++) {
      s = (s * 16807) % 2147483647; const x = (s / 2147483647 - 0.5) * 8;
      s = (s * 16807) % 2147483647; const y = (s / 2147483647) * 8;
      s = (s * 16807) % 2147483647; const z = -(s / 2147483647) * 6;
      pos.set([x, y, z, x - 0.02, y - 0.25, z], i * 6);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); return g;
  }, []);
  const y = -((frame * 0.22) % 8);
  return <group position={[0, y, 0]}>
    <lineSegments geometry={geo}><lineBasicMaterial color="#9fb0c8" transparent opacity={0.35} /></lineSegments>
    <lineSegments geometry={geo} position={[0, 8, 0]}><lineBasicMaterial color="#9fb0c8" transparent opacity={0.35} /></lineSegments>
  </group>;
};

/** Drives R3F's default camera every frame (no drei dependency). */
const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const t = interpolate(frame, [0, PROOF_FRAMES - 1], [0, 1], { easing: Easing.bezier(0.45, 0, 0.55, 1) });
  useLayoutEffect(() => {
    camera.fov = 38;
    camera.position.set(0.5 - 0.4 * t, 1.6, 7.0 - 1.2 * t);
    camera.lookAt(-0.2, 1.9, -2);
    camera.updateProjectionMatrix();
  }, [camera, t]);
  return null;
};

export const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const windowFlicker = 1.4 + Math.sin(frame * 0.21) * 0.05;
  return (
    <ThreeCanvas width={width} height={height} gl={{ antialias: true }}>
      <color attach="background" args={["#1b2233"]} />
      <fog attach="fog" args={["#3a4660", 8, 32]} />
      <CameraRig frame={frame} />
      <ambientLight intensity={1.1} color="#7d8bb0" />
      <hemisphereLight args={["#8ea6d8", "#2a2030", 0.8]} />
      {/* warm key from the window (memory / tenderness) */}
      <pointLight position={[0.4, 2.4, -3.2]} intensity={windowFlicker * 18} distance={10} decay={1.2} color="#ffb874" />
      {/* cool rim from the street (present-day grief) */}
      <directionalLight position={[-3, 4, 4]} intensity={1.6} color="#8ea6d8" />
      <Sky /><Skyline /><Wall /><Ground /><Character frame={frame} /><Rain frame={frame} /><Foreground />
    </ThreeCanvas>
  );
};
