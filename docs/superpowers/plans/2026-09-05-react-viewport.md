# React Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, document, and prepare deployment of `@nipe-solutions/react-viewport`, a conservative React abstraction over layout viewport, visual viewport, virtual-keyboard, and safe-area geometry.

**Architecture:** A framework-independent store is cached per `Window`, batches browser events into atomic animation-frame measurements, and exposes stable readonly snapshots. React bindings use `useSyncExternalStore`; an opt-in CSS-variable hook writes directly to a chosen element. A Next.js website demonstrates the real package and is configured for Vercel.

**Tech Stack:** Node.js 24, npm 11, TypeScript 6, React 18.3/19, Vite 8, Vitest 4, Testing Library, Playwright, Next.js 16, ESLint 10, Prettier 3.

**Spec:** `docs/superpowers/specs/2026-09-05-react-viewport-design.md`

## Global Constraints

- Package name: `@nipe-solutions/react-viewport`; initial version: `0.1.0-alpha.0`.
- Canonical repository: `https://github.com/NIPE-Solutions/react-viewport`.
- Documentation origin: `https://react-viewport.nipesolutions.com`; deployment target: Vercel.
- Node.js support: `>=24 <25`; package manager: npm 11.
- Peer support: React and React DOM `^18.3.0 || ^19.0.0`.
- Runtime dependencies: zero; React and React DOM remain peer dependencies and build externals.
- Package formats: ESM, CommonJS, and bundled TypeScript declarations.
- Normal hook usage requires no provider; alternate windows use `ViewportProvider`.
- No device or user-agent detection, polling, silent Virtual Keyboard overlay changes, or import-time DOM mutation.
- No breakpoints, media queries, focus management, scroll locking, keyboard dismissal, input management, modal system, gestures, or generic mobile layout components.
- No `FixedBottom` component in the initial alpha; ship geometry and CSS-variable primitives first.
- Server geometry is unknown, not fabricated; all public state is readonly and snapshots are identity-stable.
- CSS variables use the `--react-viewport-*` prefix and are installed only through `useViewportCssVariables`.
- Browser measurements preserve fractional values and publish atomically at most once per animation frame.
- Initial keyboard fallback threshold: `max(80 CSS px, 15% of layout height)`; focus alone never implies an open keyboard.
- Release readiness cannot exceed ALPHA READY before representative physical iOS and Android QA.
- Legal information must come from a verified NIPE source; no analytics or cookie banner by default.

## File structure

```text
src/
  index.ts                     Public export boundary only
  types.ts                     Public readonly contracts and provider options
  environment.ts               Narrow browser API types and environment access
  editable.ts                  Keyboard-capable focused-element classification
  geometry.ts                  Pure normalization, orientation, and keyboard math
  safe-area.ts                 Per-document CSS env measurement probe
  snapshot.ts                  Server snapshot and exact snapshot equality
  store.ts                     Reference-counted, RAF-batched viewport store
  store-registry.ts            WeakMap store lookup per Window
  context.ts                   React window/store context
  ViewportProvider.tsx         Optional alternate-window provider
  useViewport.ts               useSyncExternalStore binding
  css-variables.ts             Variable names and direct DOM serializer
  useViewportCssVariables.ts   Opt-in CSS-variable lifecycle hook
test/
  unit/                        Pure and DOM-integrated Vitest suites
  types/                       Public TypeScript contract fixture
  package/                     npm-pack and consumer verification
  fixtures/                    Browser and hydration fixtures
e2e/                           Cross-browser behavior and website tests
scripts/                       API, bundle, package, release, and site verification
website/
  app/                         Next.js routes and metadata
  components/                  Docs navigation and live demos
  content/                     Structured documentation copy
  public/                      Static social and icon assets
docs/                          Browser notes, QA, release, and architecture records
.github/                       CI, release workflow, templates, and Dependabot
```

---

### Task 1: Repository baseline and executable quality shell

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `.nvmrc`
- Create: `src/index.ts`
- Create: `src/types.ts`
- Test: `test/types/public-api.tsx`
- Test: `test/types/tsconfig.json`

**Interfaces:**
- Consumes: Global package, runtime-dependency, engine, and peer constraints.
- Produces: `ViewportState`, its nested public types, `ViewportProviderProps`, `ViewportCssVariablesOptions`, and a build/test/lint command shell used by all later tasks.

- [ ] **Step 1: Write the public contract type fixture**

```tsx
import type {
  KeyboardState,
  LayoutViewport,
  SafeAreaInsets,
  ViewportCssVariablesOptions,
  ViewportOrientation,
  ViewportProviderProps,
  ViewportState,
  ViewportSupport,
  VisualViewportState,
} from '@nipe-solutions/react-viewport'

declare const state: ViewportState
const ready: boolean = state.ready
const layout: LayoutViewport | null = state.layout
const visual: VisualViewportState | null = state.visual
const keyboard: KeyboardState = state.keyboard
const safeArea: SafeAreaInsets = state.safeArea
const orientation: ViewportOrientation | null = state.orientation
const supported: ViewportSupport = state.supported
declare const provider: ViewportProviderProps
declare const cssOptions: ViewportCssVariablesOptions
void [ready, layout, visual, keyboard, safeArea, orientation, supported, provider, cssOptions]

// @ts-expect-error snapshots are readonly
state.ready = false
// @ts-expect-error nested state is readonly
state.safeArea.bottom = 12
```

- [ ] **Step 2: Create the package/tooling manifests and verify the fixture fails**

Run: `npm install && npx tsc --project test/types/tsconfig.json --noEmit`

Expected: FAIL because the public declarations and package build do not exist.

- [ ] **Step 3: Define the public readonly contracts and temporary type-only exports**

Implement `src/types.ts` exactly as approved in the spec. Add:

```ts
export interface ViewportProviderProps {
  readonly children: React.ReactNode
  readonly targetWindow?: Window | null
}

export interface ViewportCssVariablesOptions {
  readonly target?: HTMLElement | React.RefObject<HTMLElement | null> | null
}
```

Export only these types from `src/index.ts`. Configure Vite library mode for
`dist/index.js` and `dist/index.cjs`, externalize `react` and `react-dom`, and
configure `tsc -p tsconfig.build.json` to emit declarations.

- [ ] **Step 4: Build and typecheck the baseline**

Run: `npm run build:dist && npm run test:types && npm run lint && npm run format:check`

Expected: all commands PASS; `npm ls --omit=dev` lists no runtime dependency.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.build.json vite.config.ts vitest.config.ts eslint.config.js .prettierrc.json .gitignore .npmrc .nvmrc src test/types
git commit -m "chore: establish package quality baseline"
```

### Task 2: Pure geometry and editable-element rules

**Files:**
- Create: `src/editable.ts`
- Create: `src/geometry.ts`
- Test: `test/unit/editable.test.ts`
- Test: `test/unit/geometry.test.ts`

**Interfaces:**
- Consumes: `LayoutViewport`, `VisualViewportState`, `KeyboardState`, `ViewportOrientation`.
- Produces: `isKeyboardCapableElement(element: Element | null): boolean`, `normalizeFinite(value: number, fallback?: number): number`, `getOrientation(layout: LayoutViewport): ViewportOrientation`, `getBottomOcclusion(layout, visual): number`, and `inferKeyboard(input): KeyboardState`.

- [ ] **Step 1: Write editable-element classification tests**

Cover text/email/number/search/tel/url/password/date-like inputs, textarea,
contenteditable, and select as capable; cover disabled/readonly controls and
button/checkbox/color/file/hidden/image/radio/range/reset/submit inputs as not
capable.

```ts
it.each(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'])(
  'rejects input[type=%s]',
  (type) => {
    const input = document.createElement('input')
    input.type = type
    expect(isKeyboardCapableElement(input)).toBe(false)
  },
)
```

- [ ] **Step 2: Write geometry and inference tests**

Test clamping of NaN/infinity/negative dimensions, portrait/landscape/equal
orientation, bottom-occlusion math with offsets, the exact threshold boundary,
focus requirement, zoom rejection, small toolbar rejection, and restoration.

```ts
expect(
  inferKeyboard({
    layout: { width: 390, height: 800 },
    visual: { width: 390, height: 500, offsetTop: 0, offsetLeft: 0, pageTop: 0, pageLeft: 0, scale: 1 },
    editableFocused: true,
    hasNativeGeometry: false,
  }),
).toEqual({ open: true, height: 300 })
```

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `npm run test:unit -- test/unit/editable.test.ts test/unit/geometry.test.ts`

Expected: FAIL because `src/editable.ts` and `src/geometry.ts` do not exist.

- [ ] **Step 4: Implement the pure helpers**

Use one exported internal constant:

```ts
export const MIN_KEYBOARD_OCCLUSION_PX = 80
export const MIN_KEYBOARD_OCCLUSION_RATIO = 0.15
```

Require `Math.abs(visual.scale - 1) <= 0.01`, calculate
`Math.max(0, layout.height - (visual.height + visual.offsetTop))`, and require
occlusion to be at least `Math.max(80, layout.height * 0.15)`.

- [ ] **Step 5: Run focused and full tests**

Run: `npm run test:unit -- test/unit/editable.test.ts test/unit/geometry.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/editable.ts src/geometry.ts test/unit/editable.test.ts test/unit/geometry.test.ts
git commit -m "feat: define viewport geometry rules"
```

### Task 3: Environment abstraction, server snapshot, and safe-area probe

**Files:**
- Create: `src/environment.ts`
- Create: `src/snapshot.ts`
- Create: `src/safe-area.ts`
- Test: `test/unit/snapshot.test.ts`
- Test: `test/unit/safe-area.test.ts`

**Interfaces:**
- Consumes: public state types and pure number normalization.
- Produces: `VirtualKeyboardLike`, `BrowserEnvironment`, `SERVER_SNAPSHOT`, `snapshotsEqual(a, b)`, `createSafeAreaProbe(document)`, and `SafeAreaProbe` with `measure()`/`destroy()`.

- [ ] **Step 1: Write stable snapshot and deep scalar-equality tests**

```ts
expect(getServerSnapshot()).toBe(getServerSnapshot())
expect(snapshotsEqual(SERVER_SNAPSHOT, { ...SERVER_SNAPSHOT })).toBe(true)
expect(snapshotsEqual(SERVER_SNAPSHOT, { ...SERVER_SNAPSHOT, ready: true })).toBe(false)
```

- [ ] **Step 2: Write safe-area lifecycle and parsing tests**

Mock `getComputedStyle` with fractional pixel paddings and invalid values. Assert
one probe node is appended, values parse as `{ top, right, bottom, left }`, invalid
values become zero, and `destroy()` removes the exact node idempotently.

- [ ] **Step 3: Run tests and confirm failure**

Run: `npm run test:unit -- test/unit/snapshot.test.ts test/unit/safe-area.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Implement narrow optional-browser contracts and probe**

Define the Virtual Keyboard shape locally:

```ts
export interface VirtualKeyboardLike extends EventTarget {
  readonly boundingRect: DOMRectReadOnly
  overlaysContent: boolean
}
```

Create the probe with fixed positioning, zero dimensions, hidden visibility,
`pointer-events: none`, and four `env(safe-area-inset-*)` paddings. Do not add an
external stylesheet or read/write `overlaysContent`.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npm run test:unit -- test/unit/snapshot.test.ts test/unit/safe-area.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/environment.ts src/snapshot.ts src/safe-area.ts test/unit/snapshot.test.ts test/unit/safe-area.test.ts
git commit -m "feat: add safe browser measurement foundations"
```

### Task 4: Atomic per-window viewport store

**Files:**
- Create: `src/store.ts`
- Create: `src/store-registry.ts`
- Test: `test/unit/store.test.ts`
- Test: `test/unit/store-registry.test.ts`
- Create: `test/unit/helpers/browser-environment.ts`

**Interfaces:**
- Consumes: `BrowserEnvironment`, geometry helpers, editable detection, safe-area probe, snapshot equality.
- Produces: `ViewportStore` (`subscribe`, `getSnapshot`, `getServerSnapshot`), `createViewportStore(environment)`, `getViewportStore(targetWindow)`, and `resetViewportStoreForTests(targetWindow)`.

- [ ] **Step 1: Build a deterministic fake environment**

The helper exposes mutable layout/visual/native-keyboard geometry, listener
counts, a safe-area result, queued RAF callbacks, focused element, and methods to
dispatch each source. It must use no wall-clock timers.

- [ ] **Step 2: Write subscription and batching tests**

Assert the first subscriber installs one listener for each available source;
three source events before a frame queue one RAF; flushing publishes one atomic
snapshot; equivalent measurements do not notify; later subscribers add no
browser listeners; removing the final subscriber cancels/removes everything.

- [ ] **Step 3: Write geometry-source priority and event-order tests**

Cover native bounding-rectangle priority, inferred keyboard fallback, visual
fallback when unsupported, focus-before-resize, resize-before-focus,
blur-before-restoration, zoom, offsets/page coordinates, safe-area changes, and
portrait-landscape-portrait sequences.

- [ ] **Step 4: Write registry isolation tests**

```ts
expect(getViewportStore(windowA)).toBe(getViewportStore(windowA))
expect(getViewportStore(windowA)).not.toBe(getViewportStore(windowB))
```

Also assert probes use the matching `window.document`.

- [ ] **Step 5: Run focused tests and confirm failure**

Run: `npm run test:unit -- test/unit/store.test.ts test/unit/store-registry.test.ts`

Expected: FAIL because the store modules do not exist.

- [ ] **Step 6: Implement the store and registry**

Keep `measure()` read-only until it has assembled a complete candidate. Maintain
a subscriber `Set`, one RAF id, one probe, and a cleanup list. Derive native
keyboard occlusion by intersecting `virtualKeyboard.boundingRect` with layout
bounds. Never mutate the Virtual Keyboard object. Publish only after
`snapshotsEqual` returns false.

- [ ] **Step 7: Run store tests, leak tests, and typecheck**

Run: `npm run test:unit -- test/unit/store.test.ts test/unit/store-registry.test.ts && npm run typecheck`

Expected: PASS with listener counts returning to zero.

- [ ] **Step 8: Commit**

```bash
git add src/store.ts src/store-registry.ts test/unit/store.test.ts test/unit/store-registry.test.ts test/unit/helpers
git commit -m "feat: add shared atomic viewport store"
```

### Task 5: React hook and optional provider

**Files:**
- Create: `src/context.ts`
- Create: `src/ViewportProvider.tsx`
- Create: `src/useViewport.ts`
- Modify: `src/index.ts`
- Test: `test/unit/react.test.tsx`
- Modify: `test/types/public-api.tsx`

**Interfaces:**
- Consumes: `getViewportStore(Window)`, `SERVER_SNAPSHOT`, `ViewportProviderProps`.
- Produces: `ViewportProvider` and `useViewport(): ViewportState` runtime exports.

- [ ] **Step 1: Write provider-free, SSR, provider, and Strict Mode tests**

Assert provider-free rendering uses the global window store, server rendering
does not touch globals, a custom-window provider isolates snapshots, a null
provider returns the server snapshot, and Strict Mode leaves one active browser
subscription while mounted and zero after unmount.

- [ ] **Step 2: Run the React tests and confirm failure**

Run: `npm run test:unit -- test/unit/react.test.tsx`

Expected: FAIL because the React runtime exports do not exist.

- [ ] **Step 3: Implement the context, provider, and hook**

The context stores `Window | null | undefined`, where `undefined` means normal
global-window resolution and `null` intentionally means the server snapshot.
Call `useSyncExternalStore(store.subscribe, store.getSnapshot,
store.getServerSnapshot)` without wrapping or cloning returned state.

- [ ] **Step 4: Expand the type fixture and public exports**

```tsx
import { ViewportProvider, useViewport } from '@nipe-solutions/react-viewport'
const state = useViewport()
const node = <ViewportProvider targetWindow={null}>{state.ready}</ViewportProvider>
void node
```

Export only the approved runtime values and public types.

- [ ] **Step 5: Run React, type, and declaration checks**

Run: `npm run test:unit -- test/unit/react.test.tsx && npm run build:dist && npm run test:types`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/context.ts src/ViewportProvider.tsx src/useViewport.ts src/index.ts test/unit/react.test.tsx test/types/public-api.tsx
git commit -m "feat: expose viewport state to React"
```

### Task 6: Opt-in CSS-variable subscription path

**Files:**
- Create: `src/css-variables.ts`
- Create: `src/useViewportCssVariables.ts`
- Modify: `src/index.ts`
- Test: `test/unit/css-variables.test.tsx`
- Modify: `test/types/public-api.tsx`

**Interfaces:**
- Consumes: per-window store and `ViewportCssVariablesOptions`.
- Produces: `VIEWPORT_CSS_VARIABLES`, `writeViewportCssVariables(target, state)`, and public `useViewportCssVariables(options?): void`.

- [ ] **Step 1: Write serialization, target, update, and cleanup tests**

Assert all approved names, fractional `px` serialization, unitless scale,
removal of unknown dimensions before readiness, `0px` keyboard/safe-area values,
default document root, direct element and ref targets, update without React
rerender, and cleanup that preserves unrelated/custom pre-existing properties.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm run test:unit -- test/unit/css-variables.test.tsx`

Expected: FAIL because the CSS-variable modules do not exist.

- [ ] **Step 3: Implement ownership-safe variable writes**

Track the value present before each owned write. On cleanup, restore that value
if the property still contains the hook's most recent value; otherwise leave the
consumer's later write intact. Subscribe directly to the store inside an effect
and do not call `useViewport`.

- [ ] **Step 4: Export the hook and validate the public type contract**

Add `useViewportCssVariables` to `src/index.ts` and use element/ref/null options
in `test/types/public-api.tsx`.

- [ ] **Step 5: Run focused, full, and type tests**

Run: `npm run test:unit -- test/unit/css-variables.test.tsx && npm run test:unit && npm run test:types`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/css-variables.ts src/useViewportCssVariables.ts src/index.ts test/unit/css-variables.test.tsx test/types/public-api.tsx
git commit -m "feat: add opt-in viewport CSS variables"
```

### Task 7: Distribution, bundle budgets, and packed consumers

**Files:**
- Create: `scripts/check-public-api.mjs`
- Create: `scripts/check-bundle-size.mjs`
- Create: `scripts/verify-package.mjs`
- Create: `test/package/verify-package.test.mjs`
- Create: `test/package/fixtures/esm/index.mjs`
- Create: `test/package/fixtures/cjs/index.cjs`
- Create: `test/package/fixtures/vite/`
- Create: `test/package/fixtures/next/`
- Modify: `package.json`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: built `dist/` and the exact public export list.
- Produces: `test:api`, `test:size`, and `test:package` scripts with reproducible pack/consumer evidence.

- [ ] **Step 1: Write package-verification tests**

Assert the tarball contains only `dist`, changelog, license, package metadata, and
readme; package JSON exports resolve ESM/CJS/types; React is not bundled; server
import succeeds with `window`, `document`, and `navigator` absent; Vite and Next
fixtures compile against the installed tarball.

- [ ] **Step 2: Run package tests and confirm failure**

Run: `npm run build:dist && node --test test/package/verify-package.test.mjs`

Expected: FAIL because verification scripts and complete artifact metadata do
not exist.

- [ ] **Step 3: Implement public API and package verifiers**

The API script compares declaration exports with this allowlist:

```js
const runtimeExports = ['ViewportProvider', 'useViewport', 'useViewportCssVariables']
const typeExports = [
  'KeyboardState', 'LayoutViewport', 'SafeAreaInsets',
  'ViewportCssVariablesOptions', 'ViewportOrientation',
  'ViewportProviderProps', 'ViewportState', 'ViewportSupport',
  'VisualViewportState',
]
```

Use `npm pack --json --pack-destination <mkdtemp>` and install the resulting
tarball into copied disposable fixtures.

- [ ] **Step 4: Establish measured bundle budgets**

Build the correct implementation, record minified ESM bytes, gzip bytes, and
tarball bytes in `scripts/check-bundle-size.mjs`, then set each limit to the
measured value plus the larger of 10% or 512 bytes. Print measurements and limits
on every run; reject non-React bare imports.

- [ ] **Step 5: Run all distribution checks**

Run: `npm run build:dist && npm run test:api && npm run test:size && npm run test:package`

Expected: PASS for ESM, CJS, declarations, SSR import, Vite, Next.js, externals,
tarball contents, and budgets.

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.ts scripts test/package
git commit -m "test: verify package consumers and budgets"
```

### Task 8: Browser fixtures and cross-engine library behavior

**Files:**
- Create: `playwright.config.ts`
- Create: `test/fixtures/browser/index.html`
- Create: `test/fixtures/browser/main.tsx`
- Create: `test/fixtures/browser/mock-browser-apis.ts`
- Create: `test/fixtures/hydration/server.mjs`
- Create: `test/fixtures/hydration/client.tsx`
- Create: `e2e/viewport.spec.ts`
- Create: `e2e/hydration.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: packed/built public package and controllable browser API fixtures.
- Produces: `test:e2e` coverage in Chromium, Firefox, and WebKit.

- [ ] **Step 1: Write deterministic geometry browser scenarios**

Test layout resize, real VisualViewport observation where present, absent-API
fallback, focus plus 800→500 visual-height sequence, 800→750 toolbar-like
sequence, offset/page-position updates, zoom rejection, native Virtual Keyboard
rectangles, duplicate-event batching, CSS-variable updates, and cleanup.

- [ ] **Step 2: Write SSR hydration browser scenario**

Render markup with the server snapshot, hydrate it in a browser, collect console
errors, and assert there is no hydration mismatch before real geometry becomes
ready.

- [ ] **Step 3: Run Chromium first and confirm fixture failure**

Run: `npx playwright test --project=chromium e2e/viewport.spec.ts e2e/hydration.spec.ts`

Expected: FAIL until the fixture server/configuration is wired.

- [ ] **Step 4: Implement fixtures and Playwright configuration**

Use Vite to serve the browser fixture on an ephemeral fixed test port. Expose
mock controls only in the fixture, never in package source. Configure projects
for Chromium, Firefox, and WebKit with trace-on-first-retry and no implicit mobile
keyboard claims.

- [ ] **Step 5: Run the full browser matrix**

Run: `npm run test:e2e`

Expected: PASS in Chromium, Firefox, and WebKit.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts test/fixtures e2e package.json
git commit -m "test: cover viewport behavior across browsers"
```

### Task 9: Open-source documentation and browser QA records

**Files:**
- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `LICENSE`
- Create: `docs/browser-notes.md`
- Create: `docs/REAL_DEVICE_QA.md`
- Create: `docs/RELEASING.md`
- Create: `.github/ISSUE_TEMPLATE/bug-report.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`

**Interfaces:**
- Consumes: final public API/semantics, measured budgets, automated browser results, and known limitations.
- Produces: complete user, contributor, security, release, browser-note, and manual-QA documentation.

- [ ] **Step 1: Write a documentation-content verifier**

Create `scripts/verify-docs.mjs` with assertions for installation, quick start,
layout-vs-visual explanation, “When CSS is enough”, keyboard inference caveat,
SSR, CSS variables, supported/tested/fallback distinctions, limitations, NIPE
Open Source link, repository URL, and every required QA platform/scenario.

- [ ] **Step 2: Run the verifier and confirm failure**

Run: `node scripts/verify-docs.mjs`

Expected: FAIL because documentation files do not exist.

- [ ] **Step 3: Write the repository documents**

Use factual language and the tagline “Reliable mobile viewport state for React.”
Include runnable hook and CSS recipes, the alpha warning, no universal-browser
claim, and no fake manual-verification marks. Populate `docs/browser-notes.md`
with the registry format and the documented heuristic threshold.

- [ ] **Step 4: Write the real-device matrix**

Create tables with status values `AUTOMATED`, `MANUAL PENDING`, and
`MANUAL VERIFIED`. Initial physical iPhone, iPad, Android, PWA, WebView, and
external-keyboard rows remain `MANUAL PENDING` until performed by a person.

- [ ] **Step 5: Run documentation and formatting checks**

Run: `node scripts/verify-docs.mjs && npm run format:check`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md LICENSE docs .github/ISSUE_TEMPLATE .github/pull_request_template.md scripts/verify-docs.mjs
git commit -m "docs: document viewport behavior and project policy"
```

### Task 10: Distinctive Next.js documentation site

**Files:**
- Create: `website/app/layout.tsx`
- Create: `website/app/page.tsx`
- Create: `website/app/globals.css`
- Create: `website/app/api/page.tsx`
- Create: `website/app/browser-behavior/page.tsx`
- Create: `website/app/examples/page.tsx`
- Create: `website/app/imprint/page.tsx`
- Create: `website/app/privacy/page.tsx`
- Create: `website/app/sitemap.ts`
- Create: `website/app/robots.ts`
- Create: `website/components/SiteHeader.tsx`
- Create: `website/components/GeometryDemo.tsx`
- Create: `website/components/ComposerDemo.tsx`
- Create: `website/components/CodeBlock.tsx`
- Create: `website/content/docs.ts`
- Create: `website/next.config.ts`
- Create: `website/tsconfig.json`
- Create: `website/public/icon.svg`
- Create: `website/public/og.svg`
- Create: `scripts/verify-website.mjs`
- Create: `playwright.website.config.ts`
- Create: `e2e/website.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: the real public package, verified NIPE legal information, and documentation content.
- Produces: static-compatible accessible documentation site and `build:website`/`test:website:e2e` scripts.

- [ ] **Step 1: Record and critique the visual design plan before code**

Add the concrete token rationale to `website/content/docs.ts`: a cool paper base,
ink, coordinate-blue, safe-area cyan, keyboard coral, and muted grid line; choose
two intentional locally/Google-hosted fonts through `next/font`; define a
left-aligned reading grid and nested-plane hero. Reject generic phone mockups,
gradient blobs, repeated card grids, all-caps eyebrow labels, and decorative
motion. The geometry plane is the sole high-emphasis visual device.

- [ ] **Step 2: Write static and browser website tests**

The static verifier checks canonical metadata, sitemap/robots, all required
routes/copy, repository and NIPE links, no analytics dependency, and legal-source
annotations. Playwright checks keyboard navigation, visible focus, reduced
motion, 320/768/1440 widths, axe results, real geometry labels, explicitly
labeled simulation controls, and composer behavior after fixture geometry
changes.

- [ ] **Step 3: Run the website checks and confirm failure**

Run: `npm run build:website && node scripts/verify-website.mjs`

Expected: FAIL because the website does not exist.

- [ ] **Step 4: Implement the site shell and content routes**

Build semantic header/main/footer structure, skip link, responsive navigation,
technical documentation pages, API signatures generated from one content source,
and verified Imprint/Privacy content or direct verified NIPE legal links. Keep
body line length below 80 characters and all controls keyboard accessible.

- [ ] **Step 5: Implement the live geometry and composer demos**

`GeometryDemo` calls `useViewport` for real mode and keeps simulation state
separate with a persistent “Desktop simulation” label. Render layout, visual,
safe-area, and keyboard regions from the same geometry model. `ComposerDemo`
uses `useViewportCssVariables` and CSS coordinate math; it does not invent a
keyboard transition or scroll focused inputs.

- [ ] **Step 6: Visually inspect and refine all breakpoints**

Run: `npm run dev`, capture screenshots at 320×844, 768×1024, and 1440×1000,
inspect with the available image viewer, then correct overflow, hierarchy,
contrast, focus, and nested-plane legibility. Remove any decoration that does not
explain geometry.

- [ ] **Step 7: Run website verification**

Run: `npm run build:website && node scripts/verify-website.mjs && npm run test:website:e2e`

Expected: PASS for static checks, responsive behavior, accessibility, real demo,
and simulation labeling.

- [ ] **Step 8: Commit**

```bash
git add website scripts/verify-website.mjs playwright.website.config.ts e2e/website.spec.ts package.json package-lock.json
git commit -m "feat: build viewport documentation experience"
```

### Task 11: CI, release hygiene, and Vercel configuration

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/browser.yml`
- Create: `.github/workflows/release.yml`
- Create: `.github/dependabot.yml`
- Create: `scripts/verify-workflows.test.mjs`
- Create: `scripts/verify-release.mjs`
- Create: `scripts/verify-release.test.mjs`
- Create: `vercel.json`
- Create: `.vercelignore`
- Modify: `package.json`

**Interfaces:**
- Consumes: all quality scripts, npm provenance requirements, and website build.
- Produces: protected-quality CI, separate cross-browser CI, guarded OIDC release, and Vercel build configuration.

- [ ] **Step 1: Write workflow/release policy tests**

Assert CI runs `npm ci` and `npm run check` on Node 24; browser CI installs all
three Playwright engines and runs both suites; release has `id-token: write`, no
long-lived npm token, validates tag/version/changelog/alpha dist-tag/clean tree,
runs the full quality gate, packs before publish, and uses provenance.

- [ ] **Step 2: Run policy tests and confirm failure**

Run: `node --test scripts/verify-workflows.test.mjs scripts/verify-release.test.mjs`

Expected: FAIL because workflow and release files do not exist.

- [ ] **Step 3: Implement CI and release workflows**

Use minimal permissions, pinned major action versions, npm cache, concurrency
cancellation for PR branches, uploaded Playwright reports on failure, and GitHub
environment protection for npm publishing. Do not publish during implementation.

- [ ] **Step 4: Configure Vercel**

Set the framework to Next.js, install with `npm ci`, build with
`npm run build:website`, and expose the website output expected by Vercel. Add
security headers without breaking Next.js assets. Domain association remains an
account-level operation verified during deployment.

- [ ] **Step 5: Run workflow/release tests and a release dry run**

Run: `npm run test:workflows && npm run release:check -- --dry-run`

Expected: PASS while producing a tarball summary and explicitly skipping publish.

- [ ] **Step 6: Commit**

```bash
git add .github package.json package-lock.json scripts/verify-workflows.test.mjs scripts/verify-release.mjs scripts/verify-release.test.mjs vercel.json .vercelignore
git commit -m "ci: add quality release and deployment policy"
```

### Task 12: Final quality gate, deployment, and release-readiness report

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/REAL_DEVICE_QA.md`
- Create: `docs/releases/0.1.0-alpha.0-readiness.md`
- Modify: any file implicated by final verification failures

**Interfaces:**
- Consumes: complete repository, all automated evidence, GitHub/Vercel access available in the environment.
- Produces: green local quality gate, deployed documentation when credentials permit, and the required 18-part readiness report.

- [ ] **Step 1: Run the complete local quality gate from a clean build state**

Run: `npm run clean && npm run check`

Expected: PASS for format, lint, typecheck, units, types, API, distribution,
budgets, package consumers, docs verification, and website build.

- [ ] **Step 2: Run both Playwright suites**

Run: `npm run test:e2e && npm run test:website:e2e`

Expected: PASS in Chromium, Firefox, and WebKit, with no accessibility or
hydration failures.

- [ ] **Step 3: Inspect the packed artifact and working tree**

Run: `npm pack --dry-run && npm ls --omit=dev && git diff --check && git status --short`

Expected: only intended files are packed, no runtime dependencies are installed,
no whitespace errors exist, and the tree contains only planned final-report
changes.

- [ ] **Step 4: Attempt GitHub and Vercel delivery using existing authenticated CLIs**

Run read-only identity checks first: `gh auth status` and `vercel whoami`. If
authenticated for the NIPE organization, push the branch, link/create the Vercel
project, set the production domain to `react-viewport.nipesolutions.com`, deploy
production, and verify the canonical URL over HTTPS. If either credential or DNS
authority is unavailable, make no speculative account changes; record the exact
remaining command/account action in the readiness report.

- [ ] **Step 5: Write the release-readiness report**

Include exactly these sections with measured evidence: architecture summary,
final public API, browser API strategy, VisualViewport strategy, Virtual Keyboard
strategy, keyboard fallback strategy, safe-area implementation, React
subscription/store architecture, CSS-variable strategy, SSR/hydration behavior,
performance findings, browser test coverage, real-device QA still required,
runtime dependencies, bundle size, documentation delivered, known browser
limitations, and release-readiness classification.

Classify `ALPHA READY` only if all automated gates pass; otherwise classify
`NOT READY`. Never mark physical-device scenarios verified without human results.

- [ ] **Step 6: Run verification again after report/link changes**

Run: `npm run check && npm run test:e2e && npm run test:website:e2e && git diff --check`

Expected: PASS with measurements matching the readiness report.

- [ ] **Step 7: Commit**

```bash
git add README.md CHANGELOG.md docs
git commit -m "docs: record alpha release readiness"
```

