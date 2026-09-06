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
  'docs/releases/0.1.0-alpha.0-readiness.md',
  'docs/releases/2026-09-06-product-hardening-readiness.md',
  'docs/releases/2026-09-06-device-lab-readiness.md',
  'website/app/api/page.tsx',
  'website/app/browser-behavior/page.tsx',
  'website/app/concepts/page.tsx',
  'website/app/examples/page.tsx',
  'website/components/GeometryDemo.tsx',
  'website/content/docs.ts',
  'website/public/og.svg',
  '.github/ISSUE_TEMPLATE/bug-report.yml',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/pull_request_template.md',
  'e2e/hydration.spec.ts',
  'e2e/viewport.spec.ts',
  'e2e/website.spec.ts',
  'test/unit/geometry.test.ts',
  'test/unit/safe-area.test.ts',
  'test/unit/store.test.ts',
]

async function withMutatedDocuments(path, from, to, verify) {
  return withTransformedDocument(
    path,
    (original) => {
      assert.ok(original.includes(from), `Mutation source is missing from ${path}: ${from}`)
      return original.replace(from, to)
    },
    verify,
  )
}

async function withTransformedDocument(path, transform, verify) {
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
    await writeFile(target, transform(original))

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

test('rejects a README opening that does not lead with product utility', async () => {
  await withMutatedDocuments(
    'README.md',
    `Visual viewport geometry as React state.`,
    `Reliable mobile viewport state for React.

Visual viewport geometry as React state.`,
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must lead with product utility/i),
  )
})

test('rejects a README opening without early discovery links', async () => {
  const discoveryLinks =
    'Start with [CSS alternatives](#when-css-is-enough), then read [Keyboard and safe area](#keyboard-and-safe-area) and [Browser behavior](#browser-terminology-and-limitations).\n\n'

  await withTransformedDocument(
    'README.md',
    (readme) => readme.replace(discoveryLinks, ''),
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /opening.*discovery links/i),
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
    '| Desktop Chromium | PARTIAL AUTOMATION',
    '| Desktop Chromium | MANUAL PENDING',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /Desktop Chromium status/),
  )
})

test('rejects QA automation evidence that does not resolve to a repository file', async () => {
  await withMutatedDocuments(
    'docs/REAL_DEVICE_QA.md',
    'e2e/viewport.spec.ts',
    'e2e/missing.spec.ts',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /evidence.*does not exist/i),
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
    '| Desktop WebKit | PARTIAL AUTOMATION | Only the exact fixture scopes in the scenario table | [library browser suite](../e2e/viewport.spec.ts), [hydration suite](../e2e/hydration.spec.ts), [website suite](../e2e/website.spec.ts) |',
    '| Desktop WebKit | PARTIAL AUTOMATION | Only the exact fixture scopes in the scenario table | [library browser suite](../e2e/viewport.spec.ts), [hydration suite](../e2e/hydration.spec.ts), [website suite](../e2e/website.spec.ts) |\n| Experimental device | MANUAL VERIFIED | not applicable | — |',
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

test('rejects additive keyboard and safe-area guidance', async () => {
  await withMutatedDocuments(
    'website/content/docs.ts',
    `  --bottom-inset: max(
    var(--react-viewport-keyboard-height, 0px),
    var(--react-viewport-safe-area-bottom, 0px)
  );`,
    `  --bottom-inset: calc(
    var(--react-viewport-keyboard-height, 0px) +
    var(--react-viewport-safe-area-bottom, 0px)
  );`,
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not add.*safe area/i),
  )
})

test('rejects the historical keyboard plus safe-area-clearance recipe', async () => {
  await withMutatedDocuments(
    'website/content/docs.ts',
    '  bottom: calc(var(--bottom-inset) + 1rem);',
    `  bottom: calc(
    var(--react-viewport-keyboard-height, 0px) +
      max(1rem, var(--react-viewport-safe-area-bottom, 0px))
  );`,
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not add.*safe area/i),
  )
})

test('rejects nested state keyboard and safe-area addition', async () => {
  await withMutatedDocuments(
    'website/app/examples/page.tsx',
    'export const metadata',
    'const bottomInset = state.keyboard.height + state.safeArea.bottom\n\nexport const metadata',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not add.*safe area/i),
  )
})

test('rejects component-local keyboardOcclusion and safeAreaBottom addition', async () => {
  await withMutatedDocuments(
    'website/components/GeometryDemo.tsx',
    'export function GeometryDemo(',
    'const bottomInset = keyboardOcclusion + safeAreaBottom\n\nexport function GeometryDemo(',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not add.*safe area/i),
  )
})

test('rejects additive guidance in a public website asset', async () => {
  await withMutatedDocuments(
    'website/public/og.svg',
    '<svg',
    '<text>keyboardOcclusion + safeAreaBottom</text>\n<svg',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not add.*safe area/i),
  )
})

test('rejects a universal keyboard claim in a nested public document', async () => {
  await withMutatedDocuments(
    'docs/releases/0.1.0-alpha.0-readiness.md',
    'Physical-device results are deliberately excluded because no human',
    'The package detects every software keyboard.\n\nPhysical-device results are deliberately excluded because no human',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not claim.*every.*keyboard/i),
  )
})

test('rejects VirtualKeyboard guidance without the partial-width scalar limitation', async () => {
  const requiredGuidance =
    'A bottom-attached partial-width rectangle still yields a scalar bottom inset. That scalar cannot represent segmented or arbitrary-shape avoidance.\n\n'

  await withTransformedDocument(
    'docs/browser-notes.md',
    (browserNotes) => browserNotes.replace(requiredGuidance, ''),
    (temporaryRoot) =>
      expectVerificationFailure(temporaryRoot, /partial-width.*scalar bottom inset/i),
  )
})

test('rejects ambiguous fallback-threshold wording', async () => {
  await withTransformedDocument(
    'website/app/browser-behavior/page.tsx',
    (browserPage) =>
      browserPage.replace(
        /the larger of 80 CSS pixels and\s+15% of layout height/,
        '80 CSS pixels or 15% of layout height',
      ),
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /larger.*80 CSS pixels.*15%/i),
  )
})

test('rejects a stale automated QA baseline', async () => {
  await withTransformedDocument(
    'docs/REAL_DEVICE_QA.md',
    (qa) =>
      qa.replace(
        'The latest automated baseline on 2026-09-06 passed 54 library scenarios and 102\ndocumentation-site scenarios',
        'The latest automated baseline on 2026-09-05 passed 42 library scenarios and 42\ndocumentation-site scenarios',
      ),
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /2026-09-06.*54.*102/is),
  )
})

test('rejects the noncanonical README bottom-occlusion formula', async () => {
  await withMutatedDocuments(
    'README.md',
    'The fallback infers an occluding software keyboard only when an',
    'Use `max(0, layout.height - (visual.height + visual.offsetTop))`.\n\nThe fallback infers an occluding software keyboard only when an',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /canonical.*Math\.max/i),
  )
})

test('rejects a universal keyboard-detection claim', async () => {
  await withMutatedDocuments(
    'README.md',
    'The project does not claim universal browser support.',
    'The project does not claim universal browser support. However, the package detects every software keyboard.',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not claim.*every.*keyboard/i),
  )
})

test('rejects an unverified email reporting route', async () => {
  await withMutatedDocuments(
    'SECURITY.md',
    'If private reporting is unavailable,',
    'Email security@example.invalid. If private reporting is unavailable,',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /must not include an email/),
  )
})

test('rejects a public fallback that could disclose vulnerability details', async () => {
  await withMutatedDocuments(
    'SECURITY.md',
    'open a public issue containing no\nvulnerability details',
    'open a public issue containing\nvulnerability details',
    (temporaryRoot) => expectVerificationFailure(temporaryRoot, /safe public fallback/),
  )
})
