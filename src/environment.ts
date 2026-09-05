export interface VirtualKeyboardLike extends EventTarget {
  readonly boundingRect: DOMRectReadOnly
  overlaysContent: boolean
}

export interface BrowserEnvironment {
  readonly window: Window
  readonly document: Document
  readonly visualViewport: VisualViewport | null
  readonly virtualKeyboard: VirtualKeyboardLike | null
}
