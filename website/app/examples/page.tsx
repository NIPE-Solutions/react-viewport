import type { Metadata } from 'next'

import { CodeBlock } from '../../components/CodeBlock'
import { ComposerDemo } from '../../components/ComposerDemo'
import { cssComposer } from '../../content/docs'

export const metadata: Metadata = {
  title: 'Examples',
  description: 'A live CSS-variable composer and CSS-first viewport recipes.',
  alternates: { canonical: '/examples' },
}

export default function ExamplesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main">
      <header className="docs-hero site-frame">
        <h1>Examples</h1>
        <p>
          Prefer CSS for layout. Add measured React state only where behavior needs coordinates CSS
          cannot expose.
        </p>
      </header>
      <div className="site-frame examples-stack">
        <ComposerDemo />
        <section className="recipe" aria-labelledby="recipe-title">
          <div>
            <h2 id="recipe-title">Position from the measured edge</h2>
            <p>
              <code>useViewportCssVariables()</code> updates the target directly. The composer
              combines keyboard height and safe-area bottom in CSS.
            </p>
          </div>
          <CodeBlock label="CSS positioning recipe" code={cssComposer} />
        </section>
        <section className="css-first" aria-labelledby="css-first-title">
          <h2 id="css-first-title">When CSS is enough</h2>
          <div>
            <p>
              Use <code>dvh</code>, <code>svh</code>, and <code>lvh</code> for viewport sizing.
            </p>
            <p>
              Use <code>env(safe-area-inset-*)</code> for protected-edge padding.
            </p>
            <p>
              Use media and container queries for responsive layout. This package is not a
              breakpoint or device-detection utility.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
