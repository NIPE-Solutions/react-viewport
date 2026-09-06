'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useViewport } from '@nipe-solutions/react-viewport'

import { CodeBlock } from './CodeBlock'
import { Composer, getComposerAnchor } from './Composer'

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
  const [pageScroll, setPageScroll] = useState(false)
  const effectiveBottom = Math.max(keyboard.height, safeArea.bottom)
  const pixels = (value: number | undefined) =>
    value === undefined || !ready ? 'Pending' : `${Math.round(value * 10) / 10} px`
  const dimensions = (value: { width: number; height: number } | null) =>
    value ? `${Math.round(value.width)} × ${Math.round(value.height)}` : 'Pending'
  const composerAnchorBottom =
    layout && visual ? getComposerAnchor(layout, visual, keyboard.height, safeArea.bottom) : null
  const style = {
    '--lab-bottom': `${effectiveBottom}px`,
    '--lab-top': `${visual?.offsetTop ?? 0}px`,
    '--lab-left': `${visual?.offsetLeft ?? 0}px`,
    '--lab-width': visual ? `${visual.width}px` : '100%',
    '--lab-height':
      visual && composerAnchorBottom !== null
        ? `${Math.max(0, composerAnchorBottom - visual.offsetTop)}px`
        : '100dvh',
  } as CSSProperties

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
      composerAnchorBottom,
      scrollMode: pageScroll ? 'page' : 'contained',
      requestedKeyboardPolicy: 'resizes-content',
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
    <div className="device-lab" data-page-scroll={pageScroll} style={style}>
      <div className="lab-scroll" role="region" aria-label="Scrollable lab content" tabIndex={0}>
        <div className="lab-content">
          <Link className="lab-home" href="/">
            ← React Viewport
          </Link>
          <header className="lab-intro">
            <div className="lab-title-row">
              <h1>Live Device Lab</h1>
              <span className="mode-badge" data-testid="lab-live">
                {ready ? 'LIVE' : 'Measuring…'}
              </span>
            </div>
            <p>
              Test React Viewport against your actual browser, software keyboard and screen
              geometry.
            </p>
            <p className="lab-policy">
              Browser policy: <code>interactive-widget=resizes-content</code>.{' '}
              <strong>Requested, not detected.</strong> Browsers that honor it resize the layout;
              this page uses measured geometry as a fallback. iOS may ignore the request.
            </p>
            <p>
              <a href="/lab/css">Compare the browser + CSS baseline →</a>
            </p>
            <ol className="lab-instructions">
              <li>Tap the input.</li>
              <li>Let the software keyboard open.</li>
              <li>Scroll this content while it is open.</li>
              <li>Rotate the device if available.</li>
              <li>Close the keyboard.</li>
            </ol>
            <p className="lab-expected">
              <strong>Expected behavior (check yourself):</strong> composer stays visible; viewport
              geometry changes on open and returns on close. If both viewports shrink together,
              keyboard occlusion can stay zero—the browser has already made room.
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
            <label className="lab-scroll-mode">
              <input
                type="checkbox"
                checked={pageScroll}
                onChange={(event) => setPageScroll(event.target.checked)}
              />
              Page-scroll stress test
            </label>
            <p className="lab-scroll-note">
              {pageScroll
                ? 'Whole-page scrolling is enabled for browser-chrome and overscroll QA. Some browsers delay viewport updates during a fling.'
                : 'Docked layout: content scrolls independently so long swipes do not pull the composer away from the keyboard.'}
            </p>
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
                  ['Composer anchor (layout Y)', pixels(composerAnchorBottom ?? undefined)],
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
                Raw geometry → application policy. The composer follows the visual bottom and
                applies keyboard/safe-area constraints without counting overlapping space twice. API
                availability does not identify the active keyboard source.
              </p>
              <p className="overlay-legend">
                Blue: layout · dashed blue: visual · coral: effective bottom · cyan: safe area
              </p>
            </section>
          )}
          <section className="lab-thread" aria-label="Test conversation">
            <p className="lab-message">
              The composer is fixed to the visible browser area. Scroll the content while typing.
            </p>
            <p className="lab-message lab-message--reply">
              Open the keyboard, then scroll this conversation. The geometry should follow your
              browser.
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
              limitation or inference bug. Copy the geometry before, during and after opening. A
              browser that resizes both viewports may need no bottom inset.
            </p>
            <p>
              <strong>Keyboard open, non-zero occlusion, but composer covered?</strong> That points
              to example positioning. Record the geometry and scroll/orientation steps, including
              the composer anchor.
            </p>
            <p>
              <strong>Safe area still non-zero?</strong> WebKit can retain it while the keyboard is
              open. The layout subtracts the overlap with visual occlusion before applying safe-area
              padding.
            </p>
            <p>
              Keyboard state is native where usable and otherwise conservatively inferred. Floating,
              split and hardware keyboards may produce no bottom occlusion. The composer also
              follows visual viewport size and offsets, even when keyboard inference is closed. In
              page-scroll stress mode, browser-delayed geometry can still cause movement during a
              fling.
            </p>
            <CodeBlock collapsible label="DeviceLab.tsx · actual source" code={code} />
            <CodeBlock collapsible label="Composer.tsx · actual source" code={composerCode} />
          </section>
        </div>
      </div>
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
        layout={layout}
        visual={visual}
        testId="lab-composer"
      />
    </div>
  )
}
