import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { validateReleaseWorkflow } from './verify-workflows.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const playwrightCli = path.join(repositoryRoot, 'node_modules/playwright/cli.js')

async function readRepositoryFile(file) {
  return readFile(path.join(repositoryRoot, file), 'utf8')
}

function assertOrdered(source, snippets) {
  let previousIndex = -1

  for (const snippet of snippets) {
    const index = source.indexOf(snippet)
    assert.notEqual(index, -1, `Expected workflow to contain ${JSON.stringify(snippet)}`)
    assert.ok(index > previousIndex, `Expected ${JSON.stringify(snippet)} after the prior step`)
    previousIndex = index
  }
}

test('quality CI installs reproducibly and runs the protected check on Node 24', async () => {
  const workflow = await readRepositoryFile('.github/workflows/ci.yml')

  assert.match(workflow, /permissions:\s*\n\s+contents: read/)
  assert.match(workflow, /node-version:\s*24/)
  assert.match(workflow, /cache:\s*['"]?npm['"]?/)
  assertOrdered(workflow, ['npm ci', 'npm run check'])
  assert.match(
    workflow,
    /cancel-in-progress:\s*\$\{\{\s*github\.event_name == 'pull_request'\s*\}\}/,
  )
  assert.match(workflow, /actions\/checkout@v\d+/)
  assert.match(workflow, /actions\/setup-node@v\d+/)
})

test('browser CI runs independent library and website jobs with distinct persistent reports', async () => {
  const workflow = await readRepositoryFile('.github/workflows/browser.yml')

  assert.match(workflow, /permissions:\s*\n\s+contents: read/)
  assert.match(workflow, /jobs:\s*\n\s+library:/)
  assert.match(workflow, /\n\s+website:/)
  assert.doesNotMatch(workflow, /\bneeds:/)
  assert.match(
    workflow,
    /library:[\s\S]*playwright install --with-deps chromium firefox webkit[\s\S]*npm run test:e2e -- --reporter=html --output=test-results\/library[\s\S]*name: library-playwright-report-/,
  )
  assert.match(
    workflow,
    /website:[\s\S]*playwright install --with-deps chromium firefox webkit[\s\S]*npm run test:website:e2e -- --reporter=html --output=test-results\/website[\s\S]*name: website-playwright-report-/,
  )
  assert.equal(workflow.match(/actions\/upload-artifact@v\d+/g)?.length, 2)
  assert.equal(workflow.match(/if:\s*always\(\)/g)?.length, 2)
  assert.match(workflow, /PLAYWRIGHT_HTML_OUTPUT_DIR:\s*playwright-report\/library/)
  assert.match(workflow, /PLAYWRIGHT_HTML_OUTPUT_DIR:\s*playwright-report\/website/)
})

test('Playwright configurations partition library and website specifications', async () => {
  const libraryConfiguration = await readRepositoryFile('playwright.config.ts')
  const websiteConfiguration = await readRepositoryFile('playwright.website.config.ts')

  assert.match(libraryConfiguration, /testIgnore:\s*['"]website\.spec\.ts['"]/)
  assert.match(websiteConfiguration, /testMatch:\s*['"]website\.spec\.ts['"]/)
})

test('website Playwright discovery runs every scenario in Chromium, Firefox, and WebKit', () => {
  const result = spawnSync(
    process.execPath,
    [
      playwrightCli,
      'test',
      '--config',
      'playwright.website.config.ts',
      '--list',
      '--reporter=line',
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
    },
  )

  assert.equal(result.status, 0, result.stderr || result.stdout)
  const discoveredTests = result.stdout.split('\n').filter((line) => /website\.spec\.ts/.test(line))

  assert.ok(discoveredTests.length >= 84, result.stdout)
  assert.equal(discoveredTests.length % 3, 0, result.stdout)
  assert.ok(
    discoveredTests.some((line) => line.includes('[chromium]')),
    result.stdout,
  )
  assert.ok(
    discoveredTests.some((line) => line.includes('[firefox]')),
    result.stdout,
  )
  assert.ok(
    discoveredTests.some((line) => line.includes('[webkit]')),
    result.stdout,
  )
})

test('release CI stages current main through protected OIDC and all quality gates', async () => {
  const workflow = await readRepositoryFile('.github/workflows/release.yml')
  assert.deepEqual(validateReleaseWorkflow(workflow), [])
})

test('release contract rejects bypassed guards, direct publication and extra executable fields', async () => {
  const source = await readRepositoryFile('.github/workflows/release.yml')
  const mutations = [
    ['automatic trigger', source.replace('  workflow_dispatch:', '  push:')],
    [
      'wrong dispatch ref',
      source.replace("github.ref == 'refs/heads/main'", "github.ref == 'refs/heads/feature'"),
    ],
    ['unprotected environment', source.replace('environment: npm', 'environment: preview')],
    ['missing OIDC', source.replace('id-token: write', 'id-token: read')],
    ['unsafe concurrency', source.replace('cancel-in-progress: false', 'cancel-in-progress: true')],
    ['checkout moving ref', source.replace('ref: ${{ github.sha }}', 'ref: main')],
    ['wrong npm', source.replace('npm@11.19.0', 'npm@11')],
    [
      'conditional gate',
      source.replace('      - run: npm run check', '      - run: npm run check\n        if: false'),
    ],
    ['skipped engine', source.replace('chromium firefox webkit', 'chromium')],
    ['missing website gate', source.replace('      - run: npm run test:website:e2e\n', '')],
    [
      'missing preparation guard',
      source.replace('      - run: node scripts/verify-release.mjs --verify-current-main\n', ''),
    ],
    [
      'missing final guard',
      source.replace(
        / {6}- run: node scripts\/verify-release.mjs --verify-current-main\n(?= {6}- run: npm stage)/,
        '',
      ),
    ],
    ['no uniqueness lookup', source.replaceAll('--ensure-unpublished', '--dry-run')],
    ['unverified retained artifact', source.replaceAll('--verify-retained', '--dry-run')],
    [
      'consumer skipped',
      source.replace(
        '      - run: REACT_VIEWPORT_PACKAGE_TARBALL=./artifacts/nipe-solutions-react-viewport-1.0.0.tgz npm run test:package\n',
        '',
      ),
    ],
    [
      'wrong consumer bytes',
      source.replace(
        'REACT_VIEWPORT_PACKAGE_TARBALL=./artifacts/nipe-solutions-react-viewport-1.0.0.tgz',
        'REACT_VIEWPORT_PACKAGE_TARBALL=./other.tgz',
      ),
    ],
    [
      'wrong staged artifact',
      source.replace(
        'npm stage publish ./artifacts/nipe-solutions-react-viewport-1.0.0.tgz',
        'npm stage publish .',
      ),
    ],
    ['wrong channel', source.replace('--tag latest', '--tag alpha')],
    ['missing provenance', source.replace('--provenance ', '')],
    ['lifecycle scripts', source.replace('--ignore-scripts ', '')],
    ['policy override', source.replace('--tag latest', '--tag latest --provenance=false')],
    ['direct publish', source + '      - run: npm publish --access public\n'],
    [
      'missing upload',
      source.replace('actions/upload-artifact@v7', 'actions/download-artifact@v7'),
    ],
    ['ignored artifact', source.replace('if-no-files-found: error', 'if-no-files-found: ignore')],
    [
      'credentials config',
      source.replace('NPM_CONFIG_USERCONFIG: /dev/null', 'NPM_CONFIG_USERCONFIG: /tmp/credentials'),
    ],
    ['extra command', source + '      - run: echo unverified\n'],
    [
      'extra shell payload',
      source.replace('run: npm run check', 'run: npm run check && npm publish'),
    ],
    [
      'credential override',
      source.replace(
        '    environment: npm',
        '    environment: npm\n    env:\n      NODE_AUTH_TOKEN: unsafe',
      ),
    ],
    [
      'alternate cwd',
      source.replace(
        '      - run: npm stage',
        '      - working-directory: /tmp\n        run: npm stage',
      ),
    ],
    [
      'failure bypass',
      source.replace(
        '      - run: npm run check',
        '      - run: npm run check\n        continue-on-error: true',
      ),
    ],
  ]
  for (const [label, mutated] of mutations) {
    assert.notEqual(mutated, source, `mutation must apply: ${label}`)
    assert.ok(validateReleaseWorkflow(mutated).length > 0, label)
  }
})

test('release contract rejects duplicate YAML keys, aliases and unsupported block commands', () => {
  for (const source of [
    'on:\n  workflow_dispatch:\non:\n  push:\n',
    'jobs: &unsafe\n  stage: *unsafe\n',
    'jobs:\n  stage:\n    steps:\n      - run: |\n          npm publish\n',
  ])
    assert.ok(validateReleaseWorkflow(source).length > 0)
})

test('Dependabot covers npm dependencies and GitHub Actions', async () => {
  const configuration = await readRepositoryFile('.github/dependabot.yml')

  assert.match(configuration, /package-ecosystem:\s*['"]npm['"]/)
  assert.match(configuration, /package-ecosystem:\s*['"]github-actions['"]/)
})

test('the default build and Vercel static builder both target the exported website', async () => {
  const packageJson = JSON.parse(await readRepositoryFile('package.json'))
  const vercel = JSON.parse(await readRepositoryFile('vercel.json'))
  const vercelIgnore = await readRepositoryFile('.vercelignore')

  assert.equal(packageJson.scripts.build, 'npm run build:website')
  assert.equal(vercel.framework, null)
  assert.equal(vercel.installCommand, 'npm ci')
  assert.equal(vercel.buildCommand, 'npm run check')
  assert.ok(packageJson.scripts.check.includes('npm run build'))
  assert.ok(packageJson.scripts.check.includes('node scripts/verify-website.mjs'))
  assert.doesNotMatch(vercelIgnore, /^(test|e2e|docs|\.github)\//m)
  assert.equal(vercel.outputDirectory, 'website/out')
  assert.ok(Array.isArray(vercel.headers) && vercel.headers.length > 0)
  assert.match(vercelIgnore, /node_modules/)
})
