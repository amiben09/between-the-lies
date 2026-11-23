import React from "react";
import { Composition } from "remotion";
import { ProofScene, PROOF_FRAMES } from "./proof/ProofScene";
import { CharSheet } from "./btl/CharSheet";
import { Street3D } from "./tests/Street3D";
import { Street25D } from "./tests/Street25D";
import { ItachiCharRefs } from "./episodes/itachi/CharRefs";
import { ItachiStyleframes } from "./episodes/itachi/Styleframes";
import { ItachiSetTests } from "./episodes/itachi/SetTests";
import { FreezeCharRefs } from "./episodes/freeze/CharRefs";
import { FreezeStyleframes } from "./episodes/freeze/Styleframes";
import { JinxCharRefs } from "./episodes/jinx/CharRefs";
import { JinxStyleframes } from "./episodes/jinx/Styleframes";
import { JinxEpisode, JINX_FRAMES } from "./episodes/jinx/Episode";
import { CaptionDemo } from "./demo/CaptionDemo";
import { TaiLungCharRefs } from "./episodes/tailung/CharRefs";
import { ScyllaCharRefs } from "./episodes/scylla/CharRefs";
import { ScyllaStyleframes } from "./episodes/scylla/Styleframes";
import { TaiLungStyleframes } from "./episodes/tailung/Styleframes";
import { TaiLungEpisode, TAILUNG_FRAMES } from "./episodes/tailung/Episode";
import { ItachiEpisode, TOTAL_FRAMES as ITACHI_FRAMES } from "./episodes/itachi/Episode";
import { TEST_FRAMES, TEST_W, TEST_H } from "./tests/streetSpec";
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
    <Composition id="Test3D" component={Street3D} durationInFrames={TEST_FRAMES} fps={30} width={TEST_W} height={TEST_H} />
    <Composition id="Test25D" component={Street25D} durationInFrames={TEST_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ItachiCharRefs" component={ItachiCharRefs} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="ItachiStyleframes" component={ItachiStyleframes} durationInFrames={6} fps={30} width={1080} height={1920} />
    <Composition id="ItachiSetTests" component={ItachiSetTests} durationInFrames={15} fps={30} width={1080} height={1920} />
    <Composition id="FreezeCharRefs" component={FreezeCharRefs} durationInFrames={2} fps={30} width={1080} height={1920} />
    <Composition id="FreezeStyleframes" component={FreezeStyleframes} durationInFrames={6} fps={30} width={1080} height={1920} />
    <Composition id="JinxCharRefs" component={JinxCharRefs} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="JinxStyleframes" component={JinxStyleframes} durationInFrames={6} fps={30} width={1080} height={1920} />
    <Composition id="TaiLungEmptyScroll" component={TaiLungEpisode} durationInFrames={TAILUNG_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TaiLungStyleframes" component={TaiLungStyleframes} durationInFrames={6} fps={30} width={1080} height={1920} />
    <Composition id="ScyllaStyleframes" component={ScyllaStyleframes} durationInFrames={6} fps={30} width={1080} height={1920} />
    <Composition id="ScyllaCharRefs" component={ScyllaCharRefs} durationInFrames={2} fps={30} width={1080} height={1920} />
    <Composition id="TaiLungCharRefs" component={TaiLungCharRefs} durationInFrames={2} fps={30} width={1080} height={1920} />
    <Composition id="CaptionDemo" component={CaptionDemo} durationInFrames={150} fps={30} width={1080} height={1920} />
    <Composition id="JinxPerfect" component={JinxEpisode} durationInFrames={JINX_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ItachiNextTime" component={ItachiEpisode} durationInFrames={ITACHI_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
