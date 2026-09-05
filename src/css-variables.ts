import type { ViewportState } from './types.js'

export const VIEWPORT_CSS_VARIABLES = [
  '--react-viewport-layout-width',
  '--react-viewport-layout-height',
  '--react-viewport-visual-width',
  '--react-viewport-visual-height',
  '--react-viewport-visual-offset-top',
  '--react-viewport-visual-offset-left',
  '--react-viewport-visual-page-top',
  '--react-viewport-visual-page-left',
  '--react-viewport-scale',
  '--react-viewport-keyboard-height',
  '--react-viewport-safe-area-top',
  '--react-viewport-safe-area-right',
  '--react-viewport-safe-area-bottom',
  '--react-viewport-safe-area-left',
] as const

export type ViewportCssVariableName = (typeof VIEWPORT_CSS_VARIABLES)[number]

export function writeViewportCssVariables(target: HTMLElement, state: ViewportState): void {
  for (const [name, value] of getViewportCssVariableValues(state)) {
    if (value === null) {
      target.style.removeProperty(name)
    } else {
      target.style.setProperty(name, value)
    }
  }
}

export function getViewportCssVariableValues(
  state: ViewportState,
): ReadonlyArray<readonly [ViewportCssVariableName, string | null]> {
  if (!state.ready || state.layout === null || state.visual === null) {
    return [
      ['--react-viewport-layout-width', null],
      ['--react-viewport-layout-height', null],
      ['--react-viewport-visual-width', null],
      ['--react-viewport-visual-height', null],
      ['--react-viewport-visual-offset-top', null],
      ['--react-viewport-visual-offset-left', null],
      ['--react-viewport-visual-page-top', null],
      ['--react-viewport-visual-page-left', null],
      ['--react-viewport-scale', null],
      ['--react-viewport-keyboard-height', pixel(state.keyboard.height)],
      ['--react-viewport-safe-area-top', pixel(state.safeArea.top)],
      ['--react-viewport-safe-area-right', pixel(state.safeArea.right)],
      ['--react-viewport-safe-area-bottom', pixel(state.safeArea.bottom)],
      ['--react-viewport-safe-area-left', pixel(state.safeArea.left)],
    ]
  }

  const { layout, visual } = state

  return [
    ['--react-viewport-layout-width', pixel(layout.width)],
    ['--react-viewport-layout-height', pixel(layout.height)],
    ['--react-viewport-visual-width', pixel(visual.width)],
    ['--react-viewport-visual-height', pixel(visual.height)],
    ['--react-viewport-visual-offset-top', pixel(visual.offsetTop)],
    ['--react-viewport-visual-offset-left', pixel(visual.offsetLeft)],
    ['--react-viewport-visual-page-top', pixel(visual.pageTop)],
    ['--react-viewport-visual-page-left', pixel(visual.pageLeft)],
    ['--react-viewport-scale', String(visual.scale)],
    ['--react-viewport-keyboard-height', pixel(state.keyboard.height)],
    ['--react-viewport-safe-area-top', pixel(state.safeArea.top)],
    ['--react-viewport-safe-area-right', pixel(state.safeArea.right)],
    ['--react-viewport-safe-area-bottom', pixel(state.safeArea.bottom)],
    ['--react-viewport-safe-area-left', pixel(state.safeArea.left)],
  ]
}

function pixel(value: number): string {
  return `${value}px`
}
