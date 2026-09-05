import type { ViewportState } from './types.js'

export const SERVER_SNAPSHOT: ViewportState = {
  ready: false,
  layout: null,
  visual: null,
  keyboard: { open: false, height: 0 },
  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  orientation: null,
  supported: { visualViewport: false, virtualKeyboard: false },
}

export function getServerSnapshot(): ViewportState {
  return SERVER_SNAPSHOT
}

export function snapshotsEqual(left: ViewportState, right: ViewportState): boolean {
  return (
    left.ready === right.ready &&
    nullableLayoutEqual(left, right) &&
    nullableVisualEqual(left, right) &&
    left.keyboard.open === right.keyboard.open &&
    left.keyboard.height === right.keyboard.height &&
    left.safeArea.top === right.safeArea.top &&
    left.safeArea.right === right.safeArea.right &&
    left.safeArea.bottom === right.safeArea.bottom &&
    left.safeArea.left === right.safeArea.left &&
    left.orientation === right.orientation &&
    left.supported.visualViewport === right.supported.visualViewport &&
    left.supported.virtualKeyboard === right.supported.virtualKeyboard
  )
}

function nullableLayoutEqual(left: ViewportState, right: ViewportState): boolean {
  if (left.layout === null || right.layout === null) {
    return left.layout === right.layout
  }

  return left.layout.width === right.layout.width && left.layout.height === right.layout.height
}

function nullableVisualEqual(left: ViewportState, right: ViewportState): boolean {
  if (left.visual === null || right.visual === null) {
    return left.visual === right.visual
  }

  return (
    left.visual.width === right.visual.width &&
    left.visual.height === right.visual.height &&
    left.visual.offsetTop === right.visual.offsetTop &&
    left.visual.offsetLeft === right.visual.offsetLeft &&
    left.visual.pageTop === right.visual.pageTop &&
    left.visual.pageLeft === right.visual.pageLeft &&
    left.visual.scale === right.visual.scale
  )
}
