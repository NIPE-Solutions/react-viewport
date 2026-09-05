import { useContext, useEffect, useLayoutEffect, useRef } from 'react'

import {
  releaseOwnedViewportCssVariables,
  writeOwnedViewportCssVariables,
  type ViewportCssVariableOwner,
} from './css-variable-ownership.js'
import { ViewportContext } from './context.js'
import { getViewportStore } from './store-registry.js'
import type { ViewportStore } from './store.js'
import type { ViewportCssVariablesOptions } from './types.js'

interface CssVariableBinding {
  sync(
    targetWindow: Window | null | undefined,
    targetOption: ViewportCssVariablesOptions['target'],
  ): void
  destroy(): void
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useViewportCssVariables(options: ViewportCssVariablesOptions = {}): void {
  const targetWindow = useContext(ViewportContext)
  const bindingRef = useRef<CssVariableBinding | null>(null)

  if (bindingRef.current === null) {
    bindingRef.current = createCssVariableBinding()
  }

  const binding = bindingRef.current

  useIsomorphicLayoutEffect(() => () => binding.destroy(), [binding])
  useIsomorphicLayoutEffect(() => {
    binding.sync(targetWindow, options.target)
  })
}

function createCssVariableBinding(): CssVariableBinding {
  const owner: ViewportCssVariableOwner = {}
  let selectedWindow: Window | null = null
  let target: HTMLElement | null = null
  let store: ViewportStore | null = null
  let unsubscribe: (() => void) | null = null

  function destroy(): void {
    unsubscribe?.()
    unsubscribe = null

    if (target !== null) {
      releaseOwnedViewportCssVariables(target, owner)
    }

    selectedWindow = null
    target = null
    store = null
  }

  return {
    sync(targetWindow, targetOption) {
      const nextWindow = resolveWindow(targetWindow)
      const nextTarget = nextWindow === null ? null : resolveTarget(targetOption, nextWindow)

      if (nextWindow === selectedWindow && nextTarget === target) {
        return
      }

      destroy()

      if (nextWindow === null || nextTarget === null) {
        return
      }

      const nextStore = getViewportStore(nextWindow)
      selectedWindow = nextWindow
      target = nextTarget
      store = nextStore

      const update = () => {
        if (target !== null && store !== null) {
          writeOwnedViewportCssVariables(target, owner, store.getSnapshot())
        }
      }

      update()
      unsubscribe = nextStore.subscribe(update)
    },
    destroy,
  }
}

function resolveWindow(targetWindow: Window | null | undefined): Window | null {
  if (targetWindow === null || typeof window === 'undefined') {
    return null
  }

  return targetWindow ?? window
}

function resolveTarget(
  targetOption: ViewportCssVariablesOptions['target'],
  targetWindow: Window,
): HTMLElement | null {
  if (targetOption === null || targetOption === undefined) {
    return targetWindow.document.documentElement
  }

  if ('current' in targetOption) {
    return targetOption.current
  }

  return targetOption
}
