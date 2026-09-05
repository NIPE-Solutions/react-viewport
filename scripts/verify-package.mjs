import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import console from 'node:console'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

import { assertReactIsExternal } from './check-bundle-size.mjs'

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

function isAllowedPackedFile(file) {
  return (
    file === 'package.json' ||
    file.startsWith('dist/') ||
    /^(?:changelog|license|readme)(?:\..+)?$/i.test(file)
  )
}

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
    const { stdout } = await run(
      'npm',
      ['pack', '--json', '--pack-destination', temporaryDirectory],
      root,
    )
    const pack = JSON.parse(stdout)[0]

    assert.ok(pack !== undefined, 'npm pack did not describe the generated tarball')

    const files = pack.files.map(({ path }) => path).sort()
    const unexpectedFiles = files.filter((file) => !isAllowedPackedFile(file))

    assert.deepEqual(unexpectedFiles, [], `Unexpected packed files: ${unexpectedFiles.join(', ')}`)
    assert.ok(files.includes('package.json'), 'The tarball must contain package.json')
    assert.ok(
      files.some((file) => file.startsWith('dist/')),
      'The tarball must contain dist',
    )

    const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
    const packageExports = packageJson.exports?.['.']

    assertNoRuntimeDependencies(packageJson)
    assert.deepEqual(packageExports, expectedExports)

    for (const target of Object.values(expectedExports)) {
      assert.ok(files.includes(target.slice(2)), `Packed export target is missing: ${target}`)
    }

    const bareImports = {
      esm: assertReactIsExternal(await readFile(resolve(root, 'dist/index.js'), 'utf8'), 'esm'),
      cjs: assertReactIsExternal(await readFile(resolve(root, 'dist/index.cjs'), 'utf8'), 'cjs'),
    }
    const tarballPath = resolve(temporaryDirectory, basename(pack.filename))
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

    console.log(`Tarball: ${pack.filename} (${pack.size} bytes, ${files.length} files)`)

    return {
      bareImports,
      consumers: passedConsumers,
      exports: packageExports,
      files,
      tarballBytes: pack.size,
    }
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyPackage()
}
