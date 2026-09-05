import { useRef, type ReactElement } from 'react'
import { renderToString } from 'react-dom/server'

import {
  ViewportProvider,
  useViewport,
  useViewportCssVariables,
  type ViewportState,
} from '@nipe-solutions/react-viewport'

function Consumer(): ReactElement {
  const target = useRef<HTMLOutputElement | null>(null)
  const state: ViewportState = useViewport()
  useViewportCssVariables({ target })

  return <output ref={target}>{state.ready ? state.layout?.width : 'pending'}</output>
}

const html: string = renderToString(
  <ViewportProvider targetWindow={null}>
    <Consumer />
  </ViewportProvider>,
)

void html
