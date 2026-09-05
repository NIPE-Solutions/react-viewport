'use client'

import { useRef } from 'react'

import { useViewportCssVariables } from '@nipe-solutions/react-viewport'

export function ComposerDemo() {
  const demoRef = useRef<HTMLElement>(null)
  useViewportCssVariables({ target: demoRef })

  return (
    <section
      ref={demoRef}
      className="composer-demo"
      data-testid="composer-demo"
      aria-labelledby="composer-demo-heading"
    >
      <div className="composer-demo__copy">
        <h2 id="composer-demo-heading">CSS-variable composer</h2>
        <p>
          This real input stays above measured keyboard occlusion and the safe-area inset. The
          library changes variables; CSS performs the positioning.
        </p>
      </div>
      <div className="composer-stage">
        <div className="composer-stage__content" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <form
          className="composer-shell"
          data-testid="composer-shell"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="composer-message">Message</label>
          <div>
            <input id="composer-message" name="message" placeholder="Type a message" />
            <button type="submit">Send</button>
          </div>
        </form>
      </div>
    </section>
  )
}
