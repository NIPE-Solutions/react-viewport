import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import process from 'node:process'

const responsiveSizes = [
  { name: 'compact', width: 320, height: 844 },
  { name: 'medium', width: 768, height: 1024 },
  { name: 'wide', width: 1440, height: 1000 },
] as const

for (const size of responsiveSizes) {
  test(`keeps the coordinate model legible without overflow at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size)
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const geometry = page.getByRole('region', { name: 'One screen, four measured regions' })
    await expect(
      geometry.getByRole('img', { name: /nested viewport coordinate plane/i }),
    ).toBeVisible()
    await expect(geometry.getByText('Layout viewport', { exact: true })).toBeVisible()
    await expect(geometry.getByText('Visual viewport', { exact: true })).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
  })
}

test('supports keyboard navigation with a visible skip-link focus indicator', async ({
  browserName,
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  )

  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  const focusStyle = await skipLink.evaluate((element) => {
    const style = getComputedStyle(element)
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
  })
  expect(focusStyle.outlineStyle).not.toBe('none')
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(2)

  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('has no serious accessibility violations on every documentation route', async ({ page }) => {
  for (const route of ['/', '/api', '/browser-behavior', '/examples', '/imprint', '/privacy']) {
    await page.goto(route)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations, `${route} has accessibility violations`).toEqual([])
  }
})

test('does not create decorative animation for reduced-motion visitors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
})

test('labels real geometry and keeps desktop simulation explicit', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')

  const geometry = page.getByRole('region', { name: 'One screen, four measured regions' })
  await expect(geometry.getByText('Live browser measurement')).toBeVisible()
  await expect(geometry.getByText('Layout viewport', { exact: true })).toBeVisible()
  await expect(geometry.getByText('Visual viewport', { exact: true })).toBeVisible()
  await expect(geometry.getByText('Safe area', { exact: true })).toBeVisible()
  await expect(geometry.getByText('Keyboard occlusion', { exact: true })).toBeVisible()

  const simulation = page.getByRole('group', { name: 'Desktop simulation' })
  await expect(simulation.getByText('Desktop simulation', { exact: true })).toBeVisible()
  await simulation.getByRole('checkbox', { name: 'Use simulated geometry' }).check()
  await simulation.getByRole('slider', { name: 'Visible viewport height' }).fill('520')
  await simulation.getByRole('slider', { name: 'Keyboard occlusion height' }).fill('220')

  await expect(page.getByTestId('geometry-mode')).toHaveText('Simulated geometry')
  await expect(page.getByTestId('visual-height')).toHaveText('520 px')
  await expect(page.getByTestId('keyboard-height')).toHaveText('220 px')
})

test('keeps initialization honest and reserves the plane before measurement', async ({ page }) => {
  await holdAnimationFrames(page)
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')

  const geometry = page.getByRole('region', { name: 'One screen, four measured regions' })
  await expect(geometry.getByTestId('geometry-mode')).toHaveText(
    'Initializing viewport measurement',
  )
  await expect(geometry.getByTestId('visual-height')).toHaveText('Pending')
  const before = await boxOf(geometry.getByRole('img'))

  await page.evaluate(() => {
    const release = (window as Window & { __releaseViewportMeasurement?: () => void })
      .__releaseViewportMeasurement
    if (release === undefined) throw new Error('Animation-frame gate was not installed')
    release()
  })

  await expect(geometry.getByTestId('geometry-mode')).toHaveText('Live browser measurement')
  const after = await boxOf(geometry.getByRole('img'))
  expect(Math.abs(after.width - before.width)).toBeLessThan(1)
  expect(Math.abs(after.height - before.height)).toBeLessThan(1)
})

test('renders zero safe-area and keyboard geometry without painted minimum bands', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
  await expect(page.getByTestId('geometry-mode')).toHaveText('Live browser measurement')

  expect(await renderedThickness(page.getByTestId('safe-top'), 'height')).toBe(0)
  expect(await renderedThickness(page.getByTestId('safe-right'), 'width')).toBe(0)
  expect(await renderedThickness(page.getByTestId('safe-bottom'), 'height')).toBe(0)
  expect(await renderedThickness(page.getByTestId('safe-left'), 'width')).toBe(0)
  expect(await renderedThickness(page.getByTestId('keyboard-region'), 'height')).toBe(0)
})

test('keeps capped simulation controls and geometry readouts in agreement', async ({ page }) => {
  await page.goto('/')
  const simulation = page.getByRole('group', { name: 'Desktop simulation' })
  await simulation.getByRole('checkbox', { name: 'Use simulated geometry' }).check()
  await simulation.getByRole('slider', { name: 'Visible viewport height' }).fill('440')
  await simulation.getByRole('slider', { name: 'Keyboard occlusion height' }).fill('360')
  await simulation.getByRole('slider', { name: 'Visible viewport height' }).fill('760')

  await expect(simulation.getByRole('slider', { name: 'Keyboard occlusion height' })).toHaveValue(
    '40',
  )
  await expect(
    simulation.locator('label').filter({ hasText: 'Keyboard occlusion height' }).locator('output'),
  ).toHaveText('40 px')
  await expect(page.getByTestId('keyboard-height')).toHaveText('40 px')
})

test('renders critical geometry and status labels at a legible size', async ({ page }) => {
  await page.goto('/')
  for (const locator of [
    page.getByTestId('geometry-mode'),
    page.locator('.plane-label--layout'),
    page.locator('.plane-label--visual'),
  ]) {
    const fontSize = await locator.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    )
    expect(fontSize).toBeGreaterThanOrEqual(13)
  }
})

test('draws the live layout plane with the measured aspect ratio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')

  const box = await boxOf(page.locator('.layout-plane'))

  expect(box.width / box.height).toBeCloseTo(1.44, 1)
})

test('moves the CSS-variable composer after real fixture geometry changes', async ({ page }) => {
  await installVisualViewportFixture(page)
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/examples')

  const input = page.getByRole('textbox', { name: 'Message' })
  const composer = page.getByTestId('composer-shell')
  const demo = page.getByTestId('composer-demo')
  await expect(input).toBeVisible()
  await expect
    .poll(() =>
      demo.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--react-viewport-keyboard-height'),
      ),
    )
    .toBe('0px')

  const initialTop = await topOf(composer)
  await input.focus()
  await page.evaluate(() => {
    const fixture = (
      window as Window & {
        __websiteGeometryFixture?: { setVisualHeight(height: number): void }
      }
    ).__websiteGeometryFixture
    if (fixture === undefined) throw new Error('Geometry fixture was not installed')
    fixture.setVisualHeight(500)
  })

  await expect
    .poll(() =>
      demo.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--react-viewport-visual-height'),
      ),
    )
    .toBe('500px')
  await expect
    .poll(() =>
      demo.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--react-viewport-keyboard-height'),
      ),
    )
    .toBe('300px')
  await expect.poll(() => topOf(composer)).toBeLessThan(initialTop - 250)
})

async function topOf(locator: ReturnType<Page['getByTestId']>): Promise<number> {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('Composer did not have a layout box')
  return box.y
}

async function boxOf(locator: ReturnType<Page['locator']>) {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('Element did not have a layout box')
  return box
}

async function renderedThickness(
  locator: ReturnType<Page['getByTestId']>,
  dimension: 'height' | 'width',
): Promise<number> {
  return locator.evaluate((element, selectedDimension) => {
    const bounds = element.getBoundingClientRect()
    return bounds[selectedDimension]
  }, dimension)
}

async function holdAnimationFrames(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window)
    const queuedFrames: FrameRequestCallback[] = []
    let holding = true

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value(callback: FrameRequestCallback) {
        if (!holding) return nativeRequestAnimationFrame(callback)
        queuedFrames.push(callback)
        return queuedFrames.length
      },
    })
    Object.defineProperty(window, '__releaseViewportMeasurement', {
      configurable: true,
      value() {
        holding = false
        for (const callback of queuedFrames.splice(0)) nativeRequestAnimationFrame(callback)
      },
    })
  })
}

async function installVisualViewportFixture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class ControlledVisualViewport extends EventTarget {
      width = 390
      height = 800
      offsetTop = 0
      offsetLeft = 0
      pageTop = 0
      pageLeft = 0
      scale = 1
      onresize = null
      onscroll = null
      onscrollend = null
    }

    const controlled = new ControlledVisualViewport()
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: controlled,
    })
    Object.defineProperty(navigator, 'virtualKeyboard', {
      configurable: true,
      value: undefined,
    })

    Object.defineProperty(window, '__websiteGeometryFixture', {
      configurable: true,
      value: {
        setVisualHeight(height: number) {
          controlled.height = height
          controlled.dispatchEvent(new Event('resize'))
        },
      },
    })
  })
}
