import { ViewportProvider, useViewport } from '@nipe-solutions/react-viewport'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.querySelector('#root')
const iframe = document.querySelector<HTMLIFrameElement>('#scope')

if (container === null || iframe === null || iframe.contentWindow === null) {
  throw new Error('Window scope fixture is missing its browsing context')
}

const scope = iframe
const targetWindow = iframe.contentWindow
const root = createRoot(container)
let previousDocument: Document | null = null

function Probe() {
  const state = useViewport()
  return <output data-testid="viewport-state">{JSON.stringify(state)}</output>
}

function renderScope() {
  flushSync(() => {
    root.render(
      <ViewportProvider targetWindow={targetWindow}>
        <Probe />
      </ViewportProvider>,
    )
  })
}

const controls = {
  async navigate() {
    flushSync(() => root.render(null))
    previousDocument = targetWindow.document
    await new Promise<void>((resolve) => {
      scope.addEventListener('load', () => resolve(), { once: true })
      scope.srcdoc = '<p>Replacement same-origin document</p>'
    })
    renderScope()
    return {
      sameWindow: targetWindow === scope.contentWindow,
      sameDocument: previousDocument === targetWindow.document,
    }
  },
  diagnostics() {
    return {
      currentDocumentProbes: targetWindow.document.querySelectorAll('[aria-hidden="true"]').length,
      previousDocumentProbes:
        previousDocument?.querySelectorAll('[aria-hidden="true"]').length ?? 0,
    }
  },
  geometry() {
    const visual = targetWindow.visualViewport
    return {
      layout: { width: targetWindow.innerWidth, height: targetWindow.innerHeight },
      visual:
        visual === null
          ? { width: targetWindow.innerWidth, height: targetWindow.innerHeight }
          : { width: visual.width, height: visual.height },
    }
  },
}

declare global {
  interface Window {
    __windowScopeFixture: typeof controls
  }
}

window.__windowScopeFixture = controls
renderScope()
