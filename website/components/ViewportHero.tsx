'use client'

import { formatGeometry } from './format-geometry'

import Link from 'next/link'
import { useViewport } from '@nipe-solutions/react-viewport'
import { LiveGeometry } from './LiveGeometry'

export function ViewportHero() {
  const { layout, visual } = useViewport()
  return (
    <section className="viewport-hero" aria-labelledby="hero-title">
      <div className="site-frame">
        <div className="hero-intro">
          <div>
            <h1 id="hero-title">Visual viewport geometry as React state.</h1>
            <p className="viewport-hero__introduction">
              Read the visible browser region, viewport offsets, zoom, keyboard occlusion and
              safe-area geometry when application logic needs coordinates as data.
            </p>
            <p>
              <strong>CSS owns layout. React Viewport exposes geometry to logic.</strong>
            </p>
            <div className="viewport-hero__actions">
              <Link className="primary-action desktop-cta" href="/examples">
                Explore application logic
              </Link>
              <Link className="primary-action mobile-cta" href="/lab">
                Inspect this device’s geometry
              </Link>
              <a href="#decision">Do I need this?</a>
            </div>
            <p className="hero-trust">
              Zero runtime dependencies · SSR safe · React 18.3 / 19 · Alpha
            </p>
          </div>
          <div className="hero-api">
            <pre
              tabIndex={0}
              className="viewport-hero__code"
              aria-label="Minimal useViewport example"
            >
              <code>{`const {
  layout,
  visual,
  keyboard,
  safeArea,
} = useViewport()`}</code>
            </pre>
            <LiveGeometry compact />
          </div>
        </div>
        <figure className="hero-coordinate-frame">
          <svg
            viewBox={`0 0 ${layout?.width ?? 390} ${layout?.height ?? 700}`}
            role="img"
            aria-label="Live layout viewport and nested visual viewport boundaries"
            preserveAspectRatio="xMidYMid meet"
          >
            {layout && visual ? (
              <>
                <rect
                  x="1"
                  y="1"
                  width={Math.max(0, layout.width - 2)}
                  height={Math.max(0, layout.height - 2)}
                  className="hero-layout-rect"
                />
                <rect
                  x={visual.offsetLeft}
                  y={visual.offsetTop}
                  width={visual.width}
                  height={visual.height}
                  className="hero-visual-rect"
                />
              </>
            ) : (
              <rect x="12" y="12" width="366" height="676" className="hero-layout-rect" />
            )}
          </svg>
          <figcaption>
            <strong>Layout viewport → Visual viewport</strong>
            <span>
              {visual
                ? `Visible ${formatGeometry(visual.width)} × ${formatGeometry(visual.height)} CSS px · offset (${formatGeometry(visual.offsetLeft)}, ${formatGeometry(visual.offsetTop)}) · scale ${formatGeometry(visual.scale)}`
                : 'Measuring browser geometry…'}
            </span>
            <span>
              Solid: layout boundary. Dashed: visual boundary. They can coincide. Diagram scaled to
              fit; values are live.
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
