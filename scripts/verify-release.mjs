import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import console from 'node:console'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const defaultRepositoryRoot = path.resolve(scriptDirectory, '..')

export const releaseName = '@nipe-solutions/react-viewport'
export const releaseTarball = 'nipe-solutions-react-viewport-1.0.0.tgz'

export function npmEnvironment() {
  return { ...process.env, NPM_CONFIG_USERCONFIG: '/dev/null' }
}

export function validatePackageMetadata(packageJson) {
  assert.equal(packageJson?.name, releaseName, 'Unexpected release package name')
  assert.equal(packageJson.version, '1.0.0', 'This release requires exactly stable version 1.0.0')
  assert.notEqual(packageJson.private, true, 'Release package must not be private')
  assert.equal(packageJson.publishConfig?.access, 'public', 'Package access must be public')
  assert.equal(packageJson.publishConfig?.provenance, true, 'npm provenance must be enabled')
  assert.equal(packageJson.publishConfig?.tag, 'latest', 'npm dist-tag must be latest')
}

export function ensureVersionIsUnpublished(name, version, run = spawnSync) {
  assert.equal(name, releaseName, 'Unexpected registry package identity')
  assert.equal(version, '1.0.0', 'Unexpected registry package version')
  const result = run(
    'npm',
    ['view', `${name}@${version}`, 'version', '--json', '--registry=https://registry.npmjs.org'],
    { encoding: 'utf8', env: npmEnvironment(), timeout: 30_000 },
  )
  assert.notEqual(result.status, 0, `${name}@${version} already exists on npm`)
  let errorCode
  try {
    errorCode = JSON.parse(result.stdout)?.error?.code
  } catch {
    // Ambiguous lookup output cannot establish that publication is safe.
  }
  assert.ok(
    result.status === 1 && !result.error && !result.signal && errorCode === 'E404',
    `Could not verify npm publication state: ${String(result.stderr ?? '').trim()}`,
  )
}

export function verifyCurrentMain({
  env = process.env,
  run = execFileSync,
  root = defaultRepositoryRoot,
} = {}) {
  assert.equal(
    env.GITHUB_REF,
    'refs/heads/main',
    'Current main requires a manual dispatch from main',
  )
  assert.equal(
    env.GITHUB_EVENT_NAME,
    'workflow_dispatch',
    'Current main requires a manual dispatch from main',
  )
  assert.match(env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/, 'Current main requires a valid GitHub SHA')
  let head, remote
  try {
    head = run('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root, encoding: 'utf8' })
    remote = run('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/main'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
    })
  } catch (error) {
    throw new Error('Current main lookup failed', { cause: error })
  }
  const checkedOut = typeof head === 'string' ? /^([a-f0-9]{40})\r?\n?$/.exec(head)?.[1] : undefined
  const currentMain =
    typeof remote === 'string'
      ? /^([a-f0-9]{40})\trefs\/heads\/main\r?\n?$/.exec(remote)?.[1]
      : undefined
  assert.ok(
    checkedOut && currentMain,
    'Current main requires exactly one HEAD and remote refs/heads/main commit',
  )
  assert.ok(
    checkedOut === env.GITHUB_SHA && currentMain === checkedOut,
    'Current main rejected a stale or mismatched checkout; dispatch again from current main',
  )
  return checkedOut
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function validateReleaseMetadata({ packageJson, changelog, gitTag, distTag }) {
  validatePackageMetadata(packageJson)
  assert.equal(distTag, 'latest', 'Stable version 1.0.0 must use the latest npm dist-tag')

  const expectedGitTag = `v${packageJson.version}`
  assert.equal(
    gitTag,
    expectedGitTag,
    `Git tag ${JSON.stringify(gitTag)} does not match package version ${packageJson.version}`,
  )

  const changelogHeading = new RegExp(
    `^##\\s+(?:\\[)?${escapeRegularExpression(packageJson.version)}(?:\\])?(?:\\s|$)`,
    'm',
  )
  assert.match(
    changelog,
    changelogHeading,
    `Changelog has no heading for version ${packageJson.version}`,
  )

  return {
    packageName: packageJson.name,
    version: packageJson.version,
    gitTag,
    distTag,
  }
}

export function assertCleanWorkingTree(status, dryRun) {
  if (dryRun) {
    return
  }

  assert.equal(status.trim(), '', 'Release working tree is not clean')
}

export function parseArguments(arguments_) {
  const options = {
    distTag: undefined,
    dryRun: false,
    ensureUnpublished: false,
    currentMain: false,
    gitTag: undefined,
    repositoryRoot: defaultRepositoryRoot,
  }

  const seen = new Set()
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    assert.ok(!seen.has(argument), 'Duplicate release-check argument')
    seen.add(argument)

    if (argument === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (argument === '--ensure-unpublished') {
      options.ensureUnpublished = true
      continue
    }
    if (argument === '--verify-current-main') {
      options.currentMain = true
      continue
    }

    if (argument === '--tag' || argument === '--dist-tag' || argument === '--root') {
      const value = arguments_[index + 1]
      assert.ok(value, `${argument} requires a value`)
      index += 1

      if (argument === '--tag') options.gitTag = value
      if (argument === '--dist-tag') options.distTag = value
      if (argument === '--root') options.repositoryRoot = path.resolve(value)
      continue
    }

    assert.fail(`Unknown release-check argument: ${argument}`)
  }

  assert.ok(
    !options.currentMain || arguments_.length === 1,
    'Current main arguments cannot be combined',
  )

  return options
}

function readWorkingTreeStatus(repositoryRoot, dryRun) {
  try {
    return execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    if (dryRun) {
      return null
    }

    throw error
  }
}

function inspectTarball(repositoryRoot) {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    env: npmEnvironment(),
  })
  const [summary] = JSON.parse(output)

  assert.ok(summary, 'npm pack did not return a tarball summary')
  assert.equal(typeof summary.filename, 'string', 'npm pack did not report a filename')
  assert.equal(typeof summary.size, 'number', 'npm pack did not report a package size')
  assert.equal(typeof summary.entryCount, 'number', 'npm pack did not report a file count')

  return summary
}

export async function verifyRelease(arguments_ = process.argv.slice(2)) {
  const options = parseArguments(arguments_)
  if (options.currentMain) return verifyCurrentMain({ root: options.repositoryRoot })
  const packageJson = JSON.parse(
    await readFile(path.join(options.repositoryRoot, 'package.json'), 'utf8'),
  )
  const changelog = await readFile(path.join(options.repositoryRoot, 'CHANGELOG.md'), 'utf8')
  const gitTag = options.gitTag ?? `v${packageJson.version}`
  const distTag = options.distTag ?? 'latest'
  const metadata = validateReleaseMetadata({ packageJson, changelog, gitTag, distTag })
  const workingTreeStatus = readWorkingTreeStatus(options.repositoryRoot, options.dryRun)

  if (workingTreeStatus !== null) {
    assertCleanWorkingTree(workingTreeStatus, options.dryRun)
  }

  if (options.ensureUnpublished) ensureVersionIsUnpublished(metadata.packageName, metadata.version)
  const tarball = options.dryRun ? inspectTarball(options.repositoryRoot) : null
  console.log(
    `Release metadata: ${metadata.packageName}@${metadata.version}, ${metadata.gitTag}, npm tag ${metadata.distTag}`,
  )
  if (workingTreeStatus === null) {
    console.log('Working tree: unavailable outside a Git checkout (allowed for dry run).')
  } else if (workingTreeStatus.trim() === '') {
    console.log('Working tree: clean.')
  } else {
    console.log('Working tree: dirty (allowed for dry run only).')
  }
  if (tarball)
    console.log(`Tarball: ${tarball.filename}, ${tarball.size} bytes, ${tarball.entryCount} files`)

  if (options.dryRun) {
    console.log('Publish skipped (dry run).')
  } else {
    console.log('Release checks passed. Staging remains a separate protected workflow step.')
  }

  return { metadata, tarball }
}

const invokedPath =
  process.argv[1] === undefined ? null : pathToFileURL(path.resolve(process.argv[1])).href

if (invokedPath === import.meta.url) {
  verifyRelease().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
