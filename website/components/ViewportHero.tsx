'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CodeBlock } from './CodeBlock'
import { Composer } from './Composer'

export function ViewportHero({ composerCode }: { readonly composerCode: string }) {
  const [open, setOpen] = useState(true)
  const keyboardHeight = open ? 156 : 0

  return (
    <section className="viewport-hero" aria-labelledby="hero-title">
      <div className="site-frame">
        <div className="hero-intro">
          <div>
            <h1 id="hero-title">Keep mobile UI above the software keyboard.</h1>
            <p className="viewport-hero__introduction">
              Read the visible viewport, keyboard occlusion and safe-area geometry from one shared
              React state when CSS alone is not enough.
            </p>
            <div className="viewport-hero__actions">
              <a className="primary-action desktop-cta" href="#comparison">
                Try the simulation
              </a>
              <Link className="primary-action mobile-cta" href="/lab">
                Test the real keyboard
              </Link>
              <a href="#decision">Do I need this?</a>
            </div>
          </div>
          <div className="hero-api">
            <p>Know what part of the screen is actually usable.</p>
            <pre className="viewport-hero__code" aria-label="Minimal useViewport example">
              <code>{`const { visual, keyboard, safeArea } = useViewport()
const bottomInset = Math.max(
  keyboard.height, safeArea.bottom
)`}</code>
            </pre>
            <p>
              React Viewport measures the browser. Your application decides what to do with the
              measurements.
            </p>
          </div>
        </div>
        <section id="comparison" className="comparison" aria-labelledby="comparison-title">
          <header className="comparison-heading">
            <div>
              <span className="mode-badge">SIMULATION</span>
              <h2 id="comparison-title">Same composer. Different geometry input.</h2>
            </div>
            <button type="button" aria-pressed={open} onClick={() => setOpen(!open)}>
              {open ? 'Close simulated keyboard' : 'Open simulated keyboard'}
            </button>
          </header>
          <div className="comparison-pair">
            {[false, true].map((aware) => (
              <article
                key={String(aware)}
                className="comparison-example"
                aria-label={aware ? 'With React Viewport' : 'Without React Viewport'}
              >
                <h3>{aware ? 'With React Viewport' : 'Without React Viewport'}</h3>
                <div className="comparison-stage">
                  <div className="comparison-messages" aria-hidden="true">
                    <p>Train gets in at 18:40. Dinner after?</p>
                    <p>Perfect. I’ll book a table.</p>
                  </div>
                  <div inert={open && !aware}>
                    <Composer
                      keyboardHeight={keyboardHeight}
                      safeAreaBottom={12}
                      aware={aware}
                      position="absolute"
                      testId={aware ? 'aware-composer' : 'unaware-composer'}
                    />
                  </div>
                  {open && (
                    <div
                      className="comparison-keyboard"
                      data-simulated-keyboard
                      style={{ height: keyboardHeight }}
                    >
                      <span>Simulated keyboard</span>
                      <div aria-hidden="true">
                        Q W E R T Y U I O P<br />A S D F G H J K L<br />Z X C V B N M
                      </div>
                    </div>
                  )}
                </div>
                <p className="comparison-outcome">
                  {open
                    ? aware
                      ? 'The measured inset keeps controls above occlusion.'
                      : 'A fixed bottom offset leaves controls behind the keyboard.'
                    : 'Keyboard closed. Both composers sit at the bottom.'}
                </p>
                <code>
                  {aware
                    ? 'bottom: max(keyboard, safeArea) + 1rem'
                    : 'position: fixed; bottom: 1rem'}
                </code>
              </article>
            ))}
          </div>
          <p className="simulation-note">
            Illustrated geometry, not your OS keyboard. The same form is anchored inside each frame
            here; in the Device Lab it is fixed to your actual viewport.
          </p>
          <CodeBlock collapsible label="Shared composer · actual source" code={composerCode} />
        </section>
      </div>
    </section>
  )
}
