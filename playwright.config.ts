import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  reporter: "list",
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node scripts/mock-api.mjs",
      url: "http://127.0.0.1:8081/api/v1/concerts",
      reuseExistingServer: false,
    },
    {
      command: "corepack.cmd pnpm exec next dev --port 3000 --hostname 127.0.0.1",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: false,
      env: {
        API_BASE_URL: "http://127.0.0.1:8081/api/v1",
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8081/api/v1",
      },
    },
  ],
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
});
