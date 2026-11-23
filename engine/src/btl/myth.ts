// Myth creatures (ORIGINAL imagined designs). Scylla: six eel-like necks with fanged heads rising from a dark mass,
// her own nymph face kept at the centre (the eyes stay human). `stone` 0..1 turns her to stone from the base up.
import { Cam, Ctx, H, W, clamp, lerp, makeCanvas } from "./core";
import { Light, person } from "./people";

const INK = "#1c121c";
let off: [HTMLCanvasElement, Ctx] | null = null;
export type ScyllaOpts = { rise?: number; lunge?: number; lungeHead?: number; fear?: number; stone?: number; eyesClosed?: number; tint?: string };

/** draws into g at screen position (x, y = waterline centre) with scale s */
export function scylla(g: Ctx, cam: Cam, x: number, y: number, s: number, f: number, light: Light, o: ScyllaOpts = {}) {
  const [c, h] = (off ??= makeCanvas(W, H)); h.setTransform(1, 0, 0, 1, 0, 0); h.clearRect(0, 0, W, H);
  const z = cam.zoom; h.save(); h.translate(W / 2, H / 2); h.scale(z, z); h.translate(-W / 2 - cam.x, -H / 2 - cam.y);
  const rise = o.rise ?? 1, body = o.tint ?? "#3a5048", bodyHi = "#5a7a6a";
  h.translate(x, y); h.scale(s, s);
  // necks (behind the central figure): bezier tubes, ink pass then flesh pass, gentle sine sway; one can lunge
  const necks = [-2.6, -1.6, -0.7, 0.7, 1.6, 2.6];
  const heads: [number, number, number][] = [];
  for (const pass of [0, 1]) necks.forEach((a, i) => {
    const sway = Math.sin(f * 0.05 + i * 1.3) * 40 + Math.sin(f * 0.11 + i) * 15;
    const L = (520 + (i % 2) * 120) * rise, lg = (o.lungeHead === i ? (o.lunge ?? 0) : 0);
    const bx = a * 60, by = -60;
    const tx = a * 150 + sway + lg * a * 120, ty = -L - Math.abs(a) * 30 + lg * 380;
    const cx1 = a * 30 + sway * 0.4, cy1 = -L * 0.45, cx2 = tx - a * 60, cy2 = ty + L * 0.25;
    h.lineCap = "round"; h.beginPath(); h.moveTo(bx, by); h.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
    h.strokeStyle = pass === 0 ? INK : body; h.lineWidth = pass === 0 ? 74 : 62; h.stroke();
    if (pass === 1) { h.strokeStyle = bodyHi; h.lineWidth = 16; h.beginPath(); h.moveTo(bx - 14, by); h.bezierCurveTo(cx1 - 14, cy1, cx2 - 14, cy2, tx - 14, ty); h.stroke();
      const ang = Math.atan2(ty - cy2, tx - cx2); heads.push([tx, ty, ang]); }
  });
  // heads: elongated skull, open jaw with teeth, small yellow-green eyes
  heads.forEach(([hx, hy, ang], i) => { h.save(); h.translate(hx, hy); h.rotate(ang + Math.PI / 2 * 0); const open = 0.5 + 0.5 * Math.sin(f * 0.13 + i * 2);
    h.rotate(ang - Math.PI / 2 + Math.PI / 2);
    h.fillStyle = body; h.strokeStyle = INK; h.lineWidth = 6;
    h.beginPath(); h.ellipse(30, 0, 95, 44, 0, 0, 6.283); h.fill(); h.stroke();                       // skull
    h.save(); h.rotate(0.25 + open * 0.35); h.beginPath(); h.ellipse(40, 26, 80, 22, 0, 0, 6.283); h.fill(); h.stroke(); h.restore(); // jaw
    h.fillStyle = "#3a0e16"; h.beginPath(); h.moveTo(-10, 20); h.lineTo(115, 18); h.lineTo(110, 30 + open * 30); h.lineTo(-5, 34); h.closePath(); h.fill();
    h.fillStyle = "#f2ead8"; for (let k = 0; k < 7; k++) { const tx2 = 0 + k * 16; h.beginPath(); h.moveTo(tx2, 18); h.lineTo(tx2 + 6, 34 + open * 6); h.lineTo(tx2 + 12, 18); h.fill(); }
    h.fillStyle = "#d8f04a"; h.beginPath(); h.ellipse(-10, -14, 11, 8, 0, 0, 6.283); h.fill(); h.fillStyle = "#0a0a08"; h.beginPath(); h.ellipse(-10, -14, 3, 7, 0, 0, 6.283); h.fill();
    h.restore(); });
  h.restore();
  // her own upper body rises out of the mass (waist at the waterline); the mass is drawn in front of her lower half
  const fear = o.fear ?? 1, ps = s * 0.95;
  person(h, cam, 1, "scylla", "teen", { x: x, y: y + 880 * ps * 0.5, s: ps, still: true, breathe: f, eye: lerp(1.2, 0.05, o.eyesClosed ?? 0), brow: 0.8 * fear, mouth: -0.5 * fear, open: 0.25 * fear,
    coat: body, coatHi: bodyHi, armL: [-40, -60], armR: [40, 60], tremble: 0.3 * fear, look: [0, 0.15] }, light);
  h.save(); h.translate(W / 2, H / 2); h.scale(z, z); h.translate(-W / 2 - cam.x, -H / 2 - cam.y); h.translate(x, y); h.scale(s, s);
  h.fillStyle = body; h.strokeStyle = INK; h.lineWidth = 7; h.beginPath(); h.ellipse(0, 40, 330, 120, 0, Math.PI, 0); h.closePath(); h.fill(); h.stroke();
  h.restore();
  // nothing below the waterline
  const wl = (y + 40 * s - H / 2 - cam.y) * z + H / 2; h.clearRect(0, wl, W, H - wl);
  // stone: grey from the base upward, with cracks
  const st = clamp(o.stone ?? 0);
  if (st > 0) { const top = lerp(y + 60 * s, y - 1000 * s, st);
    h.save(); h.globalCompositeOperation = "source-atop"; h.setTransform(1, 0, 0, 1, 0, 0);
    const gr = h.createLinearGradient(0, top - 60, 0, top + 20); gr.addColorStop(0, "rgba(138,134,126,0)"); gr.addColorStop(1, "rgba(138,134,126,0.96)");
    h.fillStyle = gr; h.fillRect(0, top - 60, W, 80); h.fillStyle = "rgba(138,134,126,0.96)"; h.fillRect(0, top + 20, W, H);
    h.strokeStyle = "rgba(60,56,52,0.7)"; h.lineWidth = 3; for (let k = 0; k < 40; k++) { const sx = (k * 97) % W, sy = top + ((k * 53) % 900); h.beginPath(); h.moveTo(sx, sy); h.lineTo(sx + 30, sy + 40); h.lineTo(sx + 10, sy + 80); h.stroke(); }
    h.restore(); }
  g.drawImage(c, 0, 0);
}
