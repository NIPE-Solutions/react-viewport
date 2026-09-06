# Browser notes registry

This registry records browser-specific evidence and decisions. It is not a
compatibility promise. Add an entry only when a repeatable observation changes
an implementation decision, documentation, or regression test.

## Terms

- **Supported:** the current runtime exposes a capability detected by the
  package, such as `window.visualViewport` or `navigator.virtualKeyboard`.
- **Tested:** a deterministic repository test covers behavior in a configured
  browser-engine project. It does not prove physical-device behavior.
- **Fallback:** the package supplies documented alternate geometry when an
  optional capability is absent.

Capability presence is narrower than behavior. In particular,
`supported.virtualKeyboard: true` means the runtime exposes
`navigator.virtualKeyboard`; it does not prove that `overlaysContent` mode is
active, that a software keyboard is visible, or that a physical-device scenario
has been verified.

## Native VirtualKeyboard authority

The W3C [VirtualKeyboard API](https://w3c.github.io/virtual-keyboard/) defines
`boundingRect` as the intersection of the virtual keyboard with the document's
viewport in client coordinates. The library treats a finite, positive-area
intersection as native evidence that the keyboard is open. `keyboard.height`
then reports only the portion occluding the layout viewport's bottom edge. A
floating intersection can consequently produce `{ open: true, height: 0 }`.

A bottom-attached partial-width rectangle still yields a scalar bottom inset. That scalar cannot represent segmented or arbitrary-shape avoidance.

The specification initializes `overlaysContent` to false and changes viewport
resizing behavior only when an author sets it to true. This library never sets
`overlaysContent`, calls `show()`, or calls `hide()`; it observes the available
geometry and `geometrychange` events without enabling overlay mode.

## Keyboard inference rule

Without native Virtual Keyboard geometry, keyboard inference requires focused
keyboard-capable editable content, a non-zoomed visual viewport, and a reduction
from the keyboard-closed baseline of at least `max(80 CSS px, 15% of layout
height)`. The threshold is deliberately conservative and may be changed only
with browser evidence, a registry entry, and a regression test.
The closed baseline proves that keyboard-sized visual reduction occurred; it is
not reported as keyboard height. Reported fallback height is always current
layout-bottom occlusion, so a simultaneous layout and visual shrink with no
current occlusion remains closed.

## Registry format

| Field | Record |
| --- | --- |
| Date | Observation date in ISO-8601 form |
| Browser / engine / version | Exact browser, engine, version, OS, and device when available |
| Capability | Native API, fallback path, or CSS/environment behavior involved |
| Classification | Supported, Tested, or Fallback; physical device status when relevant |
| Observation | Reproducible behavior and expected/actual geometry |
| Evidence | Test path, issue, screenshot, trace, or device record |
| Decision | Code, documentation, or QA action taken |

## Current records

| Date | Browser / engine / version | Capability | Classification | Observation | Evidence | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-05 | Chromium, Firefox, WebKit desktop projects | Layout resize, VisualViewport fixture, keyboard inference, CSS variables, and hydration | Tested | Deterministic Playwright scenarios define expected library behavior across configured engines. | `e2e/viewport.spec.ts`, `e2e/hydration.spec.ts` | Keep physical-device status pending; desktop automation is not evidence of mobile keyboard animation or browser chrome behavior. |
| 2026-09-05 | Any client without `window.visualViewport` | Visual geometry | Fallback | Visual geometry mirrors layout geometry with zero offsets, window page coordinates, and scale `1`. | `e2e/viewport.spec.ts` fallback scenarios | Expose `supported.visualViewport: false` so consumers can distinguish fallback geometry. |
| 2026-09-06 | WebKit issue; iPhone / iPad; affected versions not bounded by the report | CSS `safe-area-inset-bottom` while a software keyboard is visible | Upstream evidence; physical reproduction MANUAL PENDING | The upstream report records that the bottom safe-area environment value remains set after the keyboard appears, leaving unwanted space when consumers also position content above the keyboard. This means raw `safeArea.bottom` may be stale in the reported state. | [WebKit bug 217754](https://bugs.webkit.org/show_bug.cgi?id=217754), status `NEW` when checked 2026-09-06 | Keep keyboard occlusion and safe area raw. Applications needing one bottom constraint use `Math.max(keyboard.height, safeArea.bottom)`, not an additive value. Add no browser-specific runtime workaround. |

The WebKit record is upstream evidence, not a claim that this project reproduced
the behavior on physical hardware. Its removal condition applies only to this
note: update or remove the entry after the upstream issue is resolved and a
recorded physical iPhone regression check no longer reproduces the stale inset.
There is no runtime workaround to remove. Add a record before introducing any
browser-specific code, especially for event ordering, rotation, or a threshold
adjustment.
