// Shared shot spec for the 3D-necessity test (both renderers implement exactly these beats).
// Story beat (test only, original content): a woman walks home at dusk, stops at a lit window, and we discover the
// letter waiting on the table inside — the object carries the information.
export const TEST_FPS = 30;
export const TEST_W = 720, TEST_H = 1280; // preview resolution (final would be 1080x1920)
export const BEATS = {
  follow: [0, 96],        // 0.0-3.2 s  FOLLOW: camera trails her down the street (purpose: establish place + her)
  stop: [96, 132],        // 3.2-4.4 s  OVER-THE-SHOULDER: she stops; camera passes her shoulder toward the lit window (purpose: what she sees)
  through: [132, 156],    // 4.4-5.2 s  PUSH THROUGH WINDOW: location change without a cut (purpose: enter the hidden space)
  insert: [156, 180],     // 5.2-6.0 s  OBJECT INSERT: settle on the letter on the table (purpose: the object carries the reveal)
} as const;
export const TEST_FRAMES = 180;
export const LETTER_TEXT = ["I waited", "until the", "lamps went", "out.  — M."];
export const SHOP_SIGNS = ["BAKERY", "BOOKS", "POST", "TAILOR", "TEA", "CLOCKS"];
