import type { BrowserEnvironment, VirtualKeyboardLike } from '../../../src/environment.js'
import type { SafeAreaInsets, VisualViewportState } from '../../../src/types.js'

type ListenerSource = 'window' | 'document' | 'visualViewport' | 'virtualKeyboard'

interface FakeBrowserEnvironmentOptions {
  readonly visualViewport?: boolean
  readonly virtualKeyboard?: boolean
}

interface MutableVisualViewport extends VisualViewport {
  width: number
  height: number
  offsetTop: number
  offsetLeft: number
  pageTop: number
  pageLeft: number
  scale: number
}

interface MutableVirtualKeyboard extends VirtualKeyboardLike {
  boundingRect: DOMRectReadOnly
}

export interface FakeBrowserEnvironment {
  readonly environment: BrowserEnvironment
  readonly window: Window
  readonly document: Document
  readonly visualViewport: MutableVisualViewport | null
  readonly virtualKeyboard: MutableVirtualKeyboard | null
  readonly focusedElement: Element | null
  readonly queuedAnimationFrames: number
  readonly probeCount: number
  setLayout(width: number, height: number): void
  setScroll(left: number, top: number): void
  setVisualViewport(values: Partial<VisualViewportState>): void
  setKeyboardRect(rect: { x: number; y: number; width: number; height: number }): void
  setSafeArea(insets: SafeAreaInsets): void
  createEditable(): HTMLInputElement
  focus(element: HTMLElement): void
  blur(element: HTMLElement): void
  dispatchResize(): void
  dispatchWindowScroll(): void
  dispatchVisualResize(): void
  dispatchVisualScroll(): void
  dispatchKeyboardGeometryChange(): void
  flushAnimationFrame(): void
  listenerCount(source: ListenerSource, type: string): number
  dispose(): void
}

export function createFakeBrowserEnvironment(
  options: FakeBrowserEnvironmentOptions = {},
): FakeBrowserEnvironment {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)

  const targetWindow = iframe.contentWindow

  if (targetWindow === null) {
    throw new Error('Expected an iframe browsing context')
  }

  const targetDocument = targetWindow.document
  const listenerCounts = new Map<string, number>()
  const restoreTracking: Array<() => void> = []
  let layoutWidth = 390
  let layoutHeight = 800
  let scrollLeft = 0
  let scrollTop = 0
  let safeArea: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 }
  let nextFrameId = 1
  const frames = new Map<number, FrameRequestCallback>()

  defineGetter(targetWindow, 'innerWidth', () => layoutWidth)
  defineGetter(targetWindow, 'innerHeight', () => layoutHeight)
  defineGetter(targetWindow, 'scrollX', () => scrollLeft)
  defineGetter(targetWindow, 'scrollY', () => scrollTop)

  Object.defineProperty(targetWindow, 'requestAnimationFrame', {
    configurable: true,
    value(callback: FrameRequestCallback) {
      const id = nextFrameId++
      frames.set(id, callback)
      return id
    },
  })
  Object.defineProperty(targetWindow, 'cancelAnimationFrame', {
    configurable: true,
    value(id: number) {
      frames.delete(id)
    },
  })
  Object.defineProperty(targetWindow, 'getComputedStyle', {
    configurable: true,
    value() {
      return {
        paddingTop: `${safeArea.top}px`,
        paddingRight: `${safeArea.right}px`,
        paddingBottom: `${safeArea.bottom}px`,
        paddingLeft: `${safeArea.left}px`,
      } as CSSStyleDeclaration
    },
  })

  const visualViewport =
    options.visualViewport === false ? null : createVisualViewport(targetWindow)
  const virtualKeyboard =
    options.virtualKeyboard === true ? createVirtualKeyboard(targetWindow) : null

  trackListeners('window', targetWindow)
  trackListeners('document', targetDocument)

  if (visualViewport !== null) {
    trackListeners('visualViewport', visualViewport)
  }

  if (virtualKeyboard !== null) {
    trackListeners('virtualKeyboard', virtualKeyboard)
  }

  function trackListeners(source: ListenerSource, target: EventTarget): void {
    const add = target.addEventListener.bind(target)
    const remove = target.removeEventListener.bind(target)

    Object.defineProperty(target, 'addEventListener', {
      configurable: true,
      value(type: string, listener: EventListenerOrEventListenerObject | null, options?: unknown) {
        if (listener !== null) {
          const key = `${source}:${type}`
          listenerCounts.set(key, (listenerCounts.get(key) ?? 0) + 1)
        }
        add(type, listener, options as AddEventListenerOptions)
      },
    })
    Object.defineProperty(target, 'removeEventListener', {
      configurable: true,
      value(type: string, listener: EventListenerOrEventListenerObject | null, options?: unknown) {
        if (listener !== null) {
          const key = `${source}:${type}`
          listenerCounts.set(key, Math.max(0, (listenerCounts.get(key) ?? 0) - 1))
        }
        remove(type, listener, options as EventListenerOptions)
      },
    })

    restoreTracking.push(() => {
      Object.defineProperty(target, 'addEventListener', { configurable: true, value: add })
      Object.defineProperty(target, 'removeEventListener', { configurable: true, value: remove })
    })
  }

  return {
    environment: {
      window: targetWindow,
      document: targetDocument,
      visualViewport,
      virtualKeyboard,
    },
    window: targetWindow,
    document: targetDocument,
    visualViewport,
    virtualKeyboard,
    get focusedElement() {
      return targetDocument.activeElement
    },
    get queuedAnimationFrames() {
      return frames.size
    },
    get probeCount() {
      return targetDocument.body.querySelectorAll('[aria-hidden="true"]').length
    },
    setLayout(width, height) {
      layoutWidth = width
      layoutHeight = height
    },
    setScroll(left, top) {
      scrollLeft = left
      scrollTop = top
    },
    setVisualViewport(values) {
      if (visualViewport === null) {
        throw new Error('VisualViewport is unavailable')
      }

      Object.assign(visualViewport, values)
    },
    setKeyboardRect(rect) {
      if (virtualKeyboard === null) {
        throw new Error('Virtual Keyboard is unavailable')
      }

      virtualKeyboard.boundingRect = DOMRectReadOnly.fromRect(rect)
    },
    setSafeArea(insets) {
      safeArea = insets
    },
    createEditable() {
      const input = targetDocument.createElement('input')
      input.type = 'text'
      targetDocument.body.append(input)
      return input
    },
    focus(element) {
      element.focus()
    },
    blur(element) {
      element.blur()
    },
    dispatchResize() {
      targetWindow.dispatchEvent(createEvent(targetDocument, 'resize'))
    },
    dispatchWindowScroll() {
      targetWindow.dispatchEvent(createEvent(targetDocument, 'scroll'))
    },
    dispatchVisualResize() {
      visualViewport?.dispatchEvent(createEvent(targetDocument, 'resize'))
    },
    dispatchVisualScroll() {
      visualViewport?.dispatchEvent(createEvent(targetDocument, 'scroll'))
    },
    dispatchKeyboardGeometryChange() {
      virtualKeyboard?.dispatchEvent(createEvent(targetDocument, 'geometrychange'))
    },
    flushAnimationFrame() {
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => callback(0))
    },
    listenerCount(source, type) {
      return listenerCounts.get(`${source}:${type}`) ?? 0
    },
    dispose() {
      frames.clear()
      restoreTracking.reverse().forEach((restore) => restore())
      iframe.remove()
    },
  }
}

function createVisualViewport(targetWindow: Window): MutableVisualViewport {
  const viewport =
    targetWindow.document.createDocumentFragment() as unknown as MutableVisualViewport

  Object.assign(viewport, {
    width: 390,
    height: 800,
    offsetTop: 0,
    offsetLeft: 0,
    pageTop: 0,
    pageLeft: 0,
    scale: 1,
    onresize: null,
    onscroll: null,
  })

  return viewport
}

function createVirtualKeyboard(targetWindow: Window): MutableVirtualKeyboard {
  const keyboard =
    targetWindow.document.createDocumentFragment() as unknown as MutableVirtualKeyboard

  keyboard.boundingRect = DOMRectReadOnly.fromRect({ x: 0, y: 800, width: 390, height: 0 })
  keyboard.overlaysContent = false

  return keyboard
}

function defineGetter(target: object, property: string, get: () => number): void {
  Object.defineProperty(target, property, { configurable: true, get })
}

function createEvent(targetDocument: Document, type: string): Event {
  const event = targetDocument.createEvent('Event')
  event.initEvent(type)
  return event
}
