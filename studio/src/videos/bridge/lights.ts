// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
/** BETWEEN THE LIES adds night / candle / dawn to the upstream day / golden. */
export type LightName = "day" | "golden" | "night" | "candle" | "dawn";
/** lights whose key is low enough that character cards cast real shadows (world.ts) */
export const LOW_KEY = (l: LightName) => l === "golden" || l === "dawn" || l === "candle";
/** lights that draw a sun / moon disc (colour = preset sunDisc) */
export const SHOW_DISC = (l: LightName) => l === "golden" || l === "dawn" || l === "night";
export const LIGHTS: Record<LightName, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
  // moonlit night: cold blue key from high behind-left, deep blue-violet shade, dark navy sky, near fog for depth
  night: {
    az: 140, el: 38,
    lit: [0.52, 0.62, 0.95], shade: [0.07, 0.08, 0.17], lift: [0.03, 0.04, 0.1], lambert: 0.4, sideK: 0.8, term: 0.15,
    charTint: [0.5, 0.57, 0.82], charShade: 0.78, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.7, 0.75, 0.95],
    blob: [0.55, 0.58, 0.75], actorShadow: false,
    top: "#070b1f", hor: "#24305a", skyCurve: [0.0, 0.45, 0.7], fog: "#1b2448", fogNear: 18, fogFar: 220, sunDisc: "#dfe8ff",
    sunCol: "#9fb4ff", sunI: 1.2, sky: "#2a3768", ground: "#1a1a2a", hemiI: 0.25,
    bias: -0.0004, normalBias: 0.02,
  },
  // candle / lamp interior: very low warm key, strong falloff to cool violet shade (warm-vs-cold drama contrast)
  candle: {
    az: 60, el: 12,
    lit: [1.45, 0.82, 0.4], shade: [0.08, 0.07, 0.16], lift: [0.03, 0.03, 0.09], lambert: 0.45, sideK: 0.78, term: 0.1,
    charTint: [1.0, 0.8, 0.6], charShade: 0.82, charGrad: 0.14, bodyGrad: 0.3, sideTint: [0.7, 0.68, 0.9],
    blob: [0.6, 0.55, 0.7], actorShadow: true,
    top: "#140d1e", hor: "#3a2633", skyCurve: [0.0, 0.5, 0.6], fog: "#2a1d2a", fogNear: 10, fogFar: 120, sunDisc: "#000000",
    sunCol: "#ffb36b", sunI: 3.0, sky: "#4a3040", ground: "#2a1a18", hemiI: 0.2,
    bias: -0.0006, normalBias: 0.03,
  },
  // dawn / reveal: soft pink-peach low sun from the side, lavender shade, pale sky (the "truth" light)
  dawn: {
    az: 35, el: 9,
    lit: [1.42, 1.0, 0.86], shade: [0.24, 0.22, 0.38], lift: [0.06, 0.06, 0.14], lambert: 0.35, sideK: 0.84, term: 0.1,
    charTint: [1.0, 0.88, 0.84], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.88, 0.84, 0.98],
    blob: [0.7, 0.68, 0.88], actorShadow: true,
    top: "#6b78b8", hor: "#ffc8b0", skyCurve: [0.05, 0.55, 0.9], fog: "#eec0b8", fogNear: 40, fogFar: 360, sunDisc: "#ffe0c8",
    sunCol: "#ffc7a8", sunI: 4.0, sky: "#e0c0d0", ground: "#9a8080", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LightName, WorldLook> = {
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
  night: {
    sky: { c: ["#24305a", "#1b2650", "#121b40", "#0c1330", "#070b1f"], e: [0, 3, 8, 16, 40] },
    water: { near: "#0d1a36", mid: "#10224a", far: "#1c2c5a", crest: "#5d74b8", trough: "#060c1e", glint: "#dfe8ff", shade: [0.3, 0.34, 0.55] },
    cloud: { lit: "#6a78a8", mid: "#3c4878", shade: "#222b52" },
    bounce: [0, 0, 0.02],
    sat: 0.95,
  },
  candle: {
    sky: { c: ["#3a2633", "#2e1f2d", "#231827", "#1a1220", "#140d1e"], e: [0, 3, 8, 16, 40] },
    water: { near: "#1a1420", mid: "#20182a", far: "#2a2030", crest: "#a07050", trough: "#0c0810", glint: "#ffcf9e", shade: [0.3, 0.28, 0.45] },
    cloud: { lit: "#704838", mid: "#402838", shade: "#22182a" },
    bounce: [0.05, 0.025, 0.0],
    sat: 1.05,
  },
  dawn: {
    sky: { c: ["#ffc8b0", "#f5b8b4", "#d8a8c0", "#a898c4", "#6b78b8"], e: [0, 4, 10, 20, 40] },
    water: { near: "#3a4a80", mid: "#6a72a8", far: "#e8b8b0", crest: "#f0c8c0", trough: "#283466", glint: "#fff0e0", shade: [0.5, 0.5, 0.75] },
    cloud: { lit: "#ffe0d0", mid: "#f0b8c0", shade: "#a8a0cc" },
    bounce: [0.03, 0.02, 0.02],
    sat: 1.0,
  },
};
