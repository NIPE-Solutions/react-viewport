import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

const requirements = [
  ['README.md', 'Reliable mobile viewport state for React.'],
  ['README.md', 'npm install @nipe-solutions/react-viewport'],
  ['README.md', 'useViewport'],
  ['README.md', 'useViewportCssVariables'],
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
  ['README.md', 'limitations'],
  ['docs/browser-notes.md', 'Browser notes registry'],
  ['docs/browser-notes.md', 'max(80 CSS px, 15% of layout height)'],
  ['docs/browser-notes.md', 'Supported'],
  ['docs/browser-notes.md', 'Tested'],
  ['docs/browser-notes.md', 'Fallback'],
  ['docs/REAL_DEVICE_QA.md', 'AUTOMATED'],
  ['docs/REAL_DEVICE_QA.md', 'MANUAL PENDING'],
  ['docs/REAL_DEVICE_QA.md', 'MANUAL VERIFIED'],
  ['docs/REAL_DEVICE_QA.md', 'iPhone Safari'],
  ['docs/REAL_DEVICE_QA.md', 'iPad Safari'],
  ['docs/REAL_DEVICE_QA.md', 'Android Chrome'],
  ['docs/REAL_DEVICE_QA.md', 'Desktop Safari'],
  ['docs/REAL_DEVICE_QA.md', 'Desktop Chrome'],
  ['docs/REAL_DEVICE_QA.md', 'PWA'],
  ['docs/REAL_DEVICE_QA.md', 'WebView'],
  ['docs/REAL_DEVICE_QA.md', 'external keyboard'],
  ['docs/REAL_DEVICE_QA.md', 'keyboard open/close'],
  ['docs/REAL_DEVICE_QA.md', 'rapid input switching'],
  ['docs/REAL_DEVICE_QA.md', 'rotation'],
  ['docs/REAL_DEVICE_QA.md', 'toolbar collapse/expansion'],
  ['docs/REAL_DEVICE_QA.md', 'scrolling with and without the keyboard'],
  ['docs/REAL_DEVICE_QA.md', 'modal input'],
  ['docs/REAL_DEVICE_QA.md', 'fixed-bottom composer'],
  ['docs/REAL_DEVICE_QA.md', 'safe areas'],
  ['docs/REAL_DEVICE_QA.md', 'zoom'],
  ['docs/REAL_DEVICE_QA.md', 'restoration after blur'],
  ['CHANGELOG.md', '0.1.0-alpha.0'],
  ['CONTRIBUTING.md', 'npm run format:check'],
  ['SECURITY.md', 'Security Policy'],
  ['CODE_OF_CONDUCT.md', 'Code of Conduct'],
  ['LICENSE', 'MIT License'],
  ['docs/RELEASING.md', 'npm pack'],
  ['.github/ISSUE_TEMPLATE/bug-report.yml', 'browser'],
  ['.github/ISSUE_TEMPLATE/config.yml', 'blank_issues_enabled'],
  ['.github/pull_request_template.md', 'Testing'],
]

const contents = new Map()

async function readDocument(path) {
  if (!contents.has(path)) {
    contents.set(path, await readFile(resolve(packageRoot, path), 'utf8'))
  }

  return contents.get(path)
}

for (const [path, requiredText] of requirements) {
  const content = await readDocument(path)
  const normalizedContent = content.replace(/\s+/g, ' ')
  assert.ok(normalizedContent.includes(requiredText), `${path} must include: ${requiredText}`)
}

const qa = await readDocument('docs/REAL_DEVICE_QA.md')
for (const platform of ['iPhone', 'iPad', 'Android', 'PWA', 'WebView', 'external keyboard']) {
  const row = qa.split('\n').find((line) => line.includes(platform))
  assert.ok(row?.includes('MANUAL PENDING'), `${platform} must remain MANUAL PENDING`)
}

console.log(`Documentation verification passed (${requirements.length} content assertions).`)
