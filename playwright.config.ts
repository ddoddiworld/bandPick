import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Local D1 with seed data (members share the demo PIN in README).
  webServer: {
    command: `npm run db:setup:local && npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/api/state`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
