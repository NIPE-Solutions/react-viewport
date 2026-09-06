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
  ).toHaveText([
    'Overview',
    'Examples',
    'Geometry Lab',
    'CSS Baseline',
    'Concepts',
    'API',
    'Browser behavior',
    'Project',
  ])
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

test('homepage hands off to application logic, raw geometry, and bounded browser evidence', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('link', { name: 'Explore the concepts and simulator' }),
  ).toHaveAttribute('href', '/concepts')
  await expect(page.getByRole('group', { name: 'View' })).toHaveCount(1)

  await expect(
    page.getByRole('heading', { name: 'When application logic needs geometry' }),
  ).toBeVisible()
  await expect(page.getByRole('region', { name: 'Live application decision' })).toContainText(
    'Geometry in. Rendering decision out.',
  )
  await expect(
    page.getByRole('heading', { name: 'Why not just use window.visualViewport?' }),
  ).toBeVisible()

  const homepageEvidence = page.getByRole('region', {
    name: 'Browser evidence has boundaries',
  })
  await expect(homepageEvidence).toContainText(
    /Automated evidence.*tests cover package geometry and website behavior/s,
  )
  await expect(homepageEvidence).toContainText(/Physical-device status.*pending/is)

  const referenceLinks = [
    ['CSS alternatives', '/lab/css'],
    ['Keyboard and safe area', '/concepts#keyboard-and-safe-area'],
    ['API reference', '/api'],
    ['Browser behavior', '/browser-behavior'],
  ] as const
  for (const [name, href] of referenceLinks) {
    await expect(homepageEvidence.getByRole('link', { name, exact: true })).toHaveAttribute(
      'href',
      href,
    )
  }

  await homepageEvidence.getByRole('link', { name: 'Browser behavior', exact: true }).click()
  await expect(page).toHaveURL(/\/browser-behavior$/)

  const automatedEvidence = page.getByRole('region', { name: 'Automated evidence' })
  await expect(automatedEvidence).toContainText(/\d+ library scenarios/)
  await expect(automatedEvidence).toContainText(/\d+ documentation-site scenarios/)
  await expect(
    automatedEvidence.getByRole('link', { name: 'Library browser suite', exact: true }),
  ).toHaveAttribute(
    'href',
    'https://github.com/NIPE-Solutions/react-viewport/blob/main/e2e/viewport.spec.ts',
  )
  await expect(
    automatedEvidence.getByRole('link', { name: 'Website browser suite', exact: true }),
  ).toHaveAttribute(
    'href',
    'https://github.com/NIPE-Solutions/react-viewport/blob/main/e2e/website.spec.ts',
  )
  await expect(
    automatedEvidence.getByRole('link', { name: 'Current readiness report', exact: true }),
  ).toHaveAttribute(
    'href',
    'https://github.com/NIPE-Solutions/react-viewport/blob/main/docs/releases/2026-09-06-device-lab-readiness.md',
  )
  await expect(page.getByRole('complementary', { name: 'Physical-device status' })).toContainText(
    'pending',
  )
})

test('guides is removed from routes, rendered navigation, and the sitemap', async ({ page }) => {
  const response = await page.goto('/guides')

  expect(response?.status()).toBe(404)

  await page.goto('/concepts')
  await expect(page.locator('nav a[href="/guides"]')).toHaveCount(0)

  const sitemapResponse = await page.request.get('/sitemap.xml')
  expect(sitemapResponse.status()).toBe(200)

  const sitemap = await sitemapResponse.text()
  expect(sitemap).not.toContain('/guides')
  expect(sitemap).toContain('/concepts')
})

test('metadata describes measured viewport geometry without universal keyboard claims', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page).toHaveTitle('React Viewport — Visual viewport geometry as React state')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Reactive visual viewport, keyboard occlusion, zoom and safe-area geometry for React application logic.',
  )
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    'Nested layout viewport and visual viewport boundaries with coordinates and scale',
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

test('hero routes desktop readers to examples and mobile readers to live geometry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
  await expect(
    page.getByRole('link', { name: 'Explore application logic', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Inspect this device’s geometry', exact: true }),
  ).not.toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    page.getByRole('link', { name: 'Inspect this device’s geometry', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Explore application logic', exact: true }),
  ).not.toBeVisible()
  await page.getByRole('link', { name: 'Inspect this device’s geometry', exact: true }).click()
  await expect(page).toHaveURL(/\/lab$/)
  await expect(page.getByTestId('lab-geometry')).toBeVisible()
})

for (const size of responsiveSizes) {
  test(`keeps the homepage hero and coordinate model legible without overflow at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size)
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Visual viewport geometry as React state.',
      }),
    ).toBeVisible()
    const homepageDimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(homepageDimensions.content).toBeLessThanOrEqual(homepageDimensions.viewport)

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

test('keeps live examples within the 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/examples')

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})

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
    '/lab',
    '/lab/css',
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
  await expect(geometry.getByText('Live browser geometry', { exact: true })).toBeVisible()
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

test('examples expose concrete viewport-aware interface outputs', async ({ page }) => {
  await page.goto('/examples')

  for (const heading of [
    'Rendering budget',
    'Coordinate visibility and scroll correction',
    'Zoom-aware tools and safe-area data',
    'CSS integration',
  ]) {
    await expect(page.getByRole('heading', { level: 2, name: heading, exact: true })).toBeVisible()
  }

  await expect(page.getByTestId('target-visible')).toContainText('Place a target')
  await expect(page.getByTestId('zoom-tolerance')).toContainText('document CSS px')
})

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
        setGeometry(next: {
          visualHeight: number
          safeAreaBottom: number
          offsetTop?: number
          offsetLeft?: number
          visualWidth?: number
          pageTop?: number
          pageLeft?: number
          scale?: number
        }) {
          controlled.height = next.visualHeight
          controlled.offsetTop = next.offsetTop ?? 0
          controlled.offsetLeft = next.offsetLeft ?? 0
          controlled.width = next.visualWidth ?? 390
          controlled.pageTop = next.pageTop ?? 0
          controlled.pageLeft = next.pageLeft ?? 0
          controlled.scale = next.scale ?? 1
          safeAreaBottom = next.safeAreaBottom
          controlled.dispatchEvent(new Event('resize'))
        },
      },
    })
  })
}

async function setWebsiteGeometry(
  page: Page,
  geometry: {
    readonly visualHeight: number
    readonly safeAreaBottom: number
    readonly offsetTop?: number
    readonly offsetLeft?: number
    readonly visualWidth?: number
    readonly pageTop?: number
    readonly pageLeft?: number
    readonly scale?: number
  },
): Promise<void> {
  await page.evaluate((nextGeometry) => {
    const fixture = (
      window as Window & {
        __websiteGeometryFixture?: {
          setGeometry(next: {
            visualHeight: number
            safeAreaBottom: number
            offsetTop?: number
            offsetLeft?: number
            visualWidth?: number
            pageTop?: number
            pageLeft?: number
            scale?: number
          }): void
        }
      }
    ).__websiteGeometryFixture
    if (fixture === undefined) throw new Error('Geometry fixture was not installed')
    fixture.setGeometry(nextGeometry)
  }, geometry)
}

test('geometry lab keeps raw measurements visible and copies only allowlisted diagnostics', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/lab')
  await expect(page.getByRole('heading', { name: 'Live Geometry Lab' })).toBeVisible()
  await expect(page.getByTestId('lab-geometry')).toBeVisible()
  await expect(page.locator('[data-simulated-keyboard]')).toHaveCount(0)
  await page
    .getByRole('textbox', { name: 'Open your software keyboard' })
    .fill('private-test-message')
  await expect(page.getByTestId('lab-geometry')).toContainText('visual.offsetTop')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copiedDiagnostics = text
        },
      },
    })
  })
  await page.getByRole('button', { name: 'Copy diagnostics', exact: true }).click()
  const diagnostics = await page.locator('html').getAttribute('data-copied-diagnostics')
  expect(diagnostics).not.toContain('private-test-message')
  const parsed = JSON.parse(diagnostics ?? '{}')
  expect(diagnostics).not.toContain('private-test-message')
  expect(Object.keys(parsed).sort()).toEqual([
    'build',
    'orientation',
    'requestedKeyboardPolicy',
    'supported',
    'viewport',
  ])
  expect(Object.keys(parsed.viewport).sort()).toEqual([
    'keyboard',
    'layout',
    'ready',
    'safeArea',
    'visual',
  ])
  expect(diagnostics).not.toMatch(/effectiveBottom|composerAnchor|scrollMode|userAgent/)
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width)
})

test('unknown routes return a real not-found page', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open the Geometry Lab' })).toBeVisible()
})

test('document target follows page coordinates through shrink, restoration, and horizontal pan', async ({
  page,
}) => {
  await installVisualViewportFixture(page)
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/examples')
  await setWebsiteGeometry(page, {
    visualHeight: 800,
    visualWidth: 390,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 40,
  })
  await page.getByRole('button', { name: 'Place target near visible bottom' }).click()
  await expect(page.getByTestId('target-coordinates')).toHaveText(
    'Document target: x 225, y 852 CSS px.',
  )
  await expect(page.getByTestId('document-target')).toHaveCount(1)
  await expect(page.getByTestId('target-visible')).toContainText('YES')

  await setWebsiteGeometry(page, {
    visualHeight: 700,
    visualWidth: 390,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 40,
  })
  await expect(page.getByTestId('target-visible')).toContainText('NO')
  await expect(page.getByTestId('target-coordinates')).toHaveText(
    'Document target: x 225, y 852 CSS px.',
  )
  await setWebsiteGeometry(page, {
    visualHeight: 800,
    visualWidth: 390,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 40,
  })
  await expect(page.getByTestId('target-visible')).toContainText('YES')
  await setWebsiteGeometry(page, {
    visualHeight: 800,
    visualWidth: 390,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 246,
  })
  await expect(page.getByTestId('target-visible')).toContainText('NO')
  await setWebsiteGeometry(page, {
    visualHeight: 800,
    visualWidth: 390,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 225,
    scale: 2,
  })
  await expect(page.getByTestId('target-visible')).toContainText('YES')
  await expect(page.getByTestId('target-coordinates')).toHaveText(
    'Document target: x 225, y 852 CSS px.',
  )
})

test('scroll correction stays observational until the user opts in', async ({ page }) => {
  await installVisualViewportFixture(page)
  await page.addInitScript(() => {
    const calls: number[] = []
    Object.defineProperty(window, '__scrollByCalls', { configurable: true, value: calls })
    window.scrollBy = ((options: ScrollToOptions) =>
      calls.push(options.top ?? 0)) as typeof window.scrollBy
  })
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/examples')
  await setWebsiteGeometry(page, {
    visualHeight: 800,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 0,
  })
  await page.getByRole('button', { name: 'Place target near visible bottom' }).click()
  await setWebsiteGeometry(page, {
    visualHeight: 700,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 0,
  })
  await expect(page.getByTestId('scroll-correction')).toContainText('72 px')
  expect(
    await page.evaluate(
      () => (window as unknown as Window & { __scrollByCalls: number[] }).__scrollByCalls,
    ),
  ).toEqual([])

  await page.getByText('Keyboard-aware scroll correction', { exact: true }).click()
  await page.getByRole('checkbox', { name: 'Automatically reveal the selected target' }).check()
  await setWebsiteGeometry(page, {
    visualHeight: 690,
    safeAreaBottom: 0,
    pageTop: 100,
    pageLeft: 0,
  })
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as Window & { __scrollByCalls: number[] }).__scrollByCalls.at(-1),
      ),
    )
    .toBe(82)
  const callsBeforeScroll = await page.evaluate(
    () => (window as unknown as Window & { __scrollByCalls: number[] }).__scrollByCalls.length,
  )
  await setWebsiteGeometry(page, {
    visualHeight: 690,
    safeAreaBottom: 0,
    pageTop: 1000,
    pageLeft: 0,
  })
  await expect(page.getByTestId('target-visible')).toContainText('NO')
  expect(
    await page.evaluate(
      () => (window as unknown as Window & { __scrollByCalls: number[] }).__scrollByCalls.length,
    ),
  ).toBe(callsBeforeScroll)
})

test('clipboard failure gives a manual recording fallback without collecting input', async ({
  page,
}) => {
  await page.goto('/lab')
  await expect(page.getByTestId('lab-geometry')).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Denied')
        },
      },
    })
  })
  await page.getByRole('button', { name: 'Copy diagnostics' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Clipboard unavailable' })).toBeVisible()
  await expect(page.getByTestId('lab-geometry')).toBeVisible()
})

test('geometry lab uses normal full-page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 })
  await page.goto('/lab')
  await expect(page.getByTestId('lab-geometry')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
  await expect(page.getByRole('checkbox', { name: 'Page-scroll stress test' })).toHaveCount(0)
  await expect(page.getByTestId('lab-composer')).toHaveCount(0)
})

test('zoom tolerance divides twelve by visual scale without another multiplier', async ({
  page,
}) => {
  await installVisualViewportFixture(page)
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/examples')
  await setWebsiteGeometry(page, { visualHeight: 800, safeAreaBottom: 0, scale: 1 })
  await expect(page.getByTestId('zoom-tolerance')).toContainText('12 document CSS px')
  await setWebsiteGeometry(page, { visualHeight: 800, safeAreaBottom: 0, scale: 2 })
  await expect(page.getByTestId('zoom-tolerance')).toContainText('6 document CSS px')
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
  expect(viewport).not.toContain('user-scalable=no')
  expect(viewport).not.toContain('maximum-scale=1')
})

test('both labs request browser-managed keyboard resizing without claiming support', async ({
  page,
}) => {
  for (const route of ['/lab', '/lab/css']) {
    await page.goto(route)
    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveCount(1)
    await expect(viewport).toHaveAttribute('content', /interactive-widget=resizes-content/)
    await expect(viewport).toHaveAttribute('content', /viewport-fit=cover/)
    await expect(viewport).not.toHaveAttribute('content', /user-scalable=no|maximum-scale=1/)
    await expect(page.getByText('Requested, not detected.', { exact: true })).toBeVisible()
  }
})

test('CSS baseline uses layout height and does not apply the measured visual fallback', async ({
  page,
}) => {
  await installVisualViewportFixture(page)
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/lab/css')
  await expect(page.getByRole('heading', { level: 1, name: 'CSS Baseline' })).toBeVisible()
  const composer = page.getByTestId('css-composer')
  await expect(composer).toBeVisible()
  const before = await boxOf(composer)
  await composer.getByRole('textbox').focus()
  await setWebsiteGeometry(page, { visualHeight: 500, safeAreaBottom: 0 })
  const after = await boxOf(composer)
  expect(after.y + after.height).toBe(before.y + before.height)
  await expect(
    page.getByRole('link', { name: 'Need geometry inside React logic? Open the Geometry Lab →' }),
  ).toHaveAttribute('href', '/lab')
})

test('CSS baseline remains usable without JavaScript when the layout viewport resizes', async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Website baseURL is required')
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 800 },
  })
  const page = await context.newPage()
  try {
    await page.goto('/lab/css')
    const composer = page.getByTestId('css-composer')
    await expect(composer).toBeVisible()
    await page.setViewportSize({ width: 390, height: 500 })
    await expect
      .poll(async () => {
        const box = await boxOf(composer)
        return Math.round(box.y + box.height)
      })
      .toBe(484)
    await expect(composer.getByRole('textbox')).toBeVisible()
  } finally {
    await context.close()
  }
})

test('visible-height result budget changes rendered items rather than hiding them with CSS', async ({
  page,
}) => {
  await installVisualViewportFixture(page)
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/examples')
  const results = page.getByRole('region', { name: 'JavaScript result budget' })
  await expect(results.getByRole('listitem')).toHaveCount(8)
  await setWebsiteGeometry(page, { visualHeight: 500, safeAreaBottom: 0 })
  await expect(results.getByRole('listitem')).toHaveCount(3)
  await setWebsiteGeometry(page, { visualHeight: 300, safeAreaBottom: 0 })
  await expect(results.getByRole('listitem')).toHaveCount(0)
  await expect(results).toContainText('No result rows fit the current budget.')
  await setWebsiteGeometry(page, { visualHeight: 800, safeAreaBottom: 0 })
  await expect(results.getByRole('listitem')).toHaveCount(8)
})
