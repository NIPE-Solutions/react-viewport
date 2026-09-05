import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import { VIEWPORT_CSS_VARIABLES, writeViewportCssVariables } from '../../src/css-variables.js'
import { ViewportProvider } from '../../src/index.js'
import { useViewportCssVariables } from '../../src/useViewportCssVariables.js'
import { getViewportStore, resetViewportStoreForTests } from '../../src/store-registry.js'
import type { ViewportState } from '../../src/types.js'

const mountedRoots: Root[] = []
const frames = new Map<Window, Map<number, FrameRequestCallback>>()
let nextFrameId = 1

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

afterEach(async () => {
  await act(async () => {
    mountedRoots.splice(0).forEach((root) => root.unmount())
  })

  for (const targetWindow of frames.keys()) {
    try {
      resetViewportStoreForTests(targetWindow)
    } catch {
      // Active subscriptions are asserted by the individual tests.
    }
  }

  frames.clear()
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})

function createState(overrides: Partial<ViewportState> = {}): ViewportState {
  return {
    ready: true,
    layout: { width: 390.5, height: 844.25 },
    visual: {
      width: 372.75,
      height: 700.125,
      offsetTop: 11.5,
      offsetLeft: 2.25,
      pageTop: 31.75,
      pageLeft: 4.5,
      scale: 1.5,
    },
    keyboard: { open: true, height: 144.125 },
    safeArea: { top: 12.25, right: 3.5, bottom: 18.75, left: 4.125 },
    orientation: 'portrait',
    supported: { visualViewport: true, virtualKeyboard: false },
    ...overrides,
  }
}

function renderClient(node: React.ReactNode): HTMLElement {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  mountedRoots.push(root)

  act(() => {
    root.render(node)
  })

  return container
}

function installAnimationFrame(targetWindow: Window): void {
  const targetFrames = new Map<number, FrameRequestCallback>()
  frames.set(targetWindow, targetFrames)
  Object.defineProperty(targetWindow, 'requestAnimationFrame', {
    configurable: true,
    value(callback: FrameRequestCallback) {
      const id = nextFrameId++
      targetFrames.set(id, callback)
      return id
    },
  })
  Object.defineProperty(targetWindow, 'cancelAnimationFrame', {
    configurable: true,
    value(id: number) {
      targetFrames.delete(id)
    },
  })
}

function flushFrames(targetWindow: Window): void {
  const targetFrames = frames.get(targetWindow)

  if (targetFrames === undefined) {
    throw new Error('Expected a frame queue for the target window')
  }

  for (const callback of targetFrames.values()) {
    callback(0)
  }
  targetFrames.clear()
}

function createTargetWindow(): Window {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const targetWindow = iframe.contentWindow

  if (targetWindow === null) {
    throw new Error('Expected an iframe browsing context')
  }

  installAnimationFrame(targetWindow)
  return targetWindow
}

function cssValue(target: HTMLElement, name: string): string {
  return target.style.getPropertyValue(name)
}

describe('viewport CSS variables', () => {
  it('writes every approved variable with fractional lengths and a unitless scale', () => {
    const target = document.createElement('div')

    writeViewportCssVariables(target, createState())

    expect(VIEWPORT_CSS_VARIABLES).toEqual([
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
    ])
    expect(cssValue(target, '--react-viewport-layout-width')).toBe('390.5px')
    expect(cssValue(target, '--react-viewport-visual-height')).toBe('700.125px')
    expect(cssValue(target, '--react-viewport-visual-page-top')).toBe('31.75px')
    expect(cssValue(target, '--react-viewport-scale')).toBe('1.5')
    expect(cssValue(target, '--react-viewport-keyboard-height')).toBe('144.125px')
    expect(cssValue(target, '--react-viewport-safe-area-left')).toBe('4.125px')
  })

  it('removes unknown dimensions before readiness while preserving zero keyboard and safe-area lengths', () => {
    const target = document.createElement('div')
    const state = createState({
      ready: false,
      layout: null,
      visual: null,
      keyboard: { open: false, height: 0 },
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    writeViewportCssVariables(target, createState())
    writeViewportCssVariables(target, state)

    expect(cssValue(target, '--react-viewport-layout-width')).toBe('')
    expect(cssValue(target, '--react-viewport-visual-height')).toBe('')
    expect(cssValue(target, '--react-viewport-scale')).toBe('')
    expect(cssValue(target, '--react-viewport-keyboard-height')).toBe('0px')
    expect(cssValue(target, '--react-viewport-safe-area-top')).toBe('0px')
    expect(cssValue(target, '--react-viewport-safe-area-right')).toBe('0px')
    expect(cssValue(target, '--react-viewport-safe-area-bottom')).toBe('0px')
    expect(cssValue(target, '--react-viewport-safe-area-left')).toBe('0px')
  })

  it('uses the provider window document root by default and updates it without rerendering', async () => {
    const targetWindow = createTargetWindow()
    let renders = 0

    function CssVariablesProbe() {
      renders += 1
      useViewportCssVariables()
      return null
    }

    renderClient(
      <ViewportProvider targetWindow={targetWindow}>
        <CssVariablesProbe />
      </ViewportProvider>,
    )

    await act(async () => {
      flushFrames(targetWindow)
    })

    expect(cssValue(targetWindow.document.documentElement, '--react-viewport-layout-width')).toBe(
      `${targetWindow.innerWidth}px`,
    )
    expect(cssValue(document.documentElement, '--react-viewport-layout-width')).toBe('')
    expect(renders).toBe(1)

    Object.defineProperty(targetWindow, 'innerWidth', { configurable: true, value: 640 })
    targetWindow.dispatchEvent(new Event('resize'))

    await act(async () => {
      flushFrames(targetWindow)
    })

    expect(cssValue(targetWindow.document.documentElement, '--react-viewport-layout-width')).toBe(
      '640px',
    )
    expect(renders).toBe(1)
  })

  it('writes to direct element and ref targets', async () => {
    installAnimationFrame(window)
    const directTarget = document.createElement('section')
    const refTarget = document.createElement('aside')
    const targetRef = { current: refTarget }

    function DirectProbe() {
      useViewportCssVariables({ target: directTarget })
      useViewportCssVariables({ target: targetRef })
      return null
    }

    renderClient(<DirectProbe />)

    await act(async () => {
      flushFrames(window)
    })

    expect(cssValue(directTarget, '--react-viewport-layout-width')).toBe(`${window.innerWidth}px`)
    expect(cssValue(refTarget, '--react-viewport-layout-width')).toBe(`${window.innerWidth}px`)
    expect(cssValue(document.documentElement, '--react-viewport-layout-width')).toBe('')
  })

  it('restores owned pre-existing values, preserves a consumer overwrite, and leaves unrelated properties alone', async () => {
    installAnimationFrame(window)
    const target = document.createElement('div')
    target.style.setProperty('--react-viewport-layout-width', 'legacy-width')
    target.style.setProperty('--consumer-property', 'keep-me')

    function CssVariablesProbe() {
      useViewportCssVariables({ target })
      return null
    }

    renderClient(<CssVariablesProbe />)

    await act(async () => {
      flushFrames(window)
    })

    expect(cssValue(target, '--react-viewport-layout-width')).toBe(`${window.innerWidth}px`)
    target.style.setProperty('--react-viewport-layout-height', 'consumer-height')

    await act(async () => {
      mountedRoots.splice(0).forEach((root) => root.unmount())
    })

    expect(cssValue(target, '--react-viewport-layout-width')).toBe('legacy-width')
    expect(cssValue(target, '--react-viewport-layout-height')).toBe('consumer-height')
    expect(cssValue(target, '--consumer-property')).toBe('keep-me')
  })

  it('restores a consumer value overwritten by a later store update without replacing a later consumer write', async () => {
    const targetWindow = createTargetWindow()
    const target = document.createElement('div')

    function CssVariablesProbe() {
      useViewportCssVariables({ target })
      return null
    }

    renderClient(
      <ViewportProvider targetWindow={targetWindow}>
        <CssVariablesProbe />
      </ViewportProvider>,
    )

    await act(async () => {
      flushFrames(targetWindow)
    })

    target.style.setProperty('--react-viewport-layout-height', 'consumer-before-update')
    Object.defineProperty(targetWindow, 'innerHeight', { configurable: true, value: 700 })
    targetWindow.dispatchEvent(new Event('resize'))

    await act(async () => {
      flushFrames(targetWindow)
    })

    expect(cssValue(target, '--react-viewport-layout-height')).toBe('700px')
    target.style.setProperty('--react-viewport-layout-width', 'consumer-after-update')

    await act(async () => {
      mountedRoots.splice(0).forEach((root) => root.unmount())
    })

    expect(cssValue(target, '--react-viewport-layout-height')).toBe('consumer-before-update')
    expect(cssValue(target, '--react-viewport-layout-width')).toBe('consumer-after-update')
  })

  it('does not subscribe or write when the provider explicitly selects null', () => {
    const target = document.createElement('div')

    function CssVariablesProbe() {
      useViewportCssVariables({ target })
      return null
    }

    renderClient(
      <ViewportProvider targetWindow={null}>
        <CssVariablesProbe />
      </ViewportProvider>,
    )

    expect(cssValue(target, '--react-viewport-layout-width')).toBe('')
    expect(() => resetViewportStoreForTests(window)).not.toThrow()
  })

  it('uses the same provider-selected store as useViewport', async () => {
    const targetWindow = createTargetWindow()
    const target = document.createElement('div')

    function CssVariablesProbe() {
      useViewportCssVariables({ target })
      return null
    }

    renderClient(
      <ViewportProvider targetWindow={targetWindow}>
        <CssVariablesProbe />
      </ViewportProvider>,
    )

    await act(async () => {
      flushFrames(targetWindow)
    })

    expect(cssValue(target, '--react-viewport-layout-width')).toBe(`${targetWindow.innerWidth}px`)
    expect(() => resetViewportStoreForTests(targetWindow)).toThrow()
    expect(() => resetViewportStoreForTests(window)).not.toThrow()
    expect(getViewportStore(targetWindow).getSnapshot().ready).toBe(true)
  })
})
