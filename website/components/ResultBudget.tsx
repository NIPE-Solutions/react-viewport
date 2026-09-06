'use client'

import { formatGeometry } from './format-geometry'

import { useViewport } from '@nipe-solutions/react-viewport'

// Example application policy, not library defaults. Reserve space for the
// search overlay's controls, and limit how many local results React creates.
const RESERVED_SPACE = 320
const ROW_HEIGHT = 48
const MAX_RESULTS = 8
const results = [
  'Document outline',
  'Selection anchor',
  'Search overlay',
  'Visible-area panel',
  'Canvas controls',
  'Virtualized results',
  'Zoom-aware overlay',
  'Browser diagnostics',
]

export function ResultBudget() {
  const { ready, visual } = useViewport()
  const limit =
    ready && visual
      ? Math.min(
          MAX_RESULTS,
          Math.max(0, Math.floor((visual.height - RESERVED_SPACE) / ROW_HEIGHT)),
        )
      : null

  return (
    <section className="result-budget" aria-label="JavaScript result budget">
      <p role="status">
        {limit === null
          ? 'Measuring viewport…'
          : `Render budget: ${limit} results · visible height ${formatGeometry(visual?.height ?? 0)} px`}
      </p>
      <p>
        Example policy: reserve {RESERVED_SPACE}px for search controls, allow {ROW_HEIGHT}px per
        row, cap at {MAX_RESULTS}. This is a viewport-derived budget, not a measurement of this
        card.
      </p>
      {limit === 0 && <p>No result rows fit the current budget.</p>}
      {limit !== null && limit > 0 && (
        <ul>
          {results.slice(0, limit).map((result) => (
            <li key={result}>{result}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
