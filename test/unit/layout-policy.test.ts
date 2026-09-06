import { describe, expect, it } from 'vitest'

import { getEffectiveBottomInset } from '../../website/lib/layout-policy.js'

describe('getEffectiveBottomInset', () => {
  it.each([
    ['keeps a safe-area inset when the keyboard is closed', 0, 34, 34],
    ['uses keyboard occlusion when it covers the safe area', 326, 34, 326],
    ['uses keyboard occlusion when there is no safe area', 326, 0, 326],
    ['normalizes invalid inset measurements to zero', -1, Number.NaN, 0],
  ] as const)('%s', (_name, keyboardHeight, safeAreaBottom, expected) => {
    expect(getEffectiveBottomInset(keyboardHeight, safeAreaBottom)).toBe(expected)
  })
})
