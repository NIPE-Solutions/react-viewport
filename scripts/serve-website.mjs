import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import process from 'node:process'
import { URL } from 'node:url'

const outputRoot = join(process.cwd(), 'website', 'out')
const port = Number.parseInt(process.env.WEBSITE_PORT ?? '4174', 10)

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
])

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  try {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    const filePath = resolveOutputPath(requestUrl.pathname)
    const body = await readFile(filePath)
    const contentType = contentTypes.get(extname(filePath)) ?? 'application/octet-stream'

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentType,
    })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch (error) {
    const status = isNotFound(error) ? 404 : 500
    response.writeHead(status, {
      'Content-Type': status === 404 ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
    })
    response.end(
      request.method === 'HEAD'
        ? undefined
        : status === 404
          ? await readFile(join(outputRoot, '404.html'))
          : 'Internal server error',
    )
  }
})

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(port, '127.0.0.1', resolve)
})

process.stdout.write(`Serving website/out at http://127.0.0.1:${port}\n`)

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => process.exit(0)))
}

function resolveOutputPath(pathname) {
  const decoded = decodeURIComponent(pathname)
  const route = decoded.replace(/^\/+|\/+$/g, '')
  const requestedFile =
    route === '' ? 'index.html' : extname(route) === '' ? `${route}.html` : route
  const normalizedFile = normalize(requestedFile)

  if (normalizedFile.startsWith('..') || normalizedFile.startsWith('/')) {
    const error = new Error('Path escapes the static output directory')
    error.code = 'ENOENT'
    throw error
  }

  return join(outputRoot, normalizedFile)
}

function isNotFound(error) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
