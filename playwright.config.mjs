import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "python -m http.server 54189 --bind 127.0.0.1 --directory dist/public",
    url: "http://127.0.0.1:54189",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === "win32" ? "msedge" : undefined),
  },
});
