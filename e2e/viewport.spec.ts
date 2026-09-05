import { expect, test, type Page } from '@playwright/test'

import type { ViewportState, VisualViewportState } from '@nipe-solutions/react-viewport'

type FixtureEvent =
  'keyboard-geometrychange' | 'visual-resize' | 'visual-scroll' | 'window-resize' | 'window-scroll'

interface FixtureDiagnostics {
  readonly listenerCounts: Record<string, number>
  readonly pendingAnimationFrames: number
  readonly probeCount: number
  readonly renderCount: number
}

interface BrowserFixtureControls {
  setLayout(width: number, height: number): void
  setWindowScroll(left: number, top: number): void
  setVisualViewport(values: Partial<VisualViewportState>): void
  setKeyboardRect(rect: { x: number; y: number; width: number; height: number }): void
  dispatch(...events: FixtureEvent[]): void
  getDiagnostics(): FixtureDiagnostics
  unmount(): void
}

declare global {
  interface Window {
    __viewportFixture: BrowserFixtureControls
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

async function readState(page: Page): Promise<ViewportState> {
  const serialized = await page.getByTestId('viewport-state').textContent()

  if (serialized === null) {
    throw new Error('The viewport fixture did not render a state')
  }

  return JSON.parse(serialized) as ViewportState
}

async function openReadyFixture(page: Page, search = ''): Promise<void> {
  await page.goto(`/browser/${search}`)
  await expect.poll(() => readState(page)).not.toEqual(SERVER_STATE)
  await expect.poll(async () => (await readState(page)).ready).toBe(true)
}

test('observes actual layout resizes and the real VisualViewport when available', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 })
  await openReadyFixture(page)

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      layout: { width: 800, height: 600 },
    })

  const actualVisualViewport = await page.evaluate(() => {
    const visual = window.visualViewport

    return visual === null
      ? null
      : {
          width: visual.width,
          height: visual.height,
          offsetTop: visual.offsetTop,
          offsetLeft: visual.offsetLeft,
          pageTop: visual.pageTop,
          pageLeft: visual.pageLeft,
          scale: visual.scale,
        }
  })
  const initialState = await readState(page)

  expect(initialState.supported.visualViewport).toBe(actualVisualViewport !== null)
  if (actualVisualViewport !== null) {
    expect(initialState.visual).toEqual(actualVisualViewport)
  }

  await page.setViewportSize({ width: 640, height: 480 })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      layout: { width: 640, height: 480 },
    })
})

test('falls back to layout geometry and window page coordinates without VisualViewport', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=absent')

  await page.evaluate(() => {
    window.__viewportFixture.setLayout(720, 540)
    window.__viewportFixture.setWindowScroll(37.5, 212.25)
    window.__viewportFixture.dispatch('window-resize', 'window-scroll')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      layout: { width: 720, height: 540 },
      visual: {
        width: 720,
        height: 540,
        offsetTop: 0,
        offsetLeft: 0,
        pageTop: 212.25,
        pageLeft: 37.5,
        scale: 1,
      },
      supported: { visualViewport: false, virtualKeyboard: false },
    })
})

test('infers keyboard occlusion from a focused 800 to 500 visual-height sequence', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({ height: 500 })
    window.__viewportFixture.dispatch('visual-resize')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      layout: { width: 390, height: 800 },
      visual: { height: 500, scale: 1 },
      keyboard: { open: true, height: 300 },
    })
})

test('rejects a focused 800 to 750 toolbar-like visual-height sequence', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({ height: 750 })
    window.__viewportFixture.dispatch('visual-resize')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      visual: { height: 750 },
      keyboard: { open: false, height: 0 },
    })
})

test('publishes controlled visual offsets and page positions while rejecting zoom as a keyboard', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({
      width: 240.5,
      height: 500,
      offsetTop: 12.25,
      offsetLeft: 7.5,
      pageTop: 148.75,
      pageLeft: 42.125,
      scale: 2,
    })
    window.__viewportFixture.dispatch('visual-resize', 'visual-scroll')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      visual: {
        width: 240.5,
        height: 500,
        offsetTop: 12.25,
        offsetLeft: 7.5,
        pageTop: 148.75,
        pageLeft: 42.125,
        scale: 2,
      },
      keyboard: { open: false, height: 0 },
    })
})

test('uses controlled native Virtual Keyboard intersection rectangles', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock&keyboard=mock')

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({ height: 500 })
    window.__viewportFixture.setKeyboardRect({ x: 20, y: 610, width: 350, height: 250 })
    window.__viewportFixture.dispatch('visual-resize', 'keyboard-geometrychange')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      keyboard: { open: true, height: 190 },
      supported: { visualViewport: true, virtualKeyboard: true },
    })
})

test('batches duplicate source events into one animation-frame publication', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock&keyboard=mock')
  const initialDiagnostics = await page.evaluate(() => window.__viewportFixture.getDiagnostics())

  const queuedDiagnostics = await page.evaluate(() => {
    window.__viewportFixture.setLayout(844, 390)
    window.__viewportFixture.setVisualViewport({
      width: 700.5,
      height: 340.25,
      offsetTop: 7.5,
      offsetLeft: 12.25,
      pageTop: 107.5,
      pageLeft: 52.25,
      scale: 1.25,
    })
    window.__viewportFixture.setKeyboardRect({ x: 0, y: 300, width: 844, height: 90 })
    window.__viewportFixture.dispatch(
      'window-resize',
      'window-resize',
      'visual-resize',
      'visual-scroll',
      'keyboard-geometrychange',
      'keyboard-geometrychange',
    )
    return window.__viewportFixture.getDiagnostics()
  })

  expect(queuedDiagnostics.pendingAnimationFrames).toBe(1)
  expect(queuedDiagnostics.renderCount).toBe(initialDiagnostics.renderCount)

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      layout: { width: 844, height: 390 },
      visual: {
        width: 700.5,
        height: 340.25,
        offsetTop: 7.5,
        offsetLeft: 12.25,
        pageTop: 107.5,
        pageLeft: 52.25,
        scale: 1.25,
      },
      keyboard: { open: true, height: 90 },
    })

  const updatedDiagnostics = await page.evaluate(() => window.__viewportFixture.getDiagnostics())
  expect(updatedDiagnostics.renderCount).toBe(initialDiagnostics.renderCount + 1)
})

test('updates CSS variables from the same controlled viewport snapshot', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock&keyboard=mock')

  await page.evaluate(() => {
    window.__viewportFixture.setLayout(844, 390)
    window.__viewportFixture.setVisualViewport({
      width: 700.5,
      height: 340.25,
      offsetTop: 7.5,
      scale: 1.25,
    })
    window.__viewportFixture.setKeyboardRect({ x: 0, y: 300, width: 844, height: 90 })
    window.__viewportFixture.dispatch('window-resize', 'visual-resize', 'keyboard-geometrychange')
  })

  await expect
    .poll(() =>
      page.evaluate(() => ({
        layoutWidth: document.documentElement.style.getPropertyValue(
          '--react-viewport-layout-width',
        ),
        visualHeight: document.documentElement.style.getPropertyValue(
          '--react-viewport-visual-height',
        ),
        visualOffsetTop: document.documentElement.style.getPropertyValue(
          '--react-viewport-visual-offset-top',
        ),
        scale: document.documentElement.style.getPropertyValue('--react-viewport-scale'),
        keyboardHeight: document.documentElement.style.getPropertyValue(
          '--react-viewport-keyboard-height',
        ),
      })),
    )
    .toEqual({
      layoutWidth: '844px',
      visualHeight: '340.25px',
      visualOffsetTop: '7.5px',
      scale: '1.25',
      keyboardHeight: '90px',
    })
})

test('removes listeners, queued frames, probes, and owned CSS variables on unmount', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock&keyboard=mock')
  const activeDiagnostics = await page.evaluate(() => ({
    ...window.__viewportFixture.getDiagnostics(),
    layoutWidth: document.documentElement.style.getPropertyValue('--react-viewport-layout-width'),
  }))

  expect(Object.values(activeDiagnostics.listenerCounts).some((count) => count > 0)).toBe(true)
  expect(activeDiagnostics.probeCount).toBe(1)
  expect(activeDiagnostics.layoutWidth).toBe('390px')

  const cleanupDiagnostics = await page.evaluate(() => {
    window.__viewportFixture.dispatch('window-resize', 'visual-resize')
    window.__viewportFixture.unmount()
    return {
      ...window.__viewportFixture.getDiagnostics(),
      layoutWidth: document.documentElement.style.getPropertyValue('--react-viewport-layout-width'),
    }
  })

  expect(cleanupDiagnostics.pendingAnimationFrames).toBe(0)
  expect(cleanupDiagnostics.probeCount).toBe(0)
  expect(cleanupDiagnostics.layoutWidth).toBe('')
  expect(Object.values(cleanupDiagnostics.listenerCounts).every((count) => count === 0)).toBe(true)
})
