'use client'

import { useMemo, useState } from 'react'
import { useViewport, type ViewportState } from '@nipe-solutions/react-viewport'
import {
  createScenarioGeometry,
  defaultCustomGeometry,
  geometryScenarios,
  getSimulationBottomOcclusion,
  validateCustomGeometry,
  type CustomGeometryInput,
  type GeometryModel,
  type GeometryScenario,
} from './geometry-simulation'

type DemoMode = 'live' | GeometryScenario
const scenarioOrder: readonly GeometryScenario[] = [
  'normal',
  'browser-chrome',
  'soft-keyboard',
  'shifted-keyboard',
  'zoom',
  'custom',
]
const customFields: ReadonlyArray<{
  key: keyof CustomGeometryInput
  label: string
  min?: number
  step?: number
}> = [
  { key: 'layoutWidth', label: 'Layout viewport width', min: 0 },
  { key: 'layoutHeight', label: 'Layout viewport height', min: 0 },
  { key: 'visualWidth', label: 'Visual viewport width', min: 0 },
  { key: 'visualHeight', label: 'Visual viewport height', min: 0 },
  { key: 'visualOffsetTop', label: 'Visual viewport offset top' },
  { key: 'visualOffsetLeft', label: 'Visual viewport offset left' },
  { key: 'visualScale', label: 'Visual viewport scale', min: 0, step: 0.1 },
  { key: 'keyboardHeight', label: 'Keyboard occlusion', min: 0 },
  { key: 'safeTop', label: 'Safe area top', min: 0 },
  { key: 'safeRight', label: 'Safe area right', min: 0 },
  { key: 'safeBottom', label: 'Safe area bottom', min: 0 },
  { key: 'safeLeft', label: 'Safe area left', min: 0 },
]

export function GeometryDemo() {
  const viewport = useViewport()
  const [mode, setMode] = useState<DemoMode>('live')
  const [custom, setCustom] = useState<CustomGeometryInput>(defaultCustomGeometry)
  const realGeometry = geometryFromViewport(viewport)
  const geometry = useMemo(
    () => (mode === 'live' ? realGeometry : createScenarioGeometry(mode, custom)),
    [custom, mode, realGeometry],
  )
  const customWarning =
    mode === 'custom' && geometry !== null ? validateCustomGeometry(geometry) : null
  const bottomOcclusion =
    geometry === null
      ? null
      : getSimulationBottomOcclusion({
          layoutHeight: geometry.layout.height,
          visualHeight: geometry.visual.height,
          visualOffsetTop: geometry.visual.offsetTop,
        })
  const modeLabel =
    mode === 'live'
      ? geometry === null
        ? 'Initializing viewport measurement'
        : 'Live browser geometry'
      : `Geometry simulator · ${mode === 'custom' ? 'Custom' : geometryScenarios[mode].label}`

  return (
    <section className="geometry-demo" aria-labelledby="geometry-heading">
      <header className="geometry-demo__header">
        <div>
          <h2 id="geometry-heading">One screen, four measured regions</h2>
          <p>
            Layout, visual viewport, keyboard occlusion, and safe area stay separate. The drawing is
            a coordinate plane, not a device mockup.
          </p>
        </div>
        <output
          className="mode-indicator"
          data-state={geometry === null ? 'pending' : 'ready'}
          data-testid="geometry-mode"
        >
          {modeLabel}
        </output>
      </header>

      <div className="geometry-demo__body">
        <GeometryPlane geometry={geometry} />
        <GeometryReadout geometry={geometry} bottomOcclusion={bottomOcclusion} mode={mode} />
      </div>

      <div className="geometry-formula">
        <span>Bottom occlusion</span>
        <code>layoutHeight - (visualOffsetTop + visualHeight)</code>
      </div>

      <fieldset className="scenario-controls">
        <legend>View</legend>
        <div className="scenario-selector" aria-label="Geometry view">
          <button type="button" aria-pressed={mode === 'live'} onClick={() => setMode('live')}>
            Live browser
          </button>
          {scenarioOrder.map((scenarioName) => (
            <button
              type="button"
              aria-pressed={mode === scenarioName}
              key={scenarioName}
              onClick={() => setMode(scenarioName)}
            >
              {scenarioName === 'custom' ? 'Custom' : geometryScenarios[scenarioName].label}
            </button>
          ))}
        </div>
        <p className="scenario-description" data-testid="scenario-description">
          {mode === 'live'
            ? 'Measured by the library in your current browser. Simulator controls do not change it.'
            : mode === 'custom'
              ? 'Custom geometry can represent states that do not correspond to a typical real browser configuration.'
              : geometryScenarios[mode].description}
        </p>
        {mode === 'custom' ? (
          <div className="custom-geometry-controls">
            {customFields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  type="number"
                  min={field.min}
                  step={field.step ?? 1}
                  value={custom[field.key]}
                  onChange={(event) =>
                    setCustom((current) => ({
                      ...current,
                      [field.key]: Number(event.target.value),
                    }))
                  }
                />
                <small>{field.key === 'visualScale' ? '×' : 'px'}</small>
              </label>
            ))}
          </div>
        ) : null}
        {customWarning === null ? null : (
          <p className="geometry-warning" role="status" data-testid="custom-warning">
            {customWarning}
          </p>
        )}
      </fieldset>
    </section>
  )
}

function GeometryPlane({ geometry }: { readonly geometry: GeometryModel | null }) {
  const summary =
    geometry === null
      ? 'Nested viewport coordinate plane awaiting its first browser measurement'
      : `Layout viewport ${round(geometry.layout.width)} by ${round(geometry.layout.height)}. Visual viewport ${round(geometry.visual.width)} by ${round(geometry.visual.height)} at offset ${round(geometry.visual.offsetLeft)}, ${round(geometry.visual.offsetTop)}. Scale ${round(geometry.visual.scale)}. Keyboard occlusion ${round(geometry.keyboard.height)} pixels.`
  return (
    <figure className="coordinate-plane" role="img" aria-label={summary}>
      <svg className="coordinate-plane__sizer" width="100vw" height="100vh" aria-hidden="true" />
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
            {geometry.keyboard.open ? (
              <rect
                className="keyboard-plane"
                data-testid="keyboard-region"
                x="0"
                y={geometry.layout.height - geometry.keyboard.height}
                width={geometry.layout.width}
                height={geometry.keyboard.height}
              />
            ) : null}
          </svg>
          <span className="plane-label plane-label--layout" aria-hidden="true">
            layout
          </span>
          <span className="plane-label plane-label--visual" aria-hidden="true">
            visual
          </span>
          {geometry.keyboard.open ? (
            <span className="plane-label plane-label--keyboard" aria-hidden="true">
              keyboard occlusion
            </span>
          ) : null}
        </>
      )}
      <figcaption>Origin 0,0 · one unit equals one CSS pixel before diagram scaling</figcaption>
    </figure>
  )
}

function GeometryReadout({
  geometry,
  bottomOcclusion,
  mode,
}: {
  readonly geometry: GeometryModel | null
  readonly bottomOcclusion: number | null
  readonly mode: DemoMode
}) {
  const derived = mode === 'soft-keyboard' || mode === 'shifted-keyboard'
  return (
    <dl className="geometry-readout" aria-live="polite">
      <Readout
        label="Layout viewport"
        kind="layout"
        value={
          geometry === null ? 'Pending' : formatSize(geometry.layout.width, geometry.layout.height)
        }
      />
      <Readout
        label="Visual viewport"
        kind="visual"
        value={geometry === null ? 'Pending' : `${round(geometry.visual.height)} px`}
        detail={
          geometry === null
            ? undefined
            : `${round(geometry.visual.width)} wide · offset ${round(geometry.visual.offsetLeft)}, ${round(geometry.visual.offsetTop)} · scale ${geometry.visual.scale.toFixed(2)}`
        }
        testId="visual-height"
      />
      <Readout
        label="Safe area"
        kind="safe"
        value={
          geometry === null
            ? 'Pending'
            : `${geometry.safeArea.top} / ${geometry.safeArea.right} / ${geometry.safeArea.bottom} / ${geometry.safeArea.left} px`
        }
      />
      <Readout
        label="Bottom occlusion"
        kind="keyboard"
        value={bottomOcclusion === null ? 'Pending' : `${round(bottomOcclusion)} px`}
        testId="bottom-occlusion"
      />
      <Readout
        label="Keyboard occlusion"
        kind="keyboard"
        value={geometry === null ? 'Pending' : `${round(geometry.keyboard.height)} px`}
        detail={
          derived
            ? 'Derived from visual geometry'
            : geometry?.keyboard.open
              ? 'Custom value'
              : 'No keyboard inferred'
        }
        testId="keyboard-height"
      />
    </dl>
  )
}

function Readout({
  label,
  kind,
  value,
  detail,
  testId,
}: {
  readonly label: string
  readonly kind: 'layout' | 'visual' | 'safe' | 'keyboard'
  readonly value: string
  readonly detail?: string | undefined
  readonly testId?: string | undefined
}) {
  return (
    <div>
      <dt>
        <i className={`legend-swatch legend-swatch--${kind}`} />
        {label}
      </dt>
      <dd>
        <span data-testid={testId}>{value}</span>
        {detail === undefined ? null : <small>{detail}</small>}
      </dd>
    </div>
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
function formatSize(width: number, height: number): string {
  return `${round(width)} × ${round(height)} px`
}
function round(value: number): number {
  return Math.round(value * 10) / 10
}
