import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

const websitePort = 4174
const websiteOrigin = `http://127.0.0.1:${websitePort}`

delete process.env.NO_COLOR

export default defineConfig({
  testDir: './e2e',
  testMatch: 'website.spec.ts',
  fullyParallel: false,
  retries: 1,
  reporter: 'line',
  use: {
    baseURL: websiteOrigin,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev:website -- --port ${websitePort}`,
    url: websiteOrigin,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
