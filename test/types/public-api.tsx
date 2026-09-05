import type {
  KeyboardState,
  LayoutViewport,
  SafeAreaInsets,
  ViewportCssVariablesOptions,
  ViewportOrientation,
  ViewportProviderProps,
  ViewportState,
  ViewportSupport,
  VisualViewportState,
} from '@nipe-solutions/react-viewport'

declare const state: ViewportState
const ready: boolean = state.ready
const layout: LayoutViewport | null = state.layout
const visual: VisualViewportState | null = state.visual
const keyboard: KeyboardState = state.keyboard
const safeArea: SafeAreaInsets = state.safeArea
const orientation: ViewportOrientation | null = state.orientation
const supported: ViewportSupport = state.supported
declare const provider: ViewportProviderProps
declare const cssOptions: ViewportCssVariablesOptions
void [ready, layout, visual, keyboard, safeArea, orientation, supported, provider, cssOptions]

// @ts-expect-error snapshots are readonly
state.ready = false
// @ts-expect-error nested state is readonly
state.safeArea.bottom = 12
