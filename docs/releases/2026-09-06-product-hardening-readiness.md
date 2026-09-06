# Product hardening readiness — 2026-09-06

This report records the later product-clarity and browser-hardening branch at
source commit `c35354ab26648f118efa16e3ea4d27196fb19471`. It complements, and does not
rewrite, the historical `0.1.0-alpha.0` readiness report. Evidence was captured
locally on Node.js 24.20.0 and npm 11.19.0.

## Recommendation

**ALPHA READY.** The complete local quality gate, package boundary checks, and
Chromium, Firefox, and WebKit matrices pass. A screenshot-assisted production
site review also passes at 320 × 844 and 1440 × 1000 CSS pixels. This is not a
beta recommendation: no physical iPhone Safari or Android Chrome run was
performed, and every real-device matrix row remains pending.

## Quality gate

The final aggregate command completed with exit code 0:

```sh
npm run check
```

Its exact result counts and measurements were:

- formatting, ESLint, distribution build, TypeScript source checking, and type
  fixture checking passed;
- 125 unit tests passed in 11 files;
- the API verifier found exactly 3 runtime exports and 9 type exports;
- 11 package tests passed, including 5 packed consumers;
- documentation verification passed 39 text checks and 5 structural checks;
- 17 documentation-policy mutation tests passed;
- Next.js generated 12 of 12 static pages;
- the website verifier passed all 8 public routes; and
- 14 workflow and release-policy tests passed.

## Browser matrices

Port 4173 was already occupied by an unrelated local project, so the existing
configuration's documented environment variables selected verified-free ports.
The test commands themselves were unchanged:

```sh
export PLAYWRIGHT_FIXTURE_PORT=4273
export PLAYWRIGHT_WEBSITE_PORT=4274
npm run test:e2e && npm run test:website:e2e
```

Final output:

```text
Running 54 tests using 6 workers
54 passed (6.6s)

Running 78 tests using 3 workers
78 passed (14.6s)
```

The library result is 18 tests in each of Chromium, Firefox, and WebKit. The
website result is 26 tests in each engine. No retry was needed in the final run.

## Public package boundary

The required standalone commands all exited 0:

```sh
npm run test:api
npm run test:size
npm run test:package
npm pack --dry-run
```

The public surface remains unchanged:

```text
Public runtime exports (3): ViewportProvider, useViewport, useViewportCssVariables
Public type exports (9): KeyboardState, LayoutViewport, SafeAreaInsets,
  ViewportCssVariablesOptions, ViewportOrientation, ViewportProviderProps,
  ViewportState, ViewportSupport, VisualViewportState
```

There are zero runtime `dependencies`. React and React DOM remain peers at
`^18.3.0 || ^19.0.0`. Both distribution formats retain only `react` and
`react/jsx-runtime` as bare imports.

Measured package budgets:

| Artifact | Measured | Limit | Headroom |
| --- | ---: | ---: | ---: |
| Minified ESM | 12,421 bytes | 12,985 bytes | 564 bytes |
| Gzip ESM | 3,740 bytes | 3,960 bytes | 220 bytes |
| npm tarball | 16,178 bytes | 16,779 bytes | 601 bytes |

`npm pack --dry-run --json` reported 38 files and 50,192 bytes unpacked. The
archive contains only `CHANGELOG.md`, `LICENSE`, `README.md`, `package.json`, the
ESM and CommonJS entries, and the declaration/declaration-map files under
`dist/`. The ESM, CommonJS, React 18 hydration, React 19 Vite, and React 19
Next.js packed consumers all passed.

## Production website inspection

The freshly built static output was served with:

```sh
WEBSITE_PORT=4275 npm run serve:website
```

Headless Chromium screenshots were inspected for `/`, `/examples`, `/concepts`,
`/api`, `/browser-behavior`, `/project`, `/imprint`, and `/privacy` at 320 × 844
and 1440 × 1000. All 16 route/viewport combinations returned HTTP 200, emitted
no console errors or uncaught page errors, and had document `scrollWidth` equal
to viewport `clientWidth` (320 or 1,440 pixels). Code samples scroll inside their
own code regions where needed; they do not widen the document.

The review confirmed:

- the first Tab stop on every route is the visible `Skip to content` link with a
  3px solid coral focus outline, fully inside the viewport;
- body copy computes to 16px at 320px and 17px at desktop width, with distinct
  h1/h2 scale and sufficient spacing to preserve the reading hierarchy;
- the homepage leads with the usable-screen problem and a working composer;
- `Live browser`, `Current snapshot`, `Simulate keyboard`, and the explanatory
  note make measured state and simulation visibly distinct;
- Examples, Concepts, API, and Browser behavior preserve readable content order
  and locally contained code/data regions;
- Project, Imprint, and Privacy make repository, evidence, and legal trust
  destinations clear; and
- no content clipping or unintended horizontal page scrolling remains.

The inspection initially found `/examples` at 422px document width on a 320px
viewport. A focused browser regression reproduced the failure, and an explicit
`minmax(0, 1fr)` track now contains the examples stack. The new case passes in
all three engines.

## Verification corrections made

- `34ecc23` updates the stale website discovery guard from the historical 42
  cases to the branch's then-current 75 cases.
- `5e83eca` reads sitemap XML from its HTTP response rather than assuming every
  engine creates an HTML `body` for XML; the pre-fix Firefox test failed on both
  attempts while the XML itself was correct.
- `ecd18ee` adds the 320px Examples regression and contains the examples grid.
- `c35354a` records the resulting 78-case website discovery matrix.

## Limitations and remaining work

- No physical-device evidence was collected. iPhone Safari, iPad Safari,
  Android Chrome, installed PWA, embedded WebView, external-keyboard, browser
  chrome animation, floating/split keyboard, and safe-area behavior remain
  manual pending where specified by the real-device QA matrix.
- Headless desktop engine automation and 320px emulation do not reproduce mobile
  browser chrome, keyboard animation, display cutouts, or host WebView behavior.
- The in-app browser had no available browser instance, so the visual pass used
  the repository's installed Playwright Chromium and local production
  screenshots.
- This pass did not publish to npm, deploy a new website build, or revalidate
  external production/custom-domain state.
- Bundle headroom is positive but intentionally narrow; the enforced size gate
  remains important for later runtime changes.

Until the physical iPhone Safari and Android Chrome rows have exact device,
OS/browser, date, scenario, and evidence records, this branch must not be called
beta ready.
