import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import process from 'node:process'

const responsiveSizes = [
  { name: 'compact', width: 320, height: 844 },
  { name: 'medium', width: 768, height: 1024 },
  { name: 'wide', width: 1440, height: 1000 },
] as const

test('navigation follows the product learning path', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link'),
  ).toHaveText(['Overview', 'Examples', 'Concepts', 'API', 'Browser behavior', 'Project'])
})

test('concepts explains viewport changes before the geometry controls', async ({ page }) => {
  const response = await page.goto('/concepts')

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1, name: 'Concepts' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What changes, and why' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Keyboard status' })).toBeVisible()

  const contextTop = await page
    .getByTestId('geometry-context')
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
  const controlsTop = await page
    .getByRole('group', { name: 'View' })
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
  expect(contextTop).toBeLessThan(controlsTop)
})

test('homepage concepts preview links to the sole geometry simulator', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('link', { name: 'Explore the concepts and simulator' }),
  ).toHaveAttribute('href', '/concepts')
  await expect(page.getByRole('group', { name: 'View' })).toHaveCount(0)
})

test('guides is removed from routes, rendered navigation, and the sitemap', async ({ page }) => {
  const response = await page.goto('/guides')

  expect(response?.status()).toBe(404)

  await page.goto('/concepts')
  await expect(page.locator('nav a[href="/guides"]')).toHaveCount(0)

  await page.goto('/sitemap.xml')
  await expect(page.locator('body')).not.toContainText('/guides')
  await expect(page.locator('body')).toContainText('/concepts')
})

test('metadata describes measured viewport geometry without universal keyboard claims', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page).toHaveTitle(
    'React Viewport — Visual viewport, keyboard and safe-area geometry for React',
  )
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Measured React geometry for visual viewports, software-keyboard occlusion, and safe areas, with documented browser fallbacks and limits.',
  )
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    /composer.*layout viewport.*visual viewport.*keyboard occlusion/i,
  )
})

test('footer makes project and legal trust links discoverable', async ({ page }) => {
  await page.goto('/')

  const footer = page.locator('footer')
  const expectedLinks = [
    ['GitHub', 'https://github.com/NIPE-Solutions/react-viewport'],
    ['Changelog', 'https://github.com/NIPE-Solutions/react-viewport/blob/main/CHANGELOG.md'],
    ['Security', 'https://github.com/NIPE-Solutions/react-viewport/blob/main/SECURITY.md'],
    ['License', 'https://github.com/NIPE-Solutions/react-viewport/blob/main/LICENSE'],
    ['NIPE Open Source', 'https://opensource.nipesolutions.com'],
    ['Imprint', '/imprint'],
    ['Privacy', '/privacy'],
  ] as const

  for (const [name, href] of expectedLinks) {
    await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
  }
})

test('trust page links to repository policy and release documents', async ({ page }) => {
  await page.goto('/project')

  const expectedLinks = [
    ['GitHub repository', 'https://github.com/NIPE-Solutions/react-viewport'],
    ['changelog', 'https://github.com/NIPE-Solutions/react-viewport/blob/main/CHANGELOG.md'],
    ['security policy', 'https://github.com/NIPE-Solutions/react-viewport/blob/main/SECURITY.md'],
    ['MIT license', 'https://github.com/NIPE-Solutions/react-viewport/blob/main/LICENSE'],
  ] as const

  for (const [name, href] of expectedLinks) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
  }
})

test('hero leads with a usable composer and separates live browser state from simulation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')

  const hero = page.getByRole('region', {
    name: 'Know what part of the screen is actually usable.',
  })
  await expect(
    hero.getByRole('heading', {
      name: 'Know what part of the screen is actually usable.',
    }),
  ).toBeVisible()
  await expect(hero.getByText('Live browser', { exact: true })).toBeVisible()
  await expect(
    hero.getByText(/const \{ visual, keyboard, safeArea \} = useViewport\(\)/),
  ).toBeVisible()

  const liveValues = hero.locator('[data-live-viewport-value]')
  await expect(liveValues).toHaveCount(3)
  const beforeSimulation = await liveValues.allTextContents()

  const simulationToggle = hero.getByRole('button', { name: 'Simulate keyboard' })
  await expect(simulationToggle).toHaveAttribute('aria-pressed', 'false')
  await simulationToggle.click()
  await expect(simulationToggle).toHaveAttribute('aria-pressed', 'true')
  await expect(hero.getByText('Simulated keyboard', { exact: true })).toBeVisible()
  await expect(liveValues).toHaveText(beforeSimulation)
})

test('hero gives assistive technology a layout and visual viewport summary', async ({ page }) => {
  await page.goto('/')

  const summary = page.getByTestId('hero-live-summary')
  await expect(summary).toBeVisible()
  await expect(summary).toHaveAccessibleName(/Layout viewport.*Visual viewport/i)
})

for (const size of responsiveSizes) {
  test(`keeps the coordinate model legible without overflow at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size)
    await page.goto('/concepts')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const geometry = page.getByRole('region', { name: 'One screen, four measured regions' })
    await expect(
      geometry.getByRole('img', { name: /layout viewport|nested viewport coordinate plane/i }),
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
  for (const route of [
    '/',
    '/api',
    '/browser-behavior',
    '/examples',
    '/concepts',
    '/project',
    '/imprint',
    '/privacy',
  ]) {
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

test('labels live geometry and keeps deterministic simulation separate', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/concepts')

  const geometry = page.getByRole('region', { name: 'One screen, four measured regions' })
  await expect(geometry.getByText('Live browser geometry')).toBeVisible()
  await expect(geometry.getByText('Layout viewport', { exact: true })).toBeVisible()
  await expect(geometry.getByText('Visual viewport', { exact: true })).toBeVisible()
  await expect(geometry.getByText('Safe area', { exact: true })).toBeVisible()
  await expect(geometry.getByText('Keyboard occlusion', { exact: true })).toBeVisible()
  await expect(
    geometry.getByText('Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))', {
      exact: true,
    }),
  ).toBeVisible()

  const views = page.getByRole('group', { name: 'View' })
  await views.getByRole('button', { name: 'Soft keyboard' }).click()
  await expect(page.getByTestId('geometry-mode')).toHaveText('Geometry simulator · Soft keyboard')
  await expect(page.getByTestId('visual-height')).toHaveText('500 px')
  await expect(page.getByTestId('bottom-occlusion')).toHaveText('300 px')
  await expect(page.getByTestId('keyboard-height')).toHaveText('300 px')
})

test('keeps initialization honest and reserves the plane before measurement', async ({ page }) => {
  await holdAnimationFrames(page)
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/concepts')

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

  await expect(geometry.getByTestId('geometry-mode')).toHaveText('Live browser geometry')
  const after = await boxOf(geometry.getByRole('img'))
  expect(Math.abs(after.width - before.width)).toBeLessThan(1)
  expect(Math.abs(after.height - before.height)).toBeLessThan(1)
})

test('renders zero safe-area and keyboard geometry without painted minimum bands', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/concepts')
  await expect(page.getByTestId('geometry-mode')).toHaveText('Live browser geometry')

  expect(await renderedThickness(page.getByTestId('safe-top'), 'height')).toBe(0)
  expect(await renderedThickness(page.getByTestId('safe-right'), 'width')).toBe(0)
  expect(await renderedThickness(page.getByTestId('safe-bottom'), 'height')).toBe(0)
  expect(await renderedThickness(page.getByTestId('safe-left'), 'width')).toBe(0)
  await expect(page.getByTestId('keyboard-region')).toHaveCount(0)
})

test('geometry scenarios teach coherent chrome, shifted keyboard, and zoom states', async ({
  page,
}) => {
  await page.goto('/concepts')
  const views = page.getByRole('group', { name: 'View' })

  await views.getByRole('button', { name: 'Browser chrome' }).click()
  await expect(page.getByTestId('visual-height')).toHaveText('720 px')
  await expect(page.getByTestId('keyboard-height')).toHaveText('0 px')
  await expect(page.getByTestId('scenario-keyboard-status')).toHaveText('Keyboard status: closed')

  await views.getByRole('button', { name: 'Shifted keyboard' }).click()
  await expect(page.getByTestId('visual-height')).toHaveText('472 px')
  await expect(page.getByTestId('bottom-occlusion')).toHaveText('300 px')
  await expect(page.getByTestId('keyboard-height')).toHaveText('300 px')
  await expect(page.getByTestId('scenario-keyboard-status')).toHaveText('Keyboard status: open')

  await views.getByRole('button', { name: 'Zoom' }).click()
  await expect(page.getByTestId('keyboard-height')).toHaveText('0 px')
  await expect(page.getByTestId('scenario-description')).toContainText(
    'Scale reduces the visible region without keyboard occlusion',
  )
})

test('warns when custom keyboard occlusion contradicts visual geometry', async ({ page }) => {
  await page.goto('/concepts')
  const views = page.getByRole('group', { name: 'View' })
  await views.getByRole('button', { name: 'Custom' }).click()
  await page.getByRole('spinbutton', { name: 'Keyboard occlusion' }).fill('180')

  await expect(page.getByTestId('bottom-occlusion')).toHaveText('152 px')
  await expect(page.getByTestId('custom-warning')).toContainText(
    'does not match the current bottom occlusion (152 px)',
  )
})

test('renders critical geometry and status labels at a legible size', async ({ page }) => {
  await page.goto('/concepts')
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
  await page.goto('/concepts')

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

test('examples expose concrete viewport-aware interface outputs', async ({ page }) => {
  await page.goto('/examples')

  for (const heading of ['Chat composer', 'Modal actions', 'Visible area', 'CSS variables']) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
  }

  await expect(page.getByTestId('effective-bottom-inset')).toHaveText(/\d+px/)
  await expect(page.getByTestId('visible-area-height')).toHaveText(/\d+px/)
  await expect(page.getByTestId('css-keyboard-height')).toHaveText(/\d+px/)
  await expect(page.getByTestId('css-safe-area-bottom')).toHaveText(/\d+px/)
})

test('examples use the effective inset and keep modal actions inside the visual region', async ({
  page,
}) => {
  await installVisualViewportFixture(page)
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/examples')

  await setWebsiteGeometry(page, { visualHeight: 800, safeAreaBottom: 34 })
  await expect(page.getByTestId('keyboard-height-output')).toHaveText('0px')
  await expect(page.getByTestId('safe-area-bottom-output')).toHaveText('34px')
  await expect(page.getByTestId('effective-bottom-inset')).toHaveText('34px')

  await page.getByRole('textbox', { name: 'Message' }).focus()
  await setWebsiteGeometry(page, { visualHeight: 474, safeAreaBottom: 34 })
  await expect(page.getByTestId('keyboard-height-output')).toHaveText('326px')
  await expect(page.getByTestId('safe-area-bottom-output')).toHaveText('34px')
  await expect(page.getByTestId('effective-bottom-inset')).toHaveText('326px')
  await expect(page.getByTestId('visible-area-height')).toHaveText('474px')
  expect(await page.locator('output[data-example-output]').allTextContents()).not.toContain('360px')

  const visualRegion = await boxOf(page.getByTestId('modal-visual-region'))
  const modalActions = await boxOf(page.getByTestId('modal-action-bar'))
  expect(modalActions.y).toBeGreaterThanOrEqual(visualRegion.y)
  expect(modalActions.y + modalActions.height).toBeLessThanOrEqual(
    visualRegion.y + visualRegion.height + 1,
  )

  await setWebsiteGeometry(page, { visualHeight: 474, safeAreaBottom: 0 })
  await expect(page.getByTestId('keyboard-height-output')).toHaveText('326px')
  await expect(page.getByTestId('safe-area-bottom-output')).toHaveText('0px')
  await expect(page.getByTestId('effective-bottom-inset')).toHaveText('326px')
  expect(await page.locator('output[data-example-output]').allTextContents()).not.toContain('360px')
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
    let safeAreaBottom = 0
    const nativeGetComputedStyle = window.getComputedStyle.bind(window)

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
    Object.defineProperty(window, 'getComputedStyle', {
      configurable: true,
      value(element: Element, pseudoElement?: string | null) {
        const computed = nativeGetComputedStyle(element, pseudoElement)
        if (
          !(element instanceof HTMLElement) ||
          element.style.paddingBottom !== 'env(safe-area-inset-bottom)'
        ) {
          return computed
        }

        return new Proxy(computed, {
          get(target, property) {
            if (property === 'paddingBottom') return `${safeAreaBottom}px`
            const value = Reflect.get(target, property, target)
            return typeof value === 'function' ? value.bind(target) : value
          },
        })
      },
    })

    Object.defineProperty(window, '__websiteGeometryFixture', {
      configurable: true,
      value: {
        setVisualHeight(height: number) {
          controlled.height = height
          controlled.dispatchEvent(new Event('resize'))
        },
        setGeometry(next: { visualHeight: number; safeAreaBottom: number }) {
          controlled.height = next.visualHeight
          safeAreaBottom = next.safeAreaBottom
          controlled.dispatchEvent(new Event('resize'))
        },
      },
    })
  })
}

async function setWebsiteGeometry(
  page: Page,
  geometry: { readonly visualHeight: number; readonly safeAreaBottom: number },
): Promise<void> {
  await page.evaluate((nextGeometry) => {
    const fixture = (
      window as Window & {
        __websiteGeometryFixture?: {
          setGeometry(next: { visualHeight: number; safeAreaBottom: number }): void
        }
      }
    ).__websiteGeometryFixture
    if (fixture === undefined) throw new Error('Geometry fixture was not installed')
    fixture.setGeometry(nextGeometry)
  }, geometry)
}
