import type { Metadata } from 'next'

import { CodeBlock } from '../../components/CodeBlock'
import { apiReference, cssVariables, typeReference } from '../../content/docs'

export const metadata: Metadata = {
  title: 'API reference',
  description: 'Public hooks, provider, types, and CSS variables.',
  alternates: { canonical: '/api' },
}

export default function ApiPage() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main">
      <header className="docs-hero site-frame">
        <h1>API reference</h1>
        <p>
          Three runtime exports and a small set of readonly types. Normal use needs no provider.
        </p>
      </header>
      <div className="site-frame docs-layout">
        <nav className="page-index" aria-label="On this page">
          <strong>On this page</strong>
          <a href="#state">Reading state</a>
          <a href="#runtime">Runtime</a>
          <a href="#types">Types</a>
          <a href="#variables">CSS variables</a>
        </nav>
        <article className="prose">
          <section id="state" aria-labelledby="state-title">
            <h2 id="state-title">Read one snapshot, keep the meanings separate</h2>
            <p>
              <code>ready</code> becomes true after the first client measurement. Until then,
              layout, visual, and orientation are null. A false readiness value describes timing,
              not browser support.
            </p>
            <p>
              Layout is the page&apos;s CSS-pixel reference plane. Visual size and offsets describe
              the region currently visible inside that plane; page coordinates describe its document
              position. Native VisualViewport values are used when available, otherwise the
              documented layout fallback supplies visual geometry.
            </p>
            <p>
              supported.virtualKeyboard means API availability, not that overlay mode is active or a
              keyboard is visible. The package reads intersection geometry but never enables
              <code>overlaysContent</code> mode. Keyboard height is bottom occlusion, not the
              on-screen keyboard&apos;s full rectangle.
            </p>
            <p>
              Safe-area values are raw edge insets. To position bottom UI against both constraints,
              use <code>Math.max(keyboard.height, safeArea.bottom)</code>; do not add them.
            </p>
          </section>
          <section id="runtime" aria-labelledby="runtime-title">
            <h2 id="runtime-title">Runtime</h2>
            {apiReference.map((entry) => (
              <div className="reference-entry" key={entry.name}>
                <h3>{entry.name}</h3>
                <p>{entry.description}</p>
                <CodeBlock label="Type signature" code={entry.signature} />
              </div>
            ))}
          </section>
          <section id="types" aria-labelledby="types-title">
            <h2 id="types-title">Types</h2>
            {typeReference.map((entry) => (
              <div className="reference-entry" key={entry.name}>
                <h3>{entry.name}</h3>
                <p>{entry.description}</p>
                <CodeBlock label="Type definition" code={entry.signature} />
              </div>
            ))}
          </section>
          <section id="variables" aria-labelledby="variables-title">
            <h2 id="variables-title">CSS variables</h2>
            <p>
              Lengths serialize as CSS pixels; scale is unitless. Dimensional values are absent
              until the first client measurement.
            </p>
            <ul className="variable-list">
              {cssVariables.map((variable) => (
                <li key={variable}>
                  <code>{variable}</code>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </main>
  )
}
