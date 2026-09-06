import type { Metadata } from 'next'
import { InteractionHint } from '../../components/InteractionHint'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { CodeBlock } from '../../components/CodeBlock'
import { ResultBudget } from '../../components/ResultBudget'
import { CoordinateVisibility } from '../../components/CoordinateVisibility'
import { ZoomLogic } from '../../components/ZoomLogic'
import { cssComposer, cssSafeAreaFooter } from '../../content/docs'

export const metadata: Metadata = {
  title: 'Application logic examples',
  description:
    'Rendering budgets, coordinate visibility, zoom-aware tools and CSS-first baselines.',
  alternates: { canonical: '/examples' },
}
const source = (file: string) =>
  readFileSync(path.join(process.cwd(), 'website/components', file), 'utf8')
export default function ExamplesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main">
      <header className="docs-hero site-frame">
        <h1>Examples</h1>
        <p>CSS owns layout. React Viewport exposes geometry to logic.</p>
      </header>
      <InteractionHint />
      <div className="site-frame examples-stack">
        <nav aria-label="Example categories">
          <a href="#result-budget">Application logic</a> ·{' '}
          <a href="#css-integration">CSS integration</a> ·{' '}
          <a href="#css-first-title">CSS baselines</a>
        </nav>
        <section id="result-budget">
          <h2>Rendering budget</h2>
          <p>
            A search overlay or lightweight virtualizer can use the visible height to choose how
            many optional items React creates. CSS can size a container; JavaScript chooses which
            items exist. A single consumer could use VisualViewport directly; multiple React
            consumers can share this store.
          </p>
          <ResultBudget />
          <CodeBlock
            collapsible
            label="ResultBudget.tsx · actual source"
            code={source('ResultBudget.tsx')}
          />
        </section>
        <section id="coordinate-visibility">
          <h2>Coordinate visibility and scroll correction</h2>
          <p>
            A canvas annotation or editor selection is application data. Compare it with the visible
            document bounds. The optional scroll algorithm re-evaluates after keyboard or viewport
            changes. <a href="/concepts#coordinate-systems">Coordinate system assumptions →</a>
          </p>
          <CoordinateVisibility />
          <CodeBlock
            collapsible
            label="CoordinateVisibility.tsx · actual source"
            code={source('CoordinateVisibility.tsx')}
          />
          <CodeBlock
            collapsible
            label="geometry-logic.ts · actual source"
            code={source('geometry-logic.ts')}
          />
        </section>
        <section id="zoom-aware">
          <h2>Zoom-aware tools and safe-area data</h2>
          <p>
            A custom rendering engine needs numerical inputs for hit testing and protected drawing
            regions. Ordinary CSS padding and responsive styling need no library.
          </p>
          <ZoomLogic />
          <CodeBlock
            collapsible
            label="ZoomLogic.tsx · actual source"
            code={source('ZoomLogic.tsx')}
          />
        </section>
        <section id="css-integration">
          <h2>CSS integration</h2>
          <p>
            Use <code>useViewportCssVariables()</code> when JS logic and CSS need the same
            normalized geometry. Measure once in the shared store, then let styles consume the
            result. Copying env() into JS and back to CSS adds little value for CSS-only padding.
          </p>
          <CodeBlock
            collapsible
            label="Install the shared CSS bridge"
            code={`import { useViewportCssVariables } from '@nipe-solutions/react-viewport'

export function GeometryCssBridge() {
  useViewportCssVariables()
  return null
}`}
          />
          <h3>Secondary recipe: bottom constraints</h3>
          <p>
            If an application already needs measured geometry, an overlap-aware bottom constraint
            can consume it. This is an educational recipe, not a universal keyboard-layout fix;
            visual offsets and browser timing can require a different application policy.
          </p>
          <CodeBlock collapsible label="CSS geometry composition" code={cssComposer} />
        </section>
        <section id="css-first-title">
          <h2>When you don’t need React Viewport</h2>
          <h3>CSS-only composer</h3>
          <p>
            Use normal grid or flex layout, <code>100dvh</code> and safe-area padding. Request{' '}
            <code>interactive-widget=resizes-content</code> where supported. If browser-native
            layout meets your requirements, stop here.
          </p>
          <a href="/lab/css">Open CSS Baseline →</a>
          <h3>CSS-only modal footer</h3>
          <p>
            Let the form body scroll while its action row remains in normal grid flow. A modal
            implementation must separately own focus and accessibility.
          </p>
          <CodeBlock
            collapsible
            label="Modal body and action row"
            code={`.modal {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  max-height: 90dvh;
}
.modal-body { overflow: auto; }
.modal-actions {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
}`}
          />
          <CodeBlock collapsible label="Safe-area padding" code={cssSafeAreaFooter} />
        </section>
        <section>
          <h2>Try actual browser changes</h2>
          <p>
            <a href="/lab">Live Geometry Lab →</a> Observe the input data, rendering budget and
            coordinate test on your device. No simulated keyboard.
          </p>
        </section>
      </div>
    </main>
  )
}
