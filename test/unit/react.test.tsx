import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ViewportProvider, useViewport } from '../../src/index.js'
import { SERVER_SNAPSHOT } from '../../src/snapshot.js'
import { getViewportStore, resetViewportStoreForTests } from '../../src/store-registry.js'
import type { ViewportState } from '../../src/types.js'

const frames = new Map<Window, Map<number, FrameRequestCallback>>()
let nextFrameId = 1
const mountedRoots: Root[] = []

globalThis.IS_REACT_ACT_ENVIRONMENT = true

afterEach(async () => {
  await act(async () => {
    mountedRoots.splice(0).forEach((root) => root.unmount())
  })

  for (const targetWindow of frames.keys()) {
    try {
      resetViewportStoreForTests(targetWindow)
    } catch {
      // A test assertion reports unexpected active subscriptions directly.
    }
  }

  frames.clear()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

function ViewportProbe({ onState }: { readonly onState: (state: ViewportState) => void }) {
  const state = useViewport()
  onState(state)
  return <output>{state.layout?.width ?? 'server'}</output>
}

function renderClient(node: React.ReactNode): HTMLElement {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  mountedRoots.push(root)

  act(() => {
    root.render(node)
  })

  return container
}

function createTargetWindow(): Window {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const targetWindow = iframe.contentWindow

  if (targetWindow === null) {
    throw new Error('Expected an iframe browsing context')
  }

  installAnimationFrame(targetWindow)
  return targetWindow
}

function installAnimationFrame(targetWindow: Window): void {
  const targetFrames = new Map<number, FrameRequestCallback>()
  frames.set(targetWindow, targetFrames)
  Object.defineProperty(targetWindow, 'requestAnimationFrame', {
    configurable: true,
    value(callback: FrameRequestCallback) {
      const id = nextFrameId++
      targetFrames.set(id, callback)
      return id
    },
  })
  Object.defineProperty(targetWindow, 'cancelAnimationFrame', {
    configurable: true,
    value(id: number) {
      targetFrames.delete(id)
    },
  })
}

function flushFrames(targetWindow: Window): void {
  const targetFrames = frames.get(targetWindow)

  if (targetFrames === undefined) {
    throw new Error('Expected a frame queue for the target window')
  }

  for (const callback of targetFrames.values()) {
    callback(0)
  }
  targetFrames.clear()
}

describe('React viewport bindings', () => {
  it('uses the global Window store when no provider is present', async () => {
    installAnimationFrame(window)
    let observed: ViewportState | undefined
    const container = renderClient(<ViewportProbe onState={(state) => (observed = state)} />)

    await act(async () => {
      flushFrames(window)
    })

    expect(container.textContent).toBe(String(window.innerWidth))
    expect(observed).toBe(getViewportStore(window).getSnapshot())
    expect(() => resetViewportStoreForTests(window)).toThrow()
  })

  it('renders on the server without accessing browser globals', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    expect(renderToString(<ViewportProbe onState={() => undefined} />)).toContain('server')
  })

  it('uses a provider target Window instead of the global Window store', async () => {
    installAnimationFrame(window)
    const targetWindow = createTargetWindow()
    Object.defineProperty(targetWindow, 'innerWidth', { configurable: true, value: 640 })
    const container = renderClient(
      <ViewportProvider targetWindow={targetWindow}>
        <ViewportProbe onState={() => undefined} />
      </ViewportProvider>,
    )

    await act(async () => {
      flushFrames(targetWindow)
    })

    expect(container.textContent).toBe('640')
    expect(targetWindow.document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
    expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
  })

  it('returns the stable server snapshot for a null provider target', () => {
    let observed: ViewportState | undefined

    renderClient(
      <ViewportProvider targetWindow={null}>
        <ViewportProbe onState={(state) => (observed = state)} />
      </ViewportProvider>,
    )

    expect(observed).toBe(SERVER_SNAPSHOT)
    expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
  })

  it('keeps one browser store subscription in Strict Mode and cleans it up on unmount', () => {
    installAnimationFrame(window)
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    act(() => {
      root.render(
        <StrictMode>
          <ViewportProbe onState={() => undefined} />
        </StrictMode>,
      )
    })

    expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
    expect(() => resetViewportStoreForTests(window)).toThrow()

    act(() => {
      root.unmount()
    })

    expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
    expect(() => resetViewportStoreForTests(window)).not.toThrow()
  })
})
