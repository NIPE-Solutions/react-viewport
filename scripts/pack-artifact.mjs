import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import {
  npmEnvironment,
  releaseName,
  releaseTarball,
  validatePackageMetadata,
} from './verify-release.mjs'

export const publicPackageFiles = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'dist/ViewportProvider.d.ts',
  'dist/ViewportProvider.d.ts.map',
  'dist/context.d.ts',
  'dist/context.d.ts.map',
  'dist/css-variable-ownership.d.ts',
  'dist/css-variable-ownership.d.ts.map',
  'dist/css-variables.d.ts',
  'dist/css-variables.d.ts.map',
  'dist/editable.d.ts',
  'dist/editable.d.ts.map',
  'dist/environment.d.ts',
  'dist/environment.d.ts.map',
  'dist/geometry.d.ts',
  'dist/geometry.d.ts.map',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/index.d.ts.map',
  'dist/index.js',
  'dist/keyboard.d.ts',
  'dist/keyboard.d.ts.map',
  'dist/safe-area.d.ts',
  'dist/safe-area.d.ts.map',
  'dist/snapshot.d.ts',
  'dist/snapshot.d.ts.map',
  'dist/store-registry.d.ts',
  'dist/store-registry.d.ts.map',
  'dist/store.d.ts',
  'dist/store.d.ts.map',
  'dist/types.d.ts',
  'dist/types.d.ts.map',
  'dist/useViewport.d.ts',
  'dist/useViewport.d.ts.map',
  'dist/useViewportCssVariables.d.ts',
  'dist/useViewportCssVariables.d.ts.map',
  'package.json',
]
const metadataKeys = [
  'access',
  'integrity',
  'name',
  'provenance',
  'sourceSha',
  'tag',
  'tarball',
  'version',
]

function requireSourceSha(sourceSha) {
  assert.match(sourceSha ?? '', /^[a-f0-9]{40}$/, 'Artifact requires a valid source SHA')
}

function requireFileSurface(files) {
  assert.ok(Array.isArray(files), 'Release package file surface must be an array')
  assert.deepEqual(
    [...files].sort(),
    publicPackageFiles,
    'Release package file surface must match the exact 38 public package files',
  )
}

function requireIntegrity(integrity) {
  const digest =
    typeof integrity === 'string' && /^sha512-([A-Za-z0-9+/]+={0,2})$/.exec(integrity)?.[1]
  assert.ok(
    digest &&
      Buffer.from(digest, 'base64').length === 64 &&
      Buffer.from(digest, 'base64').toString('base64') === digest,
    'Artifact integrity requires canonical SHA-512 SRI',
  )
}

export function validatePackDescriptor(descriptors) {
  assert.ok(
    Array.isArray(descriptors) && descriptors.length === 1,
    'npm pack must return exactly one descriptor',
  )
  const descriptor = descriptors[0]
  assert.ok(
    descriptor?.name === releaseName &&
      descriptor?.version === '1.0.0' &&
      descriptor?.filename === releaseTarball,
    'npm pack identity, version or filename mismatch',
  )
  requireFileSurface(descriptor.files?.map((file) => file.path))
  requireIntegrity(descriptor.integrity)
  return descriptor
}

export function inspectPackedArchive(tarball, { run = execFileSync } = {}) {
  assert.ok(lstatSync(tarball).isFile(), 'Archive must be a regular file')
  const tarballBytes = readFileSync(tarball).byteLength
  assert.ok(tarballBytes <= 16_779, `tarball size ${tarballBytes} exceeds 16779 byte limit`)
  const options = { encoding: 'utf8', timeout: 30_000, maxBuffer: 1024 * 1024 }
  const archivePaths = run('tar', ['-tzf', tarball], options).trimEnd().split('\n')
  assert.ok(
    archivePaths.every((file) => file.startsWith('package/')),
    'Archive file surface requires package/ paths',
  )
  const files = archivePaths.map((file) => file.slice(8)).sort()
  requireFileSurface(files)
  const entries = run('tar', ['-tvzf', tarball], options).trimEnd().split('\n')
  assert.ok(
    entries.length === files.length && entries.every((entry) => entry.startsWith('-')),
    'Archive entries must be regular files',
  )
  const packageJson = JSON.parse(run('tar', ['-xOf', tarball, 'package/package.json'], options))
  validatePackageMetadata(packageJson)
  return {
    files,
    packageJson,
    tarballBytes,
    sources: {
      esm: run('tar', ['-xOf', tarball, 'package/dist/index.js'], options),
      cjs: run('tar', ['-xOf', tarball, 'package/dist/index.cjs'], options),
    },
  }
}

function hashes(bytes) {
  const hash = createHash('sha512').update(bytes).digest()
  return {
    integrity: `sha512-${hash.toString('base64')}`,
    checksum: `${hash.toString('hex')}  ${releaseTarball}\n`,
  }
}

export function prepareArtifact({ root = process.cwd(), sourceSha, run = execFileSync } = {}) {
  sourceSha ??=
    process.env.GITHUB_SHA ??
    run('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  requireSourceSha(sourceSha)
  validatePackageMetadata(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')))
  const directory = join(root, 'artifacts')
  // Only a successful mkdir gives this invocation ownership of the cleanup target.
  mkdirSync(directory)
  try {
    const descriptor = validatePackDescriptor(
      JSON.parse(
        run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory], {
          cwd: root,
          encoding: 'utf8',
          env: npmEnvironment(),
        }),
      ),
    )
    const tarball = join(directory, releaseTarball)
    const { integrity, checksum } = hashes(readFileSync(tarball))
    assert.equal(
      integrity,
      descriptor.integrity,
      'Packed tarball integrity differs from npm descriptor',
    )
    inspectPackedArchive(tarball, { run })
    const metadata = {
      name: releaseName,
      version: '1.0.0',
      tarball: releaseTarball,
      sourceSha,
      integrity,
      tag: 'latest',
      access: 'public',
      provenance: true,
    }
    writeFileSync(join(directory, `${releaseTarball}.sha512`), checksum, { flag: 'wx' })
    writeFileSync(
      join(directory, 'release-artifact.json'),
      `${JSON.stringify(metadata, null, 2)}\n`,
      { flag: 'wx' },
    )
    verifyRetainedArtifact({ root, sourceSha, run })
    return metadata
  } catch (error) {
    rmSync(directory, { recursive: true, force: true })
    throw error
  }
}

export function verifyRetainedArtifact({
  root = process.cwd(),
  sourceSha = process.env.GITHUB_SHA,
  run = execFileSync,
} = {}) {
  requireSourceSha(sourceSha)
  validatePackageMetadata(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')))
  const directory = join(root, 'artifacts')
  const expectedFiles = [releaseTarball, `${releaseTarball}.sha512`, 'release-artifact.json'].sort()
  assert.deepEqual(
    readdirSync(directory).sort(),
    expectedFiles,
    'Artifact must contain exactly the tarball, checksum and metadata',
  )
  for (const filename of expectedFiles)
    assert.ok(
      lstatSync(join(directory, filename)).isFile(),
      'Artifact entries must be regular files',
    )
  const metadata = JSON.parse(readFileSync(join(directory, 'release-artifact.json'), 'utf8'))
  assert.ok(metadata && !Array.isArray(metadata), 'Invalid artifact metadata')
  assert.deepEqual(Object.keys(metadata).sort(), metadataKeys, 'Invalid artifact metadata fields')
  assert.equal(metadata.sourceSha, sourceSha, 'Retained artifact source SHA mismatch')
  assert.ok(
    metadata.name === releaseName &&
      metadata.version === '1.0.0' &&
      metadata.tarball === releaseTarball &&
      metadata.tag === 'latest' &&
      metadata.access === 'public' &&
      metadata.provenance === true,
    'Retained artifact publication policy mismatch',
  )
  requireIntegrity(metadata.integrity)
  const tarball = join(directory, releaseTarball)
  const { integrity, checksum } = hashes(readFileSync(tarball))
  assert.equal(integrity, metadata.integrity, 'Retained tarball integrity mismatch')
  assert.equal(
    readFileSync(join(directory, `${releaseTarball}.sha512`), 'utf8'),
    checksum,
    'Retained artifact checksum mismatch',
  )
  inspectPackedArchive(tarball, { run })
  return metadata
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    const metadata = prepareArtifact()
    process.stdout.write(`${resolve('artifacts', metadata.tarball)}\n`)
  } else if (args.length === 1 && args[0] === '--verify-retained') {
    verifyRetainedArtifact()
    process.stdout.write('Retained artifact bytes and policy verified.\n')
  } else throw new Error('Usage: pack-artifact.mjs [--verify-retained]')
}
