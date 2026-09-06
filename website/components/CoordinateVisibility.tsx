'use client'

import { useEffect, useRef, useState, useId } from 'react'
import { createPortal } from 'react-dom'
import { useViewport } from '@nipe-solutions/react-viewport'
import {
  correctionToReveal,
  intersectsDocumentViewport,
  type DocumentTarget,
} from './geometry-logic'

export function CoordinateVisibility() {
  const { ready, visual, keyboard } = useViewport()
  const [target, setTarget] = useState<DocumentTarget | null>(null)
  const [correctScroll, setCorrectScroll] = useState(false)
  const lastCorrectionTrigger = useRef('')
  const inputId = useId()
  const visible = target && visual ? intersectsDocumentViewport(target, visual) : null
  const correction = target && visual ? correctionToReveal(target, visual) : null

  // Explicit opt-in application policy: re-evaluate a selected document target
  // after geometry changes. Never move focus or change the measured snapshot.
  useEffect(() => {
    if (!visual) return
    // Page scrolling/panning alone must not pull the reader back to the target.
    const trigger = JSON.stringify([
      correctScroll,
      target,
      visual.width,
      visual.height,
      visual.scale,
      keyboard.open,
    ])
    if (trigger === lastCorrectionTrigger.current) return
    lastCorrectionTrigger.current = trigger
    if (!correctScroll || !target) return
    const delta = correctionToReveal(target, visual)
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' })
  }, [correctScroll, target, visual, keyboard.open])

  function placeTarget() {
    if (!visual) return
    setTarget({
      left: visual.pageLeft + Math.max(0, (visual.width - 20) / 2),
      top: visual.pageTop + Math.max(0, visual.height - 48),
      width: 20,
      height: 20,
    })
  }

  return (
    <section className="logic-demo" aria-label="Coordinate visibility">
      <p role="status" data-testid="target-visible">
        Target visible?{' '}
        <strong>{visible === null ? 'Place a target' : visible ? 'YES' : 'NO'}</strong>
      </p>
      <p>
        A selected 20 × 20 document-coordinate target. Place it near the visible bottom, then open
        the keyboard, scroll or zoom. Its document coordinates stay fixed.
      </p>
      <button type="button" onClick={placeTarget} disabled={!ready || !visual}>
        Place target near visible bottom
      </button>
      <div className="geometry-input coordinate-input">
        <label htmlFor={inputId}>Focus to test target visibility</label>
        <input id={inputId} placeholder="Open the keyboard near this test…" autoComplete="off" />
        <p>
          Keep the target selected while the actual keyboard changes the viewport. This field is not
          stored or sent.
        </p>
      </div>
      {target && (
        <>
          <p data-testid="target-coordinates">
            Document target: x {Math.round(target.left)}, y {Math.round(target.top)} CSS px.
          </p>
          <p>
            Any positive rectangle overlap counts as visible. Other elements, clipping and floating
            keyboards can still cover it.
          </p>
          <button
            type="button"
            onClick={() => {
              setCorrectScroll(false)
              setTarget(null)
            }}
          >
            Clear target
          </button>
        </>
      )}
      <details>
        <summary>Keyboard-aware scroll correction</summary>
        <p>
          The application recalculates a vertical scroll correction when viewport geometry changes.
          CSS cannot call a selection algorithm. Try the default observation first; opt in only to
          test correction.
        </p>
        <p data-testid="scroll-correction">
          Suggested vertical correction:{' '}
          {correction === null ? 'Pending' : `${Math.round(correction)} px`}
        </p>
        <label className="lab-scroll-mode">
          <input
            type="checkbox"
            checked={correctScroll}
            onChange={(event) => setCorrectScroll(event.target.checked)}
          />
          Automatically reveal the selected target
        </label>
        <p>
          Correction runs after selection, viewport-size, scale or keyboard-state changes, not
          ordinary scrolling. Opt-in page scrolling can be clamped at document boundaries. It does
          not manage focus, defeat native browser panning, or guarantee visibility inside nested
          scrollers.
        </p>
      </details>
      {ready &&
        target &&
        createPortal(
          <div
            className="document-target"
            data-testid="document-target"
            aria-hidden="true"
            style={{
              left: target.left,
              top: target.top,
              width: target.width,
              height: target.height,
            }}
          />,
          document.body,
        )}
    </section>
  )
}
