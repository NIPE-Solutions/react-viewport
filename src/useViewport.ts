import { useContext, useSyncExternalStore } from 'react'

import { ViewportContext } from './context.js'
import { SERVER_SNAPSHOT } from './snapshot.js'
import { getViewportStore } from './store-registry.js'
import type { ViewportStore } from './store.js'
import type { ViewportState } from './types.js'

const serverStore: ViewportStore = {
  subscribe() {
    return () => undefined
  },
  getSnapshot() {
    return SERVER_SNAPSHOT
  },
  getServerSnapshot() {
    return SERVER_SNAPSHOT
  },
}

export function useViewport(): ViewportState {
  const targetWindow = useContext(ViewportContext)
  const store =
    targetWindow === null || typeof window === 'undefined'
      ? serverStore
      : getViewportStore(targetWindow ?? window)

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
