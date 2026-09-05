import assert from 'node:assert/strict'
import console from 'node:console'
import { setTimeout as delay } from 'node:timers/promises'

import { JSDOM } from 'jsdom'
import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import {
  ViewportProvider,
  useViewport,
  useViewportCssVariables,
} from '@nipe-solutions/react-viewport'

assert.equal(React.version, '18.3.1')

function Consumer() {
  const state = useViewport()
  useViewportCssVariables()
  return React.createElement('output', null, state.ready ? String(state.layout?.width) : 'pending')
}

function App({ targetWindow }) {
  return React.createElement(ViewportProvider, { targetWindow }, React.createElement(Consumer))
}

const serverHtml = renderToString(React.createElement(App, { targetWindow: null }))
assert.match(serverHtml, />pending</)

const dom = new JSDOM(`<div id="root">${serverHtml}</div>`, {
  pretendToBeVisual: true,
  url: 'https://consumer.example/',
})
const { window } = dom
const frames = new Map()
let nextFrame = 1
window.requestAnimationFrame = (callback) => {
  const id = nextFrame++
  frames.set(id, callback)
  return id
}
window.cancelAnimationFrame = (id) => frames.delete(id)

for (const [name, value] of Object.entries({
  document: window.document,
  Element: window.Element,
  HTMLElement: window.HTMLElement,
  navigator: window.navigator,
  window,
})) {
  Object.defineProperty(globalThis, name, { configurable: true, value, writable: true })
}

const errors = []
const originalError = console.error
console.error = (...arguments_) => errors.push(arguments_.join(' '))

try {
  const container = window.document.querySelector('#root')
  assert.ok(container)
  const root = hydrateRoot(container, React.createElement(App, { targetWindow: window }))

  await waitFor(() => frames.size > 0)
  for (const callback of frames.values()) callback(0)
  frames.clear()
  await waitFor(() => container.textContent !== 'pending')

  assert.equal(container.textContent, String(window.innerWidth))
  assert.equal(
    window.document.documentElement.style.getPropertyValue('--react-viewport-layout-width'),
    `${window.innerWidth}px`,
  )
  assert.deepEqual(errors, [])

  root.unmount()
  assert.equal(
    window.document.documentElement.style.getPropertyValue('--react-viewport-layout-width'),
    '',
  )
} finally {
  console.error = originalError
  dom.window.close()
}

async function waitFor(assertion) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (assertion()) return
    await delay(10)
  }
  assert.fail('Timed out waiting for the React 18 hydration consumer')
}
