'use client'

import { useId, type CSSProperties } from 'react'
import type { LayoutViewport, VisualViewportState } from '@nipe-solutions/react-viewport'

interface ComposerProps {
  readonly keyboardHeight: number
  readonly safeAreaBottom: number
  readonly aware?: boolean
  readonly position?: 'fixed' | 'absolute'
  readonly testId?: string
  readonly layout?: LayoutViewport | null
  readonly visual?: VisualViewportState | null
}

// Application policy: follow the visible bottom without relying on keyboard inference.
// A native overlay can occlude more than VisualViewport reports. Safe area is only
// applied where it is not already covered by the visual viewport's bottom gap.
export function getComposerAnchor(
  layout: LayoutViewport,
  visual: VisualViewportState,
  keyboardHeight: number,
  safeAreaBottom: number,
): number {
  const visualBottom = visual.offsetTop + visual.height
  const visualBottomOcclusion = Math.max(0, layout.height - visualBottom)
  const keyboardTop = keyboardHeight > 0 ? layout.height - keyboardHeight : visualBottom
  const safeBottom = visualBottom - Math.max(0, safeAreaBottom - visualBottomOcclusion)
  return Math.min(visualBottom, keyboardTop, safeBottom)
}

// Simulation and Live Device Lab render this same form. Live mode supplies the
// full visual geometry as well as keyboard/safe-area constraints.
export function Composer({
  keyboardHeight,
  safeAreaBottom,
  aware = true,
  position = 'fixed',
  testId,
  layout,
  visual,
}: ComposerProps) {
  const id = useId()
  const bottomInset = aware ? Math.max(keyboardHeight, safeAreaBottom) : 0
  const style: CSSProperties = { position, bottom: `calc(${bottomInset}px + 1rem)` }

  if (aware && position === 'fixed' && layout && visual) {
    // Top + translateY avoids clamping a negative bottom inset during viewport panning.
    // No transition: browser geometry must not be animated toward an old position.
    style.top = `calc(${getComposerAnchor(layout, visual, keyboardHeight, safeAreaBottom)}px - 1rem)`
    style.bottom = 'auto'
    style.transform = 'translateY(-100%)'
    style.left = `calc(${visual.offsetLeft}px + max(1rem, env(safe-area-inset-left, 0px)))`
    style.right = 'auto'
    style.width = `calc(${visual.width}px - max(1rem, env(safe-area-inset-left, 0px)) - max(1rem, env(safe-area-inset-right, 0px)))`
  }

  return (
    <form
      className="viewport-composer"
      style={style}
      data-testid={testId}
      onSubmit={(event) => {
        event.preventDefault()
        event.currentTarget.reset()
      }}
    >
      <label htmlFor={id}>Message</label>
      <div>
        <input id={id} placeholder="Type a message…" autoComplete="off" />
        <button type="submit">Send</button>
      </div>
    </form>
  )
}
