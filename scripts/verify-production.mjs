import assert from 'node:assert/strict'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

export async function verifyProduction(
  expectedCommit,
  {
    origins = ['https://react-viewport.nipesolutions.com', 'https://react-viewport.vercel.app'],
    fetch = (input, options) =>
      globalThis.fetch(input, { ...options, signal: globalThis.AbortSignal.timeout(10_000) }),
    report = (message) => process.stdout.write(message),
  } = {},
) {
  assert.match(expectedCommit ?? '', /^[a-f0-9]{40}$/, 'Pass the expected full production Git SHA')
  const markers = []
  for (const origin of origins) {
    const markerResponse = await fetch(`${origin}/build.json`, { cache: 'no-store' })
    assert.equal(markerResponse.status, 200, `${origin}: build marker missing`)
    const marker = await markerResponse.json()
    assert.equal(marker.commit, expectedCommit, `${origin}: stale or wrong commit`)
    markers.push(marker)
    for (const [route, text] of [
      ['/', 'Keep mobile UI above the software keyboard.'],
      ['/lab', 'Live Device Lab'],
      ['/examples', 'Chat composer'],
    ]) {
      const response = await fetch(`${origin}${route}`, { cache: 'no-store' })
      assert.equal(response.status, 200, `${origin}${route}`)
      const html = await response.text()
      assert.ok(html.includes(text), `${origin}${route}: wrong website artifact`)
      assert.ok(
        html.includes(`name="build-sha" content="${expectedCommit}"`),
        `${origin}${route}: HTML/marker mismatch`,
      )
      // Verify the actual referenced executable assets exist, not just a cached HTML shell.
      for (const asset of new Set(
        [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]),
      )) {
        const assetResponse = await fetch(new URL(asset, origin), { method: 'HEAD' })
        assert.equal(assetResponse.status, 200, `${origin}: missing asset ${asset}`)
      }
    }
    const missing = await fetch(`${origin}/__deployment-smoke-missing__`)
    assert.equal(missing.status, 404, `${origin}: unknown routes must return 404`)
    assert.ok((await missing.text()).includes('Page not found'))
    report(`${origin}: ${marker.commit} (${marker.builtAt}) verified\n`)
  }
  assert.deepEqual(markers[0], markers[1], 'Production aliases must serve the same build')

  return markers
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await verifyProduction(process.argv[2])
}
