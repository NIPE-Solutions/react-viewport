import { useContext, useEffect } from 'react'

import { VIEWPORT_CSS_VARIABLES, writeViewportCssVariables } from './css-variables.js'
import { ViewportContext } from './context.js'
import { getViewportStore } from './store-registry.js'
import type { ViewportCssVariablesOptions } from './types.js'

interface OwnedProperty {
  previousValue: string
  previousPriority: string
  value: string
  priority: string
}

export function useViewportCssVariables(options: ViewportCssVariablesOptions = {}): void {
  const targetWindow = useContext(ViewportContext)
  const targetOption = options.target

  useEffect(() => {
    if (targetWindow === null || typeof window === 'undefined') {
      return
    }

    const selectedWindow = targetWindow ?? window
    const target = resolveTarget(targetOption, selectedWindow)

    if (target === null) {
      return
    }

    const cssTarget = target

    const ownedProperties = new Map<string, OwnedProperty>()
    const store = getViewportStore(selectedWindow)

    function update(): void {
      for (const name of VIEWPORT_CSS_VARIABLES) {
        const currentValue = cssTarget.style.getPropertyValue(name)
        const currentPriority = cssTarget.style.getPropertyPriority(name)
        const ownedProperty = ownedProperties.get(name)

        if (ownedProperty === undefined) {
          ownedProperties.set(name, {
            previousValue: currentValue,
            previousPriority: currentPriority,
            value: '',
            priority: '',
          })
        } else if (
          currentValue !== ownedProperty.value ||
          currentPriority !== ownedProperty.priority
        ) {
          ownedProperty.previousValue = currentValue
          ownedProperty.previousPriority = currentPriority
        }
      }

      writeViewportCssVariables(cssTarget, store.getSnapshot())

      for (const name of VIEWPORT_CSS_VARIABLES) {
        const ownedProperty = ownedProperties.get(name)

        if (ownedProperty !== undefined) {
          ownedProperty.value = cssTarget.style.getPropertyValue(name)
          ownedProperty.priority = cssTarget.style.getPropertyPriority(name)
        }
      }
    }

    update()
    const unsubscribe = store.subscribe(update)

    return () => {
      unsubscribe()

      for (const [name, ownedProperty] of ownedProperties) {
        if (
          cssTarget.style.getPropertyValue(name) === ownedProperty.value &&
          cssTarget.style.getPropertyPriority(name) === ownedProperty.priority
        ) {
          if (ownedProperty.previousValue === '') {
            cssTarget.style.removeProperty(name)
          } else {
            cssTarget.style.setProperty(
              name,
              ownedProperty.previousValue,
              ownedProperty.previousPriority,
            )
          }
        }
      }
    }
  }, [targetOption, targetWindow])
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
