// Look check for character expressions: the 8 drama faces + 4 upstream faces, each on its own 600x1000 card.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, Expr, DRAMA_EXPRS, PARENT, Outfit } from "./videos/bridge/toon";

const EXPRS: Expr[] = [...DRAMA_EXPRS, "neutral", "stern", "smile", "shock"];
const WOMAN: Outfit = { ...PARENT, jacket: "#8a3b55", pants: "#2e2a3a", hair: "#2b1d1a" };

const Card: React.FC<{ expr: Expr; i: number }> = ({ expr, i }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, 600, 1000);
    bodyFront(new Pen(g), i % 2 ? WOMAN : PARENT, { expr, mode: "stand", seed: 3 + i, facing: 0 });
  }, [expr, i]);
  return (
    <div style={{ width: 270, height: 470, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <canvas ref={ref} width={600} height={1000} style={{ width: 252, height: 420 }} />
      <div style={{ color: "#ddd", fontFamily: "sans-serif", fontSize: 26 }}>{expr}</div>
    </div>
  );
};

export const FaceSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#3a3f52", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", padding: 0 }}>
    {EXPRS.map((e, i) => <Card key={e} expr={e} i={i} />)}
  </AbsoluteFill>
);
