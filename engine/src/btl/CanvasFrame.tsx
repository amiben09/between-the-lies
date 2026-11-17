import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { Ctx, H, W } from "./core";

/** One full-frame 2D canvas, redrawn synchronously for every frame. */
export const CanvasFrame: React.FC<{ draw: (g: Ctx, f: number) => void }> = ({ draw }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1; g.filter = "none";
    g.clearRect(0, 0, W, H);
    draw(g, f);
  }, [f, draw]);
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};
