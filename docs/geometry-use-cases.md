# Geometry use-case acceptance audit

This internal audit keeps every JavaScript example tied to a decision CSS cannot express. React
Viewport supplies shared reactive geometry; the application owns policy. If CSS can implement the
layout, the example should use CSS and should not recommend installing the package.

| Example | Why CSS alone is insufficient | Preferred access |
| --- | --- | --- |
| Rendering budget | The application chooses a count from current visible height: reserve 320 CSS px, allow 48 px per row, cap at 8, and render the calculated count. | Shared React snapshot because rendering changes reactively. |
| Coordinate visibility | A selected target remains in document coordinates while scroll, keyboard geometry, or zoom changes the visible document bounds. The application tests positive rectangle intersection. CSS cannot return that Boolean to React. | Shared React snapshot plus a target rectangle from the same window. |
| Zoom-sensitive hit tolerance | An optional annotation tool converts a unit-scale tolerance to document CSS pixels using `12 / visual.scale`. CSS cannot feed that numeric tolerance to event logic; scale must not become a layout breakpoint. | Shared React snapshot when continuously reactive; raw `window.visualViewport` for an occasional read. |
| Scroll correction | Application policy may opt into a measured correction after geometry changes. The library never scrolls; the demo does so only after explicit opt-in, and ignores page-position changes alone. It is not focus management. | Shared React snapshot when correction tracks viewport changes. |
| Safe-area JavaScript | CSS `env(safe-area-inset-*)` should handle padding. JavaScript is justified only when application logic needs the numeric top, right, bottom, or left value; the library reads them through a hidden CSS probe. | Shared React snapshot for reactive logic; use CSS directly for layout. |

The coordinate example must keep its synthetic target in document coordinates, including when it
is placed near the visible bottom. Visible bounds are `[pageLeft, pageLeft + width]` and
`[pageTop, pageTop + height]`; intersection requires positive width and height. A DOM target converts
with `getBoundingClientRect()` plus `window.scrollX`/`scrollY` from the same window, without an extra
scale multiplication. This calculation does not prove visibility through clipping ancestors or
other DOM overlays.

The CSS-variable hook is a bridge from the shared store to CSS, not a reason to move ordinary
layout decisions into React. A same-origin alternate `Window` may be supplied only after access is
verified.

## Why not raw browser APIs?

For rendering budgets, coordinate intersection, zoom tolerance and scroll correction, raw
`window.visualViewport` is enough for a single small consumer willing to own its subscription and
cleanup. None of the algorithms requires this package specifically. React Viewport adds a shared,
reactive snapshot, consistent SSR initialization and a common lifecycle when several consumers
need it. Safe-area logic additionally needs a CSS environment measurement; VisualViewport does
not expose those values. Keyboard state adds native/fallback policy rather than equating every
viewport shrink with a keyboard.

Recommendation: keep the project as a narrow React primitive, not a layout toolkit. Its value is
integration and normalization, not exclusive browser capabilities or superior layout reliability.
