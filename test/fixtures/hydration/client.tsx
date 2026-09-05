import { useEffect } from 'react'
import { hydrateRoot } from 'react-dom/client'

import { useViewport } from '@nipe-solutions/react-viewport'

function App() {
  const state = useViewport()

  useEffect(() => {
    const container = document.querySelector('#root')

    if (container instanceof HTMLElement) {
      container.dataset.hydrated = 'true'
    }
  }, [])

  return (
    <main>
      <h1>Hydration fixture</h1>
      <output data-testid="hydration-state">{JSON.stringify(state)}</output>
    </main>
  )
}

const container = document.querySelector('#root')

if (container === null) {
  throw new Error('Hydration fixture root is missing')
}

hydrateRoot(container, <App />)
