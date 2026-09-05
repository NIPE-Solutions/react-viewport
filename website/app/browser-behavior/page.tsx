import type { Metadata } from 'next'

import { browserNotes } from '../../content/docs'

export const metadata: Metadata = {
  title: 'Browser behavior',
  description: 'Capability labels, conservative keyboard inference, and testing limits.',
  alternates: { canonical: '/browser-behavior' },
}

export default function BrowserBehaviorPage() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main">
      <header className="docs-hero site-frame">
        <h1>Browser behavior</h1>
        <p>
          Evidence has boundaries. Supported, tested, and fallback describe different things in this
          project.
        </p>
      </header>
      <article className="site-frame prose browser-prose">
        <section aria-labelledby="terms-title">
          <h2 id="terms-title">Read the labels literally</h2>
          <dl className="definition-list">
            <div>
              <dt>Supported</dt>
              <dd>The current runtime exposes a capability the package can detect.</dd>
            </div>
            <div>
              <dt>Tested</dt>
              <dd>A deterministic repository scenario covers the behavior.</dd>
            </div>
            <div>
              <dt>Fallback</dt>
              <dd>The package supplies documented geometry when an API is absent.</dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby="keyboard-title">
          <h2 id="keyboard-title">Keyboard inference is conservative</h2>
          <p>
            Without native Virtual Keyboard geometry, inference requires a focused editable element,
            no active zoom, and visual-bottom occlusion of at least 80 CSS pixels or 15% of layout
            height. Focus alone is never reported as an open keyboard.
          </p>
        </section>
        <section aria-labelledby="environments-title">
          <h2 id="environments-title">Environment notes</h2>
          <div className="browser-list">
            {browserNotes.map((note) => (
              <article key={note.name}>
                <h3>{note.name}</h3>
                <p>{note.detail}</p>
              </article>
            ))}
          </div>
        </section>
        <aside className="evidence-note">
          <strong>Physical-device status</strong>
          <p>
            Pending. Desktop automation cannot reproduce physical keyboard animation, browser
            chrome, floating keyboards, or every embedded host.
          </p>
        </aside>
      </article>
    </main>
  )
}
