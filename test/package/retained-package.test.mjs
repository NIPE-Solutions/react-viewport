import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, delimiter, resolve } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const script = pathToFileURL(resolve('scripts/verify-package.mjs')).href
const modules = [
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

function fixture(context, patch = {}, esm = "import 'react'; import 'react/jsx-runtime';\n") {
  const root = mkdtempSync(join(tmpdir(), 'viewport-retained-consumer-'))
  context.after(() => rmSync(root, { force: true, recursive: true }))
  mkdirSync(join(root, 'dist'))
  mkdirSync(join(root, 'bin'))
  const metadata = {
    name: '@nipe-solutions/react-viewport',
    version: '1.0.0',
    publishConfig: { access: 'public', provenance: true, tag: 'latest' },
    exports: {
      '.': { import: './dist/index.js', require: './dist/index.cjs', types: './dist/index.d.ts' },
    },
    files: ['dist', 'CHANGELOG.md'],
    ...patch,
  }
  writeFileSync(join(root, 'package.json'), JSON.stringify(metadata))
  for (const file of [
    'CHANGELOG.md',
    'README.md',
    'LICENSE',
    ...modules.flatMap((name) => [`dist/${name}.d.ts`, `dist/${name}.d.ts.map`]),
  ])
    writeFileSync(join(root, file), 'fixture\n')
  writeFileSync(join(root, 'dist/index.js'), esm)
  writeFileSync(join(root, 'dist/index.cjs'), "require('react'); require('react/jsx-runtime');\n")
  const [{ filename }] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', root], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NPM_CONFIG_USERCONFIG: '/dev/null' },
    }),
  )
  const tarball = join(root, filename)
  // The supplied archive, rather than local build output, must be inspected.
  writeFileSync(join(root, 'dist/index.js'), 'invalid local bundle')
  writeFileSync(join(root, 'dist/index.cjs'), 'invalid local bundle')
  const calls = join(root, 'calls.jsonl')
  for (const command of ['npm', 'node']) {
    const executable = join(root, 'bin', command)
    writeFileSync(
      executable,
      `#!${process.execPath}\nimport { appendFileSync } from 'node:fs';\nappendFileSync(process.env.CONSUMER_CALLS, JSON.stringify({ command: ${JSON.stringify(command)}, args: process.argv.slice(2), cwd: process.cwd() }) + '\\n');\nif (${JSON.stringify(command)} === 'npm' && process.argv[2] === 'pack') process.exit(91);\n`,
    )
    chmodSync(executable, 0o755)
  }
  const invoke = () =>
    spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { verifyPackage } from ${JSON.stringify(script)}; const result = await verifyPackage(${JSON.stringify(root)}); process.stdout.write('RESULT ' + JSON.stringify(result));`,
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          NPM_CONFIG_USERCONFIG: '/dev/null',
          REACT_VIEWPORT_PACKAGE_TARBALL: tarball,
          CONSUMER_CALLS: calls,
          PATH: `${join(root, 'bin')}${delimiter}${process.env.PATH}`,
        },
      },
    )
  return { root, calls, tarball, invoke }
}

test('provided bytes go to all five consumers without repacking, rebuilding or deleting the input', (context) => {
  const { calls, tarball, invoke } = fixture(context)
  const digest = createHash('sha512').update(readFileSync(tarball)).digest('hex')
  const result = invoke()
  assert.equal(result.status, 0, result.stderr)
  const verification = JSON.parse(result.stdout.split('RESULT ')[1])
  assert.equal(verification.files.length, 38)
  assert.deepEqual(verification.bareImports, {
    esm: ['react', 'react/jsx-runtime'],
    cjs: ['react', 'react/jsx-runtime'],
  })
  assert.deepEqual(verification.consumers, ['esm', 'cjs', 'react18', 'vite', 'next'])
  const commands = readFileSync(calls, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  const installs = commands.filter(
    ({ command, args }) => command === 'npm' && args[0] === 'install',
  )
  assert.equal(installs.length, 5)
  for (const { args } of installs)
    assert.deepEqual(args, ['install', '--ignore-scripts', '--no-package-lock', tarball])
  assert.deepEqual(
    commands
      .filter(({ args }) => args[0] !== 'install')
      .map(({ command, args }) => [command, args]),
    [
      ['node', ['index.mjs']],
      ['node', ['index.cjs']],
      ['npm', ['run', 'verify']],
      ['npm', ['run', 'build']],
      ['npm', ['run', 'build']],
    ],
  )
  assert.equal(createHash('sha512').update(readFileSync(tarball)).digest('hex'), digest)
})

test('retained consumers reject the embedded identity before installing anything', (context) => {
  const { root, calls, invoke } = fixture(context, { version: '1.0.1' })
  const metadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ ...metadata, version: '1.0.0' }))
  const result = invoke()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /stable version 1\.0\.0|identity/)
  assert.equal(existsSync(calls), false)
})

test('retained consumers apply the existing gzip budget to archived bundles', (context) => {
  const { calls, invoke } = fixture(
    context,
    {},
    `import 'react'; import 'react/jsx-runtime';\n// ${randomBytes(6_000).toString('base64')}\n`,
  )
  const result = invoke()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /gzip size .* exceeds 3960 byte limit/)
  assert.equal(existsSync(calls), false)
})
