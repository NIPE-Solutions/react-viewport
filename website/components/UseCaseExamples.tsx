'use client'

import { useRef, type CSSProperties } from 'react'
import { useViewport, useViewportCssVariables } from '@nipe-solutions/react-viewport'

import { CodeBlock } from './CodeBlock'
import { getEffectiveBottomInset } from '../lib/layout-policy'

type ExampleProperties = CSSProperties & {
  '--example-effective-bottom': string
  '--example-visual-height': string
  '--example-visual-top': string
}

export function UseCaseExamples({ source }: { readonly source: string }) {
  const examplesRef = useRef<HTMLDivElement>(null)
  const { layout, visual, keyboard, safeArea } = useViewport()
  useViewportCssVariables({ target: examplesRef })

  const visibleAreaHeight = visual?.height ?? null
  const effectiveBottomInset = getEffectiveBottomInset(keyboard.height, safeArea.bottom)
  const layoutHeight = layout?.height ?? null
  const style = {
    '--example-effective-bottom': asPercentage(effectiveBottomInset, layoutHeight),
    '--example-visual-height': asPercentage(visibleAreaHeight, layoutHeight, 100),
    '--example-visual-top': asPercentage(visual?.offsetTop ?? null, layoutHeight),
  } as ExampleProperties

  return (
    <div ref={examplesRef} className="use-case-examples" style={style}>
      <section
        className="composer-demo use-case-example"
        data-testid="composer-demo"
        aria-labelledby="chat-composer-heading"
      >
        <div className="composer-demo__copy">
          <h2 id="chat-composer-heading">Chat composer</h2>
          <p>
            Keep the input above the bottom edge that is actually blocked. Keyboard occlusion and
            the safe area overlap there, so this composer uses the larger measurement rather than
            adding both.
          </p>
          <InsetEquation
            keyboardHeight={keyboard.height}
            safeAreaBottom={safeArea.bottom}
            effectiveBottomInset={effectiveBottomInset}
          />
        </div>
        <div className="composer-stage">
          <div className="composer-stage__content" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <form
            className="composer-shell"
            data-testid="composer-shell"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="composer-message">Message</label>
            <div>
              <input id="composer-message" name="message" placeholder="Type a message" />
              <button type="submit">Send</button>
            </div>
          </form>
        </div>
        <CodeBlock collapsible label="Example implementation · actual source" code={source} />
      </section>

      <section className="modal-example use-case-example" aria-labelledby="modal-actions-heading">
        <div className="use-case-example__copy">
          <h2 id="modal-actions-heading">Modal actions</h2>
          <p>
            Anchor the action bar to the same effective bottom inset. This is a geometry
            illustration, not modal framework behavior: it adds no portal, focus trap, focus
            management, or scroll lock.
          </p>
        </div>
        <div
          className="modal-stage"
          role="img"
          aria-label={`Modal action bar inside the visible region with a ${formatPixels(effectiveBottomInset)} effective bottom inset`}
        >
          <div className="modal-stage__visual" data-testid="modal-visual-region" aria-hidden="true">
            <span>visual viewport</span>
          </div>
          <div className="modal-sheet" aria-hidden="true">
            <div className="modal-sheet__title" />
            <div className="modal-sheet__line" />
            <div className="modal-sheet__line modal-sheet__line--short" />
          </div>
          <div className="modal-action-bar" data-testid="modal-action-bar" aria-hidden="true">
            <span>Cancel</span>
            <strong>Save changes</strong>
          </div>
        </div>
        <CodeBlock collapsible label="Example implementation · actual source" code={source} />
      </section>

      <section
        className="visible-area-example use-case-example"
        aria-labelledby="visible-area-heading"
      >
        <div className="use-case-example__copy">
          <h2 id="visible-area-heading">Visible area</h2>
          <p>
            Read <code>visual?.height ?? null</code> when behavior needs the currently visible
            height, such as choosing how many results to render without treating browser chrome as a
            keyboard.
          </p>
        </div>
        <div className="visible-area-ruler">
          <span aria-hidden="true">0</span>
          <output data-testid="visible-area-height" data-example-output aria-live="polite">
            {formatNullablePixels(visibleAreaHeight)}
          </output>
          <span aria-hidden="true">visible height</span>
        </div>
        <CodeBlock collapsible label="Example implementation · actual source" code={source} />
      </section>

      <section
        className="css-bridge-example use-case-example"
        aria-labelledby="css-variables-heading"
      >
        <div className="use-case-example__copy">
          <h2 id="css-variables-heading">CSS variables</h2>
          <p>
            <code>useViewportCssVariables()</code> writes measurements onto this example group.
            Measure once in the shared viewport store, then let CSS consume the geometry where
            styling is all you need. CSS can then position interface chrome without copying viewport
            state into component styles.
          </p>
        </div>
        <dl className="css-variable-readout">
          <div>
            <dt>--react-viewport-keyboard-height</dt>
            <dd>
              <output data-testid="css-keyboard-height" data-example-output>
                {formatPixels(keyboard.height)}
              </output>
            </dd>
          </div>
          <div>
            <dt>--react-viewport-safe-area-bottom</dt>
            <dd>
              <output data-testid="css-safe-area-bottom" data-example-output>
                {formatPixels(safeArea.bottom)}
              </output>
            </dd>
          </div>
        </dl>
        <CodeBlock collapsible label="Example implementation · actual source" code={source} />
      </section>
    </div>
  )
}

function InsetEquation({
  keyboardHeight,
  safeAreaBottom,
  effectiveBottomInset,
}: {
  readonly keyboardHeight: number
  readonly safeAreaBottom: number
  readonly effectiveBottomInset: number
}) {
  return (
    <dl className="inset-equation" aria-label="Effective bottom inset calculation">
      <div>
        <dt>Keyboard</dt>
        <dd>
          <output data-testid="keyboard-height-output" data-example-output>
            {formatPixels(keyboardHeight)}
          </output>
        </dd>
      </div>
      <div>
        <dt>Safe bottom</dt>
        <dd>
          <output data-testid="safe-area-bottom-output" data-example-output>
            {formatPixels(safeAreaBottom)}
          </output>
        </dd>
      </div>
      <div>
        <dt>Effective inset</dt>
        <dd>
          <output data-testid="effective-bottom-inset" data-example-output aria-live="polite">
            {formatPixels(effectiveBottomInset)}
          </output>
        </dd>
      </div>
    </dl>
  )
}

function asPercentage(value: number | null, total: number | null, fallback = 0): string {
  if (value === null || total === null || total <= 0) return `${fallback}%`
  return `${Math.min(100, Math.max(0, (value / total) * 100))}%`
}

function formatNullablePixels(value: number | null): string {
  return value === null ? 'Pending' : formatPixels(value)
}

function formatPixels(value: number): string {
  return `${Math.round(value * 10) / 10}px`
}
