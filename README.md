# React Viewport

Visual viewport geometry as React state.

Use it when visible geometry changes what React renders or how an interaction
works: limit expensive results to a visible-height budget, compare a target's
document coordinates with visible bounds, or adjust a drawing tool's hit tolerance
while zoomed. Several consumers share one store and listener set per window.

CSS owns layout. React Viewport exposes geometry; your application decides when that geometry
changes behavior. **If CSS solves it, don’t install React Viewport.**

```tsx
const { ready, layout, visual, keyboard, safeArea, orientation, supported } = useViewport()
```

Start with [CSS alternatives](#when-css-is-enough), then read [Keyboard and safe area](#keyboard-and-safe-area) and [Browser behavior](#browser-terminology-and-limitations).

[Docs](https://react-viewport.nipesolutions.com) · [Examples](https://react-viewport.nipesolutions.com/examples) · [Geometry Lab](https://react-viewport.nipesolutions.com/lab) · [API](https://react-viewport.nipesolutions.com/api) · [npm](https://www.npmjs.com/package/@nipe-solutions/react-viewport)

## Quick decision

- CSS can size or position it: use CSS.
- You need one occasional value: read `window.visualViewport` directly.
- React must react to shared layout/visual geometry: use React Viewport.

> **Stable release:** `1.0.0`. Physical iPhone Safari and Android
> Chrome testing is pending. Read [browser limitations](#browser-terminology-and-limitations)
> and [real-device QA](docs/REAL_DEVICE_QA.md) before making a support claim.

## Installation

```sh
npm install @nipe-solutions/react-viewport
```

The package has no runtime dependencies. It supports React and React DOM
`^18.3.0 || ^19.0.0`, ships ESM, CommonJS, and TypeScript declarations, and
requires Node.js `>=24 <25` for repository development.

## Quick start

```tsx
'use client'

import { useViewport } from '@nipe-solutions/react-viewport'

const results = [
  'Account',
  'Billing',
  'Projects',
  'Settings',
  'Support',
  'Team',
  'Usage',
  'Workspace',
]

export function VisibleResults() {
  const viewport = useViewport()

  if (!viewport.ready || viewport.visual === null) {
    return <p>Measuring viewport…</p>
  }

  // Application policy: reserve 320px and budget 48px for each result.
  const count = Math.min(8, Math.max(0, Math.floor((viewport.visual.height - 320) / 48)))

  return (
    <ul>
      {results.slice(0, count).map((result) => (
        <li key={result}>{result}</li>
      ))}
    </ul>
  )
}
```

No provider or stylesheet is required. The row budget is application policy,
not a measurement of the rendered list; use CSS for its layout. For SSR, render
a placeholder until the first client measurement sets `ready`. Before then,
`layout`, `visual`, and `orientation` are null. In Next.js App Router, use the
hook in a client component.

Use `ViewportProvider` only when scoping to an accessible same-origin iframe or
popup. Unmount its consumers before navigating that window, then remount to
reacquire the store. Navigation during active subscriptions is not supported.

## Geometry Lab

[Test React Viewport on your phone →](https://react-viewport.nipesolutions.com/lab)

Inspect device geometry or simulate offsets, zoom, and safe areas to try rendering
budgets and document-coordinate comparisons. Copy diagnostics excludes input
text. The lab is a diagnostic tool; physical QA remains pending. Follow the
[device protocol](docs/REAL_DEVICE_QA.md), or compare the
[CSS baseline](https://react-viewport.nipesolutions.com/lab/css).

## Layout viewport versus visual viewport

The **Layout viewport** (`layout`) contains `window.innerWidth` and
`window.innerHeight` in CSS pixels. The **Visual viewport** (`visual`) describes
the visible region, including offsets, page coordinates, and scale. Browser UI,
pinch zoom, or a keyboard can change this region; a visual change alone does not
identify a keyboard. `orientation` comes from the layout aspect ratio, not a
device sensor.

Without `window.visualViewport`, `visual` falls back to layout geometry, zero
offsets, window-scroll page coordinates, and scale `1`. Check
`supported.visualViewport` to distinguish the fallback from a native reading.

`offsetTop`/`offsetLeft` are layout-relative; `pageTop`/`pageLeft` are
document-relative. For a DOM rectangle, add same-window scroll coordinates to
`getBoundingClientRect()`. Do not multiply by `visual.scale` or use scale as a
breakpoint. See [concepts](https://react-viewport.nipesolutions.com/concepts)
and the [API reference](https://react-viewport.nipesolutions.com/api) for state
fields and coordinate recipes.

## Keyboard and safe area

`keyboard.height` is bottom-edge viewport occlusion in CSS pixels, not the full
keyboard rectangle. Native VirtualKeyboard intersection geometry takes precedence;
a floating keyboard can report `open: true` with `height: 0`. The library observes
geometry and never enables `overlaysContent` mode.

A bottom-attached partial-width rectangle still yields a scalar bottom inset. That scalar cannot represent segmented or arbitrary-shape avoidance.

The fallback infers an occluding software keyboard only when an
editable element is focused, zoom is inactive, and visual-bottom occlusion reaches
`max(80 CSS px, 15% of layout height)`. Its closed baseline gates the evidence;
reported height is the current
`Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))`. If layout and
visual height shrink together without bottom occlusion, it reports closed. Focus
alone is insufficient. Small, floating, and split keyboards may be missed.

`safeArea` contains raw CSS `env(safe-area-inset-*)` measurements and does not
automatically become zero while a keyboard is visible. Use
`Math.max(keyboard.height, safeArea.bottom)` for one bottom constraint; do not
add the two. Non-zero insets generally require `viewport-fit=cover` metadata.

Read [browser behavior](https://react-viewport.nipesolutions.com/browser-behavior)
for detection rules, native geometry, and browser-specific evidence.

## CSS variables

When CSS needs geometry from the shared store, install the optional bridge:

```tsx
'use client'

import { useViewportCssVariables } from '@nipe-solutions/react-viewport'

export function App() {
  useViewportCssVariables()
  return <main>…</main>
}
```

It writes layout/visual dimensions, offsets, page positions, scale, keyboard
height, and safe-area insets to the document root by default, or a chosen element.
Dimensional variables such as `--react-viewport-layout-height` remain absent until
the first measurement. Ownership is restored on cleanup. See
[concepts](https://react-viewport.nipesolutions.com/concepts#performance) for the
lifecycle contract and the [API](https://react-viewport.nipesolutions.com/api)
for variable names.

## When CSS is enough

Use `dvh`, `svh`, or `lvh` for viewport sizing, `env(safe-area-inset-*)` for
padding, and media/container queries for responsive layout. The package is useful
when React logic needs numeric geometry; it does not manage breakpoints, device
detection, scrolling, focus, modals, or general mobile layout.

## Browser terminology and limitations

The project does not claim universal browser support. `supported.visualViewport`
and `supported.virtualKeyboard` indicate runtime API availability. They do not
prove physical-device testing, overlay mode, or keyboard detection.

Repository scenarios test deterministic behavior in Chromium, Firefox, and
WebKit. Desktop automation cannot reproduce mobile browser chrome and keyboard
animations exactly. The fallback favors false negatives over moving UI for
ordinary browser chrome changes; embedded WebViews need host-level verification.
Focus inference follows open shadow roots only. Foldable viewport segments and
synthetic keyboard animations are outside v1.

See [browser notes](docs/browser-notes.md) for Supported, Tested, and Fallback
classifications and [real-device QA](docs/REAL_DEVICE_QA.md) for the pending
physical-device matrix.

## Project

- Repository: <https://github.com/NIPE-Solutions/react-viewport>
- Security reporting: [`SECURITY.md`](SECURITY.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Changelog: [`CHANGELOG.md`](CHANGELOG.md)
- License: [MIT](LICENSE)

[Part of NIPE Open Source](https://opensource.nipesolutions.com)
