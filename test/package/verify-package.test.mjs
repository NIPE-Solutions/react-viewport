import assert from 'node:assert/strict'
import { before, test } from 'node:test'

import { verifyPackage } from '../../scripts/verify-package.mjs'

let verification

before(async () => {
  verification = await verifyPackage()
})

test('the packed archive contains only distributable artifacts', () => {
  assert.ok(verification.files.includes('package.json'))
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

test('Vite and Next.js compile against the installed tarball', () => {
  assert.deepEqual(verification.consumers.slice(2), ['vite', 'next'])
})
