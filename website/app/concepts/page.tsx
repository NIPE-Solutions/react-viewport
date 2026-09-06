import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { CodeBlock } from '../../components/CodeBlock'
import { GeometryDemo } from '../../components/GeometryDemo'

export const metadata: Metadata = {
  title: 'Concepts',
  description:
    'Layout and visual viewports, keyboard occlusion, safe areas, SSR, and shared measurement.',
  alternates: { canonical: '/concepts' },
}

export default function ConceptsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main">
      <header className="docs-hero site-frame">
        <h1>Concepts</h1>
        <p>
          Viewport geometry you can reason about: what the browser lays out, what a person can see,
          and what may cover the edges.
        </p>
      </header>

      <div className="site-frame docs-layout">
        <nav className="page-index" aria-label="On this page">
          <strong>On this page</strong>
          <a href="#coordinates">Four measurements</a>
          <a href="#changes">What changes</a>
          <a href="#coordinate-systems">Coordinate guide</a>
          <a href="#keyboard-and-safe-area">Keyboard and safe area</a>
          <a href="#scenarios">Scenarios</a>
          <a href="#simulator">Simulator</a>
          <a href="#ssr">SSR and hydration</a>
          <a href="#performance">Performance</a>
          <a href="#anti-patterns">What not to do</a>
        </nav>

        <article className="prose" data-testid="geometry-context">
          <section id="coordinates" aria-labelledby="coordinates-title">
            <h2 id="coordinates-title">Four measurements, four jobs</h2>
            <dl className="definition-list">
              <div>
                <dt>Layout viewport</dt>
                <dd>The page’s coordinate space, measured by the browser window.</dd>
              </div>
              <div>
                <dt>Visual viewport</dt>
                <dd>The part of that layout currently visible, including its offsets and scale.</dd>
              </div>
              <div>
                <dt>Keyboard occlusion</dt>
                <dd>The bottom edge covered by a software keyboard, when evidence supports it.</dd>
              </div>
              <div>
                <dt>Safe area</dt>
                <dd>Protected edge insets exposed by CSS for hardware and browser UI.</dd>
              </div>
            </dl>
          </section>

          <section id="changes" aria-labelledby="changes-title">
            <h2 id="changes-title">What changes, and why</h2>
            <p>
              The layout viewport is the reference plane. Browser chrome can move and shorten the
              visual viewport; a software keyboard can leave part of the layout covered; pinch zoom
              changes the visual size, offsets, and scale. Those causes can look similar if an
              interface watches height alone.
            </p>
            <p>
              Bottom occlusion therefore includes the visual viewport’s top offset and never goes
              below zero:
            </p>
            <p>
              <code>Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))</code>
            </p>
          </section>

          <section id="coordinate-systems" aria-labelledby="coordinate-systems-title">
            <h2 id="coordinate-systems-title">Coordinate guide</h2>
            <p>
              <code>visual.offsetTop</code> and <code>offsetLeft</code> locate the visual viewport
              inside the layout viewport. <code>visual.pageTop</code> and <code>pageLeft</code>
              locate it in the document. All are CSS pixels. <code>visual.scale</code> describes
              pinch zoom; it is not a responsive breakpoint.
            </p>
            <p>
              Keep visibility targets in document coordinates. Convert a DOM rectangle with{' '}
              <code>getBoundingClientRect()</code>, then add <code>window.scrollX</code> and{' '}
              <code>window.scrollY</code> from that element&apos;s window. Do not multiply by scale.
              Compare it with the bounds from <code>pageLeft</code>, <code>pageTop</code>, visual
              width, and visual height; visible means the rectangles have a positive-width and
              positive-height intersection.
            </p>
            <p>
              This geometric test does not detect clipping ancestors or other DOM overlays. See the{' '}
              <a href="https://drafts.csswg.org/cssom-view/#the-visualviewport-interface">
                CSSOM View VisualViewport definition
              </a>{' '}
              and{' '}
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect">
                MDN&apos;s getBoundingClientRect reference
              </a>
              .
            </p>
            <CodeBlock
              collapsible
              label="Document-coordinate intersection · actual example helper"
              code={readFileSync(
                path.join(process.cwd(), 'website/components/geometry-logic.ts'),
                'utf8',
              )}
            />
          </section>

          <section id="keyboard-and-safe-area" aria-labelledby="keyboard-safe-title">
            <h2 id="keyboard-safe-title">Keyboard and safe area</h2>
            <h3>Keyboard status</h3>
            <p>
              <code>keyboard.open</code> means the library has sufficient evidence that a software
              keyboard is visible. It does not mean that an input merely has focus, and the package
              does not use it to show, hide, or resize the keyboard.
            </p>
            <p>
              Native keyboard geometry is used when available. Otherwise, inference requires an
              editable focus, approximately unit scale, and a keyboard-sized current bottom
              occlusion. Browser chrome, zoom, and hardware-keyboard-like focus remain closed.
            </p>
            <p>
              Safe area and keyboard occlusion stay raw and independent. For bottom UI, use the
              larger constraint—<code>Math.max(keyboard.height, safeArea.bottom)</code>—instead of
              adding two values that may describe the same covered edge.
            </p>
          </section>

          <section id="scenarios" aria-labelledby="scenarios-title">
            <h2 id="scenarios-title">Read the scenarios</h2>
            <div className="browser-list">
              <article>
                <h3>Normal</h3>
                <p>
                  The layout and visual viewports match. Nothing is occluded; keyboard status is
                  closed.
                </p>
              </article>
              <article>
                <h3>Browser chrome</h3>
                <p>
                  The visible region shifts and shrinks because of browser UI; keyboard status is
                  closed.
                </p>
              </article>
              <article>
                <h3>Soft keyboard</h3>
                <p>
                  A focused editable and 300 px bottom occlusion provide enough evidence; keyboard
                  status is open.
                </p>
              </article>
              <article>
                <h3>Shifted keyboard</h3>
                <p>
                  The 28 px top offset is included, leaving 300 px occluded; keyboard status is
                  open.
                </p>
              </article>
              <article>
                <h3>Zoom</h3>
                <p>Scale explains the smaller visible region, so keyboard status remains closed.</p>
              </article>
              <article>
                <h3>Custom</h3>
                <p>
                  Every value is editable. Contradictory keyboard and visual geometry produces a
                  warning instead of pretending the state is typical.
                </p>
              </article>
            </div>
          </section>
        </article>
      </div>

      <div className="simulator-section site-frame" id="simulator">
        <GeometryDemo
          code={readFileSync(
            path.join(process.cwd(), 'website/components/GeometryDemo.tsx'),
            'utf8',
          )}
        />
      </div>

      <article className="site-frame prose browser-prose">
        <section id="ssr" aria-labelledby="ssr-title">
          <h2 id="ssr-title">SSR and hydration</h2>
          <p>
            Imports and server renders do not read browser globals. Server rendering and the first
            hydration pass share a stable snapshot with <code>ready: false</code> and no layout or
            visual geometry. Render a geometry-neutral placeholder until the first client
            measurement.
          </p>
        </section>

        <section id="performance" aria-labelledby="performance-title">
          <h2 id="performance-title">Shared-store performance</h2>
          <p>
            <code>useViewport()</code> uses <code>useSyncExternalStore</code>. Subscribers targeting
            the same window share one store, browser listener set, and hidden CSS safe-area probe.
            The probe reads all four <code>env(safe-area-inset-*)</code> sides. Events are coalesced
            into one animation-frame measurement, and an unchanged scalar snapshot does not notify
            React again.
          </p>
          <p>
            CSS-variable consumers subscribe to that store directly. This describes the measured
            lifecycle; it is not a throughput or CPU benchmark.
          </p>
        </section>

        <section id="anti-patterns" aria-labelledby="anti-patterns-title">
          <h2 id="anti-patterns-title">What not to do</h2>
          <ul>
            <li>
              Do not use <code>layoutHeight - visualHeight</code> for bottom occlusion; it ignores
              <code>visualOffsetTop</code>.
            </li>
            <li>Do not add keyboard height to the safe-area bottom; use the larger constraint.</li>
            <li>Do not treat focus or visual viewport shrinkage alone as an open keyboard.</li>
            <li>Do not render client geometry as known before the first measurement is ready.</li>
          </ul>
        </section>
      </article>
    </main>
  )
}
