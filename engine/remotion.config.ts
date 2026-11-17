import { Config } from "@remotion/cli/config";
// Linux container: use the pre-installed Chromium. On Windows/macOS, delete this line or set BTL_BROWSER.
Config.setBrowserExecutable(process.env.BTL_BROWSER ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome");
// GPU machine: "angle". No GPU (cloud container): BTL_GL=swangle (software, slower).
Config.setChromiumOpenGlRenderer((process.env.BTL_GL as "angle" | "swangle" | "angle-egl") ?? "angle");
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(2);
