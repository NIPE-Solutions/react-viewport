# React Viewport

Know what part of the screen is actually usable.

Keep chat composers, modal actions and viewport-aware UI above the software keyboard.
Reactive visual viewport, software-keyboard occlusion and safe-area geometry for React.

Reliable mobile viewport state for React.

```tsx
const { ready, layout, visual, keyboard, safeArea, orientation, supported } = useViewport()
```

Start with [CSS alternatives](#when-css-is-enough), then read [Keyboard and safe area](#keyboard-and-safe-area) and [Browser behavior](#browser-terminology-and-limitations).

> **Alpha software:** `0.1.0-alpha.0` may change. Physical iPhone Safari and Android
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

No provider is required. Use `ViewportProvider` only for a same-origin window scope;
see the [API reference](https://react-viewport.nipesolutions.com/api).

## Chat composer fallback

For layout alone, try `interactive-widget=resizes-content` and CSS first where supported.

```tsx
import { useViewport } from '@nipe-solutions/react-viewport'

export function ChatComposer() {
  const { keyboard, safeArea } = useViewport()
  const bottomInset = Math.max(keyboard.height, safeArea.bottom)
  return (
    <form
      style={{ position: 'fixed', left: 16, right: 16, bottom: bottomInset + 16 }}
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        Message <input placeholder="Type a message…" />
      </label>
      <button type="submit">Send</button>
    </form>
  )
}
```

React Viewport measures the browser. Your application decides what to do with the measurements.
It does not move UI automatically, manage focus, render a keyboard, replace CSS, or guarantee the physical keyboard rectangle.

## CSS first

Use `100dvh`, safe-area `env()` and media/container queries for styling. React
Viewport supplies geometry for JavaScript decisions such as rendering budgets.
See [When CSS is enough](#when-css-is-enough).

## Live Device Lab

[Test React Viewport on your phone →](https://react-viewport.nipesolutions.com/lab)

Compare the [CSS baseline](https://react-viewport.nipesolutions.com/lab/css) with
the measured fallback. The site requests browser resizing; the library does not.
Copy diagnostics excludes input text. Physical QA remains pending; follow the
[device protocol](docs/REAL_DEVICE_QA.md).

## Reading `ViewportState`

- `ready` becomes true after the first client measurement. Before then,
  `layout`, `visual`, and `orientation` are null; false does not mean the browser
  APIs are unsupported.
- `layout` is the layout viewport width and height from `window.innerWidth` and
  `window.innerHeight`, in CSS pixels. It is the page's reference plane, not a
  promise that every point is visible or unobstructed.
- `visual` is the visible viewport's size, layout-relative offsets,
  document-relative page coordinates, and scale. It comes from
  `window.visualViewport` when available; otherwise documented layout geometry
  is used. A visual change does not, by itself, identify its cause as a keyboard.
- `keyboard.open` records sufficient native or fallback evidence of an on-screen
  keyboard. `keyboard.height` is only bottom-edge occlusion in CSS pixels, not
  the on-screen keyboard's full rectangle. Native floating geometry can therefore
  be open with a zero height.
- `safeArea` contains the four raw CSS `env(safe-area-inset-*)` measurements. It
  does not automatically become zero while a keyboard is visible. For a bottom
  constraint, use `Math.max(keyboard.height, safeArea.bottom)`; do not add them.
- `orientation` is derived from the layout viewport aspect ratio. It is not a
  device-orientation sensor reading.
- `supported.visualViewport` and `supported.virtualKeyboard` report runtime API
  availability. They do not prove a behavior was physically tested, that overlay
  mode is active, or that a keyboard will be detected in every configuration.

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

## Keyboard and safe area

`keyboard.height` is the estimated or reported bottom viewport occlusion caused
by the software keyboard. It is not the physical keyboard's full rectangular
height.

Detection follows a deliberately short hierarchy:

1. Native Virtual Keyboard intersection geometry is authoritative when available.
2. Otherwise, conservative VisualViewport inference can report an occlusion.
3. When the evidence is insufficient, the library reports no keyboard.

The W3C [VirtualKeyboard API](https://w3c.github.io/virtual-keyboard/) defines
`boundingRect` as the intersection of the virtual keyboard with the document
viewport in client coordinates. `supported.virtualKeyboard` means that API is
present; it does not mean `overlaysContent` mode is active. This library observes
geometry and never enables overlay mode. A non-empty native intersection sets
`open: true`; if floating geometry does not touch the layout viewport's bottom
edge, bottom occlusion remains `height: 0`.

A bottom-attached partial-width rectangle still yields a scalar bottom inset. That scalar cannot represent segmented or arbitrary-shape avoidance.

The fallback infers an occluding software keyboard only when an
editable element is focused, zoom is not active, and visual-bottom occlusion
crosses `max(80 CSS px, 15% of layout height)`. The keyboard-closed baseline is
only an evidence gate: reported fallback height is always the current
`Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))`. If layout and
visual height shrink together with no current bottom occlusion, the keyboard
remains closed. Focus alone never means that a software keyboard is open. This
deliberate heuristic can miss small, floating, or split keyboards; treat
`keyboard` as measured or inferred geometry, not a device-level keyboard
guarantee.

Keyboard occlusion and the raw bottom safe-area inset can describe the same
covered edge. When an application needs one bottom constraint, use
`Math.max(keyboard.height, safeArea.bottom)` rather than adding them.

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
  right: max(1rem, var(--react-viewport-safe-area-right, 0px));
  --bottom-inset: max(
    var(--react-viewport-keyboard-height, 0px),
    var(--react-viewport-safe-area-bottom, 0px)
  );
  bottom: calc(var(--bottom-inset) + 1rem);
  left: max(1rem, var(--react-viewport-safe-area-left, 0px));
}
```

The hook writes these client-side variables: layout and visual width/height,
visual offsets/page positions/scale, keyboard height, and four safe-area inset
lengths. Dimensional variables such as `--react-viewport-layout-height` are
removed until the first measurement, rather than populated with made-up server
values. Consumers share one store per window. CSS-variable ownership is restored on cleanup;
see [Concepts](https://react-viewport.nipesolutions.com/concepts#performance).

Non-zero `env(safe-area-inset-*)` values generally require the page viewport to
opt into `viewport-fit=cover`. Configure that metadata before relying on the
package's measured `safeArea` values; unsupported or zero-inset environments
truthfully report zero.

## SSR and hydration

SSR uses a stable, geometry-neutral snapshot without accessing browser globals.
Render a placeholder until `ready` becomes true after hydration.

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

- Browser APIs cannot reliably distinguish all floating or split software-keyboard
  arrangements.
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
- Release readiness:
  [`0.1.0-alpha.0`](docs/releases/0.1.0-alpha.0-readiness.md)
- License: [MIT](LICENSE)

[Part of NIPE Open Source](https://opensource.nipesolutions.com)
