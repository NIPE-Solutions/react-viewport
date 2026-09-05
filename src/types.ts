import type * as React from 'react'

export interface LayoutViewport {
  readonly width: number
  readonly height: number
}

export interface VisualViewportState {
  readonly width: number
  readonly height: number
  readonly offsetTop: number
  readonly offsetLeft: number
  readonly pageTop: number
  readonly pageLeft: number
  readonly scale: number
}

export interface KeyboardState {
  readonly open: boolean
  readonly height: number
}

export interface SafeAreaInsets {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

export type ViewportOrientation = 'portrait' | 'landscape'

export interface ViewportSupport {
  readonly visualViewport: boolean
  readonly virtualKeyboard: boolean
}

export interface ViewportState {
  readonly ready: boolean
  readonly layout: LayoutViewport | null
  readonly visual: VisualViewportState | null
  readonly keyboard: KeyboardState
  readonly safeArea: SafeAreaInsets
  readonly orientation: ViewportOrientation | null
  readonly supported: ViewportSupport
}

export interface ViewportProviderProps {
  readonly children: React.ReactNode
  readonly targetWindow?: Window | null
}

export interface ViewportCssVariablesOptions {
  readonly target?: HTMLElement | React.RefObject<HTMLElement | null> | null
}
