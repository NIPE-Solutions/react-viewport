import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guides',
  description: 'SSR, hydration, performance, comparisons, FAQs, and known limitations.',
  alternates: { canonical: '/guides' },
}

const comparisons = [
  {
    approach: 'CSS viewport units',
    provides: 'Layout sizing with dvh, svh, and lvh without JavaScript.',
    boundary: 'No React state, viewport offsets, page coordinates, or keyboard classification.',
  },
  {
    approach: 'Direct VisualViewport',
    provides: 'Native visible-region size, offsets, page coordinates, scale, and events.',
    boundary: 'No shared React subscription, safe-area measurement, or keyboard policy.',
  },
  {
    approach: 'Direct VirtualKeyboard',
    provides: 'Native keyboard bounding geometry where the browser exposes the API.',
    boundary: 'Availability is limited; consumers still own subscription and intersection logic.',
  },
  {
    approach: 'This library',
    provides:
      'One React snapshot combining layout, visual, keyboard, safe-area, and support state.',
    boundary:
      'Fallback keyboard inference is conservative and physical-device QA remains required.',
  },
] as const

export default function GuidesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main">
      <header className="docs-hero site-frame">
        <h1>Guides</h1>
        <p>Use the smallest viewport tool that supplies the coordinates your behavior needs.</p>
      </header>
      <div className="site-frame docs-layout">
        <nav className="page-index" aria-label="On this page">
          <strong>On this page</strong>
          <a href="#ssr">SSR &amp; hydration</a>
          <a href="#performance">Performance</a>
          <a href="#comparison">Comparison</a>
          <a href="#faq">FAQ</a>
          <a href="#limitations">Limitations</a>
        </nav>
        <article className="prose">
          <section id="ssr" aria-labelledby="ssr-title">
            <h2 id="ssr-title">SSR and hydration</h2>
            <p>
              Imports and server renders do not read browser globals. The server snapshot stays
              stable with <code>ready: false</code>; render a geometry-neutral placeholder until the
              first client measurement.
            </p>
            <p>
              Hydration uses that same snapshot before subscribing to the selected window. The
              browser matrix fails on any console error or uncaught page error, not only messages
              containing the word hydration.
            </p>
          </section>
          <section id="performance" aria-labelledby="performance-title">
            <h2 id="performance-title">Performance model</h2>
            <p>
              Subscribers share one store, listener set, and safe-area probe per window. Browser
              events are coalesced into one animation-frame measurement, and unchanged scalar
              snapshots do not notify React.
            </p>
            <p>
              CSS-variable updates subscribe directly to the store. No throughput or CPU benchmark
              is claimed for this alpha; the evidence covers lifecycle sharing and event batching.
            </p>
          </section>
          <section id="comparison" aria-labelledby="comparison-title">
            <h2 id="comparison-title">Factual comparison</h2>
            <div className="comparison-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Approach</th>
                    <th scope="col">Provides</th>
                    <th scope="col">Boundary</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((item) => (
                    <tr key={item.approach}>
                      <th scope="row">{item.approach}</th>
                      <td>{item.provides}</td>
                      <td>{item.boundary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section id="faq" aria-labelledby="faq-title">
            <h2 id="faq-title">Frequently asked questions</h2>
            <div className="reference-entry">
              <h3>Does focus mean the keyboard is open?</h3>
              <p>
                No. Without native geometry, focus only enables an evidence gate. Reported height is
                the current layout-bottom occlusion and must also cross the configured threshold.
              </p>
            </div>
            <div className="reference-entry">
              <h3>When will safe-area values be non-zero?</h3>
              <p>
                The page must opt into <code>viewport-fit=cover</code>, and the device/browser must
                expose non-zero <code>env(safe-area-inset-*)</code> values.
              </p>
            </div>
            <div className="reference-entry">
              <h3>Can multiple hooks target one element?</h3>
              <p>
                Yes. Property ownership is coordinated; the last-mounted live owner supplies values,
                and consumer styles are restored only after the final owner leaves.
              </p>
            </div>
          </section>
          <section id="limitations" aria-labelledby="limitations-title">
            <h2 id="limitations-title">Limitations</h2>
            <ul>
              <li>Floating or split keyboards may expose no bottom occlusion.</li>
              <li>Small keyboards may remain below the conservative fallback threshold.</li>
              <li>Browser chrome and keyboard animation fidelity require physical devices.</li>
              <li>Embedded WebViews vary with host configuration.</li>
              <li>Foldable segments and synthetic keyboard animation are outside v1.</li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  )
}
