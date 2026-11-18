// One establishing still per dressed set (frame = set index) for detail review.
import React from "react";
import { useCurrentFrame } from "remotion";
import { V } from "../../three/kit3d";
import { Stage } from "./stage";
import { ClanStreet, Council, CliffTop, Forest, MapRoom, NoticeBoard, PoliceHQ, Porch, Rooftops, RuinedHall, TrainingYard, Valley } from "./sets";

export const ItachiSetTests: React.FC = () => {
  const i = useCurrentFrame(); const f = 40;
  switch (i) {
    case 0: return <Stage look="nightRed" cam={V(0.7, 3.6, 6)} target={V(0, 1.6, -16)}><ClanStreet f={f} mood="night" fallen /></Stage>;
    case 1: return <Stage look="dawn" cam={V(0, 22, 24)} target={V(0, 0, -34)} fov={46}><Valley f={f} /></Stage>;
    case 2: return <Stage look="day" cam={V(1, 2.2, 5)} target={V(0, 1.2, -6)}><TrainingYard f={f} /></Stage>;
    case 3: return <Stage look="day" cam={V(-3, 1.8, 15)} target={V(0, 2.8, -6)}><PoliceHQ f={f} /></Stage>;
    case 4: return <Stage look="fire" cam={V(0, 20, 20)} target={V(0, 4, -40)} fov={46}><Valley f={f} burning /></Stage>;
    case 5: return <Stage look="interior" cam={V(0.5, 1.15, 1.4)} target={V(0, 0.7, -1.8)}><Council f={f} /></Stage>;
    case 6: return <Stage look="candle" cam={V(0.3, 2.2, 1.4)} target={V(0, 0.4, -0.4)}><MapRoom f={f} knife={1} /></Stage>;
    case 7: return <Stage look="sunset" cam={V(4.5, 1.5, 5.5)} target={V(-0.5, 0.9, -1.4)} fov={38}><Porch f={f} /></Stage>;
    case 8: return <Stage look="day" cam={V(0, 1.6, 6)} target={V(0, 1.6, -4)} fogScale={0.6}><Forest f={f} /></Stage>;
    case 9: return <Stage look="night" cam={V(0.6, 5.8, 3.6)} target={V(0, 0.4, -3.2)} fov={46}><Rooftops f={f} /></Stage>;
    case 10: return <Stage look="night" cam={V(0, 1.6, 5)} target={V(0, -2, -30)}><CliffTop f={f} /></Stage>;
    case 11: return <Stage look="storm" cam={V(0.6, 1.7, 7.5)} target={V(0, 1.9, -4)} flash={0.3}><RuinedHall f={f} flash={0.3} /></Stage>;
    case 12: return <Stage look="rainDay" cam={V(0.3, 1.6, 2.6)} target={V(0, 1.6, -2)}><NoticeBoard f={f} /></Stage>;
    case 13: return <Stage look="rainDay" cam={V(0.7, 2.2, 6)} target={V(0, 1, -12)}><ClanStreet f={f} mood="day" overgrown /></Stage>;
    default: return <Stage look="rainDay" cam={V(1, 2, 5)} target={V(0, 1.2, -6)}><TrainingYard f={f} rain /></Stage>;
  }
};
