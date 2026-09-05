import type { VirtualKeyboardLike } from './environment.js'
import { createViewportStore, type ViewportStore } from './store.js'

interface RegistryEntry {
  readonly store: ViewportStore
  readonly getActiveSubscriptionCount: () => number
}

const stores = new WeakMap<Window, RegistryEntry>()

export function getViewportStore(targetWindow: Window): ViewportStore {
  const existing = stores.get(targetWindow)

  if (existing !== undefined) {
    return existing.store
  }

  const navigator = targetWindow.navigator as Navigator & {
    readonly virtualKeyboard?: VirtualKeyboardLike
  }
  const baseStore = createViewportStore({
    window: targetWindow,
    document: targetWindow.document,
    visualViewport: targetWindow.visualViewport ?? null,
    virtualKeyboard: navigator.virtualKeyboard ?? null,
  })
  let activeSubscriptionCount = 0
  const store: ViewportStore = {
    subscribe(listener) {
      const unsubscribeBase = baseStore.subscribe(listener)
      activeSubscriptionCount += 1
      let subscribed = true

      return () => {
        if (!subscribed) {
          return
        }

        subscribed = false
        unsubscribeBase()
        activeSubscriptionCount -= 1
      }
    },
    getSnapshot: baseStore.getSnapshot,
    getServerSnapshot: baseStore.getServerSnapshot,
  }

  stores.set(targetWindow, {
    store,
    getActiveSubscriptionCount: () => activeSubscriptionCount,
  })
  return store
}

export function resetViewportStoreForTests(targetWindow: Window): void {
  const entry = stores.get(targetWindow)

  if (entry !== undefined && entry.getActiveSubscriptionCount() !== 0) {
    throw new Error('Cannot reset a viewport store while it has active subscriptions')
  }

  stores.delete(targetWindow)
}
