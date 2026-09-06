import Link from 'next/link'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { GeometryDemo } from '../components/GeometryDemo'
import { CodeBlock } from '../components/CodeBlock'
import { ViewportHero } from '../components/ViewportHero'
import { ProductBoundary } from '../components/ProductBoundary'
import { ResultBudget } from '../components/ResultBudget'
import { quickStart } from '../content/docs'

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <ViewportHero />
      <ProductBoundary />
      <section className="use-cases site-frame" aria-labelledby="use-cases-title">
        <h2 id="use-cases-title">When application logic needs geometry</h2>
        <div className="use-case-list home-recipes">
          {[
            [
              'Rendering decisions',
              'Adapt the optional content React renders to the visible region. A virtualizer or custom rendering engine needs a numeric height.',
              '/examples#result-budget',
            ],
            [
              'Coordinate visibility',
              'Test whether editor, canvas or annotation coordinates intersect the visual viewport.',
              '/examples#coordinate-visibility',
            ],
            [
              'Zoom-aware tools',
              'Convert optional tool tolerances for coordinate-sensitive hit testing as visual scale changes.',
              '/examples#zoom-aware',
            ],
            [
              'Keyboard-aware algorithms',
              'Recompute selection visibility or scroll correction when the visible region changes.',
              '/examples#coordinate-visibility',
            ],
            [
              'Safe areas in JavaScript',
              'Use protected-edge measurements in custom drawing calculations, after mapping coordinate systems.',
              '/examples#zoom-aware',
            ],
          ].map(([title, copy, href]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link href={href!}>Explore the application example →</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="site-frame home-api" aria-label="Live application decision">
        <h2>Geometry in. Rendering decision out.</h2>
        <p>This live example changes which results React creates. CSS owns their layout.</p>
        <ResultBudget />
        <CodeBlock
          collapsible
          label="ResultBudget.tsx · actual source"
          code={readFileSync(
            path.join(process.cwd(), 'website/components/ResultBudget.tsx'),
            'utf8',
          )}
        />
        <p>
          <Link href="/lab">Open the Live Geometry Lab →</Link> Focus an input, scroll, rotate or
          zoom to observe real browser changes.
        </p>
      </section>
      <section className="lab-cta site-frame" aria-labelledby="css-baseline-title">
        <div>
          <h2 id="css-baseline-title">Start with CSS.</h2>
          <p>
            This composer requires no React Viewport. Browser-native layout is the recommended
            approach when it meets your requirements. If it solves your problem, stop here.
          </p>
        </div>
        <a href="/lab/css" className="primary-action">
          Open CSS Baseline →
        </a>
      </section>
      <section className="site-frame home-api" aria-label="API snapshot">
        <h2>One reactive snapshot</h2>
        <p>
          One browser store per Window → shared subscription → useSyncExternalStore → consistent
          React snapshots.
        </p>
        <p className="install-command">
          <code>npm install @nipe-solutions/react-viewport</code>
        </p>
        <CodeBlock label="API snapshot" code={quickStart} />
        <Link href="/api">API reference →</Link>
      </section>
      <section className="mental-model site-frame" aria-labelledby="mental-model-title">
        <h2 id="mental-model-title">Preview the coordinate model</h2>
        <div className="concept-list">
          <article>
            <h3>Layout viewport</h3>
            <p>The layout reference: window.innerWidth and window.innerHeight.</p>
          </article>
          <article>
            <h3>Visual viewport</h3>
            <p>
              The visible region, with layout-relative offsets, document-relative page coordinates
              and zoom scale.
            </p>
          </article>
          <article>
            <h3>Keyboard and safe area</h3>
            <p>
              Raw bottom occlusion and protected-edge measurements. Application policy decides
              whether and how to combine them.
            </p>
          </article>
        </div>
        <p>
          <Link href="/concepts">Explore the concepts and simulator</Link>
        </p>
        <p>
          Before “Shifted keyboard”: visual.offsetTop moves the visible region. Bottom occlusion is{' '}
          <code>Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))</code>. Shrinkage alone
          is not proof of a keyboard.
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
              <strong>Automated evidence.</strong> Deterministic Chromium, Firefox and WebKit tests
              cover package geometry and website behavior.
            </p>
            <p>
              <strong>Physical-device status.</strong> iPhone Safari and Android Chrome geometry
              testing remains pending. Automation is not physical keyboard or pinch-zoom
              verification.
            </p>
          </div>
          <nav className="reference-handoff" aria-label="Evidence and reference">
            <strong>Continue with</strong>
            <Link href="/lab/css">CSS alternatives</Link>
            <Link href="/concepts#keyboard-and-safe-area">Keyboard and safe area</Link>
            <Link href="/api">API reference</Link>
            <Link href="/browser-behavior">Browser behavior</Link>
          </nav>
        </div>
      </section>
    </main>
  )
}
