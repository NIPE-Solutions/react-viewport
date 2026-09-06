import { describe, expect, it } from 'vitest'

import {
  getBottomOcclusion,
  getOrientation,
  inferKeyboard,
  normalizeFinite,
} from '../../src/geometry.js'

const visual = (
  overrides: Partial<{
    width: number
    height: number
    offsetTop: number
    offsetLeft: number
    pageTop: number
    pageLeft: number
    scale: number
  }> = {},
) => ({
  width: 390,
  height: 800,
  offsetTop: 0,
  offsetLeft: 0,
  pageTop: 0,
  pageLeft: 0,
  scale: 1,
  ...overrides,
})

describe('normalizeFinite', () => {
  it('preserves a finite, non-negative dimension', () => {
    expect(normalizeFinite(320)).toBe(320)
  })

  it('preserves a finite fractional dimension', () => {
    expect(normalizeFinite(320.5)).toBe(320.5)
  })

  it.each([
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [Number.NEGATIVE_INFINITY, 0],
    [-1, 0],
    [Number.NaN, 24],
  ])('normalizes %s to %s', (value, expected) => {
    expect(normalizeFinite(value, expected === 24 ? 24 : undefined)).toBe(expected)
  })
})

describe('getOrientation', () => {
  it.each([
    [{ width: 390, height: 800 }, 'portrait'],
    [{ width: 800, height: 390 }, 'landscape'],
    [{ width: 600, height: 600 }, 'portrait'],
  ] as const)('returns %s for %o', (layout, expected) => {
    expect(getOrientation(layout)).toBe(expected)
  })
})

describe('getBottomOcclusion', () => {
  it('subtracts the visual viewport height and top offset from layout height', () => {
    expect(
      getBottomOcclusion({ width: 390, height: 800 }, visual({ height: 500, offsetTop: 20 })),
    ).toBe(280)
  })

  it('clamps a visual viewport extending below layout to zero', () => {
    expect(
      getBottomOcclusion({ width: 390, height: 800 }, visual({ height: 790, offsetTop: 20 })),
    ).toBe(0)
  })

  it('includes offsetTop in the shifted keyboard regression geometry', () => {
    expect(
      getBottomOcclusion({ width: 390, height: 800 }, visual({ height: 472, offsetTop: 28 })),
    ).toBe(300)
  })
})

describe('inferKeyboard', () => {
  const layout = { width: 390, height: 800 }

  it('opens at the exact occlusion threshold', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 680 }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: true, height: 120 })
  })

  it('requires the 15% layout threshold when it exceeds the 80px floor', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 681 }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it.each([
    [79, { open: false, height: 0 }],
    [80, { open: true, height: 80 }],
  ] as const)(
    'uses the independent 80px floor for %ipx occlusion when the ratio threshold is smaller',
    (occlusion, expected) => {
      expect(
        inferKeyboard({
          layout: { width: 390, height: 400 },
          visual: visual({ height: 400 - occlusion }),
          editableFocused: true,
          hasNativeGeometry: false,
        }),
      ).toEqual(expected)
    },
  )

  it('requires focused editable content', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 500 }),
        editableFocused: false,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('defers to native keyboard geometry when it is available', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 500 }),
        editableFocused: true,
        hasNativeGeometry: true,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('rejects 2x zoom geometry', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 500, scale: 2 }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it.each([0.99, 1.01])('accepts scale %s at the zoom tolerance boundary', (scale) => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 500, scale }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: true, height: 300 })
  })

  it('rejects invalid scale geometry', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 500, scale: Number.NaN }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('rejects ordinary toolbar occlusion below the threshold', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 730 }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('does not infer browser chrome without editable focus', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 720, offsetTop: 56 }),
        editableFocused: false,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('does not infer browser chrome with focus below the threshold', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 720, offsetTop: 56 }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('reports zero for an external-keyboard-like unchanged viewport', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual(),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('clears the inferred keyboard after the visual viewport is restored', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual(),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: false, height: 0 })
  })

  it('uses the clamped bottom occlusion as the inferred keyboard height', () => {
    expect(
      inferKeyboard({
        layout,
        visual: visual({ height: 500 }),
        editableFocused: true,
        hasNativeGeometry: false,
      }),
    ).toEqual({ open: true, height: 300 })
  })
})
