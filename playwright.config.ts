import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import path from "node:path";

// Load env vars for the test process itself (helpers that talk to Supabase via
// the service-role key). Next's dev server loads its own env from .env.local;
// this only covers the Playwright runner. .env.local lives in the repo parent
// dir for this project — fall back to cwd if it isn't.
loadEnvConfig(path.resolve(process.cwd(), ".."), false);
loadEnvConfig(process.cwd(), false);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
