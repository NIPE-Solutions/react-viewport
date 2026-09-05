import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import console from 'node:console'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDirectory, '..')

const measuredBaselines = {
  esm: 11_804,
  gzip: 3_448,
  tarball: 9_839,
}
const limits = Object.fromEntries(
  Object.entries(measuredBaselines).map(([name, bytes]) => [
    name,
    bytes + Math.max(Math.ceil(bytes * 0.1), 512),
  ]),
)

const allowedBareImport = /^react(?:-dom)?(?:\/.*)?$/
const bundledReactMarkers = [
  'react.transitional.element',
  'react-stack-top-frame',
  '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
]

export function getBareImports(source, format) {
  const pattern =
    format === 'esm'
      ? /\b(?:import|export)\s*(?:[^'";]*?\sfrom\s*)?["']([^"']+)["']/g
      : /\brequire\(["']([^"']+)["']\)/g
  const specifiers = []

  for (const match of source.matchAll(pattern)) {
    const specifier = match[1]

    if (specifier !== undefined && !specifier.startsWith('.') && !specifier.startsWith('/')) {
      specifiers.push(specifier)
    }
  }

  return [...new Set(specifiers)].sort()
}

export function assertReactIsExternal(source, format) {
  const bareImports = getBareImports(source, format)
  const unexpected = bareImports.filter((specifier) => !allowedBareImport.test(specifier))

  assert.deepEqual(unexpected, [], `Unexpected bare ${format} imports: ${unexpected.join(', ')}`)
  assert.ok(bareImports.includes('react'), `${format} bundle must externalize react`)
  assert.ok(
    bareImports.includes('react/jsx-runtime'),
    `${format} bundle must externalize react/jsx-runtime`,
  )

  for (const marker of bundledReactMarkers) {
    assert.equal(source.includes(marker), false, `${format} bundle contains bundled React code`)
  }

  return bareImports
}

export async function measureBundleSize(root = packageRoot) {
  const esmBuffer = await readFile(resolve(root, 'dist/index.js'))
  const esmSource = esmBuffer.toString('utf8')
  const cjsSource = await readFile(resolve(root, 'dist/index.cjs'), 'utf8')
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'react-viewport-size-'))

  try {
    const pack = JSON.parse(
      execFileSync('npm', ['pack', '--json', '--pack-destination', temporaryDirectory], {
        cwd: root,
        encoding: 'utf8',
      }),
    )[0]

    assert.ok(pack !== undefined, 'npm pack did not describe the generated tarball')

    return {
      measurements: {
        esm: esmBuffer.byteLength,
        gzip: gzipSync(esmBuffer).byteLength,
        tarball: pack.size,
      },
      bareImports: {
        esm: assertReactIsExternal(esmSource, 'esm'),
        cjs: assertReactIsExternal(cjsSource, 'cjs'),
      },
    }
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

export async function checkBundleSize(root = packageRoot) {
  const result = await measureBundleSize(root)

  for (const name of Object.keys(limits)) {
    const measurement = result.measurements[name]
    const limit = limits[name]

    console.log(`${name}: ${measurement} bytes (limit ${limit} bytes)`)
    assert.ok(measurement <= limit, `${name} size ${measurement} exceeds ${limit} byte limit`)
  }

  console.log(`ESM bare imports: ${result.bareImports.esm.join(', ')}`)
  console.log(`CJS bare imports: ${result.bareImports.cjs.join(', ')}`)
  return result
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkBundleSize()
}
