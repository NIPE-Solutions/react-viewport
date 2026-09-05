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

No browser-specific workaround is recorded yet. Add a record before introducing
one, especially for event ordering, rotation, or a threshold adjustment.
