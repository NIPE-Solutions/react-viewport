'use client'

import { useState, type CSSProperties } from 'react'
import { useViewport } from '@nipe-solutions/react-viewport'

import { CodeBlock } from './CodeBlock'
import { Composer } from './Composer'

export function DeviceLab({
  code,
  composerCode,
  build,
}: {
  readonly code: string
  readonly composerCode: string
  readonly build: string
}) {
  const viewport = useViewport()
  const { ready, layout, visual, keyboard, safeArea, orientation, supported } = viewport
  const [showGeometry, setShowGeometry] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const effectiveBottom = Math.max(keyboard.height, safeArea.bottom)
  const pixels = (value: number | undefined) =>
    value === undefined || !ready ? 'Pending' : `${Math.round(value * 10) / 10} px`
  const dimensions = (value: { width: number; height: number } | null) =>
    value ? `${Math.round(value.width)} × ${Math.round(value.height)}` : 'Pending'
  const style = { '--lab-bottom': `${effectiveBottom}px` } as CSSProperties

  async function copyDiagnostics() {
    // Explicit allowlist. No field values, user agent, identifiers or network requests.
    const diagnostics = {
      build,
      viewport: {
        ready,
        layout,
        visual,
        keyboard,
        safeArea,
      },
      supported,
      orientation,
      effectiveBottom,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
      setCopyStatus('Diagnostics copied. No message text included.')
    } catch {
      setCopyStatus('Clipboard unavailable. Record the visible geometry below.')
      setShowGeometry(true)
    }
  }

  return (
    <div className="device-lab" style={style}>
      <header className="lab-intro">
        <div className="lab-title-row">
          <h1>Live Device Lab</h1>
          <span className="mode-badge" data-testid="lab-live">
            {ready ? 'LIVE' : 'Measuring…'}
          </span>
        </div>
        <p>
          Test React Viewport against your actual browser, software keyboard and screen geometry.
        </p>
        <ol className="lab-instructions">
          <li>Tap the input.</li>
          <li>Let the software keyboard open.</li>
          <li>Scroll while it is open.</li>
          <li>Rotate the device if available.</li>
          <li>Close the keyboard.</li>
        </ol>
        <p className="lab-expected">
          <strong>Expected behavior (check yourself):</strong> composer stays visible; geometry
          changes on open and returns on close.
        </p>
        <div className="lab-controls">
          <button
            type="button"
            aria-expanded={showGeometry}
            aria-controls="lab-geometry"
            onClick={() => setShowGeometry(!showGeometry)}
          >
            {showGeometry ? 'Hide geometry' : 'Show geometry'}
          </button>
          <button type="button" onClick={copyDiagnostics} disabled={!ready}>
            Copy diagnostics
          </button>
        </div>
        <p role="status" className="copy-status">
          {copyStatus}
        </p>
      </header>
      {showGeometry && (
        <section
          id="lab-geometry"
          data-testid="lab-geometry"
          className="lab-geometry"
          aria-label="Live geometry"
        >
          <h2>Live geometry</h2>
          <dl>
            {[
              ['Layout viewport', dimensions(layout)],
              ['Visual viewport', dimensions(visual)],
              ['visual.offsetTop', pixels(visual?.offsetTop)],
              ['visual.offsetLeft', pixels(visual?.offsetLeft)],
              ['visual.pageTop', pixels(visual?.pageTop)],
              ['visual.scale', ready ? String(visual?.scale ?? 'Pending') : 'Pending'],
              ['keyboard.open', ready ? String(keyboard.open) : 'Pending'],
              ['keyboard.height', pixels(keyboard.height)],
              ['safeArea.bottom', pixels(safeArea.bottom)],
              ['effectiveBottom', pixels(effectiveBottom)],
              ['Orientation', orientation ?? 'Pending'],
              ['VisualViewport API', ready ? String(supported.visualViewport) : 'Pending'],
              ['VirtualKeyboard API', ready ? String(supported.virtualKeyboard) : 'Pending'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            <code>effectiveBottom = max(keyboard.height, safeArea.bottom)</code>
          </p>
          <p>
            Raw geometry → application policy. API availability does not identify the active
            keyboard source.
          </p>
          <p className="overlay-legend">
            Blue: layout · dashed blue: visual · coral: effective bottom · cyan: safe area
          </p>
        </section>
      )}
      <section className="lab-thread" aria-label="Test conversation">
        <p className="lab-message">
          This is a real page. The composer below is fixed to the viewport.
        </p>
        <p className="lab-message lab-message--reply">
          Open the keyboard, then scroll this conversation. The geometry should follow your browser.
        </p>
        <p className="lab-message">
          Try rotating the device. Close the keyboard and check that the bottom inset returns.
        </p>
        <p className="lab-message lab-message--reply">
          Messages stay on your device. Send clears the field; nothing is sent or saved.
        </p>
      </section>
      <section className="lab-help">
        <h2>Why did the demo not move?</h2>
        <p>
          <strong>Keyboard closed while a real keyboard is open?</strong> It may be a browser
          limitation or inference bug. Copy the geometry before, during and after opening. A browser
          that resizes both viewports may need no bottom inset.
        </p>
        <p>
          <strong>Keyboard open, non-zero occlusion, but composer covered?</strong> That points to
          example positioning. Record the geometry and scroll/orientation steps.
        </p>
        <p>
          <strong>Safe area still non-zero?</strong> WebKit can retain it while the keyboard is
          open. Using max() avoids counting the same bottom edge twice.
        </p>
        <p>
          Keyboard state is native where usable and otherwise conservatively inferred. Floating,
          split and hardware keyboards may produce no bottom occlusion. Pinch zoom can leave a
          layout-width composer wider than the visual viewport; the panel exposes that distinction.
        </p>
        <CodeBlock collapsible label="DeviceLab.tsx · actual source" code={code} />
        <CodeBlock collapsible label="Composer.tsx · actual source" code={composerCode} />
      </section>
      {showGeometry && ready && layout && visual && (
        <div className="lab-overlays" aria-hidden="true">
          <div
            className="lab-layout-outline"
            style={{ width: layout.width, height: layout.height }}
          />
          <div
            className="lab-visual-outline"
            style={{
              top: visual.offsetTop,
              left: visual.offsetLeft,
              width: visual.width,
              height: visual.height,
            }}
          />
          <div className="lab-effective-overlay" style={{ height: effectiveBottom }} />
          <div className="lab-safe-overlay" style={{ height: safeArea.bottom }} />
        </div>
      )}
      <Composer
        keyboardHeight={keyboard.height}
        safeAreaBottom={safeArea.bottom}
        testId="lab-composer"
      />
    </div>
  )
}
