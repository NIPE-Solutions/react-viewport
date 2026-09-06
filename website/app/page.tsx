import Link from 'next/link'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { GeometryDemo } from '../components/GeometryDemo'

import { CodeBlock } from '../components/CodeBlock'
import { ViewportHero } from '../components/ViewportHero'
import { quickStart, modalActionBar, visibleArea } from '../content/docs'

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <ViewportHero
        composerCode={readFileSync(
          path.join(process.cwd(), 'website/components/Composer.tsx'),
          'utf8',
        )}
      />
      <section className="lab-cta site-frame" aria-labelledby="lab-cta-title">
        <div>
          <h2 id="lab-cta-title">Your phone is the proof.</h2>
          <p>
            Open the Live Device Lab, focus the input, and watch actual browser geometry respond to
            your software keyboard.
          </p>
        </div>
        <Link className="primary-action mobile-cta" href="/lab">
          Test it on this device →
        </Link>
        <Link className="desktop-cta" href="/lab">
          Open the Live Device Lab →
        </Link>
      </section>

      <section className="install-section" id="decision" aria-labelledby="install-title">
        <div className="site-frame split-section">
          <div className="section-heading">
            <h2 id="install-title">Do I need React Viewport?</h2>
            <p>
              Start with <code>100dvh</code>, <code>env(safe-area-inset-bottom)</code>, media
              queries, and container queries. Reach for JavaScript only when behavior needs the
              measured relationship between browser regions.
            </p>
            <dl className="decision-tree">
              <div>
                <dt>Need full-screen height?</dt>
                <dd>
                  <code>100dvh</code>
                </dd>
              </div>
              <div>
                <dt>Need home-indicator padding?</dt>
                <dd>
                  <code>env(safe-area-inset-bottom)</code>
                </dd>
              </div>
              <div>
                <dt>Need responsive styling?</dt>
                <dd>Media / container queries</dd>
              </div>
              <div>
                <dt>Need JavaScript to inspect visual geometry, offsets or keyboard occlusion?</dt>
                <dd>React Viewport</dd>
              </div>
            </dl>
            <p className="install-command">
              <code>npm install @nipe-solutions/react-viewport</code>
            </p>
          </div>
          <div>
            <h3>CSS can adapt layout. JavaScript sometimes needs measurements.</h3>
            <p>React Viewport is useful when JavaScript must inspect the current geometry.</p>
            <p>
              It does not move your UI automatically, manage focus, render a keyboard, replace CSS,
              or guarantee the physical keyboard rectangle.
            </p>
          </div>
        </div>
      </section>

      <section className="use-cases site-frame" aria-labelledby="use-cases-title">
        <div className="section-heading">
          <h2 id="use-cases-title">Use it where geometry changes behavior</h2>
          <p>
            React Viewport supplies measurements. Your interface decides what those measurements
            should do.
          </p>
        </div>
        <div className="use-case-list home-recipes">
          <article>
            <h3>Chat composers</h3>
            <p>Keep the input above bottom occlusion without double-counting the safe area.</p>
            <CodeBlock
              collapsible
              label="Chat composer · actual source"
              code={readFileSync(
                path.join(process.cwd(), 'website/components/Composer.tsx'),
                'utf8',
              )}
            />
          </article>
          <article>
            <h3>Modal actions</h3>
            <p>
              Keep the action row above the larger of keyboard occlusion and the safe-area bottom.
            </p>
            <CodeBlock collapsible label="Modal action bar" code={modalActionBar} />
          </article>
          <article>
            <h3>Viewport-aware panel</h3>
            <p>Know how much visible vertical space is currently available.</p>
            <CodeBlock collapsible label="Visible-area panel" code={visibleArea} />
          </article>
        </div>
        <p className="section-link">
          <Link href="/examples">See working examples</Link>
        </p>
      </section>

      <section className="site-frame home-api" aria-label="API snapshot">
        <CodeBlock label="API snapshot" code={quickStart} />
      </section>
      <section className="mental-model site-frame" aria-labelledby="mental-model-title">
        <div className="section-heading">
          <h2 id="mental-model-title">Preview the coordinate model</h2>
          <p>
            A browser can lay out one rectangle while showing only part of it. That distinction is
            the center of the API. The Concepts page explains why each region changes and lets you
            compare deterministic scenarios.
          </p>
        </div>
        <div className="concept-list">
          <article>
            <h3>Layout viewport</h3>
            <p>
              The page’s layout space: <code>window.innerWidth</code> and{' '}
              <code>window.innerHeight</code>.
            </p>
          </article>
          <article>
            <h3>Visual viewport</h3>
            <p>
              The visible region, including its layout-relative offsets, page coordinates, and zoom
              scale.
            </p>
          </article>
          <article>
            <h3>Keyboard and safe area</h3>
            <p>
              Occlusion and protected-edge measurements remain independent, so your interface can
              combine them deliberately.
            </p>
          </article>
        </div>
        <p className="section-link">
          <Link href="/concepts">Explore the concepts and simulator</Link>
        </p>
      </section>

      <section className="site-frame" aria-label="Browser height alternatives">
        <h2>Why not window.innerHeight?</h2>
        <p>
          <code>window.innerHeight</code> alone may not describe the visible mobile region under
          keyboard or browser chrome. VisualViewport adds visible dimensions and offsets; React
          Viewport exposes them in shared React state.
        </p>
        <h2>Why not 100dvh?</h2>
        <p>
          <code>100dvh</code> is often the right CSS answer. It does not give JavaScript the current
          visual viewport, offsets, keyboard state or bottom occlusion.
        </p>
        <p>
          Before trying “Shifted keyboard”: <code>visual.offsetTop</code> is the visible region’s
          top offset. Bottom occlusion is{' '}
          <code>layout.height - (visual.offsetTop + visual.height)</code>, clamped at zero.
        </p>
      </section>
      <div className="simulator-section site-frame" id="simulator">
        <h2>Geometry simulator</h2>
        <GeometryDemo
          code={readFileSync(
            path.join(process.cwd(), 'website/components/GeometryDemo.tsx'),
            'utf8',
          )}
        />
      </div>
      <section className="evidence-handoff" aria-labelledby="evidence-handoff-title">
        <div className="site-frame split-section">
          <div className="section-heading evidence-handoff__copy">
            <h2 id="evidence-handoff-title">Browser evidence has boundaries</h2>
            <p>
              <strong>Automated evidence.</strong> The current deterministic desktop matrix covers
              54 library scenarios and 93 documentation-site scenarios across Chromium, Firefox, and
              WebKit.
            </p>
            <p>
              <strong>Physical-device status.</strong> iPhone Safari and Android Chrome testing is
              still pending; automation does not turn those rows into device passes.
            </p>
          </div>
          <nav className="reference-handoff" aria-label="Evidence and reference">
            <strong>Continue with</strong>
            <Link href="/examples#css-first-title">CSS alternatives</Link>
            <Link href="/concepts#keyboard-and-safe-area">Keyboard and safe area</Link>
            <Link href="/api">API reference</Link>
            <Link href="/browser-behavior">Browser behavior</Link>
          </nav>
        </div>
      </section>
    </main>
  )
}
