'use client'

import { ViewportProvider, useViewport } from '@nipe-solutions/react-viewport'

export function ViewportState() {
  return (
    <ViewportProvider>
      <ViewportSummary />
    </ViewportProvider>
  )
}

function ViewportSummary() {
  const viewport = useViewport()

  return <output>{viewport.ready ? viewport.orientation : 'pending'}</output>
}
