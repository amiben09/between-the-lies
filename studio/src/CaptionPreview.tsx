// Audio + caption preview for an episode before the picture exists: slow dark gradient, the final mix, the captions.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "./components/Captions";

export const CaptionPreview: React.FC<{ dir: string }> = ({ dir }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const a = 200 + 25 * Math.sin(t * 0.15);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 35%, hsl(${a}, 35%, 16%) 0%, hsl(${a + 30}, 40%, 6%) 70%, #040308 100%)` }}>
      <Audio src={staticFile(`${dir}/mix.m4a`)} />
      <div style={{ position: "absolute", top: "8%", width: "100%", textAlign: "center", color: "rgba(255,255,255,0.35)",
        fontFamily: "'BTL Caption', sans-serif", fontSize: 34, letterSpacing: 6 }}>BETWEEN THE LIES · AUDIO + CAPTION TEST</div>
      <Captions src={`${dir}/words.json`} />
    </AbsoluteFill>
  );
};
