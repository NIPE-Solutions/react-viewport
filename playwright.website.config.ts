import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'

const websitePort = Number.parseInt(process.env.PLAYWRIGHT_WEBSITE_PORT ?? '4174', 10)
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
    command: 'npm run build:website && npm run serve:website',
    env: { WEBSITE_PORT: String(websitePort) },
    url: websiteOrigin,
    reuseExistingServer: false,
    timeout: 120_000,
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
