import { Config } from "@remotion/cli/config";
import fs from "node:fs";
// Browser: BTL_BROWSER if set; else the cloud container's Chromium if present; else Remotion's own downloaded
// Chrome Headless Shell (Windows/macOS: nothing to configure).
const containerChrome = "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
const browser = process.env.BTL_BROWSER ?? (fs.existsSync(containerChrome) ? containerChrome : null);
if (browser) Config.setBrowserExecutable(browser);
// GPU machine: "angle". No GPU (cloud container): BTL_GL=swangle (software, slower).
Config.setChromiumOpenGlRenderer((process.env.BTL_GL as "angle" | "swangle" | "angle-egl") ?? "angle");
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(2);
