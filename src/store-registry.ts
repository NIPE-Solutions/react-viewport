import type { VirtualKeyboardLike } from './environment.js'
import { createViewportStore, type ViewportStore } from './store.js'

const stores = new WeakMap<Window, ViewportStore>()

export function getViewportStore(targetWindow: Window): ViewportStore {
  const existing = stores.get(targetWindow)

  if (existing !== undefined) {
    return existing
  }

  const navigator = targetWindow.navigator as Navigator & {
    readonly virtualKeyboard?: VirtualKeyboardLike
  }
  const store = createViewportStore({
    window: targetWindow,
    document: targetWindow.document,
    visualViewport: targetWindow.visualViewport ?? null,
    virtualKeyboard: navigator.virtualKeyboard ?? null,
  })

  stores.set(targetWindow, store)
  return store
}

export function resetViewportStoreForTests(targetWindow: Window): void {
  stores.delete(targetWindow)
}
