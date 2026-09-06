import type { KeyboardState, LayoutViewport } from './types.js'

export function getNativeKeyboardState(
  layout: LayoutViewport,
  boundingRect: DOMRectReadOnly,
): KeyboardState {
  const { x, y, width, height } = boundingRect

  if (
    ![layout.width, layout.height, x, y, width, height].every(Number.isFinite) ||
    layout.width <= 0 ||
    layout.height <= 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return { open: false, height: 0 }
  }

  const left = Math.max(0, x)
  const top = Math.max(0, y)
  const right = Math.min(layout.width, x + width)
  const bottom = Math.min(layout.height, y + height)

  if (right <= left || bottom <= top) {
    return { open: false, height: 0 }
  }

  return {
    open: true,
    height: bottom === layout.height ? bottom - top : 0,
  }
}
