// BETWEEN THE LIES episode editor: cuts generated shot clips to the voice timeline, adds a slow camera drift on every
// shot (no static holds), crossfades (or hard cuts), a cinematic grade + vignette + light grain, the final mix and captions.
// Props come from episodes/<slug>/07_shots.json: { dir, seconds, shots: [{ id, start, end, clip, cut }] }.
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Captions } from "./components/Captions";

export type Shot = { id: number; start: number; end: number; clip: string; cut?: boolean; clipSeconds?: number };
export type EpisodeProps = { dir: string; seconds: number; shots: Shot[]; xfade?: number; captions?: boolean };

const XFADE_DEFAULT = 7; // frames

const ShotLayer: React.FC<{ shot: Shot; dir: string; frames: number; fadeIn: number; index: number }> = ({ shot, dir, frames, fadeIn, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clipLen = shot.clipSeconds ?? 5;
  const need = frames / fps;
  // stretch slightly (never faster than 1x) when a shot is longer than its clip
  const rate = need > clipLen ? Math.max(0.6, clipLen / need) : 1;
  const opacity = fadeIn > 0 ? interpolate(f, [0, fadeIn], [0, 1], { extrapolateRight: "clamp" }) : 1;
  // camera drift: alternate push-in / slight pan so consecutive shots never feel static
  const u = interpolate(f, [0, frames], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const scale = 1.04 + 0.05 * u;
  const dx = (index % 2 ? 1 : -1) * 14 * u;
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ transform: `translate(${dx}px, 0) scale(${scale})` }}>
        <OffthreadVideo src={staticFile(`${dir}/${shot.clip}`)} playbackRate={rate} muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Grade: React.FC = () => {
  const f = useCurrentFrame();
  // static-free grain: shift a noise gradient each frame (cheap, no textures)
  const gx = (f * 37) % 100, gy = (f * 53) % 100;
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(4,6,14,0.55) 100%)" }} />
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.25, background: "linear-gradient(180deg, rgba(40,70,140,0.6), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 70%, rgba(10,20,50,0.7))" }} />
      <AbsoluteFill style={{ opacity: 0.05, backgroundImage: `repeating-radial-gradient(circle at ${gx}% ${gy}%, #fff 0 1px, transparent 1px 3px)` }} />
    </>
  );
};

export const EpisodeCut: React.FC<EpisodeProps> = ({ dir, shots, xfade = XFADE_DEFAULT, captions = true }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shots.map((s, i) => {
        const fadeIn = i === 0 || s.cut ? 0 : xfade;
        const from = Math.max(0, Math.round(s.start * fps) - fadeIn);
        const to = Math.round(s.end * fps);
        return (
          <Sequence key={s.id} from={from} durationInFrames={to - from} layout="none">
            <ShotLayer shot={s} dir={dir} frames={to - from} fadeIn={fadeIn} index={i} />
          </Sequence>
        );
      })}
      <Grade />
      <Audio src={staticFile(`${dir}/mix.m4a`)} />
      {captions ? <Captions src={`${dir}/words.json`} /> : null}
    </AbsoluteFill>
  );
};
