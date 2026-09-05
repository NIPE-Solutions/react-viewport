import { isKeyboardCapableElement } from './editable.js'
import type { BrowserEnvironment } from './environment.js'
import {
  getOrientation,
  inferKeyboard,
  MIN_KEYBOARD_OCCLUSION_PX,
  MIN_KEYBOARD_OCCLUSION_RATIO,
  normalizeFinite,
} from './geometry.js'
import { createSafeAreaProbe, type SafeAreaProbe } from './safe-area.js'
import { getServerSnapshot, snapshotsEqual } from './snapshot.js'
import type { KeyboardState, LayoutViewport, ViewportState, VisualViewportState } from './types.js'

export interface ViewportStore {
  subscribe(listener: () => void): () => void
  getSnapshot(): ViewportState
  getServerSnapshot(): ViewportState
}

interface KeyboardBaseline {
  readonly layout: LayoutViewport
  readonly visual: VisualViewportState
}

interface Subscription {
  readonly listener: () => void
}

export function createViewportStore(environment: BrowserEnvironment): ViewportStore {
  const subscribers = new Set<Subscription>()
  let snapshot = getServerSnapshot()
  let animationFrameId: number | null = null
  let probe: SafeAreaProbe | null = null
  let cleanup: Array<() => void> = []
  let editableFocused = false
  let keyboardBaseline: KeyboardBaseline | null = null

  function subscribe(listener: () => void): () => void {
    const wasEmpty = subscribers.size === 0
    const subscription = { listener }
    subscribers.add(subscription)

    if (wasEmpty) {
      activate()
    }

    let subscribed = true

    return () => {
      if (!subscribed) {
        return
      }

      subscribed = false
      subscribers.delete(subscription)

      if (subscribers.size === 0) {
        deactivate()
      }
    }
  }

  function activate(): void {
    editableFocused = isKeyboardCapableElement(environment.document.activeElement)
    probe = createSafeAreaProbe(environment.document)

    listen(environment.window, 'resize', scheduleMeasurement)
    listen(environment.window, 'scroll', scheduleMeasurement)
    listen(environment.document, 'focusin', handleFocusIn)
    listen(environment.document, 'focusout', handleFocusOut)

    if (environment.visualViewport !== null) {
      listen(environment.visualViewport, 'resize', scheduleMeasurement)
      listen(environment.visualViewport, 'scroll', scheduleMeasurement)
    }

    if (environment.virtualKeyboard !== null) {
      listen(environment.virtualKeyboard, 'geometrychange', scheduleMeasurement)
    }

    scheduleMeasurement()
  }

  function deactivate(): void {
    cleanup.forEach((removeListener) => removeListener())
    cleanup = []

    if (animationFrameId !== null) {
      environment.window.cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    probe?.destroy()
    probe = null
    editableFocused = false
    keyboardBaseline = null
  }

  function listen(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener)
    cleanup.push(() => target.removeEventListener(type, listener))
  }

  function handleFocusIn(event: Event): void {
    editableFocused = isKeyboardCapableElement(isElement(event.target) ? event.target : null)
    scheduleMeasurement()
  }

  function handleFocusOut(): void {
    editableFocused = false
    scheduleMeasurement()
  }

  function scheduleMeasurement(): void {
    if (animationFrameId !== null) {
      return
    }

    animationFrameId = environment.window.requestAnimationFrame(() => {
      animationFrameId = null
      measure()
    })
  }

  function measure(): void {
    const layout = readLayout(environment.window)
    const visual = readVisual(environment, layout)
    const nextBaseline = getNextBaseline(keyboardBaseline, layout, visual, editableFocused)
    const keyboard = readKeyboard(environment, layout, visual, nextBaseline, editableFocused)
    const safeArea = probe?.measure() ?? { top: 0, right: 0, bottom: 0, left: 0 }
    const candidate: ViewportState = {
      ready: true,
      layout,
      visual,
      keyboard,
      safeArea,
      orientation: getOrientation(layout),
      supported: {
        visualViewport: environment.visualViewport !== null,
        virtualKeyboard: environment.virtualKeyboard !== null,
      },
    }

    keyboardBaseline = nextBaseline

    if (snapshotsEqual(snapshot, candidate)) {
      return
    }

    snapshot = candidate
    subscribers.forEach(({ listener }) => listener())
  }

  return {
    subscribe,
    getSnapshot() {
      return snapshot
    },
    getServerSnapshot,
  }
}

function readLayout(targetWindow: Window): LayoutViewport {
  return {
    width: normalizeFinite(targetWindow.innerWidth),
    height: normalizeFinite(targetWindow.innerHeight),
  }
}

function readVisual(environment: BrowserEnvironment, layout: LayoutViewport): VisualViewportState {
  const visualViewport = environment.visualViewport

  if (visualViewport === null) {
    return {
      width: layout.width,
      height: layout.height,
      offsetTop: 0,
      offsetLeft: 0,
      pageTop: finiteOrZero(environment.window.scrollY),
      pageLeft: finiteOrZero(environment.window.scrollX),
      scale: 1,
    }
  }

  return {
    width: normalizeFinite(visualViewport.width),
    height: normalizeFinite(visualViewport.height),
    offsetTop: finiteOrZero(visualViewport.offsetTop),
    offsetLeft: finiteOrZero(visualViewport.offsetLeft),
    pageTop: finiteOrZero(visualViewport.pageTop),
    pageLeft: finiteOrZero(visualViewport.pageLeft),
    scale: normalizeFinite(visualViewport.scale),
  }
}

function getNextBaseline(
  baseline: KeyboardBaseline | null,
  layout: LayoutViewport,
  visual: VisualViewportState,
  editableFocused: boolean,
): KeyboardBaseline {
  if (
    baseline === null ||
    !editableFocused ||
    baseline.layout.width !== layout.width ||
    getOrientation(baseline.layout) !== getOrientation(layout)
  ) {
    return { layout, visual }
  }

  return baseline
}

function readKeyboard(
  environment: BrowserEnvironment,
  layout: LayoutViewport,
  visual: VisualViewportState,
  baseline: KeyboardBaseline,
  editableFocused: boolean,
): KeyboardState {
  if (environment.virtualKeyboard !== null) {
    return getNativeKeyboardState(layout, environment.virtualKeyboard.boundingRect)
  }

  if (!hasKeyboardSizedVisualReduction(baseline, visual)) {
    return { open: false, height: 0 }
  }

  return inferKeyboard({
    layout,
    visual,
    editableFocused,
    hasNativeGeometry: false,
  })
}

function hasKeyboardSizedVisualReduction(
  baseline: KeyboardBaseline,
  visual: VisualViewportState,
): boolean {
  const baselineBottom = baseline.visual.height + baseline.visual.offsetTop
  const currentBottom = visual.height + visual.offsetTop
  const reduction = Math.max(0, baselineBottom - currentBottom)
  const threshold = Math.max(
    MIN_KEYBOARD_OCCLUSION_PX,
    baseline.layout.height * MIN_KEYBOARD_OCCLUSION_RATIO,
  )

  return reduction >= threshold
}

function getNativeKeyboardState(
  layout: LayoutViewport,
  boundingRect: DOMRectReadOnly,
): KeyboardState {
  const { x, y, width, height } = boundingRect

  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return { open: false, height: 0 }
  }

  const intersectionWidth = Math.max(0, Math.min(layout.width, x + width) - Math.max(0, x))
  const intersectionHeight = Math.max(0, Math.min(layout.height, y + height) - Math.max(0, y))

  if (intersectionWidth === 0 || intersectionHeight === 0) {
    return { open: false, height: 0 }
  }

  return { open: true, height: intersectionHeight }
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function isElement(target: EventTarget | null): target is Element {
  return target !== null && 'nodeType' in target && target.nodeType === 1
}
