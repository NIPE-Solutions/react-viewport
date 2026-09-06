import type { Metadata } from 'next'
import Link from 'next/link'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { CodeBlock } from '../../components/CodeBlock'
import { UseCaseExamples } from '../../components/UseCaseExamples'
import { cssComposer, cssSafeAreaFooter, modalActionBar, visibleArea } from '../../content/docs'

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Live viewport-aware interface examples and copyable integration recipes.',
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
        <p>
          <strong>Live browser readouts in scaled illustrations.</strong> For a full-screen, fixed
          composer and your actual software keyboard,{' '}
          <Link href="/lab">open the Live Device Lab</Link>.
        </p>
        <UseCaseExamples
          source={readFileSync(
            path.join(process.cwd(), 'website/components/UseCaseExamples.tsx'),
            'utf8',
          )}
        />
        <section className="example-recipes" aria-labelledby="recipes-title">
          <header>
            <h2 id="recipes-title">Recipes to copy</h2>
            <p>
              Use React state for decisions that need coordinates. Use the CSS bridge when layout is
              the only consumer.
            </p>
          </header>
          <div className="example-recipe-list">
            <article>
              <h3>Position a composer</h3>
              <CodeBlock
                collapsible
                label="Install the shared CSS bridge"
                code={`import { useViewportCssVariables } from '@nipe-solutions/react-viewport'

export function App() {
  useViewportCssVariables()
  return <form className="composer"><label>Message<input /></label></form>
}`}
              />
              <CodeBlock collapsible label="CSS composer recipe" code={cssComposer} />
            </article>
            <article>
              <h3>Place modal actions</h3>
              <CodeBlock collapsible label="React modal action recipe" code={modalActionBar} />
            </article>
            <article>
              <h3>Read the visible height</h3>
              <CodeBlock collapsible label="Visible-area recipe" code={visibleArea} />
            </article>
          </div>
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
              A safe-area-only footer does not need JavaScript. Let the browser resolve its edge
              padding directly.
            </p>
          </div>
          <CodeBlock collapsible label="Safe-area-only footer" code={cssSafeAreaFooter} />
        </section>
        <section className="avoid-recipe" aria-labelledby="avoid-recipe-title">
          <h2 id="avoid-recipe-title">What not to do</h2>
          <p>
            Do not add keyboard height to the safe-area bottom. Both can describe overlap at the
            same physical edge, and a browser may keep reporting the safe area while the keyboard is
            open. Adding <code>326px + 34px</code> produces a false <code>360px</code> gap; use the
            larger value.
          </p>
        </section>
      </div>
    </main>
  )
}
