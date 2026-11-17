// Render every 3D shot of an episode at 10 fps / 540x960 into public/<dir>/clips3d/Sxx.mp4 (one bundle, skip existing).
// usage: node scripts/render_shots3d.mjs <07_shots.json> <publicDir e.g. ep/mr-freeze-heart-of-ice> [ids=1,2,...]
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const [shotsPath, dir, only] = process.argv.slice(2);
if (!shotsPath || !dir) { console.error("usage: node scripts/render_shots3d.mjs <07_shots.json> <publicDir> [ids]"); process.exit(2); }
const data = JSON.parse(fs.readFileSync(shotsPath, "utf8"));
const outDir = path.resolve("public", dir, "clips3d");
fs.mkdirSync(outDir, { recursive: true });
const browserExecutable = process.env.BTL_CHROME || "/opt/pw-browsers/chromium";
const chromiumOptions = { gl: process.env.BTL_GL || "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const ids = only ? only.split(",").map(Number) : data.shots.map((s) => s.id);
const LEAD = 0.25; // whip-in lead (s) so the clip covers the transition
for (const s of data.shots.filter((x) => ids.includes(x.id))) {
  const out = path.join(outDir, `S${String(s.id).padStart(2, "0")}.mp4`);
  if (fs.existsSync(out) && !process.env.FORCE) { console.log("skip", out); continue; }
  const dur = Math.ceil((s.end - s.start + LEAD) * 10);
  const inputProps = { id: s.id, dur };
  const composition = await selectComposition({ serveUrl, id: "Shot3D", inputProps, browserExecutable, chromiumOptions });
  const t0 = Date.now();
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 16, outputLocation: out + ".part.mp4", inputProps, browserExecutable,
    chromiumOptions, concurrency: Number(process.env.CONC || 2), timeoutInMilliseconds: 600000, muted: true });
  fs.renameSync(out + ".part.mp4", out);
  console.log(`S${s.id}: ${dur} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
console.log("done");
