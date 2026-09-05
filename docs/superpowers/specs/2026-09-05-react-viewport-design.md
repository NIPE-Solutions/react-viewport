# React Viewport Design

## Status

Approved for implementation planning on 2026-09-05.

## Product

`@nipe-solutions/react-viewport` is a small React library that exposes reliable,
reactive layout viewport, visual viewport, virtual-keyboard, and safe-area
geometry. It exists for application behavior that CSS alone cannot express,
especially mobile composers, overlays, forms, and fixed controls affected by the
software keyboard.

The package does not provide breakpoints, device detection, media-query hooks,
focus management, scroll locking, keyboard dismissal, input management, modal
behavior, gesture handling, or a general mobile layout system. Documentation
must recommend `dvh`, `svh`, `lvh`, and `env(safe-area-inset-*)` whenever CSS is
sufficient.

The initial version is `0.1.0-alpha.0`. The release cannot be classified above
ALPHA READY until representative physical iOS and Android keyboard scenarios
have been manually verified.

## Repository and deployment

- Package: `@nipe-solutions/react-viewport`
- Repository: `https://github.com/NIPE-Solutions/react-viewport`
- Documentation: `https://react-viewport.nipesolutions.com`
- Hosting: Vercel
- Node.js: `>=24 <25`
- Package manager: npm 11
- License: MIT
- Package formats: ESM, CommonJS, and bundled TypeScript declarations
- Runtime dependencies: none
- Peer dependencies: React and React DOM `^18.3.0 || ^19.0.0`

The repository is a single package. Library source lives under `src/`, tests and
consumer fixtures under `test/`, browser scenarios under `e2e/`, and the Next.js
documentation application under `website/`. This matches current NIPE release
and documentation conventions without introducing workspace machinery.

## Public API

The alpha public API contains three runtime exports:

```ts
useViewport(): ViewportState

useViewportCssVariables(
  options?: ViewportCssVariablesOptions,
): void

ViewportProvider(props: ViewportProviderProps): React.ReactNode
```

It also exports the readonly types used by those APIs:

```ts
interface LayoutViewport {
  readonly width: number
  readonly height: number
}

interface VisualViewportState {
  readonly width: number
  readonly height: number
  readonly offsetTop: number
  readonly offsetLeft: number
  readonly pageTop: number
  readonly pageLeft: number
  readonly scale: number
}

interface KeyboardState {
  readonly open: boolean
  readonly height: number
}

interface SafeAreaInsets {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

type ViewportOrientation = 'portrait' | 'landscape'

interface ViewportSupport {
  readonly visualViewport: boolean
  readonly virtualKeyboard: boolean
}

interface ViewportState {
  readonly ready: boolean
  readonly layout: LayoutViewport | null
  readonly visual: VisualViewportState | null
  readonly keyboard: KeyboardState
  readonly safeArea: SafeAreaInsets
  readonly orientation: ViewportOrientation | null
  readonly supported: ViewportSupport
}
```

`ViewportProvider` accepts an optional `targetWindow: Window | null`. Normal use
requires no provider. A provider scopes descendants to the supplied window for
iframes, tests, or embedded browsing contexts. A null target produces the stable
server snapshot and must not throw.

`useViewportCssVariables` accepts a target element or React ref. Its client-side
default is `document.documentElement`. It removes only properties installed by
that hook instance. Importing the package and calling `useViewport` do not mutate
root styles.

No positioning component is included in the first alpha. `FixedBottom` can only
be considered after the geometry API and coordinate math have been validated on
physical browsers. This avoids freezing a misleading convenience API.

## Snapshot semantics

Server and unavailable-environment snapshots are stable objects:

```ts
{
  ready: false,
  layout: null,
  visual: null,
  keyboard: { open: false, height: 0 },
  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
  orientation: null,
  supported: { visualViewport: false, virtualKeyboard: false },
}
```

The first client measurement publishes `ready: true`. Missing
`window.visualViewport` does not make visual geometry unknown on the client;
visual geometry mirrors layout geometry with zero offsets, page coordinates from
the window scroll position, and scale `1`. Capability flags preserve the
distinction between native and fallback geometry.

Browser-provided fractional values are preserved. Values that cannot be
meaningfully negative, including dimensions, scale, safe-area insets, and
keyboard height, are clamped. Snapshot comparison uses exact scalar equality
unless browser tests demonstrate real floating-point noise that warrants a
documented epsilon.

Orientation is derived from layout width and height. Equal dimensions resolve to
portrait so the union stays small and deterministic. No deprecated orientation
API is exposed.

## Store architecture

Browser measurement is implemented in a small framework-independent internal
store. A `WeakMap<Window, ViewportStore>` supplies one store per browsing
context. This gives normal provider-free use shared listeners while supporting
iframes, alternate documents, and isolated tests.

The React hook uses `useSyncExternalStore`. `getSnapshot` and
`getServerSnapshot` return stable object identities until a meaningful scalar
changes. Each browser store reference-counts subscribers:

1. The first subscriber creates the safe-area probe, installs event listeners,
   and schedules an initial measurement.
2. Later subscribers reuse that store and its snapshot.
3. Browser events schedule at most one measurement per animation frame.
4. One measurement reads all related geometry and publishes one atomic snapshot.
5. Equivalent snapshots do not notify subscribers.
6. The final unsubscribe removes all listeners, cancels the queued animation
   frame, removes the probe, and resets transient focus/baseline state.

There is no polling. Strict Mode subscribe/unsubscribe cycles must remain clean.

## Browser event strategy

The store centralizes these sources:

- `window.resize` for layout viewport changes and fallback environments
- `visualViewport.resize` for visible-region and keyboard changes
- `visualViewport.scroll` for offsets, page position, and zoom movement
- `virtualKeyboard.geometrychange` when supported
- document `focusin` and `focusout` for keyboard inference context

An explicit legacy `orientationchange` listener is unnecessary because resize
events drive measurement. If browser verification finds a supported target that
does not settle after rotation, the workaround must be isolated, documented in
`docs/browser-notes.md`, and covered by a regression test.

Events never publish partial state. The animation-frame callback reads layout,
visual, keyboard, safe area, support flags, and orientation before comparing the
complete candidate with the current snapshot.

## Layout and visual viewport

Layout geometry comes from `window.innerWidth` and `window.innerHeight`. Visual
geometry comes directly from `window.visualViewport` when present:

- `width` and `height` describe the visible region.
- `offsetTop` and `offsetLeft` locate it inside the layout viewport.
- `pageTop` and `pageLeft` locate it in page coordinates.
- `scale` exposes pinch zoom.

These coordinate systems remain separate in the public API. The library never
flattens them into an ambiguous top-level `width` or `height`.

## Virtual Keyboard strategy

`navigator.virtualKeyboard` is capability-detected through a narrow internal
type rather than assumed to exist in TypeScript DOM declarations. When supported,
the store reads `boundingRect` after `geometrychange`. The intersection of that
rectangle with the layout viewport determines bottom occlusion. Non-intersecting
or invalid rectangles produce a closed keyboard with height zero.

Native Virtual Keyboard geometry is the authoritative source. The library never
sets `virtualKeyboard.overlaysContent`; importing or subscribing therefore never
changes global browser keyboard behavior. Overlay opt-in is excluded from v1.

## Keyboard fallback strategy

Fallback detection is conservative because viewport reduction alone can be
browser chrome and focused editable content alone can be used with a hardware
keyboard.

Editable-element detection is centralized. It includes text-like `input`
controls, `textarea`, and editable content. It excludes disabled and readonly
controls plus non-keyboard input types such as button, checkbox, color, file,
hidden, image, radio, range, reset, and submit. `select` focus is retained as
keyboard-capable context only when geometry also proves occlusion.

The inference uses a stable, keyboard-closed layout/visual baseline. A keyboard
is inferred only when all of these conditions hold:

- a keyboard-capable editable element is focused;
- native Virtual Keyboard geometry is unavailable;
- visual scale is close enough to `1` to exclude active pinch zoom;
- the visual viewport has a bottom occlusion relative to the layout viewport;
- the occlusion exceeds one centralized threshold designed to reject ordinary
  mobile toolbar changes.

The initial threshold is `max(80 CSS px, 15% of layout height)`. It is an internal
heuristic constant with focused unit tests for small chrome changes, phone
keyboards, landscape geometry, event-order variation, and viewport restoration.
It may be adjusted only with browser evidence and a browser-note entry.

Fallback keyboard height is the clamped bottom occlusion:

```text
layout height - (visual height + visual offsetTop)
```

The fallback clears when focus leaves editable content, scale indicates zoom,
or occlusion falls below the threshold. Focus never opens the keyboard on its
own. This intentionally favors false negatives over moving UI in response to
browser chrome. Split/floating keyboards and WebView-specific behavior remain
documented limitations where browser geometry does not expose occlusion.

## Safe-area strategy

Each active store creates one visually hidden, non-interactive element in the
correct document. Its four paddings use `env(safe-area-inset-top)`, right,
bottom, and left. Measurement reads computed padding values with a parser that
turns invalid or unavailable values into zero.

The probe is reused for every measurement and removed with the final subscriber.
No device models, notch tables, user-agent checks, or injected style sheets are
used. Safe-area values refresh in the same atomic measurement as viewport
geometry, including resize and rotation sequences.

## CSS variables

The stable prefix is `--react-viewport-`:

```text
--react-viewport-layout-width
--react-viewport-layout-height
--react-viewport-visual-width
--react-viewport-visual-height
--react-viewport-visual-offset-top
--react-viewport-visual-offset-left
--react-viewport-visual-page-top
--react-viewport-visual-page-left
--react-viewport-scale
--react-viewport-keyboard-height
--react-viewport-safe-area-top
--react-viewport-safe-area-right
--react-viewport-safe-area-bottom
--react-viewport-safe-area-left
```

Lengths serialize as CSS pixel values; scale is unitless. When the client is not
ready, dimensional variables are removed rather than populated with fake viewport
values. Keyboard and safe-area variables may safely serialize as `0px`.

CSS-variable subscribers share the same store, but update the target directly
from store notifications instead of routing geometry through React state. This
is the recommended path for high-frequency purely visual positioning.

## Documentation website

The Next.js documentation site uses the same source package through a local
alias during development and the built artifact during package verification. It
is static-compatible for Vercel and includes metadata, sitemap, robots rules,
social preview assets, canonical URLs, and legal navigation.

Its identity is a live nested-coordinate-plane visualization rather than a
generic device mockup. The hero directly demonstrates layout bounds, visible
bounds, safe-area bands, viewport offsets, scale, and keyboard occlusion. On a
mobile browser the demo uses real library state and includes a real input. On
desktop, explicit controls enable a clearly labeled simulation that never claims
to emulate a physical keyboard.

The surrounding design stays disciplined and technical. It inherits NIPE family
navigation language, open-source attribution, repository conventions,
accessibility quality, and legal links, while using its own viewport-derived
palette, type hierarchy, grid, and motion language. The interactive geometry
plane is the single high-emphasis visual gesture.

Documentation contains:

- introduction, installation, and quick start;
- layout-versus-visual mental model;
- soft keyboard and safe areas;
- CSS variables and fixed-bottom recipes;
- SSR and hydration behavior;
- browser behavior for iOS Safari, Android Chrome, PWA, and WebViews;
- performance and API reference;
- live geometry and composer examples;
- CSS-first alternatives and factual API comparisons;
- FAQ, limitations, contributing, security, and real-device QA;
- verified NIPE Imprint and Privacy links or content;
- “Part of NIPE Open Source” linking to
  `https://opensource.nipesolutions.com`.

No analytics or cookie banner is included by default. Legal data must be copied
only from a verified NIPE source, never invented.

## Testing and quality gates

Vitest covers pure and DOM-integrated behavior:

- editable-element detection;
- orientation and geometry normalization;
- native and inferred keyboard geometry;
- browser-chrome rejection and zoom rejection;
- safe-area parsing;
- snapshot equality and stable identity;
- event batching and event-order variation;
- first/final subscriber lifecycle;
- multiple subscribers and Strict Mode;
- fallback behavior without optional APIs;
- custom windows and correct documents;
- stable server snapshots and hydration.

Playwright runs against Chromium, Firefox, and WebKit. It verifies actual resize,
focus, scroll, VisualViewport presence/fallbacks, orientation-like changes,
safe-area fallback, CSS-variable installation, website accessibility, and SSR
hydration. Deterministic browser fixtures provide controllable VisualViewport and
Virtual Keyboard objects for geometry sequences that desktop automation cannot
produce naturally.

Package verification uses `npm pack` and disposable consumer fixtures to check:

- ESM and CommonJS loading;
- declaration resolution and strict TypeScript use;
- Vite production bundling;
- Next.js server rendering;
- server-side import without browser globals;
- absence of undeclared runtime dependencies;
- exact public exports and tarball contents.

`npm run check` runs formatting, linting, type checking, unit tests, public API
checks, distribution build, size checks, package tests, and documentation build.
Browser tests run in CI as a dedicated Chromium/Firefox/WebKit job. Bundle budgets
are recorded only after the correct baseline exists, with separate minified ESM,
gzip, and npm tarball limits and a small documented allowance.

## Repository hygiene and releases

The repository includes README, changelog, contribution guide, security policy,
code of conduct, MIT license, issue/PR templates, Dependabot configuration, and
browser notes. CI blocks merges when the quality gate fails.

The release workflow uses npm trusted publishing/OIDC with provenance, validates
the expected tag/version relationship, performs a pack dry run, checks changelog
and clean-tree conditions, and never publishes from ordinary CI. Implementation
does not publish the alpha.

Vercel configuration builds the Next.js website and associates the production
deployment with `react-viewport.nipesolutions.com`. Repository files can fully
prepare this target; final Vercel project attachment and DNS validation depend on
available account access and must be reported explicitly.

## Real-device validation

`docs/REAL_DEVICE_QA.md` separates automated, manually pending, and manually
verified results. The required matrix includes iPhone Safari, iPad Safari,
Android Chrome, desktop Safari and Chrome, standalone PWA where available, and an
external-keyboard scenario where available.

Scenarios cover keyboard open/close, rapid input switching, rotation, toolbar
collapse/expansion, scrolling with and without the keyboard, modal input,
fixed-bottom composer recipes, safe areas, zoom, and restoration after blur.
Desktop WebKit is never presented as proof of physical iOS Safari behavior.

## Known initial limitations

- Browser APIs do not reliably distinguish every floating or split keyboard.
- A fallback inference can intentionally miss unusually small keyboards.
- Desktop automation cannot reproduce physical mobile browser chrome or keyboard
  animations exactly.
- Embedded WebViews may expose different viewport behavior and require host-level
  verification.
- Foldable viewport segments are outside v1 scope.
- The library follows geometry exposed by the browser and does not synthesize a
  keyboard animation.

These limitations are documented as boundaries, not hidden behind universal
support claims.

