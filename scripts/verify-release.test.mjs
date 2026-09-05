import assert from 'node:assert/strict'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { assertCleanWorkingTree, validateReleaseMetadata } from './verify-release.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const releaseScript = path.join(repositoryRoot, 'scripts/verify-release.mjs')

const alphaPackage = {
  name: '@nipe-solutions/react-viewport',
  version: '0.1.0-alpha.0',
}
const alphaChangelog = '# Changelog\n\n## 0.1.0-alpha.0\n\nInitial alpha.\n'

test('release metadata requires the git tag to exactly match the package version', () => {
  assert.throws(
    () =>
      validateReleaseMetadata({
        packageJson: alphaPackage,
        changelog: alphaChangelog,
        gitTag: 'v0.1.0-alpha.1',
        distTag: 'alpha',
      }),
    /does not match package version/,
  )
})

test('release metadata requires a changelog heading for the package version', () => {
  assert.throws(
    () =>
      validateReleaseMetadata({
        packageJson: alphaPackage,
        changelog: '# Changelog\n',
        gitTag: 'v0.1.0-alpha.0',
        distTag: 'alpha',
      }),
    /Changelog has no heading/,
  )
})

test('alpha versions can only use the alpha npm dist-tag', () => {
  assert.throws(
    () =>
      validateReleaseMetadata({
        packageJson: alphaPackage,
        changelog: alphaChangelog,
        gitTag: 'v0.1.0-alpha.0',
        distTag: 'latest',
      }),
    /must use the alpha npm dist-tag/,
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
  await writeFile(path.join(fixtureDirectory, 'package.json'), `${JSON.stringify(alphaPackage)}\n`)
  await writeFile(path.join(fixtureDirectory, 'CHANGELOG.md'), alphaChangelog)

  const fakeNpm = `#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.RELEASE_TEST_CALL_LOG, JSON.stringify(process.argv.slice(2)) + '\\n')
if (process.argv[2] !== 'pack') process.exit(91)
process.stdout.write(JSON.stringify([{ filename: 'nipe-solutions-react-viewport-0.1.0-alpha.0.tgz', name: '@nipe-solutions/react-viewport', version: '0.1.0-alpha.0', size: 1234, unpackedSize: 5678, entryCount: 4, files: [{ path: 'LICENSE' }, { path: 'README.md' }, { path: 'dist/index.js' }, { path: 'package.json' }] }]))
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
      'v0.1.0-alpha.0',
      '--dist-tag',
      'alpha',
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
  assert.deepEqual(calls, [['pack', '--dry-run', '--json']])
})
