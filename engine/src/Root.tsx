import React from "react";
import { Composition } from "remotion";
import { ProofScene, PROOF_FRAMES } from "./proof/ProofScene";
import { CharSheet } from "./btl/CharSheet";
import { SnapeEpisode } from "./episodes/snape/Episode";
import { FRAMES as SNAPE_FRAMES } from "./episodes/snape/shots";
import { SnapeEpisodeV2 } from "./episodes/snape2/Episode";
import { FRAMES as SNAPE2_FRAMES } from "./episodes/snape2/shots";
import { SnapeEpisodeV3 } from "./episodes/snape3/Episode";
import { FRAMES as SNAPE3_FRAMES } from "./episodes/snape3/shots";
import { SnapeEpisodeV31 } from "./episodes/snape31/Episode";
import { FRAMES as SNAPE31_FRAMES } from "./episodes/snape31/shots";

// Every episode registers its own composition here: 1080x1920, 30 fps (locked default).
export const Root: React.FC = () => (
  <>
    <Composition id="ProofScene" component={ProofScene} durationInFrames={PROOF_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CharSheet" component={CharSheet} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="SnapeAlways" component={SnapeEpisode} durationInFrames={SNAPE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SnapeAlwaysV2" component={SnapeEpisodeV2} durationInFrames={SNAPE2_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SnapeAlwaysV3" component={SnapeEpisodeV3} durationInFrames={SNAPE3_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SnapeAlwaysV31" component={SnapeEpisodeV31} durationInFrames={SNAPE31_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
