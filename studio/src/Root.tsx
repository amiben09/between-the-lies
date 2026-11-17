import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { CaptionPreview } from "./CaptionPreview";
import { FaceSheet } from "./FaceSheet";
import { EpisodeCut, EpisodeProps } from "./EpisodeCut";

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
  </>
);
