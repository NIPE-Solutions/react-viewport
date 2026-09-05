'use client'

import { useMemo, useState } from 'react'

import { useViewport, type ViewportState } from '@nipe-solutions/react-viewport'

interface GeometryModel {
  readonly layout: { readonly width: number; readonly height: number }
  readonly visual: {
    readonly width: number
    readonly height: number
    readonly offsetTop: number
    readonly offsetLeft: number
    readonly scale: number
  }
  readonly safeArea: {
    readonly top: number
    readonly right: number
    readonly bottom: number
    readonly left: number
  }
  readonly keyboard: { readonly open: boolean; readonly height: number }
}

interface SimulationState {
  readonly enabled: boolean
  readonly visualHeight: number
  readonly keyboardHeight: number
  readonly safeBottom: number
}

export function GeometryDemo() {
  const viewport = useViewport()
  const [simulation, setSimulation] = useState<SimulationState>({
    enabled: false,
    visualHeight: 620,
    keyboardHeight: 0,
    safeBottom: 24,
  })

  const realGeometry = geometryFromViewport(viewport)
  const geometry = useMemo(
    () => (simulation.enabled ? simulatedGeometry(simulation) : realGeometry),
    [realGeometry, simulation],
  )
  const mode = simulation.enabled
    ? 'Simulated geometry'
    : geometry === null
      ? 'Initializing viewport measurement'
      : 'Live browser measurement'
  const keyboardMaximum = 800 - simulation.visualHeight

  return (
    <section className="geometry-demo" aria-labelledby="geometry-heading">
      <header className="geometry-demo__header">
        <div>
          <h2 id="geometry-heading">One screen, four measured regions</h2>
          <p>
            The drawing uses the same model as the numbers. It is a coordinate plane, not a device
            mockup.
          </p>
        </div>
        <output
          className="mode-indicator"
          data-state={geometry === null ? 'pending' : 'ready'}
          data-testid="geometry-mode"
        >
          {mode}
        </output>
      </header>

      <div className="geometry-demo__body">
        <figure
          className="coordinate-plane"
          role="img"
          aria-label={
            geometry === null
              ? 'Nested viewport coordinate plane awaiting its first browser measurement'
              : 'Nested viewport coordinate plane showing layout viewport, visual viewport, safe area, and keyboard occlusion'
          }
        >
          <svg
            className="coordinate-plane__sizer"
            width="100vw"
            height="100vh"
            aria-hidden="true"
          />
          {geometry === null ? (
            <div className="coordinate-plane__pending" aria-hidden="true">
              <span>Awaiting client geometry</span>
            </div>
          ) : (
            <>
              <svg
                className="coordinate-drawing"
                viewBox={`0 0 ${geometry.layout.width} ${geometry.layout.height}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                <rect
                  className="layout-plane"
                  x="0"
                  y="0"
                  width={geometry.layout.width}
                  height={geometry.layout.height}
                />
                <rect
                  className="visual-plane"
                  x={geometry.visual.offsetLeft}
                  y={geometry.visual.offsetTop}
                  width={geometry.visual.width}
                  height={geometry.visual.height}
                />
                <rect
                  className="safe-band safe-band--top"
                  data-testid="safe-top"
                  x={geometry.visual.offsetLeft}
                  y={geometry.visual.offsetTop}
                  width={geometry.visual.width}
                  height={geometry.safeArea.top}
                />
                <rect
                  className="safe-band safe-band--right"
                  data-testid="safe-right"
                  x={geometry.visual.offsetLeft + geometry.visual.width - geometry.safeArea.right}
                  y={geometry.visual.offsetTop}
                  width={geometry.safeArea.right}
                  height={geometry.visual.height}
                />
                <rect
                  className="safe-band safe-band--bottom"
                  data-testid="safe-bottom"
                  x={geometry.visual.offsetLeft}
                  y={geometry.visual.offsetTop + geometry.visual.height - geometry.safeArea.bottom}
                  width={geometry.visual.width}
                  height={geometry.safeArea.bottom}
                />
                <rect
                  className="safe-band safe-band--left"
                  data-testid="safe-left"
                  x={geometry.visual.offsetLeft}
                  y={geometry.visual.offsetTop}
                  width={geometry.safeArea.left}
                  height={geometry.visual.height}
                />
                <rect
                  className="keyboard-plane"
                  data-testid="keyboard-region"
                  x="0"
                  y={geometry.layout.height - geometry.keyboard.height}
                  width={geometry.layout.width}
                  height={geometry.keyboard.height}
                />
              </svg>
              <span className="plane-label plane-label--layout" aria-hidden="true">
                layout
              </span>
              <span className="plane-label plane-label--visual" aria-hidden="true">
                visual
              </span>
              {geometry.keyboard.height > 0 ? (
                <span className="plane-label plane-label--keyboard" aria-hidden="true">
                  keyboard occlusion
                </span>
              ) : null}
            </>
          )}
          <figcaption>Origin 0,0 · one unit equals one CSS pixel before diagram scaling</figcaption>
        </figure>

        <dl className="geometry-readout" aria-live="polite">
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--layout" />
              Layout viewport
            </dt>
            <dd>
              {geometry === null
                ? 'Pending'
                : formatSize(geometry.layout.width, geometry.layout.height)}
            </dd>
          </div>
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--visual" />
              Visual viewport
            </dt>
            <dd>
              <span data-testid="visual-height">
                {geometry === null ? 'Pending' : `${round(geometry.visual.height)} px`}
              </span>
              {geometry === null ? null : (
                <small>
                  {round(geometry.visual.width)} wide · offset {round(geometry.visual.offsetLeft)},
                  {round(geometry.visual.offsetTop)} · scale {geometry.visual.scale.toFixed(2)}
                </small>
              )}
            </dd>
          </div>
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--safe" />
              Safe area
            </dt>
            <dd>
              {geometry === null
                ? 'Pending'
                : `${geometry.safeArea.top} / ${geometry.safeArea.right} / ${geometry.safeArea.bottom} / ${geometry.safeArea.left} px`}
            </dd>
          </div>
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--keyboard" />
              Keyboard occlusion
            </dt>
            <dd data-testid="keyboard-height">
              {geometry === null ? 'Pending' : `${round(geometry.keyboard.height)} px`}
            </dd>
          </div>
        </dl>
      </div>

      <fieldset className="simulation-controls">
        <legend>Desktop simulation</legend>
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={simulation.enabled}
            onChange={(event) =>
              setSimulation((current) => ({ ...current, enabled: event.target.checked }))
            }
          />
          <span>Use simulated geometry</span>
        </label>
        <label>
          <span>Visible viewport height</span>
          <input
            type="range"
            min="360"
            max="760"
            step="10"
            value={simulation.visualHeight}
            disabled={!simulation.enabled}
            onChange={(event) => {
              const visualHeight = Number(event.target.value)
              setSimulation((current) => ({
                ...current,
                visualHeight,
                keyboardHeight: Math.min(current.keyboardHeight, 800 - visualHeight),
              }))
            }}
          />
          <output>{simulation.visualHeight} px</output>
        </label>
        <label>
          <span>Keyboard occlusion height</span>
          <input
            type="range"
            min="0"
            max={keyboardMaximum}
            step="10"
            value={simulation.keyboardHeight}
            disabled={!simulation.enabled}
            onChange={(event) =>
              setSimulation((current) => ({
                ...current,
                keyboardHeight: Number(event.target.value),
              }))
            }
          />
          <output>{simulation.keyboardHeight} px</output>
        </label>
      </fieldset>
    </section>
  )
}

function geometryFromViewport(viewport: ViewportState): GeometryModel | null {
  if (!viewport.ready || viewport.layout === null || viewport.visual === null) return null

  return {
    layout: viewport.layout,
    visual: viewport.visual,
    safeArea: viewport.safeArea,
    keyboard: viewport.keyboard,
  }
}

function simulatedGeometry(simulation: SimulationState): GeometryModel {
  const keyboardHeight = Math.min(simulation.keyboardHeight, 800 - simulation.visualHeight)
  return {
    layout: { width: 390, height: 800 },
    visual: {
      width: 366,
      height: simulation.visualHeight,
      offsetTop: 28,
      offsetLeft: 12,
      scale: 1,
    },
    safeArea: { top: 18, right: 10, bottom: simulation.safeBottom, left: 10 },
    keyboard: { open: keyboardHeight > 0, height: keyboardHeight },
  }
}

function formatSize(width: number, height: number): string {
  return `${round(width)} × ${round(height)} px`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
