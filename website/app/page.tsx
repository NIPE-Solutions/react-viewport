import Link from 'next/link'

import { CodeBlock } from '../components/CodeBlock'
import { GeometryDemo } from '../components/GeometryDemo'
import { quickStart, site } from '../content/docs'

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="hero site-frame" aria-labelledby="hero-title">
        <div className="hero__copy">
          <h1 id="hero-title">Viewport geometry you can reason about.</h1>
          <p className="hero__introduction">
            Read the layout viewport, visual viewport, keyboard occlusion, and safe area as one
            typed React state—without pretending they are one rectangle.
          </p>
          <div className="hero__actions">
            <a className="primary-action" href="#install">
              Start with the API
            </a>
            <a href={site.repository} rel="noreferrer">
              View source on GitHub
            </a>
          </div>
          <dl className="hero__facts">
            <div>
              <dt>Runtime dependencies</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>Server import</dt>
              <dd>Safe</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Alpha</dd>
            </div>
          </dl>
        </div>
        <div className="hero__demo">
          <GeometryDemo />
        </div>
      </section>

      <section className="install-section" id="install" aria-labelledby="install-title">
        <div className="site-frame split-section">
          <div className="section-heading">
            <h2 id="install-title">Measure only when CSS stops being enough</h2>
            <p>
              Use dynamic viewport units and environment insets first. Reach for JavaScript when
              interface behavior needs measured geometry.
            </p>
            <p className="install-command">
              <code>npm install @nipe-solutions/react-viewport</code>
            </p>
          </div>
          <CodeBlock label="Quick start" code={quickStart} />
        </div>
      </section>

      <section className="mental-model site-frame" aria-labelledby="mental-model-title">
        <div className="section-heading">
          <h2 id="mental-model-title">Keep the coordinate systems separate</h2>
          <p>
            A browser can lay out one rectangle while showing only part of it. That distinction is
            the center of the API, not an implementation detail.
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
          <Link href="/browser-behavior">Read the evidence and browser limits</Link>
        </p>
      </section>
    </main>
  )
}
