'use client'

import { formatGeometry } from './format-geometry'

import { useViewport } from '@nipe-solutions/react-viewport'

export function LiveGeometry({ compact = false }: { readonly compact?: boolean }) {
  const { ready, layout, visual, keyboard, safeArea, orientation, supported } = useViewport()
  const px = (n: number | undefined) =>
    ready && n !== undefined ? `${formatGeometry(n)} px` : 'Pending'
  const rows = compact
    ? [
        ['Visual height', px(visual?.height)],
        ['Offset top', px(visual?.offsetTop)],
        ['Scale', visual ? formatGeometry(visual.scale) : 'Pending'],
        ['Keyboard', ready ? (keyboard.open ? 'open' : 'closed') : 'Pending'],
        ['Bottom occlusion', px(keyboard.height)],
        ['Safe bottom', px(safeArea.bottom)],
      ]
    : [
        ['layout.width', px(layout?.width)],
        ['layout.height', px(layout?.height)],
        ['visual.width', px(visual?.width)],
        ['visual.height', px(visual?.height)],
        ['visual.offsetTop', px(visual?.offsetTop)],
        ['visual.offsetLeft', px(visual?.offsetLeft)],
        ['visual.pageTop', px(visual?.pageTop)],
        ['visual.pageLeft', px(visual?.pageLeft)],
        ['visual.scale', visual ? formatGeometry(visual.scale) : 'Pending'],
        ['keyboard.open', ready ? String(keyboard.open) : 'Pending'],
        ['keyboard.height (bottom occlusion)', px(keyboard.height)],
        ['safeArea.top', px(safeArea.top)],
        ['safeArea.right', px(safeArea.right)],
        ['safeArea.bottom', px(safeArea.bottom)],
        ['safeArea.left', px(safeArea.left)],
        ['Orientation', orientation ?? 'Pending'],
        ['VisualViewport API', ready ? String(supported.visualViewport) : 'Pending'],
        ['VirtualKeyboard API', ready ? String(supported.virtualKeyboard) : 'Pending'],
      ]
  return (
    <section
      className="lab-geometry"
      data-testid={compact ? 'hero-geometry' : 'lab-geometry'}
      aria-label={compact ? 'Live snapshot' : 'Live geometry'}
    >
      <span className="mode-badge">{ready ? 'LIVE' : 'Measuring…'}</span>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {!compact && (
        <p>
          Raw geometry from the current browser. API presence does not identify the active keyboard
          source. No simulation.
        </p>
      )}
    </section>
  )
}
