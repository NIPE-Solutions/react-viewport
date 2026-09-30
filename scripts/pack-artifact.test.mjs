import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import * as artifact from './pack-artifact.mjs'

const sha = 'a'.repeat(40)
const metadata = {
  name: '@nipe-solutions/react-viewport',
  version: '1.0.0',
  publishConfig: { access: 'public', provenance: true, tag: 'latest' },
  files: ['dist', 'CHANGELOG.md'],
  exports: {
    '.': { types: './dist/index.d.ts', import: './dist/index.js', require: './dist/index.cjs' },
  },
}
const declarationModules = [
  'ViewportProvider',
  'context',
  'css-variable-ownership',
  'css-variables',
  'editable',
  'environment',
  'geometry',
  'index',
  'keyboard',
  'safe-area',
  'snapshot',
  'store-registry',
  'store',
  'types',
  'useViewport',
  'useViewportCssVariables',
]
const publicFiles = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'dist/index.js',
  'dist/index.cjs',
  'package.json',
  ...declarationModules.flatMap((name) => [`dist/${name}.d.ts`, `dist/${name}.d.ts.map`]),
].sort()

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), 'viewport-release-'))
  context.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'dist'))
  for (const file of publicFiles) writeFileSync(join(root, file), 'fixture\n')
  writeFileSync(join(root, 'package.json'), JSON.stringify(metadata))
  writeFileSync(join(root, 'dist/index.js'), "import 'react'; import 'react/jsx-runtime';\n")
  writeFileSync(join(root, 'dist/index.cjs'), "require('react'); require('react/jsx-runtime');\n")
  return root
}

test('prepares one retained tarball with SHA-512 and an exact 38-file archive', (context) => {
  const root = fixture(context)
  const release = artifact.prepareArtifact({ root, sourceSha: sha })
  assert.equal(release.tarball, 'nipe-solutions-react-viewport-1.0.0.tgz')
  assert.equal(release.sourceSha, sha)
  assert.deepEqual(artifact.verifyRetainedArtifact({ root, sourceSha: sha }), release)
  assert.deepEqual(
    artifact.inspectPackedArchive(join(root, 'artifacts', release.tarball)).files,
    publicFiles,
  )
  assert.match(
    readFileSync(join(root, 'artifacts', `${release.tarball}.sha512`), 'utf8'),
    /^[a-f0-9]{128} {2}nipe-solutions-react-viewport-1\.0\.0\.tgz\n$/,
  )
  assert.throws(() => artifact.prepareArtifact({ root, sourceSha: sha }), /EEXIST|preexisting/)
  assert.deepEqual(artifact.verifyRetainedArtifact({ root, sourceSha: sha }), release)
})

test('retained verification rejects modified bytes, metadata, checksums and extra files', (context) => {
  const root = fixture(context)
  const release = artifact.prepareArtifact({ root, sourceSha: sha })
  const directory = join(root, 'artifacts')
  const tarball = join(directory, release.tarball)
  const original = readFileSync(tarball)
  writeFileSync(tarball, 'altered bytes')
  assert.throws(() => artifact.verifyRetainedArtifact({ root, sourceSha: sha }), /integrity/)
  writeFileSync(tarball, original)
  assert.throws(
    () => artifact.verifyRetainedArtifact({ root, sourceSha: 'b'.repeat(40) }),
    /source/,
  )
  const metadataPath = join(directory, 'release-artifact.json')
  const originalMetadata = readFileSync(metadataPath)
  for (const patch of [
    { tag: 'alpha' },
    { access: 'restricted' },
    { provenance: false },
    { version: '1.0.1' },
    { sourceSha: 'b'.repeat(40) },
    { tarball: '../escape.tgz' },
    { extra: true },
  ]) {
    writeFileSync(metadataPath, JSON.stringify({ ...release, ...patch }))
    assert.throws(() => artifact.verifyRetainedArtifact({ root, sourceSha: sha }))
  }
  writeFileSync(metadataPath, originalMetadata)
  const checksumPath = join(directory, `${release.tarball}.sha512`)
  const originalChecksum = readFileSync(checksumPath)
  writeFileSync(checksumPath, originalChecksum.toString() + originalChecksum.toString())
  assert.throws(() => artifact.verifyRetainedArtifact({ root, sourceSha: sha }), /checksum/)
  writeFileSync(checksumPath, originalChecksum)
  writeFileSync(join(directory, 'extra'), 'unexpected')
  assert.throws(() => artifact.verifyRetainedArtifact({ root, sourceSha: sha }), /exactly/)
})

test('preparation rejects unexpected files, descriptor corruption and unsafe source identity', (context) => {
  const root = fixture(context)
  writeFileSync(join(root, 'dist', 'secret.txt'), 'must not ship')
  assert.throws(() => artifact.prepareArtifact({ root, sourceSha: sha }), /file surface/)
  assert.throws(() => artifact.prepareArtifact({ root, sourceSha: 'bad\nsha' }), /source SHA/)
  const descriptor = {
    name: metadata.name,
    version: '1.0.0',
    filename: 'nipe-solutions-react-viewport-1.0.0.tgz',
    integrity: `sha512-${Buffer.alloc(64).toString('base64')}`,
    files: publicFiles.map((path) => ({ path })),
  }
  assert.doesNotThrow(() => artifact.validatePackDescriptor([descriptor]))
  for (const patch of [
    { name: '@other/package' },
    { version: '1.0.1' },
    { filename: '../escape.tgz' },
    { integrity: 'sha512-YWJjZA==' },
    { files: [...descriptor.files, descriptor.files[0]] },
  ]) {
    assert.throws(() => artifact.validatePackDescriptor([{ ...descriptor, ...patch }]))
  }
  for (const descriptors of [[], [descriptor, descriptor], {}])
    assert.throws(() => artifact.validatePackDescriptor(descriptors), /exactly one/)
})

test('a pack subprocess failure cleans only the directory created by that invocation', (context) => {
  const root = fixture(context)
  assert.throws(
    () =>
      artifact.prepareArtifact({
        root,
        sourceSha: sha,
        run: (command, args, options) => {
          if (command === 'npm') throw new Error('pack failed')
          return execFileSync(command, args, options)
        },
      }),
    /pack failed/,
  )
  assert.throws(() => artifact.verifyRetainedArtifact({ root, sourceSha: sha }), /ENOENT/)
  mkdirSync(join(root, 'artifacts'))
  writeFileSync(join(root, 'artifacts', 'keep'), 'existing artifact')
  assert.throws(() => artifact.prepareArtifact({ root, sourceSha: sha }), /EEXIST/)
  assert.equal(readFileSync(join(root, 'artifacts', 'keep'), 'utf8'), 'existing artifact')
})

test('archive inspection rejects linked entries and wrong embedded identity', (context) => {
  const root = fixture(context)
  writeFileSync(join(root, 'package.json'), JSON.stringify({ ...metadata, name: '@other/package' }))
  const output = execFileSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', root],
    { cwd: root, encoding: 'utf8', env: { ...process.env, NPM_CONFIG_USERCONFIG: '/dev/null' } },
  )
  const tarball = join(root, JSON.parse(output)[0].filename)
  assert.throws(() => artifact.inspectPackedArchive(tarball), /package name/)
  // tar preserves this symlink; the archive must reject it before reading a bundle.
  const packageDirectory = join(root, 'package')
  mkdirSync(packageDirectory)
  symlinkSync(join(root, 'package.json'), join(packageDirectory, 'package.json'))
  const linkedTarball = join(root, 'linked.tgz')
  execFileSync('tar', ['-czf', linkedTarball, '-C', root, 'package'])
  assert.throws(() => artifact.inspectPackedArchive(linkedTarball), /file surface|regular files/)
})
