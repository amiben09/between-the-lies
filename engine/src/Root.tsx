import React from "react";
import { Composition } from "remotion";
import { ProofScene, PROOF_FRAMES } from "./proof/ProofScene";

// Every episode registers its own composition here: 1080x1920, 30 fps (locked default).
export const Root: React.FC = () => (
  <>
    <Composition id="ProofScene" component={ProofScene} durationInFrames={PROOF_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
