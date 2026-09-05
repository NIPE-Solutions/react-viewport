# Real-device QA matrix

This is an evidence log, not a compatibility claim. `AUTOMATED` means the
repository has a deterministic automated scenario. `MANUAL PENDING` means no
person has recorded the physical-device result. `MANUAL VERIFIED` may be used
only after a person records the device, OS, browser/app version, date, scenarios,
and evidence.

There are no `MANUAL VERIFIED` rows in the initial alpha.

## Platform matrix

| Platform / context | Status | Required scenarios | Evidence |
| --- | --- | --- | --- |
| iPhone Safari | MANUAL PENDING | keyboard open/close; rapid input switching; rotation; toolbar collapse/expansion; scrolling with and without the keyboard; modal input; fixed-bottom composer; safe areas; zoom; restoration after blur | — |
| iPad Safari | MANUAL PENDING | keyboard open/close; rapid input switching; rotation; toolbar collapse/expansion; scrolling with and without the keyboard; modal input; fixed-bottom composer; safe areas; zoom; restoration after blur | — |
| Android Chrome | MANUAL PENDING | keyboard open/close; rapid input switching; rotation; toolbar collapse/expansion; scrolling with and without the keyboard; modal input; fixed-bottom composer; safe areas; zoom; restoration after blur | — |
| PWA (standalone, where available) | MANUAL PENDING | launch, keyboard open/close, rotation, safe areas, fixed-bottom composer, restoration after blur | — |
| Embedded WebView | MANUAL PENDING | host integration, keyboard open/close, scrolling with and without the keyboard, modal input, safe areas, restoration after blur | — |
| external keyboard (where available) | MANUAL PENDING | focus without soft keyboard, rotation, scrolling, keyboard fallback remains closed, restoration after blur | — |
| Desktop Chrome | AUTOMATED | deterministic resize, focus, scroll, fallback, CSS variables, and hydration scenarios | `e2e/viewport.spec.ts`, `e2e/hydration.spec.ts` |
| Desktop Safari / WebKit | AUTOMATED | deterministic resize, focus, scroll, fallback, CSS variables, and hydration scenarios | `e2e/viewport.spec.ts`, `e2e/hydration.spec.ts` |

Desktop Safari / WebKit automation is not proof of physical iPhone or iPad
Safari behavior. Automated fixtures cannot reproduce physical mobile browser
chrome, keyboard animation, floating keyboards, or every WebView integration.

## Recording a manual verification

When a person completes a row, keep the pending evidence and add an entry with
the exact device model, OS and browser/app version, test date, tested scenarios,
result, screenshots or trace location, and any linked browser-note record. Do
not replace a `MANUAL PENDING` status solely because an automated test exists.
