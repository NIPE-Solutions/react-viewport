export interface GeometryModel {
  readonly layout: { readonly width: number; readonly height: number }
  readonly visual: {
    readonly width: number
    readonly height: number
    readonly offsetTop: number
    readonly offsetLeft: number
    readonly scale: number
  }
  readonly safeArea: {
    readonly top: number
    readonly right: number
    readonly bottom: number
    readonly left: number
  }
  readonly keyboard: { readonly open: boolean; readonly height: number }
}

export type GeometryScenario =
  'normal' | 'browser-chrome' | 'soft-keyboard' | 'shifted-keyboard' | 'zoom' | 'custom'

export interface CustomGeometryInput {
  readonly layoutWidth: number
  readonly layoutHeight: number
  readonly visualWidth: number
  readonly visualHeight: number
  readonly visualOffsetTop: number
  readonly visualOffsetLeft: number
  readonly visualScale: number
  readonly keyboardHeight: number
  readonly safeTop: number
  readonly safeRight: number
  readonly safeBottom: number
  readonly safeLeft: number
}

interface ScenarioDefinition {
  readonly label: string
  readonly description: string
  readonly keyboardSource: 'fixed' | 'derived' | 'editable'
  readonly geometry: GeometryModel
}

const layout = { width: 390, height: 800 } as const
const noSafeArea = { top: 0, right: 0, bottom: 0, left: 0 } as const

function preset(
  visual: GeometryModel['visual'],
  keyboard: GeometryModel['keyboard'],
): GeometryModel {
  return { layout, visual, safeArea: noSafeArea, keyboard }
}

export const geometryScenarios: Readonly<
  Record<Exclude<GeometryScenario, 'custom'>, ScenarioDefinition>
> = {
  normal: {
    label: 'Normal',
    description: 'The visual viewport matches the layout viewport. No keyboard is visible.',
    keyboardSource: 'fixed',
    geometry: preset(
      { width: 390, height: 800, offsetTop: 0, offsetLeft: 0, scale: 1 },
      { open: false, height: 0 },
    ),
  },
  'browser-chrome': {
    label: 'Browser chrome',
    description: 'The visual viewport moves and shrinks, but no software keyboard is inferred.',
    keyboardSource: 'fixed',
    geometry: preset(
      { width: 390, height: 720, offsetTop: 56, offsetLeft: 0, scale: 1 },
      { open: false, height: 0 },
    ),
  },
  'soft-keyboard': {
    label: 'Soft keyboard',
    description: 'A focused editable and sufficient bottom occlusion support keyboard inference.',
    keyboardSource: 'derived',
    geometry: preset(
      { width: 390, height: 500, offsetTop: 0, offsetLeft: 0, scale: 1 },
      { open: true, height: 300 },
    ),
  },
  'shifted-keyboard': {
    label: 'Shifted keyboard',
    description: 'The top offset is included when deriving the 300 px bottom occlusion.',
    keyboardSource: 'derived',
    geometry: preset(
      { width: 390, height: 472, offsetTop: 28, offsetLeft: 0, scale: 1 },
      { open: true, height: 300 },
    ),
  },
  zoom: {
    label: 'Zoom',
    description: 'The visual viewport shrinks because of scale, not keyboard occlusion.',
    keyboardSource: 'fixed',
    geometry: preset(
      { width: 195, height: 400, offsetTop: 24, offsetLeft: 18, scale: 2 },
      { open: false, height: 0 },
    ),
  },
}

export const defaultCustomGeometry: CustomGeometryInput = {
  layoutWidth: 390,
  layoutHeight: 800,
  visualWidth: 390,
  visualHeight: 620,
  visualOffsetTop: 28,
  visualOffsetLeft: 0,
  visualScale: 1,
  keyboardHeight: 152,
  safeTop: 0,
  safeRight: 0,
  safeBottom: 24,
  safeLeft: 0,
}

export function getSimulationBottomOcclusion(input: {
  readonly layoutHeight: number
  readonly visualHeight: number
  readonly visualOffsetTop: number
}): number {
  return Math.max(0, input.layoutHeight - (input.visualOffsetTop + input.visualHeight))
}

export function createScenarioGeometry(
  scenario: GeometryScenario,
  custom: CustomGeometryInput = defaultCustomGeometry,
): GeometryModel {
  if (scenario !== 'custom') return geometryScenarios[scenario].geometry

  const keyboardHeight = Math.max(0, custom.keyboardHeight)
  return {
    layout: {
      width: Math.max(0, custom.layoutWidth),
      height: Math.max(0, custom.layoutHeight),
    },
    visual: {
      width: Math.max(0, custom.visualWidth),
      height: Math.max(0, custom.visualHeight),
      offsetTop: custom.visualOffsetTop,
      offsetLeft: custom.visualOffsetLeft,
      scale: Math.max(0, custom.visualScale),
    },
    safeArea: {
      top: Math.max(0, custom.safeTop),
      right: Math.max(0, custom.safeRight),
      bottom: Math.max(0, custom.safeBottom),
      left: Math.max(0, custom.safeLeft),
    },
    keyboard: { open: keyboardHeight > 0, height: keyboardHeight },
  }
}

export function validateCustomGeometry(geometry: GeometryModel): string | null {
  if (!geometry.keyboard.open) return null
  const bottomOcclusion = getSimulationBottomOcclusion({
    layoutHeight: geometry.layout.height,
    visualHeight: geometry.visual.height,
    visualOffsetTop: geometry.visual.offsetTop,
  })
  if (Math.abs(bottomOcclusion - geometry.keyboard.height) < 0.5) return null
  return `This custom keyboard occlusion does not match the current bottom occlusion (${round(bottomOcclusion)} px).`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
