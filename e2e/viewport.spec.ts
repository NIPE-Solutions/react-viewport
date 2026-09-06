import { expect, test, type Page } from '@playwright/test'

import type { ViewportState } from '@nipe-solutions/react-viewport'

const VIEWPORT_CSS_PROPERTIES = [
  '--react-viewport-layout-width',
  '--react-viewport-layout-height',
  '--react-viewport-visual-width',
  '--react-viewport-visual-height',
  '--react-viewport-visual-offset-top',
  '--react-viewport-visual-offset-left',
  '--react-viewport-visual-page-top',
  '--react-viewport-visual-page-left',
  '--react-viewport-scale',
  '--react-viewport-keyboard-height',
  '--react-viewport-safe-area-top',
  '--react-viewport-safe-area-right',
  '--react-viewport-safe-area-bottom',
  '--react-viewport-safe-area-left',
] as const

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

async function expectKeyboard(page: Page, open: boolean, height: number): Promise<void> {
  await expect.poll(async () => (await readState(page)).keyboard.open).toBe(open)
  await expect.poll(async () => (await readState(page)).keyboard.height).toBe(height)
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
    window.__viewportFixture.dispatch('window-resize')
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
        pageTop: 0,
        pageLeft: 0,
        scale: 1,
      },
      supported: { visualViewport: false, virtualKeyboard: false },
    })
})

test('updates fallback page coordinates from a window scroll event alone', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=absent')

  await page.evaluate(() => {
    window.__viewportFixture.setWindowScroll(37.5, 212.25)
    window.__viewportFixture.dispatch('window-scroll')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      visual: {
        pageTop: 212.25,
        pageLeft: 37.5,
      },
    })
})

test('reports normal viewport keyboard state as closed', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')

  await expectKeyboard(page, false, 0)
})

test('rejects focused browser chrome below the keyboard threshold', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({ height: 720, offsetTop: 56 })
    window.__viewportFixture.dispatch('visual-resize')
  })

  await expectKeyboard(page, false, 0)
})

test('reports soft keyboard occlusion from a focused 800 to 500 visual-height sequence', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({ height: 500 })
    window.__viewportFixture.dispatch('visual-resize')
  })

  await expectKeyboard(page, true, 300)
})

test('reports shifted visual viewport keyboard occlusion from the bottom edge', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({ height: 472, offsetTop: 28 })
    window.__viewportFixture.dispatch('visual-resize')
  })

  await expectKeyboard(page, true, 300)
})

test('keeps hardware-keyboard-like focused viewport closed without a visual reduction', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await expectKeyboard(page, false, 0)
})

test('does not infer a keyboard when layout and visual geometry shrink together', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setLayout(390, 500)
    window.__viewportFixture.setVisualViewport({ height: 500 })
    window.__viewportFixture.dispatch('window-resize', 'visual-resize')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      layout: { width: 390, height: 500 },
      visual: { height: 500, offsetTop: 0, scale: 1 },
      keyboard: { open: false, height: 0 },
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

test('publishes controlled offsets and page positions from a VisualViewport scroll event alone', async ({
  page,
}) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({
      offsetTop: 12.25,
      offsetLeft: 7.5,
      pageTop: 148.75,
      pageLeft: 42.125,
    })
    window.__viewportFixture.dispatch('visual-scroll')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      visual: {
        offsetTop: 12.25,
        offsetLeft: 7.5,
        pageTop: 148.75,
        pageLeft: 42.125,
      },
    })
})

test('rejects a 2x zoom resize as a keyboard', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock')
  await page.getByLabel('Editable control').focus()

  await page.evaluate(() => {
    window.__viewportFixture.setVisualViewport({
      width: 240.5,
      height: 500,
      scale: 2,
    })
    window.__viewportFixture.dispatch('visual-resize')
  })

  await expectKeyboard(page, false, 0)
})

test('updates native keyboard intersection from a geometrychange event alone', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock&keyboard=mock')

  await page.evaluate(() => {
    window.__viewportFixture.setKeyboardRect({ x: 20, y: 610, width: 350, height: 250 })
    window.__viewportFixture.dispatch('keyboard-geometrychange')
  })

  await expect
    .poll(() => readState(page))
    .toMatchObject({
      keyboard: { open: true, height: 190 },
      supported: { visualViewport: true, virtualKeyboard: true },
    })
})

test('accounts for listener identity and capture when tracking cleanup', async ({ page }) => {
  await openReadyFixture(page, '?layout=mock&visual=mock&keyboard=mock')

  const counts = await page.evaluate(() => {
    const trackedListener = () => undefined
    const unknownListener = () => undefined
    const count = () => window.__viewportFixture.getDiagnostics().listenerCounts['window:resize']
    const initial = count()

    window.removeEventListener('resize', unknownListener, true)
    const afterUnknownRemoval = count()
    window.addEventListener('resize', trackedListener, true)
    const afterCapturedAddition = count()
    window.addEventListener('resize', trackedListener, true)
    const afterDuplicateAddition = count()
    window.addEventListener('resize', trackedListener, false)
    const afterCaptureVariant = count()
    window.removeEventListener('resize', trackedListener, true)
    const afterCapturedRemoval = count()
    window.removeEventListener('resize', trackedListener, true)
    const afterDuplicateRemoval = count()
    window.removeEventListener('resize', trackedListener, false)
    const final = count()

    return {
      initial,
      afterUnknownRemoval,
      afterCapturedAddition,
      afterDuplicateAddition,
      afterCaptureVariant,
      afterCapturedRemoval,
      afterDuplicateRemoval,
      final,
    }
  })

  expect(counts).toEqual({
    initial: 1,
    afterUnknownRemoval: 1,
    afterCapturedAddition: 2,
    afterDuplicateAddition: 2,
    afterCaptureVariant: 3,
    afterCapturedRemoval: 2,
    afterDuplicateRemoval: 2,
    final: 1,
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
  const activeDiagnostics = await page.evaluate(
    (properties) => ({
      ...window.__viewportFixture.getDiagnostics(),
      cssVariables: Object.fromEntries(
        properties.map((property) => [
          property,
          document.documentElement.style.getPropertyValue(property),
        ]),
      ),
    }),
    VIEWPORT_CSS_PROPERTIES,
  )

  expect(Object.values(activeDiagnostics.listenerCounts).some((count) => count > 0)).toBe(true)
  expect(activeDiagnostics.probeCount).toBe(1)
  expect(activeDiagnostics.cssVariables).toEqual({
    '--react-viewport-layout-width': '390px',
    '--react-viewport-layout-height': '800px',
    '--react-viewport-visual-width': '390px',
    '--react-viewport-visual-height': '800px',
    '--react-viewport-visual-offset-top': '0px',
    '--react-viewport-visual-offset-left': '0px',
    '--react-viewport-visual-page-top': '0px',
    '--react-viewport-visual-page-left': '0px',
    '--react-viewport-scale': '1',
    '--react-viewport-keyboard-height': '0px',
    '--react-viewport-safe-area-top': '0px',
    '--react-viewport-safe-area-right': '0px',
    '--react-viewport-safe-area-bottom': '0px',
    '--react-viewport-safe-area-left': '0px',
  })

  const cleanupDiagnostics = await page.evaluate((properties) => {
    window.__viewportFixture.unmount()
    const renderCount = window.__viewportFixture.getDiagnostics().renderCount
    const observedEvents = {
      documentFocusIn: 0,
      documentFocusOut: 0,
      windowResize: 0,
      windowScroll: 0,
      visualResize: 0,
      visualScroll: 0,
      keyboardGeometryChange: 0,
    }
    const onDocumentFocusIn = () => (observedEvents.documentFocusIn += 1)
    const onDocumentFocusOut = () => (observedEvents.documentFocusOut += 1)
    const onWindowResize = () => (observedEvents.windowResize += 1)
    const onWindowScroll = () => (observedEvents.windowScroll += 1)
    const onVisualResize = () => (observedEvents.visualResize += 1)
    const onVisualScroll = () => (observedEvents.visualScroll += 1)
    const onKeyboardGeometryChange = () => (observedEvents.keyboardGeometryChange += 1)
    const visualViewport = window.visualViewport
    const virtualKeyboard = (navigator as Navigator & { readonly virtualKeyboard?: EventTarget })
      .virtualKeyboard

    document.addEventListener('focusin', onDocumentFocusIn)
    document.addEventListener('focusout', onDocumentFocusOut)
    window.addEventListener('resize', onWindowResize)
    window.addEventListener('scroll', onWindowScroll)
    visualViewport?.addEventListener('resize', onVisualResize)
    visualViewport?.addEventListener('scroll', onVisualScroll)
    virtualKeyboard?.addEventListener('geometrychange', onKeyboardGeometryChange)
    window.__viewportFixture.dispatch(
      'document-focusin',
      'document-focusout',
      'window-resize',
      'window-scroll',
      'visual-resize',
      'visual-scroll',
      'keyboard-geometrychange',
    )
    document.removeEventListener('focusin', onDocumentFocusIn)
    document.removeEventListener('focusout', onDocumentFocusOut)
    window.removeEventListener('resize', onWindowResize)
    window.removeEventListener('scroll', onWindowScroll)
    visualViewport?.removeEventListener('resize', onVisualResize)
    visualViewport?.removeEventListener('scroll', onVisualScroll)
    virtualKeyboard?.removeEventListener('geometrychange', onKeyboardGeometryChange)
    return {
      ...window.__viewportFixture.getDiagnostics(),
      renderCountBeforeDispatch: renderCount,
      observedEvents,
      cssVariables: Object.fromEntries(
        properties.map((property) => [
          property,
          document.documentElement.style.getPropertyValue(property),
        ]),
      ),
    }
  }, VIEWPORT_CSS_PROPERTIES)

  expect(cleanupDiagnostics.pendingAnimationFrames).toBe(0)
  expect(cleanupDiagnostics.probeCount).toBe(0)
  expect(cleanupDiagnostics.renderCount).toBe(cleanupDiagnostics.renderCountBeforeDispatch)
  expect(cleanupDiagnostics.observedEvents).toEqual({
    documentFocusIn: 1,
    documentFocusOut: 1,
    windowResize: 1,
    windowScroll: 1,
    visualResize: 1,
    visualScroll: 1,
    keyboardGeometryChange: 1,
  })
  expect(Object.values(cleanupDiagnostics.listenerCounts).every((count) => count === 0)).toBe(true)
  expect(cleanupDiagnostics.cssVariables).toEqual({
    '--react-viewport-layout-width': '',
    '--react-viewport-layout-height': '',
    '--react-viewport-visual-width': '',
    '--react-viewport-visual-height': '',
    '--react-viewport-visual-offset-top': '',
    '--react-viewport-visual-offset-left': '',
    '--react-viewport-visual-page-top': '',
    '--react-viewport-visual-page-left': '',
    '--react-viewport-scale': '',
    '--react-viewport-keyboard-height': '',
    '--react-viewport-safe-area-top': '',
    '--react-viewport-safe-area-right': '',
    '--react-viewport-safe-area-bottom': '',
    '--react-viewport-safe-area-left': '',
  })
})
