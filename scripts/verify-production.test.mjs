import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getBuildIdentity } from './build-identity.mjs'
import { URL } from 'node:url'

import { verifyProduction } from './verify-production.mjs'

const commit = 'a'.repeat(40)
const marker = {
  commit,
  builtAt: '2026-09-06T00:00:00.000Z',
  dirty: false,
  version: '0.1.0-alpha.0',
}
const origins = ['https://custom.example', 'https://origin.example']

function fixture(overrides = {}) {
  return async (input) => {
    const url = new URL(input)
    const route = url.pathname
    let status = route === '/__deployment-smoke-missing__' ? 404 : 200
    let text =
      route === '/__deployment-smoke-missing__'
        ? 'Page not found'
        : `
      <meta name="build-sha" content="${commit}">
      Keep mobile UI above the software keyboard. Live Device Lab Chat composer
      <script src="/asset.js"></script>`
    let json = { ...marker }
    const change = overrides[route] ?? overrides[url.origin]
    if (change) ({ status = status, text = text, json = json } = change)
    return { status, text: async () => text, json: async () => json }
  }
}

test('production verifier accepts matching aliases, HTML markers, assets and 404', async () => {
  const result = await verifyProduction(commit, { origins, fetch: fixture(), report: () => {} })
  assert.deepEqual(result, [marker, marker])
})

for (const [name, changes, message] of [
  ['stale deployment', { '/build.json': { json: { ...marker, commit: 'b'.repeat(40) } } }, /stale/],
  ['mixed HTML and marker', { '/lab': { text: 'Live Device Lab' } }, /HTML\/marker mismatch/],
  ['wrong root', { '/': { text: 'unrelated website' } }, /wrong website artifact/],
  ['missing asset', { '/asset.js': { status: 404 } }, /missing asset/],
  [
    'homepage fallback on unknown route',
    { '/__deployment-smoke-missing__': { status: 200 } },
    /must return 404/,
  ],
  [
    'dirty production source',
    { '/build.json': { json: { ...marker, dirty: true } } },
    /clean checkout/,
  ],
]) {
  test(`production verifier rejects ${name}`, async () => {
    await assert.rejects(
      verifyProduction(commit, { origins, fetch: fixture(changes), report: () => {} }),
      message,
    )
  })
}

test('source snapshots may explicitly report unknown worktree cleanliness', async () => {
  await verifyProduction(commit, {
    origins,
    fetch: fixture({ '/build.json': { json: { ...marker, dirty: null } } }),
    report: () => {},
  })
})

test('hosted build identity works without .git and never fabricates a clean state', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'viewport-build-identity-'))
  try {
    const identity = getBuildIdentity({ cwd, env: { VERCEL_GIT_COMMIT_SHA: commit } })
    assert.equal(identity.commit, commit)
    assert.equal(identity.dirty, null)
    assert.ok(Number.isFinite(Date.parse(identity.builtAt)))
    assert.throws(() => getBuildIdentity({ cwd, env: {} }))
    assert.throws(
      () => getBuildIdentity({ cwd, env: { GITHUB_SHA: 'invalid' } }),
      /full Git commit/,
    )
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
})
