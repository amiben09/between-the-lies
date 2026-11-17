import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { CaptionPreview } from "./CaptionPreview";
import { FaceSheet } from "./FaceSheet";
import { EpisodeCut, EpisodeProps } from "./EpisodeCut";
import { Test3D, Shot3D, Preview3D } from "./free3d/Test3D";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CaptionPreview" component={CaptionPreview} durationInFrames={2016} fps={30} width={1080} height={1920}
      defaultProps={{ dir: "preview", seconds: 67.2 }}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.seconds * 30) })} />
    <Composition id="FaceSheet" component={FaceSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="EpisodeCut" component={EpisodeCut} durationInFrames={1800} fps={30} width={1080} height={1920}
      defaultProps={{ dir: "ep/mr-freeze-heart-of-ice", seconds: 62.5, shots: [] } as EpisodeProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.seconds * 30) })} />
    <Composition id="Test3D" component={Test3D} durationInFrames={30} fps={10} width={540} height={960} />
    <Composition id="Shot3D" component={Shot3D} durationInFrames={30} fps={10} width={540} height={960}
      defaultProps={{ id: 1, dur: 30 }} calculateMetadata={({ props }) => ({ durationInFrames: props.dur })} />
    <Composition id="Preview3D" component={Preview3D} durationInFrames={20} fps={10} width={540} height={960} />
  </>
);
