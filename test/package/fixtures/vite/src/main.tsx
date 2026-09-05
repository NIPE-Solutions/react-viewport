import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ViewportProvider,
  useViewport,
  useViewportCssVariables,
  type ViewportState,
} from '@nipe-solutions/react-viewport'

function Summary() {
  const viewport: ViewportState = useViewport()
  useViewportCssVariables()

  return <output>{viewport.ready ? viewport.orientation : 'pending'}</output>
}

const root = document.querySelector('#root')

if (root === null) {
  throw new Error('Missing root element')
}

createRoot(root).render(
  <StrictMode>
    <ViewportProvider>
      <Summary />
    </ViewportProvider>
  </StrictMode>,
)
