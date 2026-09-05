import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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

test('browser CI installs every Playwright engine and runs both browser suites', async () => {
  const workflow = await readRepositoryFile('.github/workflows/browser.yml')

  assert.match(workflow, /permissions:\s*\n\s+contents: read/)
  assert.match(workflow, /node-version:\s*24/)
  assertOrdered(workflow, [
    'npm ci',
    'playwright install --with-deps chromium firefox webkit',
    'npm run test:e2e',
    'npm run test:website:e2e',
  ])
  assert.match(workflow, /if:\s*failure\(\)/)
  assert.match(workflow, /actions\/upload-artifact@v\d+/)
  assert.match(workflow, /playwright-report/)
  assert.match(workflow, /test-results/)
})

test('release CI uses OIDC, an npm environment, and no long-lived npm token', async () => {
  const workflow = await readRepositoryFile('.github/workflows/release.yml')

  assert.match(workflow, /permissions:\s*\n\s+contents: read\s*\n\s+id-token: write/)
  assert.match(workflow, /environment:\s*\n\s+name:\s*npm/)
  assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN|_authToken/i)
  assert.match(workflow, /node-version:\s*24/)
  assert.match(workflow, /registry-url:\s*['"]https:\/\/registry\.npmjs\.org['"]/)
})

test('release CI validates, checks, packs, then publishes the tarball with provenance', async () => {
  const workflow = await readRepositoryFile('.github/workflows/release.yml')

  assertOrdered(workflow, [
    'npm ci',
    'npm run check',
    'npm run release:check',
    'npm pack',
    'npm publish',
  ])
  assert.match(workflow, /--tag\s+["']?\$GITHUB_REF_NAME/)
  assert.match(workflow, /--dist-tag\s+alpha/)
  assert.match(workflow, /npm publish[^\n]*--provenance/)
  assert.match(workflow, /npm publish[^\n]*--tag\s+alpha/)
})

test('Dependabot covers npm dependencies and GitHub Actions', async () => {
  const configuration = await readRepositoryFile('.github/dependabot.yml')

  assert.match(configuration, /package-ecosystem:\s*['"]npm['"]/)
  assert.match(configuration, /package-ecosystem:\s*['"]github-actions['"]/)
})

test('the default build and Vercel both target the exported website', async () => {
  const packageJson = JSON.parse(await readRepositoryFile('package.json'))
  const vercel = JSON.parse(await readRepositoryFile('vercel.json'))
  const vercelIgnore = await readRepositoryFile('.vercelignore')

  assert.equal(packageJson.scripts.build, 'npm run build:website')
  assert.equal(vercel.framework, 'nextjs')
  assert.equal(vercel.installCommand, 'npm ci')
  assert.equal(vercel.buildCommand, 'npm run build:website')
  assert.equal(vercel.outputDirectory, 'website/out')
  assert.ok(Array.isArray(vercel.headers) && vercel.headers.length > 0)
  assert.match(vercelIgnore, /node_modules/)
})
