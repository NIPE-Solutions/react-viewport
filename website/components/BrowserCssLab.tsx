import { CodeBlock } from './CodeBlock'
import { Composer } from './Composer'

import './BrowserCssLab.css'

// No useViewport subscription or JavaScript sizing. The same form participates
// in normal grid layout, and the browser owns keyboard-related viewport resizing.
export function BrowserCssLab({ code, css }: { readonly code: string; readonly css: string }) {
  return (
    <div className="browser-css-lab">
      <div
        className="browser-css-scroll"
        role="region"
        aria-label="CSS baseline content"
        tabIndex={0}
      >
        <div className="lab-content">
          <a className="lab-home" href="/lab">
            Open measured fallback
          </a>
          <h1>Browser + CSS baseline</h1>
          <span className="mode-badge">BROWSER + CSS</span>
          <p>The composer uses ordinary grid layout. React Viewport does not position it.</p>
          <p>
            Browser policy: <code>interactive-widget=resizes-content</code>.{' '}
            <strong>Requested, not detected.</strong> On a supporting browser, the page shrinks when
            the keyboard opens. iOS may ignore this request and cover or pan the composer.
          </p>
          <p>
            Tap the input, scroll this content, then close the keyboard. If this layout meets your
            needs, use the browser and CSS—you do not need a viewport library for this composer.
          </p>
          <p>
            JavaScript still needs measurements for decisions such as rendering budgets or
            coordinate calculations. <a href="/examples#result-budget">Try a JavaScript use case</a>
            .
          </p>
          <CodeBlock
            collapsible
            label="Browser resize policy"
            code={
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">'
            }
          />
          <CodeBlock collapsible label="BrowserCssLab.tsx · actual source" code={code} />
          <CodeBlock collapsible label="BrowserCssLab.css · actual source" code={css} />
          <p className="browser-css-end">
            End of content. Test a long swipe here with the keyboard open.
          </p>
        </div>
      </div>
      <Composer
        keyboardHeight={0}
        safeAreaBottom={0}
        aware={false}
        position="static"
        testId="css-composer"
      />
    </div>
  )
}
