import { defineConfig, devices } from "@playwright/test";

const port = 3001;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `sh -c 'export DATABASE_URL=file:./dev.db; npm run db:migrate && npm run db:seed && npm run dev -- -p ${port}'`,
    reuseExistingServer: true,
    timeout: 120_000,
    url: `http://localhost:${port}`,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
