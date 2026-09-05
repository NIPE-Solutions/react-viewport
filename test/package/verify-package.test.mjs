import assert from 'node:assert/strict'
import { before, test } from 'node:test'

import { verifyPackage } from '../../scripts/verify-package.mjs'

let verification

before(async () => {
  verification = await verifyPackage()
})

test('the packed archive contains only distributable artifacts', () => {
  assert.ok(verification.files.includes('package.json'))
  assert.ok(verification.files.includes('README.md'))
  assert.ok(verification.files.includes('CHANGELOG.md'))
  assert.ok(verification.files.includes('LICENSE'))
  assert.ok(verification.files.some((file) => file.startsWith('dist/')))
  assert.ok(
    verification.files.every(
      (file) =>
        file === 'package.json' ||
        file.startsWith('dist/') ||
        /^(?:changelog|license|readme)(?:\..+)?$/i.test(file),
    ),
  )
})

test('the packed export map resolves ESM, CommonJS, and declarations', () => {
  assert.deepEqual(verification.exports, {
    import: './dist/index.js',
    require: './dist/index.cjs',
    types: './dist/index.d.ts',
  })
})

test('the runtime bundles externalize every React entry point', () => {
  assert.deepEqual(verification.bareImports.esm, ['react', 'react/jsx-runtime'])
  assert.deepEqual(verification.bareImports.cjs, ['react', 'react/jsx-runtime'])
})

test('ESM and CommonJS consumers import safely without browser globals', () => {
  assert.deepEqual(verification.consumers.slice(0, 2), ['esm', 'cjs'])
})

test('React 18 server rendering and hydration exercise the installed tarball and types', () => {
  assert.equal(verification.consumers[2], 'react18')
})

test('React 19 Vite and Next.js consumers compile against the installed tarball', () => {
  assert.deepEqual(verification.consumers.slice(3), ['vite', 'next'])
})
