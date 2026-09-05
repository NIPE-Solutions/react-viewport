import type {
  KeyboardState,
  LayoutViewport,
  ViewportOrientation,
  VisualViewportState,
} from './types.js'

export const MIN_KEYBOARD_OCCLUSION_PX = 80
export const MIN_KEYBOARD_OCCLUSION_RATIO = 0.15

export interface KeyboardInferenceInput {
  readonly layout: LayoutViewport
  readonly visual: VisualViewportState
  readonly editableFocused: boolean
  readonly hasNativeGeometry: boolean
}

export function normalizeFinite(value: number, fallback = 0): number {
  if (Number.isFinite(value) && value >= 0) {
    return value
  }

  return Number.isFinite(fallback) && fallback >= 0 ? fallback : 0
}

export function getOrientation(layout: LayoutViewport): ViewportOrientation {
  return normalizeFinite(layout.width) > normalizeFinite(layout.height) ? 'landscape' : 'portrait'
}

export function getBottomOcclusion(layout: LayoutViewport, visual: VisualViewportState): number {
  return Math.max(
    0,
    normalizeFinite(layout.height) -
      (normalizeFinite(visual.height) + normalizeFinite(visual.offsetTop)),
  )
}

export function inferKeyboard(input: KeyboardInferenceInput): KeyboardState {
  const scale = input.visual.scale
  const isScaleAtRest =
    Number.isFinite(scale) && scale > 0 && Math.abs(scale - 1) <= 0.01 + Number.EPSILON

  if (!input.editableFocused || input.hasNativeGeometry || !isScaleAtRest) {
    return { open: false, height: 0 }
  }

  const occlusion = getBottomOcclusion(input.layout, input.visual)
  const threshold = Math.max(
    MIN_KEYBOARD_OCCLUSION_PX,
    normalizeFinite(input.layout.height) * MIN_KEYBOARD_OCCLUSION_RATIO,
  )

  return occlusion >= threshold ? { open: true, height: occlusion } : { open: false, height: 0 }
}
