# @nipe-solutions/react-viewport

Reliable mobile viewport state for React.

`@nipe-solutions/react-viewport` exposes reactive layout viewport, visual
viewport, keyboard-occlusion, and safe-area geometry. It is intended for the
application behavior that CSS cannot express by itself, such as a composer that
must respond to a measured keyboard occlusion.

> **Alpha software:** `0.1.0-alpha.0` is an early release. Its API and browser
> behavior may change. Physical-device QA is still pending; see
> [`docs/REAL_DEVICE_QA.md`](docs/REAL_DEVICE_QA.md).

## Installation

```sh
npm install @nipe-solutions/react-viewport
```

The package has no runtime dependencies. It supports React and React DOM
`^18.3.0 || ^19.0.0`, ships ESM, CommonJS, and TypeScript declarations, and
requires Node.js `>=24 <25` for repository development.

## Quick start

```tsx
import { useViewport } from '@nipe-solutions/react-viewport'

export function ViewportReadout() {
  const viewport = useViewport()

  if (!viewport.ready || viewport.visual === null) {
    return <p>Measuring viewport…</p>
  }

  return (
    <p>
      Visible size: {viewport.visual.width} × {viewport.visual.height}; keyboard:{' '}
      {viewport.keyboard.open ? `${viewport.keyboard.height}px` : 'closed'}
    </p>
  )
}
```

No provider is required for normal use. Use `ViewportProvider` only to scope a
subtree to another `Window`, such as an iframe or test window.

```tsx
import { ViewportProvider } from '@nipe-solutions/react-viewport'

export function EmbeddedViewport({ childWindow }: { childWindow: Window | null }) {
  return <ViewportProvider targetWindow={childWindow}>{/* descendants */}</ViewportProvider>
}
```

## Layout viewport versus visual viewport

The **Layout viewport** is `window.innerWidth` and `window.innerHeight`: the
coordinate space used for layout. The **Visual viewport** is the currently
visible region. When `window.visualViewport` is available, it also has offsets,
page coordinates, and a scale. A soft keyboard, browser UI, or pinch zoom can
change the visual viewport without changing the layout viewport.

The API intentionally keeps those coordinate systems separate:

```ts
const { layout, visual, keyboard, safeArea, supported } = useViewport()
```

On a client without `window.visualViewport`, `visual` falls back to layout
geometry with zero offsets, page coordinates from window scroll, and scale `1`.
`supported.visualViewport` records that this is fallback geometry rather than a
native VisualViewport reading.

### Keyboard state is conservative

When the Virtual Keyboard API supplies geometry, that geometry is authoritative.
Otherwise, the package infers an occluding software keyboard only when an
editable element is focused, zoom is not active, and visual-bottom occlusion
crosses `max(80 CSS px, 15% of layout height)`. Focus alone never means that a
software keyboard is open. This deliberate heuristic can miss small, floating,
or split keyboards; treat `keyboard` as measured or inferred geometry, not a
device-level keyboard guarantee.

## CSS variables

For CSS-driven positioning, install variables on the document root (the default)
or on a chosen element:

```tsx
import { useViewportCssVariables } from '@nipe-solutions/react-viewport'

export function App() {
  useViewportCssVariables()
  return <main>…</main>
}
```

```css
.composer {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  bottom: calc(
    var(--react-viewport-keyboard-height, 0px) +
      max(1rem, var(--react-viewport-safe-area-bottom, 0px))
  );
  left: max(1rem, env(safe-area-inset-left));
}
```

The hook writes these client-side variables: layout and visual width/height,
visual offsets/page positions/scale, keyboard height, and four safe-area inset
lengths. Dimensional variables such as `--react-viewport-layout-height` are
removed until the first measurement, rather than populated with made-up server
values. The hook cleans up only the properties installed by its own instance.

## SSR and hydration

Server rendering is safe: importing the package and calling `useViewport` do not
access browser globals. The stable server snapshot has `ready: false`, null
layout and visual values, a closed zero-height keyboard, zero safe-area insets,
and false support flags. Render a safe placeholder for geometry-dependent UI
until `ready` is true to avoid assumptions during SSR and hydration.

## When CSS is enough

Prefer CSS when the browser can express the behavior directly. Use `dvh`, `svh`,
and `lvh` for viewport-relative sizing; use `env(safe-area-inset-*)` for safe
area padding; and use media/container queries for responsive layout. This
library is for React behavior that needs measured geometry or an explicit
layout-versus-visual distinction. It is not a breakpoint, device-detection,
scroll-locking, focus-management, modal, or general mobile-layout library.

## Browser terminology and limitations

**Supported** means the runtime can detect an API on the current browser.
**Tested** means a deterministic repository scenario covers a behavior in the
configured Chromium, Firefox, or WebKit projects. **Fallback** means the package
uses documented alternate geometry when an optional API is absent. These labels
are different from physical-device verification.

The project does not claim universal browser support. In particular:

- Browser APIs cannot reliably distinguish every floating or split keyboard.
- The fallback inference intentionally favors false negatives over moving UI for
  ordinary browser chrome changes.
- Desktop automation cannot reproduce physical mobile browser chrome or keyboard
  animations exactly.
- Embedded WebViews can expose different viewport behavior and need host-level
  verification.
- Foldable viewport segments and synthetic keyboard animations are outside v1.

See [`docs/browser-notes.md`](docs/browser-notes.md) for the browser-note
registry and [`docs/REAL_DEVICE_QA.md`](docs/REAL_DEVICE_QA.md) for the current
physical-device matrix.

## Project

- Repository: <https://github.com/NIPE-Solutions/react-viewport>
- Security reporting: [`SECURITY.md`](SECURITY.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Changelog: [`CHANGELOG.md`](CHANGELOG.md)
- License: [MIT](LICENSE)

[Part of NIPE Open Source](https://opensource.nipesolutions.com)
