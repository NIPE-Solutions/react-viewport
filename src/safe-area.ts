import type { SafeAreaInsets } from './types.js'
import { normalizeFinite } from './geometry.js'

export interface SafeAreaProbe {
  measure(): SafeAreaInsets
  destroy(): void
}

export function createSafeAreaProbe(document: Document): SafeAreaProbe {
  const node = document.createElement('div')

  node.setAttribute('aria-hidden', 'true')
  node.style.position = 'fixed'
  node.style.top = '0'
  node.style.left = '0'
  node.style.width = '0'
  node.style.height = '0'
  node.style.visibility = 'hidden'
  node.style.pointerEvents = 'none'
  node.style.paddingTop = 'env(safe-area-inset-top)'
  node.style.paddingRight = 'env(safe-area-inset-right)'
  node.style.paddingBottom = 'env(safe-area-inset-bottom)'
  node.style.paddingLeft = 'env(safe-area-inset-left)'
  ;(document.body ?? document.documentElement).append(node)

  return {
    measure() {
      const view = document.defaultView

      if (view === null) {
        return { top: 0, right: 0, bottom: 0, left: 0 }
      }

      const style = view.getComputedStyle(node)

      return {
        top: parseInset(style.paddingTop),
        right: parseInset(style.paddingRight),
        bottom: parseInset(style.paddingBottom),
        left: parseInset(style.paddingLeft),
      }
    },
    destroy() {
      node.remove()
    },
  }
}

function parseInset(value: string): number {
  const match = /^(?:\+)?(\d+(?:\.\d+)?|\.\d+)px$/.exec(value.trim())

  return match === null ? 0 : normalizeFinite(Number(match[1]))
}
