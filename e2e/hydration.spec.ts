import { expect, test, type Page } from '@playwright/test'

import type { ViewportState } from '@nipe-solutions/react-viewport'

interface HydrationFixtureControls {
  flushAnimationFrames(): void
}

declare global {
  interface Window {
    __hydrationFixture: HydrationFixtureControls
  }
}

const SERVER_STATE: ViewportState = {
  ready: false,
  layout: null,
  visual: null,
  keyboard: { open: false, height: 0 },
  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  orientation: null,
  supported: { visualViewport: false, virtualKeyboard: false },
}

async function readHydrationState(page: Page): Promise<ViewportState> {
  const serialized = await page.getByTestId('hydration-state').textContent()

  if (serialized === null) {
    throw new Error('The hydration fixture did not render a state')
  }

  return JSON.parse(serialized) as ViewportState
}

test('hydrates the server snapshot without a mismatch before client geometry is ready', async ({
  page,
}) => {
  const browserErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))

  await page.goto('/hydration/')
  await expect(page.locator('#root')).toHaveAttribute('data-hydrated', 'true')

  expect(await readHydrationState(page)).toEqual(SERVER_STATE)
  expect(browserErrors).toEqual([])

  await page.evaluate(() => window.__hydrationFixture.flushAnimationFrames())

  await expect.poll(async () => (await readHydrationState(page)).ready).toBe(true)
  expect(browserErrors).toEqual([])
})
