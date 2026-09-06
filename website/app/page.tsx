import Link from 'next/link'

import { CodeBlock } from '../components/CodeBlock'
import { ViewportHero } from '../components/ViewportHero'
import { quickStart } from '../content/docs'

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <ViewportHero />

      <section className="install-section" id="decision" aria-labelledby="install-title">
        <div className="site-frame split-section">
          <div className="section-heading">
            <h2 id="install-title">Do I need React Viewport?</h2>
            <p>
              Start with <code>100dvh</code>, <code>env(safe-area-inset-bottom)</code>, media
              queries, and container queries. Reach for JavaScript only when behavior needs the
              measured relationship between browser regions.
            </p>
            <p className="install-command">
              <code>npm install @nipe-solutions/react-viewport</code>
            </p>
          </div>
          <CodeBlock label="Quick start" code={quickStart} />
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
        <div className="use-case-list">
          <article>
            <h3>Chat composers</h3>
            <p>Keep the input above bottom occlusion without double-counting the safe area.</p>
            <code>keyboard.height</code>
          </article>
          <article>
            <h3>Modal actions</h3>
            <p>Keep the action row inside the visual viewport while browser chrome changes.</p>
            <code>visual.height</code>
          </article>
          <article>
            <h3>Zoom-aware tools</h3>
            <p>Distinguish a shifted or scaled visible region from a smaller layout viewport.</p>
            <code>visual.scale</code>
          </article>
        </div>
        <p className="section-link">
          <Link href="/examples">See working examples</Link>
        </p>
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
    </main>
  )
}
