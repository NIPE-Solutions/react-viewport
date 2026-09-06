'use client'

import { formatGeometry } from './format-geometry'

import { useViewport } from '@nipe-solutions/react-viewport'
import { zoomTolerance } from './geometry-logic'

export function ZoomLogic() {
  const { visual, safeArea, ready } = useViewport()
  const tolerance = visual ? zoomTolerance(visual.scale) : null
  return (
    <section className="logic-demo" aria-label="Zoom-aware tool">
      <p data-testid="zoom-tolerance">
        Optional annotation hit tolerance:{' '}
        <strong>
          {tolerance === null ? 'Pending' : `${formatGeometry(tolerance)} document CSS px`}
        </strong>
      </p>
      <p>
        A canvas tool can convert a 12 CSS-pixel tolerance at unit scale using{' '}
        <code>12 / visual.scale</code>. This is an algorithm input, not a smaller button or text
        size.
      </p>
      <p>
        Pinch zoom is user viewport geometry, not responsive design. Essential controls remain
        available at every scale.
      </p>
      <p>
        Safe-area input for a custom drawing surface:{' '}
        {ready
          ? `top ${formatGeometry(safeArea.top)}, right ${formatGeometry(safeArea.right)}, bottom ${formatGeometry(safeArea.bottom)}, left ${formatGeometry(safeArea.left)} CSS px`
          : 'Pending'}
        .
      </p>
      <p>
        Use these raw protected-edge values only after mapping the drawing surface into the same
        coordinate system. For ordinary padding, use <code>env()</code> directly.
      </p>
    </section>
  )
}
