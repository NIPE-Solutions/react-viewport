import { describe, expect, it } from 'vitest'
import {
  intersectsDocumentViewport,
  correctionToReveal,
  zoomTolerance,
} from '../../website/components/geometry-logic'

const visual = {
  width: 300,
  height: 400,
  offsetTop: 20,
  offsetLeft: 10,
  pageTop: 1020,
  pageLeft: 110,
  scale: 2,
}
describe('website application geometry (document CSS pixels)', () => {
  it('compares document bounds, not layout offsets or scaled pixels', () => {
    expect(
      intersectsDocumentViewport({ left: 120, top: 1100, width: 20, height: 20 }, visual),
    ).toBe(true)
    expect(intersectsDocumentViewport({ left: 120, top: 500, width: 20, height: 20 }, visual)).toBe(
      false,
    )
  })
  it('rejects non-overlapping horizontal bounds and zero-area edge contact', () => {
    expect(
      intersectsDocumentViewport({ left: 410, top: 1100, width: 20, height: 20 }, visual),
    ).toBe(false)
    expect(
      intersectsDocumentViewport({ left: 120, top: 1420, width: 20, height: 20 }, visual),
    ).toBe(false)
    expect(
      intersectsDocumentViewport({ left: 400, top: 1410, width: 20, height: 20 }, visual),
    ).toBe(true)
  })
  it('does not report an intersection for an empty visible viewport', () => {
    expect(
      intersectsDocumentViewport(
        { left: 100, top: 1000, width: 40, height: 40 },
        { ...visual, width: 0 },
      ),
    ).toBe(false)
    expect(
      intersectsDocumentViewport(
        { left: 100, top: 1000, width: 40, height: 40 },
        { ...visual, height: 0 },
      ),
    ).toBe(false)
  })
  it('computes minimum vertical correction without adding keyboard occlusion twice', () => {
    expect(correctionToReveal({ left: 120, top: 1410, width: 20, height: 20 }, visual)).toBe(10)
    expect(correctionToReveal({ left: 120, top: 1000, width: 20, height: 20 }, visual)).toBe(-20)
    expect(correctionToReveal({ left: 120, top: 1100, width: 20, height: 20 }, visual)).toBe(0)
  })
  it('converts optional tool tolerance without changing essential UI', () => {
    expect(zoomTolerance(1)).toBe(12)
    expect(zoomTolerance(2)).toBe(6)
    expect(zoomTolerance(0)).toBe(null)
  })
})
