import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import console from 'node:console'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { assertReactIsExternal, reportBundleMeasurements } from './check-bundle-size.mjs'
import { inspectPackedArchive } from './pack-artifact.mjs'

const executeFile = promisify(execFile)
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDirectory, '..')
const fixturesRoot = resolve(packageRoot, 'test/package/fixtures')
const expectedExports = {
  import: './dist/index.js',
  require: './dist/index.cjs',
  types: './dist/index.d.ts',
}
const consumers = [
  { name: 'esm', executable: 'node', arguments: ['index.mjs'] },
  { name: 'cjs', executable: 'node', arguments: ['index.cjs'] },
  { name: 'react18', executable: 'npm', arguments: ['run', 'verify'] },
  { name: 'vite', executable: 'npm', arguments: ['run', 'build'] },
  { name: 'next', executable: 'npm', arguments: ['run', 'build'] },
]

export function assertNoRuntimeDependencies(packageJson) {
  const dependencies = packageJson.dependencies
  const dependencyNames =
    dependencies !== null && typeof dependencies === 'object' && !Array.isArray(dependencies)
      ? Object.keys(dependencies)
      : null

  assert.ok(
    dependencies === undefined || dependencyNames?.length === 0,
    `Package must not declare runtime dependencies: ${dependencyNames?.join(', ') ?? 'invalid value'}`,
  )
}

async function run(executable, arguments_, cwd) {
  try {
    return await executeFile(executable, arguments_, {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
        npm_config_audit: 'false',
        npm_config_fund: 'false',
        NPM_CONFIG_USERCONFIG: '/dev/null',
      },
      maxBuffer: 20 * 1024 * 1024,
    })
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n')
    throw new Error(`${executable} ${arguments_.join(' ')} failed in ${cwd}\n${output}`, {
      cause: error,
    })
  }
}

export async function verifyPackage(root = packageRoot) {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'react-viewport-package-'))

  try {
    let tarballPath
    if (process.env.REACT_VIEWPORT_PACKAGE_TARBALL !== undefined) {
      assert.ok(
        process.env.REACT_VIEWPORT_PACKAGE_TARBALL,
        'Provided package tarball path must not be empty',
      )
      tarballPath = resolve(root, process.env.REACT_VIEWPORT_PACKAGE_TARBALL)
    } else {
      const { stdout } = await run(
        'npm',
        ['pack', '--json', '--ignore-scripts', '--pack-destination', temporaryDirectory],
        root,
      )
      const descriptors = JSON.parse(stdout)
      assert.ok(
        Array.isArray(descriptors) && descriptors.length === 1,
        'npm pack must describe exactly one tarball',
      )
      const [pack] = descriptors
      assert.equal(pack.filename, basename(pack.filename), 'npm pack returned an unsafe filename')
      tarballPath = resolve(temporaryDirectory, pack.filename)
    }
    const { files, packageJson, sources, tarballBytes } = inspectPackedArchive(tarballPath)
    const initialIntegrity = createHash('sha512')
      .update(await readFile(tarballPath))
      .digest('hex')
    const sourcePackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
    assert.equal(
      packageJson.name,
      sourcePackage.name,
      'Archive package identity differs from source package',
    )
    assert.equal(
      packageJson.version,
      sourcePackage.version,
      'Archive package version differs from source package',
    )
    const packageExports = packageJson.exports?.['.']

    assertNoRuntimeDependencies(packageJson)
    assert.deepEqual(packageExports, expectedExports)

    for (const target of Object.values(expectedExports)) {
      assert.ok(files.includes(target.slice(2)), `Packed export target is missing: ${target}`)
    }

    const bareImports = {
      esm: assertReactIsExternal(sources.esm, 'esm'),
      cjs: assertReactIsExternal(sources.cjs, 'cjs'),
    }
    const esm = Buffer.from(sources.esm)
    reportBundleMeasurements({
      esm: esm.byteLength,
      gzip: gzipSync(esm).byteLength,
      tarball: tarballBytes,
    })
    const passedConsumers = []

    for (const consumer of consumers) {
      const fixtureDirectory = resolve(temporaryDirectory, `consumer-${consumer.name}`)
      await cp(resolve(fixturesRoot, consumer.name), fixtureDirectory, { recursive: true })
      await run(
        'npm',
        ['install', '--ignore-scripts', '--no-package-lock', tarballPath],
        fixtureDirectory,
      )
      await run(consumer.executable, consumer.arguments, fixtureDirectory)
      passedConsumers.push(consumer.name)
      console.log(`Packed ${consumer.name} consumer passed`)
    }

    assert.equal(
      createHash('sha512')
        .update(await readFile(tarballPath))
        .digest('hex'),
      initialIntegrity,
      'Consumer verification changed the supplied tarball bytes',
    )
    console.log(`Tarball: ${basename(tarballPath)} (${tarballBytes} bytes, ${files.length} files)`)

    return {
      bareImports,
      consumers: passedConsumers,
      exports: packageExports,
      files,
      tarballBytes,
    }
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyPackage()
}
