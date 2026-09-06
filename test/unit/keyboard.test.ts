import { describe, expect, it } from 'vitest'

import { getNativeKeyboardState } from '../../src/keyboard.js'
import type { LayoutViewport } from '../../src/types.js'

const layout: LayoutViewport = { width: 390, height: 800 }

function rect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return { x, y, width, height } as DOMRectReadOnly
}

describe('getNativeKeyboardState', () => {
  it.each([
    ['empty', rect(0, 0, 0, 0), { open: false, height: 0 }],
    ['bottom-attached', rect(0, 500, 390, 300), { open: true, height: 300 }],
    ['floating', rect(90, 420, 210, 220), { open: true, height: 0 }],
    ['bottom-attached partial width', rect(120, 650, 150, 150), { open: true, height: 150 }],
    ['non-intersecting', rect(500, 500, 100, 300), { open: false, height: 0 }],
  ] as const)('reports $s native keyboard geometry', (_name, boundingRect, expected) => {
    expect(getNativeKeyboardState(layout, boundingRect)).toEqual(expected)
  })

  it.each([
    ['negative width', rect(0, 500, -1, 300)],
    ['negative height', rect(0, 500, 390, -1)],
    ['NaN coordinate', rect(Number.NaN, 500, 390, 300)],
    ['infinite dimension', rect(0, 500, Infinity, 300)],
  ] as const)('closes for a rectangle with %s', (_name, boundingRect) => {
    expect(getNativeKeyboardState(layout, boundingRect)).toEqual({ open: false, height: 0 })
  })
})
