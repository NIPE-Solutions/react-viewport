import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  assertReactIsExternal,
  reportBundleMeasurements,
} from '../../scripts/check-bundle-size.mjs'
import { collectDeclarationExports } from '../../scripts/check-public-api.mjs'
import { assertNoRuntimeDependencies } from '../../scripts/verify-package.mjs'

const expectedExports = `
  export type { KeyboardState, LayoutViewport, SafeAreaInsets,
    ViewportCssVariablesOptions, ViewportOrientation, ViewportProviderProps,
    ViewportState, ViewportSupport, VisualViewportState } from './types.js'
  export { ViewportProvider } from './ViewportProvider.js'
  export { useViewport } from './useViewport.js'
  export { useViewportCssVariables } from './useViewportCssVariables.js'
`

test('public API collection rejects inline exported declarations', () => {
  assert.throws(
    () => collectDeclarationExports(`${expectedExports}\nexport interface LeakedType {}`),
    /named export declarations only/,
  )
})

test('public API collection rejects a default interface declaration', () => {
  assert.throws(
    () =>
      collectDeclarationExports(`${expectedExports}\nexport default interface LeakedDefault {}`),
    /named export declarations only/,
  )
})

test('package verification accepts only absent or empty runtime dependencies', () => {
  assert.doesNotThrow(() => assertNoRuntimeDependencies({}))
  assert.doesNotThrow(() => assertNoRuntimeDependencies({ dependencies: {} }))
  assert.throws(
    () => assertNoRuntimeDependencies({ dependencies: { 'non-react-package': '1.0.0' } }),
    /runtime dependencies/i,
  )
})

test('bundle verification rejects dynamic bare imports in every output format', () => {
  assert.throws(
    () =>
      assertReactIsExternal(
        `import 'react'; import 'react/jsx-runtime'; import('non-react-package')`,
        'esm',
      ),
    /Unexpected bare esm imports: non-react-package/,
  )
  assert.throws(
    () =>
      assertReactIsExternal(
        `require('react'); require('react/jsx-runtime'); import('non-react-package')`,
        'cjs',
      ),
    /Unexpected bare cjs imports: non-react-package/,
  )
})

test('bundle size reporting prints every measurement and limit before failing', () => {
  const lines = []

  assert.throws(
    () =>
      reportBundleMeasurements({ esm: 12_986, gzip: 3_961, tarball: 14_884 }, (line) =>
        lines.push(line),
      ),
    /esm size 12986 exceeds 12985 byte limit/,
  )
  assert.deepEqual(lines, [
    'esm: 12986 bytes (limit 12985 bytes)',
    'gzip: 3961 bytes (limit 3960 bytes)',
    'tarball: 14884 bytes (limit 14883 bytes)',
  ])
})
