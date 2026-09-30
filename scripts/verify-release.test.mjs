import assert from 'node:assert/strict'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { assertCleanWorkingTree, validateReleaseMetadata } from './verify-release.mjs'
import * as release from './verify-release.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const releaseScript = path.join(repositoryRoot, 'scripts/verify-release.mjs')

const stablePackage = {
  name: '@nipe-solutions/react-viewport',
  version: '1.0.0',
  publishConfig: { access: 'public', provenance: true, tag: 'latest' },
}
const stableChangelog = '# Changelog\n\n## 1.0.0\n\nStable release.\n'

test('release metadata requires the git tag to exactly match the package version', () => {
  assert.throws(
    () =>
      validateReleaseMetadata({
        packageJson: stablePackage,
        changelog: stableChangelog,
        gitTag: 'v1.0.1',
        distTag: 'latest',
      }),
    /does not match package version/,
  )
})

test('release metadata requires a changelog heading for the package version', () => {
  assert.throws(
    () =>
      validateReleaseMetadata({
        packageJson: stablePackage,
        changelog: '# Changelog\n',
        gitTag: 'v1.0.0',
        distTag: 'latest',
      }),
    /Changelog has no heading/,
  )
})

test('stable releases require exactly 1.0.0 with public latest and provenance policy', () => {
  for (const patch of [
    { name: '@other/package' },
    { version: '1.0.0-alpha.0' },
    { version: '1.0.1' },
    { private: true },
    { publishConfig: { access: 'restricted', provenance: true, tag: 'latest' } },
    { publishConfig: { access: 'public', provenance: false, tag: 'latest' } },
    { publishConfig: { access: 'public', provenance: true, tag: 'alpha' } },
  ]) {
    assert.throws(() =>
      validateReleaseMetadata({
        packageJson: { ...stablePackage, ...patch },
        changelog: stableChangelog,
        gitTag: `v${patch.version ?? '1.0.0'}`,
        distTag: 'latest',
      }),
    )
  }
  assert.throws(
    () =>
      validateReleaseMetadata({
        packageJson: stablePackage,
        changelog: stableChangelog,
        gitTag: 'v1.0.0',
        distTag: 'alpha',
      }),
    /latest/,
  )
})

test('a publishing check rejects a dirty tree while a dry run may inspect one', () => {
  assert.throws(
    () => assertCleanWorkingTree(' M package.json\n', false),
    /working tree is not clean/,
  )
  assert.doesNotThrow(() => assertCleanWorkingTree(' M package.json\n', true))
})

test('the guarded dry run inspects the tarball and never invokes npm publish', async (context) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'react-viewport-release-test-'))
  context.after(() => rm(temporaryRoot, { force: true, recursive: true }))

  const binDirectory = path.join(temporaryRoot, 'bin')
  const fixtureDirectory = path.join(temporaryRoot, 'fixture')
  const callLog = path.join(temporaryRoot, 'npm-calls.jsonl')
  await import('node:fs/promises').then(({ mkdir }) =>
    Promise.all([mkdir(binDirectory), mkdir(fixtureDirectory)]),
  )
  await writeFile(path.join(fixtureDirectory, 'package.json'), `${JSON.stringify(stablePackage)}\n`)
  await writeFile(path.join(fixtureDirectory, 'CHANGELOG.md'), stableChangelog)

  const fakeNpm = `#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.RELEASE_TEST_CALL_LOG, JSON.stringify(process.argv.slice(2)) + '\\n')
if (process.argv[2] !== 'pack') process.exit(91)
process.stdout.write(JSON.stringify([{ filename: 'nipe-solutions-react-viewport-1.0.0.tgz', name: '@nipe-solutions/react-viewport', version: '1.0.0', size: 1234, unpackedSize: 5678, entryCount: 4, files: [{ path: 'LICENSE' }, { path: 'README.md' }, { path: 'dist/index.js' }, { path: 'package.json' }] }]))
`
  const fakeNpmPath = path.join(binDirectory, 'npm')
  await writeFile(fakeNpmPath, fakeNpm)
  await chmod(fakeNpmPath, 0o755)

  const result = spawnSync(
    process.execPath,
    [
      releaseScript,
      '--dry-run',
      '--root',
      fixtureDirectory,
      '--tag',
      'v1.0.0',
      '--dist-tag',
      'latest',
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_REF_NAME: 'ambient-branch-name-must-not-be-used',
        PATH: `${binDirectory}${path.delimiter}${process.env.PATH ?? ''}`,
        RELEASE_TEST_CALL_LOG: callLog,
      },
    },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Tarball: .*1234 bytes, 4 files/)
  assert.match(result.stdout, /Publish skipped \(dry run\)\./)

  const calls = (await readFile(callLog, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  assert.deepEqual(calls, [['pack', '--dry-run', '--json', '--ignore-scripts']])
})

test('npm availability accepts only a structured public-registry E404', () => {
  assert.equal(typeof release.ensureVersionIsUnpublished, 'function')
  const results = [
    { status: 0, stdout: '"1.0.0"' },
    { status: 1, stdout: '{"error":{"code":"E401"}}' },
    { status: 1, stdout: 'E404 not found' },
    { status: 1, stdout: '{"error":{"code":"E404"}}', signal: 'SIGTERM' },
    { status: 2, stdout: '{"error":{"code":"E404"}}' },
    { status: 1, stdout: '{"error":{"code":"E404"}}', error: new Error('timeout') },
  ]
  for (const result of results) {
    assert.throws(() =>
      release.ensureVersionIsUnpublished(stablePackage.name, '1.0.0', () => result),
    )
  }
  assert.doesNotThrow(() =>
    release.ensureVersionIsUnpublished(stablePackage.name, '1.0.0', (command, args, options) => {
      assert.equal(command, 'npm')
      assert.deepEqual(args, [
        'view',
        '@nipe-solutions/react-viewport@1.0.0',
        'version',
        '--json',
        '--registry=https://registry.npmjs.org',
      ])
      assert.equal(options.env.NPM_CONFIG_USERCONFIG, '/dev/null')
      assert.equal(options.timeout, 30_000)
      return { status: 1, stdout: '{"error":{"code":"E404"}}' }
    }),
  )
})

test('current-main guard rejects stale HEAD, stale remote, malformed or unavailable lookups', () => {
  assert.equal(typeof release.verifyCurrentMain, 'function')
  const sha = 'a'.repeat(40)
  const env = {
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REF: 'refs/heads/main',
    GITHUB_SHA: sha,
  }
  const run = (command, args) =>
    args[0] === 'rev-parse' ? `${sha}\n` : `${sha}\trefs/heads/main\n`
  assert.equal(release.verifyCurrentMain({ env, run }), sha)
  for (const patch of [
    { GITHUB_EVENT_NAME: 'push' },
    { GITHUB_REF: 'refs/tags/v1.0.0' },
    { GITHUB_SHA: 'bad' },
    { GITHUB_SHA: 'b'.repeat(40) },
  ])
    assert.throws(() => release.verifyCurrentMain({ env: { ...env, ...patch }, run }))
  for (const remote of [
    `${'b'.repeat(40)}\trefs/heads/main\n`,
    `${sha}\trefs/heads/main\n${sha}\trefs/heads/main\n`,
    `${sha}\trefs/heads/feature\n`,
    '',
  ]) {
    assert.throws(() =>
      release.verifyCurrentMain({
        env,
        run: (command, args) => (args[0] === 'rev-parse' ? `${sha}\n` : remote),
      }),
    )
  }
  assert.throws(() =>
    release.verifyCurrentMain({
      env,
      run: () => {
        throw new Error('offline')
      },
    }),
  )
})
