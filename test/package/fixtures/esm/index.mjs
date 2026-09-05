import assert from 'node:assert/strict'

for (const name of ['window', 'document', 'navigator']) {
  Reflect.deleteProperty(globalThis, name)
}

const viewport = await import('@nipe-solutions/react-viewport')

assert.deepEqual(Object.keys(viewport).sort(), [
  'ViewportProvider',
  'useViewport',
  'useViewportCssVariables',
])
assert.equal('window' in globalThis, false)
assert.equal('document' in globalThis, false)
assert.equal('navigator' in globalThis, false)
