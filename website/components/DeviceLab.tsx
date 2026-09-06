'use client'

import { InteractionHint } from './InteractionHint'
import { useState } from 'react'
import Link from 'next/link'
import { useViewport } from '@nipe-solutions/react-viewport'
import { CodeBlock } from './CodeBlock'
import { LiveGeometry } from './LiveGeometry'
import { ResultBudget } from './ResultBudget'
import { CoordinateVisibility } from './CoordinateVisibility'
import { ZoomLogic } from './ZoomLogic'

export function DeviceLab({
  sources,
  build,
}: {
  readonly sources: ReadonlyArray<{ label: string; code: string }>
  readonly build: string
}) {
  const viewport = useViewport()
  const { ready, layout, visual, keyboard, safeArea, orientation, supported } = viewport
  const [showBounds, setShowBounds] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  async function copyDiagnostics() {
    // Geometry allowlist only. No input text, user agent, identifiers or network request.
    const diagnostics = {
      build,
      viewport: { ready, layout, visual, keyboard, safeArea },
      orientation,
      supported,
      requestedKeyboardPolicy: 'resizes-content',
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
      setCopyStatus('Diagnostics copied. No input text included.')
    } catch {
      setCopyStatus('Clipboard unavailable. Record the visible geometry below.')
    }
  }
  return (
    <div className="geometry-lab lab-content">
      <Link className="lab-home" href="/">
        ← React Viewport
      </Link>
      <header className="lab-intro">
        <h1>Live Geometry Lab</h1>
        <p>
          This lab is not trying to beat CSS layout. It shows the browser geometry React Viewport
          exposes to application logic.
        </p>
        <p>
          <a href="/lab/css">Looking for keyboard-safe layout? See the CSS baseline →</a>
        </p>
        <ol className="lab-instructions">
          <li>Focus the input and open the software keyboard.</li>
          <li>Watch geometry and the result budget. Scroll to change browser chrome.</li>
          <li>Place a target, then scroll, rotate or pinch zoom where supported.</li>
          <li>Close the keyboard and compare values.</li>
        </ol>
        <p className="lab-policy">
          Browser policy: <code>interactive-widget=resizes-content</code>.{' '}
          <strong>Requested, not detected.</strong> When both viewports shrink, keyboard bottom
          occlusion can stay zero. iOS may ignore the request.
        </p>
      </header>
      <InteractionHint />
      <div className="lab-controls">
        <button type="button" onClick={copyDiagnostics} disabled={!ready}>
          Copy diagnostics
        </button>
        <button type="button" aria-pressed={showBounds} onClick={() => setShowBounds(!showBounds)}>
          Outline visual bounds
        </button>
      </div>
      <p role="status">{copyStatus}</p>
      <div className="geometry-lab-grid">
        <div>
          <h2>What does this browser expose?</h2>
          <LiveGeometry />
        </div>
        <div>
          <h2>Application decision</h2>
          <form className="geometry-input" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="geometry-keyboard-input">Open your software keyboard</label>
            <input
              id="geometry-keyboard-input"
              placeholder="Type to change browser geometry…"
              autoComplete="off"
            />
            <p>Normal CSS layout. Typed text is never sent, saved or included in diagnostics.</p>
          </form>
          <ResultBudget />
          <p>
            CSS can resize a container. This JavaScript decision changes which optional results
            React creates. The constants are application policy, not library defaults.
          </p>
        </div>
      </div>
      <h2>Is this point actually visible?</h2>
      <CoordinateVisibility />
      <h2>Zoom-aware application logic</h2>
      <ZoomLogic />
      <section className="lab-help">
        <h2>Reading unexpected results</h2>
        <p>
          Compare visual dimensions, offsets and scale before interpreting keyboard state. Browser
          chrome and zoom can change geometry without an open keyboard. Keyboard state is native
          where usable and otherwise conservatively inferred.
        </p>
        <p>
          A real keyboard with zero bottom occlusion can reflect native layout resizing, a floating
          or split keyboard, or conservative inference. Capture before/during/after geometry to
          investigate. Safe-area values may remain non-zero on WebKit.
        </p>
        <p>
          Browser updates can lag during fast scrolling. No layout workaround here changes the raw
          values or claims to fix that platform behavior. Physical iPhone Safari and Android Chrome
          geometry QA remains pending.
        </p>
        <p>
          Expected: dimensions and offsets follow browser changes; result count follows visible
          height; target intersection follows the selected document coordinates. These are manual
          checks, not automatic pass badges.
        </p>
      </section>
      {sources.map((source) => (
        <CodeBlock key={source.label} collapsible label={source.label} code={source.code} />
      ))}
      {showBounds && ready && visual && (
        <div
          className="geometry-visual-outline"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: visual.pageLeft,
            top: visual.pageTop,
            width: visual.width,
            height: visual.height,
          }}
        />
      )}
    </div>
  )
}
