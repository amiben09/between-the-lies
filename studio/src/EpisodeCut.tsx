// BETWEEN THE LIES episode editor v2: reference-channel camera grammar on generated shot clips.
//  - camera keys (engine/edit/camera_plan.py): a new framing every ~1.3 s landing on a word; each move is an EASE-OUT
//    burst (fastest on its first frame, settled in ~9 frames), then the hold keeps creeping in (never static);
//    accent words punch in harder;
//  - transitions: whip pans with motion blur (6 f out + 6 f in, alternating direction), hard cuts where cut: true,
//    a 4-frame white flash after the hook;
//  - grade + vignette + light grain, the final mix and the captions on top.
// Props: episodes/<slug>/07_shots.json { dir, seconds, shots: [{ id, start, end, clip, cut, rate, keys, whip }] }.
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "./components/Captions";
import { SCENES } from "./free/scenes";

export type CamKey = { t: number; s: number; fx: number; fy: number; punch?: boolean };
export type Shot = {
  id: number; start: number; end: number; clip: string; cut?: boolean; clipSeconds?: number; rate?: number;
  keys?: CamKey[]; whip?: number;
};
export type EpisodeProps = { dir: string; seconds: number; shots: Shot[]; captions?: boolean; flashAfterHook?: boolean };

const WHIP = 6;          // frames of whip out / in
const BURST = 9;         // frames for a camera move to settle
const CREEP = 0.0025;    // scale per frame during holds (0.25 %/f)
const CREEP_PUNCH = 0.006;

const easeOut = (u: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3); // peak speed at the start

/** camera state at local frame f: last key reached via an ease-out burst from the previous one, plus a creep */
const camAt = (keys: CamKey[], f: number, fps: number) => {
  const ks = keys.length ? keys : [{ t: 0, s: 1.04, fx: 0.5, fy: 0.5 }];
  let i = 0;
  for (let k = 0; k < ks.length; k++) if (f >= Math.round(ks[k].t * fps)) i = k;
  const cur = ks[i], prev = ks[Math.max(0, i - 1)];
  const since = f - Math.round(cur.t * fps);
  const u = i === 0 ? 1 : easeOut(since / BURST);
  const lerp = (a: number, b: number) => a + (b - a) * u;
  const creep = 1 + (cur.punch ? CREEP_PUNCH : CREEP) * Math.max(0, since);
  return { s: lerp(prev.s, cur.s) * creep, fx: lerp(prev.fx, cur.fx), fy: lerp(prev.fy, cur.fy) };
};

const ShotLayer: React.FC<{ shot: Shot; dir: string; frames: number; whipIn: number; whipOut: number; lead: number }> = ({ shot, dir, frames, whipIn, whipOut, lead }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const local = f - lead; // frame relative to the shot's real start (whip-in frames are negative)
  const clipLen = shot.clipSeconds ?? 5;
  const need = (frames - lead) / fps;
  const rate = shot.rate ?? (need > clipLen ? Math.max(0.6, clipLen / need) : 1);
  const cam = camAt(shot.keys ?? [], Math.max(0, local), fps);
  // whip in: slides in from the side with motion blur; whip out: slides out the other way
  let tx = 0, blur = 0;
  if (whipIn && local < 0) {
    const u = (local + lead) / lead; // 0 -> 1 over the whip-in frames
    tx = whipIn * width * 0.55 * (1 - easeOut(u));
    blur = 28 * (1 - u);
  }
  const outStart = frames - WHIP;
  if (whipOut && f >= outStart) {
    const u = (f - outStart) / WHIP;
    tx = -whipOut * width * 0.55 * u * u;
    blur = 28 * u;
  }
  const still = /\.(png|jpe?g|webp)$/i.test(shot.clip);
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
  return (
    <AbsoluteFill style={{ transform: `translateX(${tx}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
      <AbsoluteFill style={{ transform: `scale(${cam.s})`, transformOrigin: `${cam.fx * 100}% ${cam.fy * 100}%` }}>
        {shot.clip.startsWith("scene:")
          ? <SceneSlot id={Number(shot.clip.slice(6))} dur={frames} />
          : still
          ? <Img src={staticFile(`${dir}/${shot.clip}`)} style={style} />
          : <OffthreadVideo src={staticFile(`${dir}/${shot.clip}`)} playbackRate={rate} muted style={style} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** free (no-credit) version: a hand-built scene instead of a generated clip ("clip": "scene:<id>") */
const SceneSlot: React.FC<{ id: number; dur: number }> = ({ id, dur }) => {
  const Scene = SCENES[id];
  return Scene ? <AbsoluteFill style={{ overflow: "hidden" }}><Scene dur={dur} /></AbsoluteFill> : <AbsoluteFill style={{ background: "#300" }} />;
};

const Grade: React.FC = () => {
  const f = useCurrentFrame();
  const gx = (f * 37) % 100, gy = (f * 53) % 100;
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(4,6,14,0.55) 100%)" }} />
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.25, background: "linear-gradient(180deg, rgba(40,70,140,0.6), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 70%, rgba(10,20,50,0.7))" }} />
      <AbsoluteFill style={{ opacity: 0.05, backgroundImage: `repeating-radial-gradient(circle at ${gx}% ${gy}%, #fff 0 1px, transparent 1px 3px)` }} />
    </>
  );
};

const Flash: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + 4], [0, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return o > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: o }} /> : null;
};

export const EpisodeCut: React.FC<EpisodeProps> = ({ dir, shots, captions = true, flashAfterHook = true }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shots.map((s, i) => {
        const next = shots[i + 1];
        const whipIn = s.whip ?? 0;
        const whipOut = next?.whip ?? 0;
        const lead = whipIn ? WHIP : 0;
        const from = Math.max(0, Math.round(s.start * fps) - lead);
        const to = Math.round(s.end * fps);
        return (
          <Sequence key={s.id} from={from} durationInFrames={to - from} layout="none">
            <ShotLayer shot={s} dir={dir} frames={to - from} whipIn={whipIn} whipOut={whipOut} lead={lead} />
          </Sequence>
        );
      })}
      {flashAfterHook && shots[1] ? <Flash at={Math.round(shots[1].start * fps)} /> : null}
      <Grade />
      <Audio src={staticFile(`${dir}/mix.m4a`)} />
      {captions ? <Captions src={`${dir}/words.json`} /> : null}
    </AbsoluteFill>
  );
};
