'use client'

import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { useViewport } from '@nipe-solutions/react-viewport'

import { getEffectiveBottomInset } from '../lib/layout-policy'

const simulatedKeyboardHeight = 176

export function ViewportHero() {
  const { ready, layout, visual, keyboard, safeArea } = useViewport()
  const [isKeyboardSimulated, setIsKeyboardSimulated] = useState(false)
  const illustratedKeyboardHeight = isKeyboardSimulated ? simulatedKeyboardHeight : keyboard.height
  const effectiveBottomInset = getEffectiveBottomInset(illustratedKeyboardHeight, safeArea.bottom)
  const summary =
    ready && layout !== null && visual !== null
      ? `Layout viewport ${formatSize(layout.width, layout.height)}. Visual viewport ${formatSize(visual.width, visual.height)} at offset ${formatPair(visual.offsetLeft, visual.offsetTop)}. Keyboard occlusion ${formatPixels(keyboard.height)}. Safe bottom ${formatPixels(safeArea.bottom)}.`
      : 'Layout viewport and Visual viewport measurements are pending.'
  const stageStyle = {
    '--hero-effective-inset': `${effectiveBottomInset}px`,
    '--hero-keyboard-height': `${illustratedKeyboardHeight}px`,
    '--hero-safe-bottom': `${safeArea.bottom}px`,
  } as CSSProperties

  return (
    <section className="viewport-hero" aria-labelledby="hero-title">
      <div className="site-frame viewport-hero__layout">
        <div className="viewport-hero__copy">
          <h1 id="hero-title">Know what part of the screen is actually usable.</h1>
          <p className="viewport-hero__introduction">
            Keep a composer above the soft keyboard and protected screen edges with measured, typed
            browser geometry.
          </p>
          <div className="viewport-hero__actions">
            <a className="primary-action" href="#decision">
              Decide if you need it
            </a>
            <Link href="/concepts#simulator">Explore the geometry</Link>
          </div>
          <pre className="viewport-hero__code" aria-label="Minimal useViewport example">
            <code>{`const { visual, keyboard, safeArea } = useViewport()
const bottomInset = Math.max(keyboard.height, safeArea.bottom)`}</code>
          </pre>
        </div>

        <div className="viewport-hero__proof">
          <header className="viewport-hero__live-header">
            <div>
              <strong>Live browser</strong>
              <span>Measured by useViewport()</span>
            </div>
            <output
              className="viewport-hero__summary"
              data-testid="hero-live-summary"
              aria-label={summary}
              aria-live="polite"
            >
              {ready ? 'Current snapshot' : 'Measuring…'}
            </output>
          </header>

          <dl className="viewport-hero__readout">
            <ViewportValue label="Visual height" value={formatNullablePixels(visual?.height)} />
            <ViewportValue label="Keyboard occlusion" value={formatPixels(keyboard.height)} />
            <ViewportValue label="Safe bottom" value={formatPixels(safeArea.bottom)} />
          </dl>

          <div className="viewport-hero__stage" style={stageStyle}>
            <div className="viewport-hero__thread" aria-hidden="true">
              <div className="viewport-hero__thread-header">
                <span className="viewport-hero__avatar">M</span>
                <span>
                  <strong>Message Maya</strong>
                  <small>Planning the weekend</small>
                </span>
              </div>
              <p>Train gets in at 18:40. Dinner after?</p>
              <p className="viewport-hero__reply">Perfect. I’ll book a table.</p>
            </div>

            <form className="viewport-hero__composer" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="hero-message">Message</label>
              <div>
                <input id="hero-message" name="message" placeholder="Write a message" />
                <button type="submit">Send</button>
              </div>
            </form>

            <div className="viewport-hero__safe-area" aria-hidden="true" />
            {isKeyboardSimulated ? (
              <div className="viewport-hero__keyboard" aria-hidden="true" />
            ) : null}
          </div>

          <div className="viewport-hero__simulation">
            <output aria-live="polite">
              {isKeyboardSimulated ? 'Simulated keyboard' : 'Live bottom constraints'}
            </output>
            <button
              type="button"
              aria-pressed={isKeyboardSimulated}
              onClick={() => setIsKeyboardSimulated((current) => !current)}
            >
              Simulate keyboard
            </button>
          </div>
          <p className="viewport-hero__simulation-note">
            The control changes only this illustration. Live browser values stay measured.
          </p>
        </div>
      </div>
    </section>
  )
}

function ViewportValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd data-live-viewport-value>{value}</dd>
    </div>
  )
}

function formatNullablePixels(value: number | undefined): string {
  return value === undefined ? 'Pending' : formatPixels(value)
}

function formatPixels(value: number): string {
  return `${round(value)} px`
}

function formatSize(width: number, height: number): string {
  return `${round(width)} by ${round(height)} pixels`
}

function formatPair(horizontal: number, vertical: number): string {
  return `${round(horizontal)}, ${round(vertical)}`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
