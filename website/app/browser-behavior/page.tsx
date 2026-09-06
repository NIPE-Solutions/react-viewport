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
              <dd>
                The current runtime exposes an API the package can detect. This says nothing about
                active browser mode or physical-device validation.
              </dd>
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
        <section aria-labelledby="native-title">
          <h2 id="native-title">Native geometry has narrow authority</h2>
          <p>
            The W3C{' '}
            <a href="https://w3c.github.io/virtual-keyboard/">VirtualKeyboard specification</a>{' '}
            defines <code>boundingRect</code> as the intersection of the virtual keyboard with the
            document viewport in client coordinates. The package treats a finite, positive-area
            intersection as native evidence that the keyboard is open.
          </p>
          <p>
            <code>supported.virtualKeyboard</code> reports API availability. Capability presence is
            not proof that overlay mode is active: the library never sets{' '}
            <code>overlaysContent</code>, calls <code>show()</code>, or calls <code>hide()</code>.
          </p>
          <p>
            Height remains a bottom-occlusion value. A native floating rectangle can intersect the
            viewport without touching its bottom edge, producing{' '}
            <code>{'{ open: true, height: 0 }'}</code>. Open and zero bottom occlusion are therefore
            compatible, not contradictory.
          </p>
        </section>
        <section aria-labelledby="keyboard-title">
          <h2 id="keyboard-title">Keyboard inference is conservative</h2>
          <p>
            Without native Virtual Keyboard geometry, inference requires a focused editable element,
            no active zoom, and visual-bottom occlusion of at least 80 CSS pixels or 15% of layout
            height. Focus alone is never reported as an open keyboard.
          </p>
        </section>
        <section aria-labelledby="composition-title">
          <h2 id="composition-title">Compose bottom constraints with the larger value</h2>
          <p>
            Keyboard occlusion and safe-area insets remain raw, independent measurements. Use{' '}
            <code>Math.max(keyboard.height, safeArea.bottom)</code> for a single bottom constraint;
            adding them can count the same covered edge twice.
          </p>
          <p>
            Upstream <a href="https://bugs.webkit.org/show_bug.cgi?id=217754">WebKit bug 217754</a>{' '}
            records <code>safe-area-inset-bottom</code> remaining set after a software keyboard
            appears. That report explains why a raw safe-area value may be stale in this state. It
            is upstream evidence, not a physical-device result from this project, and the package
            adds no browser-specific runtime workaround.
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
            Physical iPhone Safari and Android Chrome testing is pending. Desktop automation cannot
            reproduce mobile keyboard animation, browser chrome, floating keyboards, or all embedded
            hosts.
          </p>
        </aside>
      </article>
    </main>
  )
}
