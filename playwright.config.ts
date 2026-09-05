import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

const fixturePort = 4173
const fixtureOrigin = `http://127.0.0.1:${fixturePort}`

delete process.env.NO_COLOR

export default defineConfig({
  testDir: './e2e',
  retries: 1,
  use: {
    baseURL: fixtureOrigin,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build:dist && node test/fixtures/hydration/server.mjs',
    url: `${fixtureOrigin}/browser/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PLAYWRIGHT_FIXTURE_PORT: String(fixturePort),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
