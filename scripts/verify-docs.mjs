import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

const defaultPackageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageRoot = resolve(process.env.REACT_VIEWPORT_DOCS_ROOT ?? defaultPackageRoot)

const textRequirements = [
  ['README.md', 'CSS owns layout.'],
  ['README.md', 'Visual viewport geometry as React state.'],
  [
    'README.md',
    'const { ready, layout, visual, keyboard, safeArea, orientation, supported } = useViewport()',
  ],
  ['README.md', 'Math.max(keyboard.height, safeArea.bottom)'],
  ['README.md', 'Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))'],
  ['README.md', 'npm install @nipe-solutions/react-viewport'],
  ['README.md', 'Layout viewport'],
  ['README.md', 'Visual viewport'],
  ['README.md', 'When CSS is enough'],
  ['README.md', 'dvh'],
  ['README.md', 'SSR'],
  ['README.md', '--react-viewport-layout-height'],
  ['README.md', '0.1.0-alpha.0'],
  ['README.md', 'does not claim universal browser support'],
  ['README.md', 'https://opensource.nipesolutions.com'],
  ['README.md', 'https://github.com/NIPE-Solutions/react-viewport'],
  ['README.md', 'max(80 CSS px, 15% of layout height)'],
  ['README.md', 'bottom-attached partial-width rectangle still yields a scalar bottom inset'],
  ['README.md', 'segmented or arbitrary-shape avoidance'],
  ['README.md', 'viewport-fit=cover'],
  ['README.md', 'limitations'],
  ['docs/browser-notes.md', 'max(80 CSS px, 15% of layout height)'],
  [
    'docs/browser-notes.md',
    'bottom-attached partial-width rectangle still yields a scalar bottom inset',
  ],
  ['docs/browser-notes.md', 'segmented or arbitrary-shape avoidance'],
  ['docs/browser-notes.md', 'https://w3c.github.io/virtual-keyboard/'],
  ['docs/browser-notes.md', 'https://bugs.webkit.org/show_bug.cgi?id=217754'],
  ['docs/browser-notes.md', 'Math.max(keyboard.height, safeArea.bottom)'],
  ['docs/REAL_DEVICE_QA.md', 'Physical iPhone Safari and Android Chrome testing is pending.'],
  [
    'docs/REAL_DEVICE_QA.md',
    'The latest automated baseline on 2026-09-06 passed 54 library scenarios and 102 documentation-site scenarios',
  ],
  ['docs/REAL_DEVICE_QA.md', 'releases/2026-09-06-device-lab-readiness.md'],
  ['website/app/api/page.tsx', 'supported.virtualKeyboard means API availability'],
  ['website/app/api/page.tsx', 'Math.max(keyboard.height, safeArea.bottom)'],
  ['website/app/browser-behavior/page.tsx', 'https://w3c.github.io/virtual-keyboard/'],
  ['website/app/browser-behavior/page.tsx', 'https://bugs.webkit.org/show_bug.cgi?id=217754'],
  [
    'website/app/browser-behavior/page.tsx',
    'bottom-attached partial-width rectangle still yields a scalar bottom inset',
  ],
  ['website/app/browser-behavior/page.tsx', 'segmented or arbitrary-shape avoidance'],
  ['website/app/browser-behavior/page.tsx', 'the larger of 80 CSS pixels and 15% of layout height'],
  ['website/app/browser-behavior/page.tsx', '54 library scenarios'],
  ['website/app/browser-behavior/page.tsx', '102 documentation-site scenarios'],
  ['website/content/docs.ts', 'open: true, height: 0'],
  ['CHANGELOG.md', '0.1.0-alpha.0'],
  ['CONTRIBUTING.md', 'npm run format:check'],
  ['SECURITY.md', 'Security Policy'],
  ['CODE_OF_CONDUCT.md', 'Code of Conduct'],
  ['LICENSE', 'MIT License'],
  ['docs/RELEASING.md', 'npm pack'],
  ['docs/RELEASING.md', 'npm run test:website:e2e'],
  ['.github/ISSUE_TEMPLATE/bug-report.yml', 'browser'],
  ['.github/ISSUE_TEMPLATE/config.yml', 'blank_issues_enabled'],
  ['.github/pull_request_template.md', 'Testing'],
]

const platformStatuses = new Map([
  ['iPhone Safari', 'MANUAL PENDING'],
  ['iPad Safari', 'MANUAL PENDING'],
  ['Android Chrome', 'MANUAL PENDING'],
  ['PWA (standalone, where available)', 'MANUAL PENDING'],
  ['Embedded WebView', 'MANUAL PENDING'],
  ['external keyboard (where available)', 'MANUAL PENDING'],
  ['Desktop Chromium', 'PARTIAL AUTOMATION'],
  ['Desktop Firefox', 'PARTIAL AUTOMATION'],
  ['Desktop WebKit', 'PARTIAL AUTOMATION'],
])

const qaScenarioColumns = [
  'Scenario',
  'Physical-device status',
  'Automated status',
  'Automated scope',
  'Evidence',
]

const qaScenarios = new Map([
  ['keyboard open/close', 'AUTOMATED FIXTURE'],
  ['rapid input switching', 'MANUAL PENDING'],
  ['rotation', 'AUTOMATED UNIT'],
  ['toolbar collapse/expansion', 'AUTOMATED FIXTURE'],
  ['scrolling with and without the keyboard', 'AUTOMATED FIXTURE'],
  ['modal input', 'MANUAL PENDING'],
  ['fixed-bottom composer', 'HISTORICAL AUTOMATED FIXTURE'],
  ['safe areas', 'AUTOMATED UNIT'],
  ['zoom', 'AUTOMATED FIXTURE'],
  ['restoration after blur', 'AUTOMATED UNIT'],
])

const browserNoteFields = [
  'Date',
  'Browser / engine / version',
  'Capability',
  'Classification',
  'Observation',
  'Evidence',
  'Decision',
]

const publicGuidanceRoots = [
  'docs',
  'website/app',
  'website/components',
  'website/content',
  'website/public',
]
const publicGuidanceExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.svg',
  '.ts',
  '.tsx',
])
const excludedGuidanceDirectories = new Set(['superpowers'])

const contents = new Map()

async function readDocument(path) {
  if (!contents.has(path)) {
    contents.set(path, await readFile(resolve(packageRoot, path), 'utf8'))
  }

  return contents.get(path)
}

async function discoverPublicGuidancePaths() {
  const paths = ['README.md']

  for (const root of publicGuidanceRoots) {
    await collectPublicGuidancePaths(root, paths)
  }

  return paths.toSorted()
}

async function collectPublicGuidancePaths(directory, paths) {
  const entries = await readdir(resolve(packageRoot, directory), { withFileTypes: true })

  for (const entry of entries.toSorted((left, right) => left.name.localeCompare(right.name))) {
    const path = `${directory}/${entry.name}`

    if (entry.isDirectory()) {
      if (!excludedGuidanceDirectories.has(entry.name)) {
        await collectPublicGuidancePaths(path, paths)
      }
      continue
    }

    if (entry.isFile() && publicGuidanceExtensions.has(extname(entry.name))) {
      paths.push(path)
    }
  }
}

function getSection(content, heading) {
  const expression = new RegExp(
    `^## ${escapeRegularExpression(heading)}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`,
    'm',
  )
  const match = expression.exec(content)
  assert.ok(match?.[1] !== undefined, `Missing "${heading}" section`)
  return match[1]
}

function parseMarkdownTable(section, description) {
  const lines = section.split('\n')
  const start = lines.findIndex((line) => line.startsWith('|'))
  assert.ok(start >= 0, `${description} must contain a Markdown table`)

  const tableLines = []
  for (const line of lines.slice(start)) {
    if (!line.startsWith('|')) {
      break
    }
    tableLines.push(line)
  }

  assert.ok(tableLines.length >= 3, `${description} must contain a header, separator, and row`)
  assert.match(tableLines[1], /^\|(?:\s*:?-{3,}:?\s*\|)+$/)

  const [headerLine, , ...rowLines] = tableLines
  const headers = parseMarkdownRow(headerLine)
  const rows = rowLines.map((line) => parseMarkdownRow(line))

  for (const row of rows) {
    assert.equal(row.length, headers.length, `${description} has a row with the wrong column count`)
  }

  return { headers, rows }
}

function parseMarkdownRow(line) {
  assert.ok(line.endsWith('|'), `Malformed Markdown table row: ${line}`)
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

function assertHeaders(actual, expected, description) {
  assert.deepEqual(actual, expected, `${description} must use the required columns`)
}

function assertQuickStart(readme) {
  const section = getSection(readme, 'Quick start')
  const match = /^```tsx\n([\s\S]*?)\n```/m.exec(section)
  assert.ok(match?.[1] !== undefined, 'Quick start must begin with a fenced TSX example')
  const example = match[1]

  assert.match(
    example,
    /import\s*\{\s*useViewport\s*\}\s*from\s*['"]@nipe-solutions\/react-viewport['"]/,
    'Quick start must import useViewport from the package',
  )
  assert.match(
    example,
    /\bconst\s+viewport\s*=\s*useViewport\(\)/,
    'Quick start must call useViewport()',
  )
  assert.match(example, /export function \w+\(\)/, 'Quick start must export a runnable component')
}

function assertReadmeOpening(readme) {
  const firstCopyLine = readme
    .split('\n')
    .slice(1)
    .find((line) => line.trim().length > 0)
  assert.equal(
    firstCopyLine,
    'Visual viewport geometry as React state.',
    'README must lead with product utility',
  )

  const installationIndex = readme.indexOf('\n## Installation')
  assert.ok(installationIndex > 0, 'README must contain Installation after its opening')
  const opening = readme.slice(0, installationIndex)
  assert.ok(opening.includes('= useViewport()'), 'README opening must show the useViewport shape')
  assert.ok(opening.includes('**Alpha software:**'), 'README opening must keep the alpha caveat')
  assert.ok(
    opening.includes('[browser limitations](#browser-terminology-and-limitations)'),
    'README opening must link to browser limitations',
  )

  const links = new Map(
    [...opening.matchAll(/\[([^\]]+)]\(([^)]+)\)/g)].map((match) => [match[1], match[2]]),
  )
  const discoveryLinks = new Map([
    ['CSS alternatives', '#when-css-is-enough'],
    ['Keyboard and safe area', '#keyboard-and-safe-area'],
    ['Browser behavior', '#browser-terminology-and-limitations'],
  ])
  for (const [label, href] of discoveryLinks) {
    assert.equal(
      links.get(label),
      href,
      `README opening discovery links must include ${label} -> ${href}`,
    )
  }
}

async function assertQaMatrix(qa) {
  const platformTable = parseMarkdownTable(getSection(qa, 'Platform matrix'), 'Platform matrix')
  assertHeaders(
    platformTable.headers,
    ['Platform / context', 'Status', 'Required scenarios', 'Evidence'],
    'Platform matrix',
  )

  const platformRows = new Map(platformTable.rows.map((row) => [row[0], row]))
  for (const [platform, expectedStatus] of platformStatuses) {
    const row = platformRows.get(platform)
    assert.ok(row !== undefined, `Platform matrix must contain an exact ${platform} row`)
    assert.equal(row[1], expectedStatus, `${platform} status must be ${expectedStatus}`)
    if (expectedStatus !== 'MANUAL PENDING') {
      await assertEvidenceLinks(row[3], `${platform} evidence`)
    }
  }

  const scenarioTable = parseMarkdownTable(getSection(qa, 'Scenario coverage'), 'Scenario coverage')
  assertHeaders(scenarioTable.headers, qaScenarioColumns, 'Scenario coverage')

  const scenarioRows = new Map(scenarioTable.rows.map((row) => [row[0], row]))
  for (const [scenario, expectedAutomatedStatus] of qaScenarios) {
    const row = scenarioRows.get(scenario)
    assert.ok(row !== undefined, `Scenario coverage must contain a ${scenario} scenario row`)
    assert.equal(row[1], 'MANUAL PENDING', `${scenario} physical status must remain pending`)
    assert.equal(
      row[2],
      expectedAutomatedStatus,
      `${scenario} automated status must be ${expectedAutomatedStatus}`,
    )
    assert.ok(row[3].length > 0, `${scenario} must define its exact automated scope`)

    if (expectedAutomatedStatus === 'MANUAL PENDING') {
      assert.equal(row[4], '—', `${scenario} must not cite nonexistent automated evidence`)
    } else {
      await assertEvidenceLinks(row[4], `${scenario} evidence`)
    }
  }

  const statuses = [
    ...platformTable.rows.map((row) => row[1]),
    ...scenarioTable.rows.flatMap((row) => [row[1], row[2]]),
  ]
  assert.equal(
    statuses.includes('MANUAL VERIFIED'),
    false,
    'Initial QA matrix must have no MANUAL VERIFIED status',
  )
}

async function assertEvidenceLinks(cell, description) {
  const targets = [...cell.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])
  assert.ok(targets.length > 0, `${description} must contain a Markdown evidence link`)

  for (const target of targets) {
    const evidencePath = resolve(packageRoot, 'docs', target)
    await assert.doesNotReject(
      readFile(evidencePath, 'utf8'),
      `${description} does not exist: ${target}`,
    )
  }
}

function assertBrowserNoteRegistry(browserNotes) {
  const registryTable = parseMarkdownTable(
    getSection(browserNotes, 'Registry format'),
    'Browser-note registry format',
  )
  assertHeaders(registryTable.headers, ['Field', 'Record'], 'Browser-note registry format')

  const fields = new Map(registryTable.rows.map((row) => [row[0], row[1]]))
  for (const field of browserNoteFields) {
    const record = fields.get(field)
    assert.ok(
      record !== undefined && record.length > 0,
      `Browser-note registry must include ${field}`,
    )
  }

  assert.ok(
    fields.get('Classification')?.includes('Supported, Tested, or Fallback'),
    'Browser-note registry classification must distinguish Supported, Tested, and Fallback',
  )
}

function assertSecurityPolicy(securityPolicy) {
  const normalizedSecurityPolicy = securityPolicy.replace(/\s+/g, ' ')
  const privateAdvisoryUrl =
    'https://github.com/NIPE-Solutions/react-viewport/security/advisories/new'
  const safePublicFallback = [
    'open a public issue containing no vulnerability details',
    'only request a private maintainer channel',
    'Do not disclose security details in a public issue.',
    'Wait for a private response before sharing any vulnerability detail.',
  ]

  assert.ok(
    securityPolicy.includes(privateAdvisoryUrl),
    'Security policy must use the repository GitHub private-advisory URL as the primary route',
  )
  assert.equal(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(securityPolicy),
    false,
    'Security policy must not include an email reporting route without package-specific authorization',
  )

  for (const requiredText of safePublicFallback) {
    assert.ok(
      normalizedSecurityPolicy.includes(requiredText),
      `Security policy must include safe public fallback wording: ${requiredText}`,
    )
  }
}

async function assertNoMisleadingKeyboardGuidance() {
  const memberPrefix = String.raw`(?:[$A-Z_a-z][\w$]*(?:\?\.|\.))*`
  const keyboardOperand = String.raw`\b${memberPrefix}keyboard(?:(?:\?\.|\.)height|Height|Occlusion|BottomOcclusion|Inset|InsetBottom|BottomInset)\b`
  const safeAreaOperand = String.raw`(?:\b${memberPrefix}safeArea(?:(?:\?\.|\.)bottom|Bottom|InsetBottom)\b|\bbottomSafeArea(?:Inset)?\b)`
  const addition = String.raw`\s*\)?\s*\+\s*\(?\s*`
  const additiveInsetPatterns = [
    new RegExp(`${keyboardOperand}${addition}${safeAreaOperand}`, 'i'),
    new RegExp(`${safeAreaOperand}${addition}${keyboardOperand}`, 'i'),
    /(?:var|env)\(\s*(?:--)?[^)]*keyboard[^)]*\)\s*\+\s*(?:var|env)\(\s*(?:--)?[^)]*safe-area[^)]*\)/i,
    /(?:var|env)\(\s*(?:--)?[^)]*safe-area[^)]*\)\s*\+\s*(?:var|env)\(\s*(?:--)?[^)]*keyboard[^)]*\)/i,
    /(?:var|env)\(\s*(?:--)?[^)\n]*keyboard[^)\n]*\)\s*\+\s*max\(\s*[^,()\n]+,\s*(?:var|env)\(\s*(?:--)?[^)\n]*safe-area[^)\n]*\)\s*\)/i,
    /max\(\s*[^,()\n]+,\s*(?:var|env)\(\s*(?:--)?[^)\n]*safe-area[^)\n]*\)\s*\)\s*\+\s*(?:var|env)\(\s*(?:--)?[^)\n]*keyboard[^)\n]*\)/i,
  ]
  const universalDetectionPatterns = [
    /\b(?:detects?|reports?|recognizes?|identifies?)\s+every\b[^.\n]{0,80}\bkeyboard\b/i,
    /\bevery\b[^.\n]{0,80}\bkeyboard\b[^.\n]{0,40}\b(?:is|are)\s+(?:reliably\s+)?detected\b/i,
  ]
  const nonCanonicalFormulaPatterns = [
    /\bmax\(0,\s*layout\.height\s*-\s*\(visual\.height\s*\+\s*visual\.offsetTop\)\)/,
  ]

  for (const path of await discoverPublicGuidancePaths()) {
    const content = await readDocument(path)
    for (const pattern of additiveInsetPatterns) {
      assert.doesNotMatch(content, pattern, `${path} must not add keyboard and safe area insets`)
    }
    for (const pattern of universalDetectionPatterns) {
      assert.doesNotMatch(content, pattern, `${path} must not claim every keyboard is detected`)
    }
    for (const pattern of nonCanonicalFormulaPatterns) {
      assert.doesNotMatch(
        content,
        pattern,
        `${path} must use the canonical Math.max bottom-occlusion formula`,
      )
    }
  }
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

await assertNoMisleadingKeyboardGuidance()

for (const [path, requiredText] of textRequirements) {
  const content = await readDocument(path)
  const normalizedContent = content.replace(/\s+/g, ' ')
  assert.ok(normalizedContent.includes(requiredText), `${path} must include: ${requiredText}`)
}

assertReadmeOpening(await readDocument('README.md'))
assertQuickStart(await readDocument('README.md'))
await assertQaMatrix(await readDocument('docs/REAL_DEVICE_QA.md'))
assertBrowserNoteRegistry(await readDocument('docs/browser-notes.md'))
assertSecurityPolicy(await readDocument('SECURITY.md'))

process.stdout.write(
  `Documentation verification passed (${textRequirements.length} text checks and 5 structural checks).\n`,
)
