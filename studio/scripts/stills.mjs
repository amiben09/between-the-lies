// Render stills from a composition. Linux / cloud friendly (software WebGL via SwiftShader when there is no GPU).
// usage: node scripts/stills.mjs <compositionId> <outPrefix> <frame,frame,...> [scale=0.5]
// env: BTL_PROPS (JSON inputProps, e.g. '{"light":"night"}'), BTL_CHROME (browser path, default /opt/pw-browsers/chromium), BTL_GL (swiftshader|angle|egl, default swangle),
//      REMOTION_TMP (bundle temp folder; each bundle copies public/)
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
if (!id || !prefix || !frames) {
  console.error("usage: node scripts/stills.mjs <compositionId> <outPrefix> <frame,frame,...> [scale]");
  process.exit(2);
}
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TMPDIR = process.env.REMOTION_TMP; }
const browserExecutable = process.env.BTL_CHROME || "/opt/pw-browsers/chromium";
const chromiumOptions = { gl: process.env.BTL_GL || "swangle" };
fs.mkdirSync(path.dirname(path.resolve(prefix)), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const inputProps = process.env.BTL_PROPS ? JSON.parse(process.env.BTL_PROPS) : {};
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (l.type === "error") console.log("[browser]", l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 90,
    scale: Number(scale), inputProps, browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000, onBrowserLog });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
