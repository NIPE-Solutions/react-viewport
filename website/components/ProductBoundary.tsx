export function ProductBoundary() {
  return (
    <section className="site-frame product-boundary" id="decision" aria-labelledby="decision-title">
      <h2 id="decision-title">If CSS solves it, don’t install React Viewport.</h2>
      <p>
        React Viewport is for application logic that needs viewport geometry as data. It is not a
        replacement for <code>100dvh</code>, safe-area CSS or normal responsive layout.
      </p>
      <h3>Do I need this?</h3>
      <dl className="decision-tree">
        <div>
          <dt>Can CSS solve the layout?</dt>
          <dd>
            Use CSS: grid, flexbox, sticky positioning, <code>100dvh</code>, <code>env()</code>,
            media and container queries.
          </dd>
        </div>
        <div>
          <dt>Only need one occasional VisualViewport value?</dt>
          <dd>
            Use <code>window.visualViewport?.height</code> directly.
          </dd>
        </div>
        <div>
          <dt>Does React logic need shared reactive geometry?</dt>
          <dd>
            <code>useViewport()</code> may be useful for a coherent snapshot across consumers.
          </dd>
        </div>
      </dl>
      <div
        className="comparison-table"
        tabIndex={0}
        role="region"
        aria-label="CSS and React Viewport capabilities"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Problem</th>
              <th scope="col">CSS</th>
              <th scope="col">React Viewport</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Full-height layout', 'Preferred: 100dvh', 'Unnecessary'],
              ['Safe-area padding', 'Preferred: env()', 'Unnecessary'],
              ['Responsive styling', 'Preferred: queries', 'Unnecessary'],
              ['Sticky / fixed footer', 'Usually sufficient', 'Usually unnecessary'],
              ['Visual dimensions and offsets in React logic', 'Not a reactive JS snapshot', 'Yes'],
              ['Pinch zoom in coordinate algorithms', 'Not a JS algorithm input', 'visual.scale'],
              ['Keyboard occlusion as JS state', 'Not a React state source', 'keyboard'],
              ['Safe-area insets in JS calculations', 'env() needs measurement', 'safeArea'],
              [
                'JS rendering budget / coordinate visibility',
                'Cannot make the JS decision',
                'Geometry inputs for your algorithm',
              ],
            ].map((row) => (
              <tr key={row[0]}>
                <th scope="row">{row[0]}</th>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        This compares CSS with a React abstraction. Native browser APIs already expose geometry; the
        library does not invent exclusive access to it.
      </p>
      <h3>Why not just use window.visualViewport?</h3>
      <p>
        If all you need is one <code>visualViewport.height</code> read, you probably should. React
        Viewport adds <code>useSyncExternalStore</code> integration, shared subscriptions per
        Window, an SSR-safe snapshot, layout and visual geometry, measured safe areas and a
        conservative keyboard abstraction.
      </p>
      <p>
        A CSS-variable bridge can share that same normalized state with styles. It is unnecessary
        for recreating ordinary <code>env()</code> padding.{' '}
        <a href="/concepts#performance">Read the store architecture</a>.
      </p>
      <p>
        <strong>What it does not do:</strong> replace CSS, move UI automatically, manage focus,
        detect devices, universally expose a physical keyboard rectangle, or solve all
        mobile-browser quirks.
      </p>
    </section>
  )
}
