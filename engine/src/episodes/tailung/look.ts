// "The Scroll That Was Always Empty" — the episode's single look file (palette, 2D card lights, caption style, grade).
import type { Light } from "../../btl/people";
import type { CaptionLook } from "../../btl/captions";
import { CAPTION as BASE } from "../jinx/look";

export const PAL = {
  memoryAmber: "#ffc070", gold: "#e8c060", pillarRed: "#a8302a", prisonBlue: "#3a5a7a", betrayalPlum: "#6a3a5a",
  fur: "#dcdad4", panda: "#c45a2a", ink: "#fbf7ef", accent: "#ffcc66",
} as const;

export const LIGHTS: Record<"SUNSET" | "LANTERN" | "HALL" | "PRISON" | "GOLD" | "FIRE", Light> = {
  SUNSET: { x: 150, y: 500, r: 2000, key: "#ffa860", shade: "#2a1a30", keyA: 0.36, shadeA: 0.32 },
  LANTERN: { x: 760, y: 900, r: 1700, key: PAL.memoryAmber, shade: "#2a1810", keyA: 0.34, shadeA: 0.35 },
  HALL: { x: 300, y: 300, r: 1800, key: "#c8b8e8", shade: "#1a0c18", keyA: 0.24, shadeA: 0.5 },
  PRISON: { x: 900, y: 600, r: 1800, key: "#ff9a50", shade: "#0a1220", keyA: 0.3, shadeA: 0.6 },
  GOLD: { x: 540, y: 1600, r: 1800, key: "#ffd890", shade: "#2a1608", keyA: 0.4, shadeA: 0.4 },
  FIRE: { x: 540, y: 1600, r: 1900, key: "#ff7a3a", shade: "#140808", keyA: 0.35, shadeA: 0.5 },
};

/** same caption geometry as the channel standard; gold accent for this episode */
export const CAPTION: CaptionLook = { ...BASE, accent: PAL.accent };
export const GRADE = { grainOpacity: 0.06 };
