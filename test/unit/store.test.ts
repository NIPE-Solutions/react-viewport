import { afterEach, describe, expect, it, vi } from 'vitest'

import { getServerSnapshot } from '../../src/snapshot.js'
import { createViewportStore } from '../../src/store.js'
import {
  createFakeBrowserEnvironment,
  type FakeBrowserEnvironment,
} from './helpers/browser-environment.js'

const environments: FakeBrowserEnvironment[] = []

afterEach(() => {
  environments.splice(0).forEach((environment) => environment.dispose())
})

function createEnvironment(
  options: Parameters<typeof createFakeBrowserEnvironment>[0] = {},
): FakeBrowserEnvironment {
  const environment = createFakeBrowserEnvironment(options)
  environments.push(environment)
  return environment
}

describe('createViewportStore', () => {
  it('shares one listener set and one probe across all subscribers', () => {
    const fake = createEnvironment({ virtualKeyboard: true })
    const store = createViewportStore(fake.environment)
    const first = vi.fn()
    const second = vi.fn()

    const unsubscribeFirst = store.subscribe(first)

    expect(fake.listenerCount('window', 'resize')).toBe(1)
    expect(fake.listenerCount('window', 'scroll')).toBe(1)
    expect(fake.listenerCount('visualViewport', 'resize')).toBe(1)
    expect(fake.listenerCount('visualViewport', 'scroll')).toBe(1)
    expect(fake.listenerCount('virtualKeyboard', 'geometrychange')).toBe(1)
    expect(fake.listenerCount('document', 'focusin')).toBe(1)
    expect(fake.listenerCount('document', 'focusout')).toBe(1)
    expect(fake.probeCount).toBe(1)
    expect(fake.queuedAnimationFrames).toBe(1)

    const unsubscribeSecond = store.subscribe(second)

    expect(fake.listenerCount('window', 'resize')).toBe(1)
    expect(fake.listenerCount('window', 'scroll')).toBe(1)
    expect(fake.listenerCount('visualViewport', 'resize')).toBe(1)
    expect(fake.listenerCount('visualViewport', 'scroll')).toBe(1)
    expect(fake.listenerCount('virtualKeyboard', 'geometrychange')).toBe(1)
    expect(fake.listenerCount('document', 'focusin')).toBe(1)
    expect(fake.listenerCount('document', 'focusout')).toBe(1)
    expect(fake.probeCount).toBe(1)
    expect(fake.queuedAnimationFrames).toBe(1)

    fake.flushAnimationFrame()
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)

    unsubscribeFirst()
    expect(fake.listenerCount('window', 'resize')).toBe(1)

    fake.dispatchResize()
    expect(fake.queuedAnimationFrames).toBe(1)
    unsubscribeSecond()

    expect(fake.listenerCount('window', 'resize')).toBe(0)
    expect(fake.listenerCount('window', 'scroll')).toBe(0)
    expect(fake.listenerCount('visualViewport', 'resize')).toBe(0)
    expect(fake.listenerCount('visualViewport', 'scroll')).toBe(0)
    expect(fake.listenerCount('virtualKeyboard', 'geometrychange')).toBe(0)
    expect(fake.listenerCount('document', 'focusin')).toBe(0)
    expect(fake.listenerCount('document', 'focusout')).toBe(0)
    expect(fake.probeCount).toBe(0)
    expect(fake.queuedAnimationFrames).toBe(0)
  })

  it('batches source events into one atomic snapshot and skips equivalent measurements', () => {
    const fake = createEnvironment({ virtualKeyboard: true })
    const store = createViewportStore(fake.environment)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    fake.flushAnimationFrame()
    listener.mockClear()

    fake.setLayout(844, 390)
    fake.setVisualViewport({
      width: 700.5,
      height: 340.25,
      offsetTop: 7.5,
      offsetLeft: 12.25,
      pageTop: 107.5,
      pageLeft: 52.25,
      scale: 1.25,
    })
    fake.setKeyboardRect({ x: 0, y: 300, width: 844, height: 90 })
    fake.setSafeArea({ top: 1, right: 2, bottom: 3, left: 4 })

    fake.dispatchResize()
    fake.dispatchVisualScroll()
    fake.dispatchKeyboardGeometryChange()

    expect(fake.queuedAnimationFrames).toBe(1)
    expect(listener).not.toHaveBeenCalled()

    fake.flushAnimationFrame()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()).toEqual({
      ready: true,
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
      safeArea: { top: 1, right: 2, bottom: 3, left: 4 },
      orientation: 'landscape',
      supported: { visualViewport: true, virtualKeyboard: true },
    })

    const snapshot = store.getSnapshot()
    fake.dispatchResize()
    fake.flushAnimationFrame()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()).toBe(snapshot)
    unsubscribe()
  })

  it('returns the stable server snapshot before its initial client measurement', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)

    expect(store.getSnapshot()).toBe(getServerSnapshot())
    expect(store.getServerSnapshot()).toBe(getServerSnapshot())
  })

  it('keeps duplicate callback subscriptions independent', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const listener = vi.fn()

    const unsubscribeFirst = store.subscribe(listener)
    const unsubscribeSecond = store.subscribe(listener)
    fake.flushAnimationFrame()

    expect(listener).toHaveBeenCalledTimes(2)

    listener.mockClear()
    unsubscribeFirst()
    fake.setLayout(400, 800)
    fake.dispatchResize()
    fake.flushAnimationFrame()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(fake.listenerCount('window', 'resize')).toBe(1)
    expect(fake.probeCount).toBe(1)

    unsubscribeSecond()
    expect(fake.listenerCount('window', 'resize')).toBe(0)
    expect(fake.probeCount).toBe(0)
  })

  it('uses native keyboard intersection geometry instead of visual inference', () => {
    const fake = createEnvironment({ virtualKeyboard: true })
    const store = createViewportStore(fake.environment)
    const editable = fake.createEditable()
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    fake.focus(editable)
    fake.setVisualViewport({ height: 500 })
    fake.setKeyboardRect({ x: 20, y: 610, width: 350, height: 250 })
    fake.dispatchVisualResize()
    fake.dispatchKeyboardGeometryChange()
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: true, height: 190 })
    expect(fake.virtualKeyboard?.overlaysContent).toBe(false)
    unsubscribe()
  })

  it('ignores native keyboard rectangles that do not intersect the layout', () => {
    const fake = createEnvironment({ virtualKeyboard: true })
    const store = createViewportStore(fake.environment)
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    fake.setKeyboardRect({ x: 500, y: 600, width: 100, height: 200 })
    fake.dispatchKeyboardGeometryChange()
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: false, height: 0 })
    unsubscribe()
  })

  it.each([
    ['focus before resize', true],
    ['resize before focus', false],
  ] as const)('infers a keyboard from the closed baseline when %s', (_name, focusFirst) => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const editable = fake.createEditable()
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    if (focusFirst) {
      fake.focus(editable)
    }

    fake.setVisualViewport({ height: 500 })
    fake.dispatchVisualResize()

    if (!focusFirst) {
      fake.focus(editable)
    }

    fake.flushAnimationFrame()

    expect(store.getSnapshot().layout).toEqual({ width: 390, height: 800 })
    expect(store.getSnapshot().keyboard).toEqual({ open: true, height: 300 })
    unsubscribe()
  })

  it('uses the baseline only as evidence and reports current bottom occlusion', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const editable = fake.createEditable()
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    fake.focus(editable)
    fake.setLayout(390, 700)
    fake.setVisualViewport({ height: 500, offsetTop: 20 })
    fake.dispatchResize()
    fake.dispatchVisualResize()
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: true, height: 180 })
    unsubscribe()
  })

  it('does not infer a keyboard when layout and visual geometry shrink together', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const editable = fake.createEditable()
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    fake.focus(editable)
    fake.setLayout(390, 500)
    fake.setVisualViewport({ height: 500 })
    fake.dispatchResize()
    fake.dispatchVisualResize()
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: false, height: 0 })
    unsubscribe()
  })

  it('requires visual geometry to shrink relative to the closed baseline', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const editable = fake.createEditable()
    fake.setVisualViewport({ height: 650 })
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    fake.focus(editable)
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: false, height: 0 })

    fake.setVisualViewport({ height: 550 })
    fake.dispatchVisualResize()
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: false, height: 0 })

    fake.setVisualViewport({ height: 500 })
    fake.dispatchVisualResize()
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: true, height: 300 })
    unsubscribe()
  })

  it('closes on blur before visual geometry is restored', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const editable = fake.createEditable()
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()
    fake.focus(editable)
    fake.setVisualViewport({ height: 500 })
    fake.dispatchVisualResize()
    fake.flushAnimationFrame()
    expect(store.getSnapshot().keyboard.open).toBe(true)

    fake.blur(editable)
    fake.flushAnimationFrame()
    expect(store.getSnapshot().keyboard).toEqual({ open: false, height: 0 })

    fake.setVisualViewport({ height: 800 })
    fake.dispatchVisualResize()
    fake.flushAnimationFrame()
    expect(store.getSnapshot().keyboard).toEqual({ open: false, height: 0 })
    unsubscribe()
  })

  it('does not infer a keyboard while zoomed', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const editable = fake.createEditable()
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    fake.focus(editable)
    fake.setVisualViewport({ height: 500, scale: 2 })
    fake.dispatchVisualResize()
    fake.flushAnimationFrame()

    expect(store.getSnapshot().keyboard).toEqual({ open: false, height: 0 })
    unsubscribe()
  })

  it('mirrors layout and window page coordinates without VisualViewport support', () => {
    const fake = createEnvironment({ visualViewport: false })
    const store = createViewportStore(fake.environment)
    fake.setLayout(1024.5, 768.25)
    fake.setScroll(45.5, 123.25)
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    expect(store.getSnapshot()).toMatchObject({
      layout: { width: 1024.5, height: 768.25 },
      visual: {
        width: 1024.5,
        height: 768.25,
        offsetTop: 0,
        offsetLeft: 0,
        pageTop: 123.25,
        pageLeft: 45.5,
        scale: 1,
      },
      supported: { visualViewport: false, virtualKeyboard: false },
    })
    expect(fake.listenerCount('visualViewport', 'resize')).toBe(0)

    fake.setScroll(67.25, 245.5)
    fake.dispatchWindowScroll()
    expect(fake.queuedAnimationFrames).toBe(1)
    fake.flushAnimationFrame()

    expect(store.getSnapshot().visual).toMatchObject({ pageTop: 245.5, pageLeft: 67.25 })
    unsubscribe()
  })

  it('refreshes native VisualViewport page coordinates on window scroll', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const unsubscribe = store.subscribe(() => undefined)
    fake.flushAnimationFrame()

    fake.setVisualViewport({ pageTop: 240.5, pageLeft: 60.25 })
    fake.dispatchWindowScroll()
    expect(fake.queuedAnimationFrames).toBe(1)
    fake.flushAnimationFrame()

    expect(store.getSnapshot().visual).toMatchObject({ pageTop: 240.5, pageLeft: 60.25 })
    unsubscribe()
  })

  it('publishes safe-area and portrait-landscape-portrait changes in frame order', () => {
    const fake = createEnvironment()
    const store = createViewportStore(fake.environment)
    const published: Array<ReturnType<typeof store.getSnapshot>> = []
    const unsubscribe = store.subscribe(() => published.push(store.getSnapshot()))
    fake.flushAnimationFrame()

    fake.setLayout(800, 390)
    fake.setVisualViewport({ width: 800, height: 390 })
    fake.setSafeArea({ top: 0, right: 8, bottom: 6, left: 8 })
    fake.dispatchResize()
    fake.flushAnimationFrame()

    fake.setLayout(390, 800)
    fake.setVisualViewport({ width: 390, height: 800 })
    fake.setSafeArea({ top: 20, right: 0, bottom: 12, left: 0 })
    fake.dispatchResize()
    fake.flushAnimationFrame()

    expect(published.map(({ orientation }) => orientation)).toEqual([
      'portrait',
      'landscape',
      'portrait',
    ])
    expect(published.at(-1)?.safeArea).toEqual({ top: 20, right: 0, bottom: 12, left: 0 })
    unsubscribe()
  })
})
