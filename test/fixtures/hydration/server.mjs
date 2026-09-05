import console from 'node:console'
import { createServer as createHttpServer } from 'node:http'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { useViewport } from '@nipe-solutions/react-viewport'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer as createViteServer } from 'vite'

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url))
const fixtureRoot = fileURLToPath(new URL('..', import.meta.url))
const port = Number.parseInt(process.env.PLAYWRIGHT_FIXTURE_PORT ?? '4173', 10)

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PLAYWRIGHT_FIXTURE_PORT must be a valid TCP port')
}

function App() {
  const state = useViewport()

  return createElement(
    'main',
    null,
    createElement('h1', null, 'Hydration fixture'),
    createElement('output', { 'data-testid': 'hydration-state' }, JSON.stringify(state)),
  )
}

const vite = await createViteServer({
  root: fixtureRoot,
  appType: 'mpa',
  server: {
    middlewareMode: true,
    fs: {
      allow: [projectRoot],
    },
  },
})

const server = createHttpServer((request, response) => {
  void handleRequest(request, response).catch((error) => {
    vite.ssrFixStacktrace(error)
    console.error(error)
    response.statusCode = 500
    response.end('Fixture server error')
  })
})

async function handleRequest(request, response) {
  const url = request.url ?? '/'
  const pathname = new URL(url, `http://127.0.0.1:${port}`).pathname

  if (pathname !== '/hydration/' && pathname !== '/hydration/index.html') {
    vite.middlewares(request, response, (error) => {
      if (error !== undefined) {
        throw error
      }

      response.statusCode = 404
      response.end('Fixture not found')
    })
    return
  }

  const appMarkup = renderToString(createElement(App))
  const html = await vite.transformIndexHtml(
    url,
    `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>React Viewport hydration fixture</title>
        </head>
        <body>
          <div id="root">${appMarkup}</div>
          <script>
            (() => {
              const frames = new Map()
              let nextFrameId = 1
              window.requestAnimationFrame = (callback) => {
                const frameId = nextFrameId++
                frames.set(frameId, callback)
                return frameId
              }
              window.cancelAnimationFrame = (frameId) => frames.delete(frameId)
              window.__hydrationFixture = {
                flushAnimationFrames() {
                  const pending = [...frames.values()]
                  frames.clear()
                  pending.forEach((callback) => callback(performance.now()))
                },
              }
            })()
          </script>
          <script type="module" src="/hydration/client.tsx"></script>
        </body>
      </html>`,
  )

  response.statusCode = 200
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(html)
}

server.listen(port, '127.0.0.1')

async function shutDown() {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve()
      } else {
        reject(error)
      }
    })
  })
  await vite.close()
}

process.once('SIGINT', () => void shutDown())
process.once('SIGTERM', () => void shutDown())
