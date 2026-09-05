import { afterEach, describe, expect, it } from 'vitest'

import { getViewportStore, resetViewportStoreForTests } from '../../src/store-registry.js'

const frames = new Map<Window, Map<number, FrameRequestCallback>>()
let nextFrameId = 1

afterEach(() => {
  frames.clear()
  document.body.replaceChildren()
})

function createTargetWindow(): Window {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const targetWindow = iframe.contentWindow

  if (targetWindow === null) {
    throw new Error('Expected an iframe browsing context')
  }

  const windowFrames = new Map<number, FrameRequestCallback>()
  frames.set(targetWindow, windowFrames)
  Object.defineProperty(targetWindow, 'requestAnimationFrame', {
    configurable: true,
    value(callback: FrameRequestCallback) {
      const id = nextFrameId++
      windowFrames.set(id, callback)
      return id
    },
  })
  Object.defineProperty(targetWindow, 'cancelAnimationFrame', {
    configurable: true,
    value(id: number) {
      windowFrames.delete(id)
    },
  })

  return targetWindow
}

describe('viewport store registry', () => {
  it('returns one store per Window and isolates distinct browsing contexts', () => {
    const windowA = createTargetWindow()
    const windowB = createTargetWindow()

    expect(getViewportStore(windowA)).toBe(getViewportStore(windowA))
    expect(getViewportStore(windowA)).not.toBe(getViewportStore(windowB))

    resetViewportStoreForTests(windowA)
    resetViewportStoreForTests(windowB)
  })

  it('creates and removes each safe-area probe in its matching document', () => {
    const windowA = createTargetWindow()
    const windowB = createTargetWindow()
    const storeA = getViewportStore(windowA)
    const storeB = getViewportStore(windowB)

    const unsubscribeA = storeA.subscribe(() => undefined)
    const unsubscribeB = storeB.subscribe(() => undefined)

    expect(windowA.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
    expect(windowB.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)

    unsubscribeA()
    expect(windowA.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
    expect(windowB.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)

    unsubscribeB()
    expect(windowB.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)

    resetViewportStoreForTests(windowA)
    resetViewportStoreForTests(windowB)
  })

  it('forgets only the requested Window', () => {
    const windowA = createTargetWindow()
    const windowB = createTargetWindow()
    const originalA = getViewportStore(windowA)
    const originalB = getViewportStore(windowB)

    resetViewportStoreForTests(windowA)

    expect(getViewportStore(windowA)).not.toBe(originalA)
    expect(getViewportStore(windowB)).toBe(originalB)

    resetViewportStoreForTests(windowA)
    resetViewportStoreForTests(windowB)
  })
})
