import { CodeBlock } from './CodeBlock'
import { Composer } from './Composer'

import './BrowserCssLab.css'

// No useViewport subscription or JavaScript sizing. The same form participates
// in normal grid layout, and the browser owns keyboard-related viewport resizing.
export function BrowserCssLab({
  code,
  css,
  composerCode,
}: {
  readonly code: string
  readonly css: string
  readonly composerCode: string
}) {
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
            Need geometry inside React logic? Open the Geometry Lab →
          </a>
          <h1>CSS Baseline</h1>
          <span className="mode-badge">BROWSER + CSS</span>
          <p>
            This composer requires no React Viewport. Browser-native layout is the recommended
            solution when it meets your requirements.
          </p>
          <p>
            Browser policy: <code>interactive-widget=resizes-content</code>.{' '}
            <strong>Requested, not detected.</strong> On a supporting browser, the page shrinks when
            the keyboard opens. iOS may ignore this request and cover or pan the composer.
          </p>
          <p>
            This uses 100dvh, env(safe-area-inset-bottom) and normal grid layout. Tap the input,
            scroll, then close the keyboard. If this solves your problem, stop here.
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
          <CodeBlock collapsible label="Composer.tsx · actual source" code={composerCode} />
          <p className="browser-css-end">
            End of content. Test a long swipe here with the keyboard open.
          </p>
        </div>
      </div>
      <Composer testId="css-composer" />
    </div>
  )
}
