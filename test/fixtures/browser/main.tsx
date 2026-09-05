import { useViewport, useViewportCssVariables } from '@nipe-solutions/react-viewport'
import { createRoot } from 'react-dom/client'

import { installBrowserFixture } from './mock-browser-apis.js'

const search = new URLSearchParams(window.location.search)
const visualViewport = search.get('visual')
const fixture = installBrowserFixture({
  mockLayout: search.get('layout') === 'mock',
  visualViewport:
    visualViewport === 'mock' || visualViewport === 'absent' ? visualViewport : 'native',
  virtualKeyboard: search.get('keyboard') === 'mock' ? 'mock' : 'absent',
})
const container = document.querySelector('#root')

if (container === null) {
  throw new Error('Browser fixture root is missing')
}

function App() {
  const state = useViewport()
  useViewportCssVariables()
  fixture.recordRender()

  return (
    <main>
      <label htmlFor="editable-control">Editable control</label>
      <input id="editable-control" type="text" />
      <output data-testid="viewport-state">{JSON.stringify(state)}</output>
    </main>
  )
}

const root = createRoot(container)
fixture.registerUnmount(() => root.unmount())
root.render(<App />)
