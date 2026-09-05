import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import console from 'node:console'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const defaultRepositoryRoot = path.resolve(scriptDirectory, '..')

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function validateReleaseMetadata({ packageJson, changelog, gitTag, distTag }) {
  assert.equal(typeof packageJson.name, 'string', 'package.json must contain a package name')
  assert.equal(typeof packageJson.version, 'string', 'package.json must contain a version')

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

  if (/-alpha(?:\.|$)/.test(packageJson.version)) {
    assert.equal(
      distTag,
      'alpha',
      `Alpha version ${packageJson.version} must use the alpha npm dist-tag`,
    )
  }

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

function parseArguments(arguments_) {
  const options = {
    distTag: undefined,
    dryRun: false,
    gitTag: undefined,
    repositoryRoot: defaultRepositoryRoot,
  }

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]

    if (argument === '--dry-run') {
      options.dryRun = true
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
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
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
  const packageJson = JSON.parse(
    await readFile(path.join(options.repositoryRoot, 'package.json'), 'utf8'),
  )
  const changelog = await readFile(path.join(options.repositoryRoot, 'CHANGELOG.md'), 'utf8')
  const isAlpha =
    typeof packageJson.version === 'string' && /-alpha(?:\.|$)/.test(packageJson.version)
  const gitTag = options.gitTag ?? process.env.GITHUB_REF_NAME ?? `v${packageJson.version}`
  const distTag = options.distTag ?? (isAlpha ? 'alpha' : 'latest')
  const metadata = validateReleaseMetadata({ packageJson, changelog, gitTag, distTag })
  const workingTreeStatus = readWorkingTreeStatus(options.repositoryRoot, options.dryRun)

  if (workingTreeStatus !== null) {
    assertCleanWorkingTree(workingTreeStatus, options.dryRun)
  }

  const tarball = inspectTarball(options.repositoryRoot)
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
  console.log(`Tarball: ${tarball.filename}, ${tarball.size} bytes, ${tarball.entryCount} files`)

  if (options.dryRun) {
    console.log('Publish skipped (dry run).')
  } else {
    console.log('Release checks passed. Publishing remains a separate protected workflow step.')
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
