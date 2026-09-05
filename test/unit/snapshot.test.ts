import { describe, expect, it } from 'vitest'

import { getServerSnapshot, SERVER_SNAPSHOT, snapshotsEqual } from '../../src/snapshot.js'

describe('getServerSnapshot', () => {
  it('returns the same unavailable-environment snapshot instance', () => {
    expect(getServerSnapshot()).toBe(getServerSnapshot())
  })
})

describe('snapshotsEqual', () => {
  it('treats a shallow copy of the server snapshot as equal', () => {
    expect(snapshotsEqual(SERVER_SNAPSHOT, { ...SERVER_SNAPSHOT })).toBe(true)
  })

  it('accepts independently allocated snapshots with equal scalar values', () => {
    const snapshot = {
      ready: true,
      layout: { width: 390.5, height: 844.25 },
      visual: {
        width: 390.5,
        height: 512.75,
        offsetTop: 10.5,
        offsetLeft: 2.25,
        pageTop: 100.5,
        pageLeft: 20.25,
        scale: 1,
      },
      keyboard: { open: true, height: 321.5 },
      safeArea: { top: 47.5, right: 0, bottom: 34.5, left: 0 },
      orientation: 'portrait' as const,
      supported: { visualViewport: true, virtualKeyboard: true },
    }

    expect(
      snapshotsEqual(snapshot, {
        ...snapshot,
        layout: { ...snapshot.layout },
        visual: { ...snapshot.visual },
        keyboard: { ...snapshot.keyboard },
        safeArea: { ...snapshot.safeArea },
        supported: { ...snapshot.supported },
      }),
    ).toBe(true)
  })

  it('rejects a changed scalar value', () => {
    expect(snapshotsEqual(SERVER_SNAPSHOT, { ...SERVER_SNAPSHOT, ready: true })).toBe(false)
  })
})
