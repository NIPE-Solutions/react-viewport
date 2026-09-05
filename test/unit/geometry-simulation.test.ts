import { describe, expect, it } from 'vitest'

import {
  createScenarioGeometry,
  getSimulationBottomOcclusion,
  geometryScenarios,
  validateCustomGeometry,
} from '../../website/components/geometry-simulation.js'

describe('geometry demo scenarios', () => {
  it.each([
    ['normal', 800, 0, false],
    ['browser-chrome', 720, 0, false],
    ['soft-keyboard', 500, 300, true],
    ['shifted-keyboard', 472, 300, true],
    ['zoom', 400, 0, false],
  ] as const)('keeps the %s scenario coherent', (scenario, visualHeight, keyboardHeight, open) => {
    const geometry = createScenarioGeometry(scenario)

    expect(geometry.visual.height).toBe(visualHeight)
    expect(geometry.keyboard).toEqual({ open, height: keyboardHeight })
    expect(geometry.keyboard.height).toBeGreaterThanOrEqual(0)
    expect(geometry.keyboard.open || geometry.keyboard.height === 0).toBe(true)
  })

  it('includes visual offsetTop when calculating bottom occlusion', () => {
    expect(
      getSimulationBottomOcclusion({
        layoutHeight: 800,
        visualOffsetTop: 28,
        visualHeight: 472,
      }),
    ).toBe(300)
  })

  it('clamps elastic geometry to zero bottom occlusion', () => {
    expect(
      getSimulationBottomOcclusion({
        layoutHeight: 800,
        visualOffsetTop: 28,
        visualHeight: 790,
      }),
    ).toBe(0)
  })

  it('marks preset keyboard values as derived', () => {
    expect(geometryScenarios['soft-keyboard'].keyboardSource).toBe('derived')
    expect(geometryScenarios['shifted-keyboard'].keyboardSource).toBe('derived')
  })

  it('warns when custom keyboard height disagrees with visual bottom occlusion', () => {
    const geometry = createScenarioGeometry('custom', {
      layoutWidth: 390,
      layoutHeight: 800,
      visualWidth: 390,
      visualHeight: 620,
      visualOffsetTop: 28,
      visualOffsetLeft: 0,
      visualScale: 1,
      keyboardHeight: 180,
      safeTop: 0,
      safeRight: 0,
      safeBottom: 24,
      safeLeft: 0,
    })

    expect(
      getSimulationBottomOcclusion({
        layoutHeight: geometry.layout.height,
        visualHeight: geometry.visual.height,
        visualOffsetTop: geometry.visual.offsetTop,
      }),
    ).toBe(152)
    expect(validateCustomGeometry(geometry)).toBe(
      'This custom keyboard occlusion does not match the current bottom occlusion (152 px).',
    )
  })
})
