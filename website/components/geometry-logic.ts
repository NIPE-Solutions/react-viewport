import type { VisualViewportState } from '@nipe-solutions/react-viewport'

// Application helpers, not package API. Both rectangles use document CSS pixels.
export interface DocumentTarget {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export function intersectsDocumentViewport(target: DocumentTarget, visual: VisualViewportState) {
  return (
    visual.width > 0 &&
    visual.height > 0 &&
    target.width > 0 &&
    target.height > 0 &&
    target.left + target.width > visual.pageLeft &&
    target.left < visual.pageLeft + visual.width &&
    target.top + target.height > visual.pageTop &&
    target.top < visual.pageTop + visual.height
  )
}

export function correctionToReveal(target: DocumentTarget, visual: VisualViewportState) {
  if (target.top < visual.pageTop) return target.top - visual.pageTop
  return Math.max(0, target.top + target.height - (visual.pageTop + visual.height))
}

// Optional canvas hit-testing tolerance in document CSS pixels. This is not
// devicePixelRatio, physical pixels, or a responsive UI breakpoint.
export function zoomTolerance(scale: number) {
  return scale > 0 && Number.isFinite(scale) ? 12 / scale : null
}
