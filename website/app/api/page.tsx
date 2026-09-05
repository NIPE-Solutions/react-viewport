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
          <a href="#runtime">Runtime</a>
          <a href="#types">Types</a>
          <a href="#variables">CSS variables</a>
        </nav>
        <article className="prose">
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
