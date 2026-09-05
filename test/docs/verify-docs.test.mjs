import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const executeFile = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const verifier = resolve(root, 'scripts/verify-docs.mjs')
const documentPaths = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE',
  'docs/browser-notes.md',
  'docs/REAL_DEVICE_QA.md',
  'docs/RELEASING.md',
  '.github/ISSUE_TEMPLATE/bug-report.yml',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/pull_request_template.md',
]

async function withMutatedDocuments(path, from, to, verify) {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'react-viewport-docs-'))

  try {
    await Promise.all(
      documentPaths.map(async (documentPath) => {
        const destination = resolve(temporaryRoot, documentPath)
        await cp(resolve(root, documentPath), destination, { recursive: true })
      }),
    )

    const target = resolve(temporaryRoot, path)
    const original = await readFile(target, 'utf8')
    assert.ok(original.includes(from), `Mutation source is missing from ${path}: ${from}`)
    await writeFile(target, original.replace(from, to))

    await verify(temporaryRoot)
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true })
  }
}

async function expectVerificationFailure(rootPath, message) {
  await assert.rejects(
    executeFile(process.execPath, [verifier], {
      env: { ...process.env, REACT_VIEWPORT_DOCS_ROOT: rootPath },
      encoding: 'utf8',
    }),
    (error) => {
      const output = `${error.stdout}\n${error.stderr}`
      assert.match(output, message)
      return true
    },
  )
}

test('rejects a quick start fence that names but does not call useViewport', async () => {
  await withMutatedDocuments(
    'README.md',
    'const viewport = useViewport()',
    'const viewport = null // useViewport',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /Quick start/),
  )
})

test('rejects a physical platform status mutation', async () => {
  await withMutatedDocuments(
    'docs/REAL_DEVICE_QA.md',
    '| iPhone Safari | MANUAL PENDING',
    '| iPhone Safari | AUTOMATED',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /iPhone Safari status/),
  )
})

test('rejects a desktop platform status mutation', async () => {
  await withMutatedDocuments(
    'docs/REAL_DEVICE_QA.md',
    '| Desktop Chrome | AUTOMATED',
    '| Desktop Chrome | MANUAL PENDING',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /Desktop Chrome status/),
  )
})

test('rejects a required scenario-row mutation', async () => {
  await withMutatedDocuments(
    'docs/REAL_DEVICE_QA.md',
    '| keyboard open/close |',
    '| keyboard state changes |',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /keyboard open\/close scenario/),
  )
})

test('rejects an initial manual-verification status', async () => {
  await withMutatedDocuments(
    'docs/REAL_DEVICE_QA.md',
    '| Desktop Safari / WebKit | AUTOMATED | deterministic resize, focus, scroll, fallback, CSS variables, and hydration scenarios | `e2e/viewport.spec.ts`, `e2e/hydration.spec.ts` |',
    '| Desktop Safari / WebKit | AUTOMATED | deterministic resize, focus, scroll, fallback, CSS variables, and hydration scenarios | `e2e/viewport.spec.ts`, `e2e/hydration.spec.ts` |\n| Experimental device | MANUAL VERIFIED | not applicable | — |',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /no MANUAL VERIFIED/),
  )
})

test('rejects a browser-note registry without its Evidence field', async () => {
  await withMutatedDocuments(
    'docs/browser-notes.md',
    '| Evidence | Test path, issue, screenshot, trace, or device record |',
    '| Proof | Test path, issue, screenshot, trace, or device record |',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /Evidence/),
  )
})
