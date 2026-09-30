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

  it('replaces an inactive cached store when the same Window has a different document', () => {
    const originalWindow = createTargetWindow()
    const replacementWindow = createTargetWindow()
    const originalDocument = originalWindow.document
    let currentDocument = originalDocument
    const targetWindow = new Proxy(originalWindow, {
      get(target, key) {
        if (key === 'document') {
          return currentDocument
        }
        const value: unknown = Reflect.get(target, key, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    const originalStore = getViewportStore(targetWindow)
    const unsubscribeOriginal = originalStore.subscribe(() => undefined)
    unsubscribeOriginal()
    currentDocument = replacementWindow.document

    const replacementStore = getViewportStore(targetWindow)
    expect(replacementStore).not.toBe(originalStore)
    const unsubscribeReplacement = replacementStore.subscribe(() => undefined)

    expect(originalDocument.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
    expect(currentDocument.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)

    unsubscribeReplacement()
    resetViewportStoreForTests(targetWindow)
  })

  it('retains one active store across document changes and replaces it after cleanup', () => {
    const originalWindow = createTargetWindow()
    const replacementWindow = createTargetWindow()
    let currentDocument = originalWindow.document
    const targetWindow = new Proxy(originalWindow, {
      get(target, key) {
        if (key === 'document') {
          return currentDocument
        }
        const value: unknown = Reflect.get(target, key, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    const originalStore = getViewportStore(targetWindow)
    const unsubscribe = originalStore.subscribe(() => undefined)
    currentDocument = replacementWindow.document

    expect(getViewportStore(targetWindow)).toBe(originalStore)
    expect(currentDocument.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)

    unsubscribe()
    expect(getViewportStore(targetWindow)).not.toBe(originalStore)
    resetViewportStoreForTests(targetWindow)
  })

  it('rejects reset while a store is active and permits it after cleanup', () => {
    const targetWindow = createTargetWindow()
    const store = getViewportStore(targetWindow)
    const unsubscribe = store.subscribe(() => undefined)

    expect(() => resetViewportStoreForTests(targetWindow)).toThrow()
    expect(getViewportStore(targetWindow)).toBe(store)
    expect(targetWindow.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)

    unsubscribe()

    expect(targetWindow.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
    expect(frames.get(targetWindow)?.size).toBe(0)
    expect(() => resetViewportStoreForTests(targetWindow)).not.toThrow()
    expect(getViewportStore(targetWindow)).not.toBe(store)

    resetViewportStoreForTests(targetWindow)
  })
})
