import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const repositoryRoot = process.cwd()
const outputRoot = path.join(repositoryRoot, 'website', 'out')
const canonicalOrigin = 'https://react-viewport.nipesolutions.com'

const routes = [
  {
    route: '/',
    file: 'index.html',
    copy: ['Viewport geometry you can reason about', 'Layout viewport', 'Visual viewport'],
  },
  { route: '/api', file: 'api.html', copy: ['API reference', 'useViewport()', 'ViewportState'] },
  {
    route: '/browser-behavior',
    file: 'browser-behavior.html',
    copy: ['Browser behavior', 'iOS Safari', 'Android Chrome', 'WebViews'],
  },
  {
    route: '/examples',
    file: 'examples.html',
    copy: ['Examples', 'CSS-variable composer', 'When CSS is enough'],
  },
  {
    route: '/imprint',
    file: 'imprint.html',
    copy: ['Imprint', 'Verified against', 'opensource.nipesolutions.com/impressum'],
  },
  {
    route: '/privacy',
    file: 'privacy.html',
    copy: ['Privacy', 'Verified against', 'opensource.nipesolutions.com/privacy'],
  },
]

await assertDirectory(outputRoot)

for (const { route, file, copy } of routes) {
  const html = await readFile(path.join(outputRoot, file), 'utf8')
  const canonical = route === '/' ? canonicalOrigin : `${canonicalOrigin}${route}`

  assert.match(
    html,
    new RegExp(`<link[^>]+rel="canonical"[^>]+href="${escapeRegExp(canonical)}"`),
    `${route} must publish its canonical URL`,
  )
  assert.match(html, /<main[^>]+id="main-content"/, `${route} must expose the skip-link target`)

  for (const expectedCopy of copy) {
    assert.ok(html.includes(expectedCopy), `${route} must contain “${expectedCopy}”`)
  }
}

const home = await readFile(path.join(outputRoot, 'index.html'), 'utf8')
for (const expectedLink of [
  'https://github.com/NIPE-Solutions/react-viewport',
  'https://opensource.nipesolutions.com',
]) {
  assert.ok(home.includes(expectedLink), `Home must link to ${expectedLink}`)
}

const sitemap = await readFile(path.join(outputRoot, 'sitemap.xml'), 'utf8')
for (const { route } of routes) {
  const url = route === '/' ? canonicalOrigin : `${canonicalOrigin}${route}`
  assert.ok(sitemap.includes(`<loc>${url}</loc>`), `Sitemap must include ${url}`)
}

const robots = await readFile(path.join(outputRoot, 'robots.txt'), 'utf8')
assert.match(robots, /User-Agent: \*/)
assert.match(robots, /Allow: \//)
assert.ok(robots.includes(`${canonicalOrigin}/sitemap.xml`), 'robots.txt must name the sitemap')

const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'))
const installedPackages = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}
const analyticsPackages = Object.keys(installedPackages).filter((name) =>
  /analytics|segment|posthog|plausible|fathom/i.test(name),
)
assert.deepEqual(analyticsPackages, [], 'The documentation site must not install analytics')
assert.doesNotMatch(home, /googletagmanager|segment\.com|posthog|plausible|fathom/i)

process.stdout.write(`Website verification passed for ${routes.length} static routes.\n`)

async function assertDirectory(directory) {
  try {
    const result = await stat(directory)
    assert.ok(result.isDirectory(), `${directory} must be a directory`)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      assert.fail(`Website output is missing at ${directory}. Run npm run build:website first.`)
    }
    throw error
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
