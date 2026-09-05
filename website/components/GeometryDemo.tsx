'use client'

import { useMemo, useState, type CSSProperties } from 'react'

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

const fallbackGeometry: GeometryModel = {
  layout: { width: 390, height: 800 },
  visual: {
    width: 366,
    height: 720,
    offsetTop: 28,
    offsetLeft: 12,
    scale: 1,
  },
  safeArea: { top: 18, right: 10, bottom: 24, left: 10 },
  keyboard: { open: false, height: 0 },
}

export function GeometryDemo() {
  const viewport = useViewport()
  const [simulation, setSimulation] = useState<SimulationState>({
    enabled: false,
    visualHeight: 620,
    keyboardHeight: 0,
    safeBottom: 24,
  })

  const realGeometry = geometryFromViewport(viewport) ?? fallbackGeometry
  const geometry = useMemo(
    () => (simulation.enabled ? simulatedGeometry(simulation) : realGeometry),
    [realGeometry, simulation],
  )
  const styles = diagramStyles(geometry)

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
        <output className="mode-indicator" data-testid="geometry-mode">
          {simulation.enabled ? 'Simulated geometry' : 'Live browser measurement'}
        </output>
      </header>

      <div className="geometry-demo__body">
        <figure
          className="coordinate-plane"
          style={styles}
          role="img"
          aria-label="Nested viewport coordinate plane showing layout viewport, visual viewport, safe area, and keyboard occlusion"
        >
          <div className="layout-plane" aria-hidden="true">
            <span className="plane-label plane-label--layout">layout</span>
            <div className="visual-plane">
              <span className="safe-band safe-band--top" />
              <span className="safe-band safe-band--right" />
              <span className="safe-band safe-band--bottom" />
              <span className="safe-band safe-band--left" />
              <span className="plane-label plane-label--visual">visual</span>
            </div>
            <div className="keyboard-plane">
              <span>keyboard occlusion</span>
            </div>
          </div>
          <figcaption>Origin 0,0 · one unit equals one CSS pixel before diagram scaling</figcaption>
        </figure>

        <dl className="geometry-readout" aria-live="polite">
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--layout" />
              Layout viewport
            </dt>
            <dd>{formatSize(geometry.layout.width, geometry.layout.height)}</dd>
          </div>
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--visual" />
              Visual viewport
            </dt>
            <dd>
              <span data-testid="visual-height">{round(geometry.visual.height)} px</span>
              <small>
                {round(geometry.visual.width)} wide · offset {round(geometry.visual.offsetLeft)},
                {round(geometry.visual.offsetTop)} · scale {geometry.visual.scale.toFixed(2)}
              </small>
            </dd>
          </div>
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--safe" />
              Safe area
            </dt>
            <dd>
              {geometry.safeArea.top} / {geometry.safeArea.right} / {geometry.safeArea.bottom} /{' '}
              {geometry.safeArea.left} px
            </dd>
          </div>
          <div>
            <dt>
              <i className="legend-swatch legend-swatch--keyboard" />
              Keyboard occlusion
            </dt>
            <dd data-testid="keyboard-height">{round(geometry.keyboard.height)} px</dd>
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
            onChange={(event) =>
              setSimulation((current) => ({
                ...current,
                visualHeight: Number(event.target.value),
              }))
            }
          />
          <output>{simulation.visualHeight} px</output>
        </label>
        <label>
          <span>Keyboard occlusion height</span>
          <input
            type="range"
            min="0"
            max="360"
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

function diagramStyles(geometry: GeometryModel): CSSProperties {
  const percent = (value: number, total: number) => `${(value / total) * 100}%`
  return {
    aspectRatio: `${geometry.layout.width} / ${geometry.layout.height}`,
    '--visual-width': percent(geometry.visual.width, geometry.layout.width),
    '--visual-height': percent(geometry.visual.height, geometry.layout.height),
    '--visual-top': percent(geometry.visual.offsetTop, geometry.layout.height),
    '--visual-left': percent(geometry.visual.offsetLeft, geometry.layout.width),
    '--safe-top': percent(geometry.safeArea.top, geometry.layout.height),
    '--safe-right': percent(geometry.safeArea.right, geometry.layout.width),
    '--safe-bottom': percent(geometry.safeArea.bottom, geometry.layout.height),
    '--safe-left': percent(geometry.safeArea.left, geometry.layout.width),
    '--keyboard-height': percent(geometry.keyboard.height, geometry.layout.height),
  } as CSSProperties
}

function formatSize(width: number, height: number): string {
  return `${round(width)} × ${round(height)} px`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
