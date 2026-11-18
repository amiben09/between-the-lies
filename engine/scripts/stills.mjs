// usage: node scripts/stills.mjs <CompId> <outPrefix> <f1,f2,...> [scale]   — bundles once, renders JPEG stills.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
import fs from "node:fs";
const cc = "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
const browserExecutable = process.env.BTL_BROWSER ?? (fs.existsSync(cc) ? cc : null);
const chromiumOptions = { gl: process.env.BTL_GL ?? "angle" }; // swangle on GPU-less machines
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${String(f).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale: Number(scale), browserExecutable, chromiumOptions, timeoutInMilliseconds: 240000,
    onBrowserLog: (l) => { if (l.type === "error") console.log("[err]", l.text.slice(0, 300)); } });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
