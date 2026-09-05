# Real-device QA matrix

This is an evidence log, not a compatibility claim. `AUTOMATED FIXTURE` means a
linked Playwright scenario ran in desktop Chromium, Firefox, and WebKit, limited
to the scope stated in that row. `AUTOMATED UNIT` means only the platform-neutral
model is covered. `PARTIAL AUTOMATION` is an aggregate label, never a platform
compatibility claim. `MANUAL PENDING` means no person has recorded the required
result. `MANUAL VERIFIED` may be used only after a person records the device, OS,
browser/app version, date, scenarios, and evidence.

There are no `MANUAL VERIFIED` rows in the initial alpha.

The latest automated baseline on 2026-09-05 passed 42 library scenarios and 42
documentation-site scenarios: 14 library and 14 site scenarios in each of
desktop Chromium, Firefox, and WebKit. Those results are detailed in the
[`0.1.0-alpha.0` readiness report](releases/0.1.0-alpha.0-readiness.md) and do
not change any physical row below from `MANUAL PENDING`.

## Platform matrix

| Platform / context | Status | Required scenarios | Evidence |
| --- | --- | --- | --- |
| iPhone Safari | MANUAL PENDING | normal; URL bar changes; keyboard open/close; page scroll; orientation; rapid input switching; modal input; fixed-bottom composer; safe areas; zoom; hardware keyboard if available; restoration after blur | — |
| iPad Safari | MANUAL PENDING | software keyboard; hardware keyboard; floating/split keyboard if available; keyboard open/close; page scroll; orientation; modal input; fixed-bottom composer; safe areas; zoom; restoration after blur | — |
| Android Chrome | MANUAL PENDING | normal; address-bar collapse; keyboard open/close; page scroll; orientation; rapid input switching; modal input; fixed-bottom composer; safe areas; zoom; restoration after blur | — |
| PWA (standalone, where available) | MANUAL PENDING | launch, keyboard open/close, rotation, safe areas, fixed-bottom composer, restoration after blur | — |
| Embedded WebView | MANUAL PENDING | host integration, keyboard open/close, scrolling with and without the keyboard, modal input, safe areas, restoration after blur | — |
| external keyboard (where available) | MANUAL PENDING | focus without soft keyboard, rotation, scrolling, keyboard fallback remains closed, restoration after blur | — |
| Desktop Chromium | PARTIAL AUTOMATION | Only the exact fixture scopes in the scenario table | [library browser suite](../e2e/viewport.spec.ts), [hydration suite](../e2e/hydration.spec.ts), [website suite](../e2e/website.spec.ts) |
| Desktop Firefox | PARTIAL AUTOMATION | Only the exact fixture scopes in the scenario table | [library browser suite](../e2e/viewport.spec.ts), [hydration suite](../e2e/hydration.spec.ts), [website suite](../e2e/website.spec.ts) |
| Desktop WebKit | PARTIAL AUTOMATION | Only the exact fixture scopes in the scenario table | [library browser suite](../e2e/viewport.spec.ts), [hydration suite](../e2e/hydration.spec.ts), [website suite](../e2e/website.spec.ts) |

## Scenario coverage

Every physical target remains pending for every required scenario. Desktop
evidence is recorded per scenario and names the boundary of what automation
actually proves.

| Scenario | Physical-device status | Automated status | Automated scope | Evidence |
| --- | --- | --- | --- | --- |
| keyboard open/close | MANUAL PENDING | AUTOMATED FIXTURE | Open inference, false-positive rejection, and native intersection in desktop engines; blur close is unit-only | [library browser suite](../e2e/viewport.spec.ts), [store tests](../test/unit/store.test.ts) |
| rapid input switching | MANUAL PENDING | MANUAL PENDING | No deterministic scenario | — |
| rotation | MANUAL PENDING | AUTOMATED UNIT | Orientation calculation and store transitions only | [geometry tests](../test/unit/geometry.test.ts), [store tests](../test/unit/store.test.ts) |
| toolbar collapse/expansion | MANUAL PENDING | AUTOMATED FIXTURE | Rejection of a toolbar-sized visual reduction only | [library browser suite](../e2e/viewport.spec.ts) |
| scrolling with and without the keyboard | MANUAL PENDING | AUTOMATED FIXTURE | Window and VisualViewport scrolling without a keyboard; keyboard-open scrolling remains pending | [library browser suite](../e2e/viewport.spec.ts) |
| modal input | MANUAL PENDING | MANUAL PENDING | No deterministic scenario | — |
| fixed-bottom composer | MANUAL PENDING | AUTOMATED FIXTURE | CSS-variable positioning under controlled bottom occlusion | [website browser suite](../e2e/website.spec.ts) |
| safe areas | MANUAL PENDING | AUTOMATED UNIT | Probe parsing/cleanup and zero-value rendering only; physical cutouts remain pending | [safe-area tests](../test/unit/safe-area.test.ts), [website browser suite](../e2e/website.spec.ts) |
| zoom | MANUAL PENDING | AUTOMATED FIXTURE | Keyboard rejection at controlled scale 2 | [library browser suite](../e2e/viewport.spec.ts) |
| restoration after blur | MANUAL PENDING | AUTOMATED UNIT | Store closes inference before visual restoration | [store tests](../test/unit/store.test.ts) |

Desktop Safari / WebKit automation is not proof of physical iPhone or iPad
Safari behavior. Automated fixtures cannot reproduce physical mobile browser
chrome, keyboard animation, floating keyboards, or every WebView integration.

## Recording a manual verification

When a person completes a row, keep the pending evidence and add an entry with
the exact device model, OS and browser/app version, test date, tested scenarios,
result, screenshots or trace location, and any linked browser-note record. Do
not replace a `MANUAL PENDING` status solely because an automated test exists.
