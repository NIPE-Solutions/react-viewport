import { getDeepActiveElement, isKeyboardCapableElement } from './editable.js'
import type { BrowserEnvironment } from './environment.js'
import {
  getOrientation,
  inferKeyboard,
  MIN_KEYBOARD_OCCLUSION_PX,
  MIN_KEYBOARD_OCCLUSION_RATIO,
  normalizeFinite,
} from './geometry.js'
import { getNativeKeyboardState } from './keyboard.js'
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
  let focusRoots: ShadowRoot[] = []
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
    probe = createSafeAreaProbe(environment.document)

    listen(environment.window, 'resize', scheduleMeasurement)
    listen(environment.window, 'scroll', scheduleMeasurement)
    listen(environment.document, 'focusin', scheduleMeasurement)
    listen(environment.document, 'focusout', scheduleMeasurement)

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
    updateFocusRoots([])
    keyboardBaseline = null
  }

  function listen(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener)
    cleanup.push(() => target.removeEventListener(type, listener))
  }

  function updateFocusRoots(roots: ShadowRoot[]): void {
    // Same-host shadow focus moves can suppress the document's focus events.
    for (const root of focusRoots) {
      root.removeEventListener('focusin', scheduleMeasurement)
      root.removeEventListener('focusout', scheduleMeasurement)
    }
    focusRoots = roots
    for (const root of focusRoots) {
      root.addEventListener('focusin', scheduleMeasurement)
      root.addEventListener('focusout', scheduleMeasurement)
    }
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
    const roots: ShadowRoot[] = []
    const editableFocused = isKeyboardCapableElement(
      getDeepActiveElement(environment.document, roots),
    )
    updateFocusRoots(roots)
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

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0
}
