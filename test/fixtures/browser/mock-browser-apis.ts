import type { VisualViewportState } from '@nipe-solutions/react-viewport'

export type FixtureEvent =
  | 'document-focusin'
  | 'document-focusout'
  | 'keyboard-geometrychange'
  | 'visual-resize'
  | 'visual-scroll'
  | 'window-resize'
  | 'window-scroll'

export interface FixtureDiagnostics {
  readonly listenerCounts: Record<string, number>
  readonly pendingAnimationFrames: number
  readonly probeCount: number
  readonly renderCount: number
}

export interface BrowserFixtureControls {
  setLayout(width: number, height: number): void
  setWindowScroll(left: number, top: number): void
  setVisualViewport(values: Partial<VisualViewportState>): void
  setKeyboardRect(rect: { x: number; y: number; width: number; height: number }): void
  dispatch(...events: FixtureEvent[]): void
  getDiagnostics(): FixtureDiagnostics
  recordRender(): void
  registerUnmount(unmount: () => void): void
  unmount(): void
}

interface FixtureOptions {
  readonly mockLayout: boolean
  readonly visualViewport: 'absent' | 'mock' | 'native'
  readonly virtualKeyboard: 'absent' | 'mock'
}

interface VirtualKeyboardFixture extends EventTarget {
  boundingRect: DOMRectReadOnly
  overlaysContent: boolean
}

interface ListenerRegistration {
  readonly listener: EventListenerOrEventListenerObject
  readonly capture: boolean
}

class VisualViewportFixture extends EventTarget {
  width = 390
  height = 800
  offsetTop = 0
  offsetLeft = 0
  pageTop = 0
  pageLeft = 0
  scale = 1
  onresize: ((this: VisualViewport, event: Event) => unknown) | null = null
  onscroll: ((this: VisualViewport, event: Event) => unknown) | null = null
  onscrollend: ((this: VisualViewport, event: Event) => unknown) | null = null
}

const trackedEvents = {
  document: ['focusin', 'focusout'],
  keyboard: ['geometrychange'],
  visual: ['resize', 'scroll'],
  window: ['resize', 'scroll'],
} as const

export function installBrowserFixture(options: FixtureOptions): BrowserFixtureControls {
  let layoutWidth = options.mockLayout ? 390 : window.innerWidth
  let layoutHeight = options.mockLayout ? 800 : window.innerHeight
  let scrollLeft = 0
  let scrollTop = 0
  let renderCount = 0
  let unmount: () => void = () => undefined

  if (options.mockLayout) {
    defineGetter(window, 'innerWidth', () => layoutWidth)
    defineGetter(window, 'innerHeight', () => layoutHeight)
    defineGetter(window, 'scrollX', () => scrollLeft)
    defineGetter(window, 'scrollY', () => scrollTop)
  }

  const controlledVisualViewport =
    options.visualViewport === 'mock' ? new VisualViewportFixture() : null

  if (options.visualViewport !== 'native') {
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: controlledVisualViewport,
    })
  }

  const controlledVirtualKeyboard: VirtualKeyboardFixture | null =
    options.virtualKeyboard === 'mock'
      ? Object.assign(new EventTarget(), {
          boundingRect: DOMRectReadOnly.fromRect({ x: 0, y: 800, width: 390, height: 0 }),
          overlaysContent: false,
        })
      : null

  Object.defineProperty(navigator, 'virtualKeyboard', {
    configurable: true,
    value: controlledVirtualKeyboard ?? undefined,
  })

  const listenerRegistrations = new Map<string, ListenerRegistration[]>()
  trackListeners('window', window, trackedEvents.window, listenerRegistrations)
  trackListeners('document', document, trackedEvents.document, listenerRegistrations)

  const activeVisualViewport = window.visualViewport
  if (activeVisualViewport !== null) {
    trackListeners(
      'visualViewport',
      activeVisualViewport,
      trackedEvents.visual,
      listenerRegistrations,
    )
  }

  if (controlledVirtualKeyboard !== null) {
    trackListeners(
      'virtualKeyboard',
      controlledVirtualKeyboard,
      trackedEvents.keyboard,
      listenerRegistrations,
    )
  }

  const pendingAnimationFrames = new Set<number>()
  const requestAnimationFrame = window.requestAnimationFrame.bind(window)
  const cancelAnimationFrame = window.cancelAnimationFrame.bind(window)

  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value(callback: FrameRequestCallback) {
      let animationFrameId = 0
      animationFrameId = requestAnimationFrame((time) => {
        pendingAnimationFrames.delete(animationFrameId)
        callback(time)
      })
      pendingAnimationFrames.add(animationFrameId)
      return animationFrameId
    },
  })
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    value(animationFrameId: number) {
      pendingAnimationFrames.delete(animationFrameId)
      cancelAnimationFrame(animationFrameId)
    },
  })

  const controls: BrowserFixtureControls = {
    setLayout(width, height) {
      requireMockLayout(options)
      layoutWidth = width
      layoutHeight = height
    },
    setWindowScroll(left, top) {
      requireMockLayout(options)
      scrollLeft = left
      scrollTop = top
    },
    setVisualViewport(values) {
      if (controlledVisualViewport === null) {
        throw new Error('The fixture does not have a controlled VisualViewport')
      }

      Object.assign(controlledVisualViewport, values)
    },
    setKeyboardRect(rect) {
      if (controlledVirtualKeyboard === null) {
        throw new Error('The fixture does not have a controlled Virtual Keyboard')
      }

      controlledVirtualKeyboard.boundingRect = DOMRectReadOnly.fromRect(rect)
    },
    dispatch(...events) {
      for (const event of events) {
        switch (event) {
          case 'document-focusin':
            document.dispatchEvent(new Event('focusin'))
            break
          case 'document-focusout':
            document.dispatchEvent(new Event('focusout'))
            break
          case 'window-resize':
            window.dispatchEvent(new Event('resize'))
            break
          case 'window-scroll':
            window.dispatchEvent(new Event('scroll'))
            break
          case 'visual-resize':
            controlledVisualViewport?.dispatchEvent(new Event('resize'))
            break
          case 'visual-scroll':
            controlledVisualViewport?.dispatchEvent(new Event('scroll'))
            break
          case 'keyboard-geometrychange':
            controlledVirtualKeyboard?.dispatchEvent(new Event('geometrychange'))
            break
        }
      }
    },
    getDiagnostics() {
      return {
        listenerCounts: Object.fromEntries(
          [...listenerRegistrations].map(([key, registrations]) => [key, registrations.length]),
        ),
        pendingAnimationFrames: pendingAnimationFrames.size,
        probeCount: document.body.querySelectorAll('[aria-hidden="true"]').length,
        renderCount,
      }
    },
    recordRender() {
      renderCount += 1
    },
    registerUnmount(nextUnmount) {
      unmount = nextUnmount
    },
    unmount() {
      unmount()
    },
  }

  window.__viewportFixture = controls
  return controls
}

function defineGetter(target: object, property: string, get: () => number): void {
  Object.defineProperty(target, property, { configurable: true, get })
}

function requireMockLayout(options: FixtureOptions): void {
  if (!options.mockLayout) {
    throw new Error('The fixture does not have controlled layout geometry')
  }
}

function trackListeners(
  source: string,
  target: EventTarget,
  eventTypes: readonly string[],
  listenerRegistrations: Map<string, ListenerRegistration[]>,
): void {
  const trackedTypes = new Set(eventTypes)
  const addEventListener = target.addEventListener.bind(target)
  const removeEventListener = target.removeEventListener.bind(target)

  for (const type of trackedTypes) {
    listenerRegistrations.set(`${source}:${type}`, [])
  }

  Object.defineProperty(target, 'addEventListener', {
    configurable: true,
    value(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      addEventListener(type, listener, options)

      if (listener !== null && trackedTypes.has(type)) {
        const key = `${source}:${type}`
        const registrations = listenerRegistrations.get(key)
        const capture = getCapture(options)

        if (
          registrations !== undefined &&
          !registrations.some(
            (registration) =>
              registration.listener === listener && registration.capture === capture,
          )
        ) {
          registrations.push({ listener, capture })
        }
      }
    },
  })
  Object.defineProperty(target, 'removeEventListener', {
    configurable: true,
    value(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) {
      removeEventListener(type, listener, options)

      if (listener !== null && trackedTypes.has(type)) {
        const key = `${source}:${type}`
        const registrations = listenerRegistrations.get(key)
        const capture = getCapture(options)
        const registrationIndex =
          registrations?.findIndex(
            (registration) =>
              registration.listener === listener && registration.capture === capture,
          ) ?? -1

        if (registrationIndex >= 0) {
          registrations?.splice(registrationIndex, 1)
        }
      }
    },
  })
}

function getCapture(
  options: boolean | AddEventListenerOptions | EventListenerOptions | undefined,
): boolean {
  return typeof options === 'boolean' ? options : (options?.capture ?? false)
}

declare global {
  interface Window {
    __viewportFixture: BrowserFixtureControls
  }
}
