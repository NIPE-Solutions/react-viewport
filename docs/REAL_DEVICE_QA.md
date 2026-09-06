# Real-device QA matrix

This is an evidence log, not a compatibility claim. `AUTOMATED FIXTURE` means a
linked Playwright scenario ran in desktop Chromium, Firefox, and WebKit, limited
to the scope stated in that row. `AUTOMATED UNIT` means only the platform-neutral
model is covered. `PARTIAL AUTOMATION` is an aggregate label, never a platform
compatibility claim. `MANUAL PENDING` means no person has recorded the required
result. `MANUAL VERIFIED` may be used only after a person records the device, OS,
browser/app version, date, scenarios, and evidence.
`HISTORICAL` labels preserve evidence for the retired Device Lab and do not describe the current
Geometry Lab.

There are no `MANUAL VERIFIED` rows in the initial alpha.

Physical iPhone Safari and Android Chrome testing is pending. Nothing in this
matrix, the desktop browser suites, or the upstream issue links records a
physical-device pass.

The latest automated baseline on 2026-09-06 passed 54 library scenarios and 102
documentation-site scenarios: 18 library and 34 site scenarios in each of
desktop Chromium, Firefox, and WebKit. Those results are detailed in the
[`2026-09-06` Device Lab readiness report](releases/2026-09-06-device-lab-readiness.md)
and do not change any physical row below from `MANUAL PENDING`.

## Platform matrix

| Platform / context | Status | Required scenarios | Evidence |
| --- | --- | --- | --- |
| iPhone Safari | MANUAL PENDING | visual dimensions; offsets; page coordinates; scale; all safe-area sides; keyboard open/close; document scrolling; coordinate target visibility; rendering budget; browser chrome; rotation; pinch zoom | — |
| iPad Safari | MANUAL PENDING | visual dimensions; offsets; page coordinates; scale; all safe-area sides; software/hardware/floating keyboard; coordinate target visibility; rendering budget; scroll; rotation; pinch zoom | — |
| Android Chrome | MANUAL PENDING | visual dimensions; offsets; page coordinates; scale; all safe-area sides; keyboard open/close; VirtualKeyboard capability; coordinate target visibility; rendering budget; address-bar changes; scroll; rotation; pinch zoom | — |
| PWA (standalone, where available) | MANUAL PENDING | launch; geometry dimensions and coordinates; coordinate target visibility; rendering budget; keyboard open/close; scroll; rotation; safe areas | — |
| Embedded WebView | MANUAL PENDING | host integration; geometry dimensions and coordinates; coordinate target visibility; rendering budget; keyboard open/close; scroll; safe areas | — |
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
| modal input | MANUAL PENDING | MANUAL PENDING | Legacy Device Lab scenario; no deterministic scenario | — |
| fixed-bottom composer | MANUAL PENDING | HISTORICAL AUTOMATED FIXTURE | Legacy CSS-variable positioning under controlled bottom occlusion; this is evidence from the prior Device Lab, not the current Geometry Lab | [prior Device Lab readiness](releases/2026-09-06-device-lab-readiness.md) |
| safe areas | MANUAL PENDING | AUTOMATED UNIT | Probe parsing/cleanup and zero-value rendering only; physical cutouts remain pending | [safe-area tests](../test/unit/safe-area.test.ts), [website browser suite](../e2e/website.spec.ts) |
| zoom | MANUAL PENDING | AUTOMATED FIXTURE | Keyboard rejection at controlled scale 2 | [library browser suite](../e2e/viewport.spec.ts) |
| geometry dimensions and coordinates | MANUAL PENDING | AUTOMATED FIXTURE | Layout/visual dimensions, offsets, page coordinates, scale, and all four safe-area sides under synthetic geometry | [library browser suite](../e2e/viewport.spec.ts), [website browser suite](../e2e/website.spec.ts) |
| coordinate visibility | MANUAL PENDING | AUTOMATED FIXTURE | Positive document-rectangle intersection against visual page bounds; clipping and unrelated overlays are excluded | [website browser suite](../e2e/website.spec.ts) |
| rendering budget | MANUAL PENDING | AUTOMATED FIXTURE | Actual rendered count from 320 px reserved, 48 px per row, maximum 8; no fixed count is promised | [website browser suite](../e2e/website.spec.ts) |
| restoration after blur | MANUAL PENDING | AUTOMATED UNIT | Store closes inference before visual restoration | [store tests](../test/unit/store.test.ts) |

Desktop Safari / WebKit automation is not proof of physical iPhone or iPad
Safari behavior. Automated fixtures cannot reproduce physical mobile browser
chrome, keyboard animation, floating keyboards, or every WebView integration.

## Pending manual procedures

These procedures define evidence to collect; they do not record results.

### Current Geometry Lab geometry

Status: `MANUAL PENDING` on physical iPhone Safari and Android Chrome.

1. Open `/lab` and record layout and visual width/height, offsets, `pageTop`, `pageLeft`, scale,
   keyboard state and height, all four safe-area sides, coordinate-target result, and actual
   rendering-budget count.
2. Capture those numbers before keyboard open, during keyboard display, after document scroll,
   after browser-chrome movement, after pinch zoom, after rotation, and after keyboard close.
3. Place the synthetic target near the visible bottom. Leave its document coordinates unchanged
   while scroll, keyboard, zoom, and rotation change the visual document bounds. Confirm visibility
   uses positive rectangle intersection.
4. Confirm the rendering budget follows the displayed policy: 320 px reserved, 48 px per row,
   maximum 8, with the actual calculated count recorded rather than a promised constant.
5. Attach exact device, OS, browser version, date, numeric records, and screenshots or trace.

### iPhone Safari stale-inset reproduction

Status: `MANUAL PENDING`.

1. On a physical iPhone, open a `viewport-fit=cover` page that displays the raw
   bottom safe-area inset, keyboard state, visual dimensions, offsets and scale.
2. Record the values with the input blurred, then focus the Geometry Lab input
   and wait for the software keyboard animation to settle.
3. Record whether `safe-area-inset-bottom` remains non-zero, the behavior reported
   by [WebKit bug 217754](https://bugs.webkit.org/show_bug.cgi?id=217754). This
   upstream report is the reason for the check, not proof of the device result.
4. Scroll the page, rotate in both directions, dismiss and reopen the keyboard,
   and record the independent keyboard and safe-area measurements.
5. Attach the device model, iOS and Safari versions, date, values, screenshots or
   trace, and pass/fail result before changing the status.

### Android Chrome keyboard geometry

Status: `MANUAL PENDING`.

1. On a physical Android device, record the Chrome version and whether
   `visualViewport` and `navigator.virtualKeyboard` are present. Record
   `navigator.virtualKeyboard.overlaysContent` separately; API presence is not
   proof that overlay mode is active.
2. Exercise keyboard open/close, address-bar collapse, document scrolling,
   portrait/landscape changes, rapid input switching, zoom, coordinate visibility,
   and the rendering budget.
3. Capture layout and visual geometry, native/fallback source, keyboard
   `{ open, height }`, safe areas, and screenshots or a trace for each failure.

### External-keyboard focus

Status: `MANUAL PENDING` on both platforms where hardware is available. Focus
editable content without opening a software keyboard, scroll and rotate, and
confirm that focus alone does not create inferred keyboard occlusion. Then
disconnect the external keyboard, open the software keyboard, and record whether
normal measurement resumes. Record platform, hardware, versions, date, and
evidence before changing the status.

## Recording a manual verification

When a person completes a row, keep the pending evidence and add an entry with
the exact device model, OS and browser/app version, test date, tested scenarios,
result, screenshots or trace location, and any linked browser-note record. Do
not replace a `MANUAL PENDING` status solely because an automated test exists.

## Geometry Lab protocol

Open https://react-viewport.nipesolutions.com/lab on the physical device. Record the visible numeric
geometry before keyboard open, during keyboard display, and after close. Repeat while scrolling,
rotating, pinching, and expanding or collapsing browser chrome. Exercise the rendering budget and
the selected document-coordinate target throughout. Copying diagnostics is user-initiated, contains
only geometry/capabilities/build identity, and never includes input text or user agent. Nothing is
uploaded or stored by the site.

### iPhone Safari — MANUAL PENDING

- [ ] Page loads and live values are present.
- [ ] Tap input; physical software keyboard opens.
- [ ] Record whether keyboard.open changes appropriately.
- [ ] Record bottom occlusion and raw safe area independently.
- [ ] Record visual width/height, offsets, page coordinates, scale, and every safe-area side.
- [ ] Scroll the document with the keyboard open and record numeric geometry.
- [ ] Keep the selected target fixed in document coordinates and verify positive intersection.
- [ ] Record the actual rendering-budget count.
- [ ] Browser chrome changes alone do not look like a keyboard.
- [ ] Close keyboard; geometry returns.
- [ ] Rotate both with keyboard open and closed; no reload needed.
- [ ] Check safe areas in portrait/landscape and zoom accessibility.

### Android Chrome — MANUAL PENDING

- [ ] Page loads and live values are present.
- [ ] Tap input; physical software keyboard opens.
- [ ] Record whether keyboard.open changes appropriately.
- [ ] Record VisualViewport dimensions, offsets and bottom occlusion.
- [ ] Record page coordinates, scale, and every safe-area side.
- [ ] Scroll the document with the keyboard open and record numeric geometry.
- [ ] Keep the selected target fixed in document coordinates and verify positive intersection.
- [ ] Record the actual rendering-budget count.
- [ ] Browser chrome changes alone do not look like a keyboard.
- [ ] Close keyboard; geometry returns.
- [ ] Rotate both with keyboard open and closed; no reload needed.
- [ ] Check safe areas and zoom accessibility.

### Exact recording template

Device: pending; OS/version: pending; browser/version: pending; date: pending.
Build SHA from /build.json: pending. Browser mode (tab/PWA/WebView): pending.
Keyboard type (docked/floating/split/hardware): pending.

| Phase | Layout W×H | Visual W×H | offsetTop / offsetLeft | pageTop / pageLeft | scale | keyboard.open / height | safe area T/R/B/L | Budget count | Target visible? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Before keyboard | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| During keyboard | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Scroll with keyboard | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Rotated | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| After keyboard closes | pending | pending | pending | pending | pending | pending | pending | pending | pending |

Also record `pageLeft` and safe-area top/right/bottom/left. Select a coordinate-visibility target
near the visible bottom and leave it fixed in document coordinates while scrolling, opening and
closing the keyboard, pinching, rotating, and collapsing or expanding browser chrome. Confirm the
reported result changes only when the target and visual document bounds have a positive-area
intersection. Record the rendering budget's actual row count; the example reserves 320 px, uses
48 px per row, and caps the calculated count at 8.

Paste diagnostics for each phase in the QA report (never message text). Record
VisualViewport and VirtualKeyboard capability flags; they do not identify the
active source. Record the observation, not an assumed pass:

- Closed keyboard state despite a docked keyboard and non-zero bottom occlusion:
  isolate browser support/inference; attach numeric geometry.
- Correct source values but an incorrect target or budget: isolate application geometry logic.
- Both viewports shrink together with no bottom occlusion: no inset may be needed.
- Raw safe area stays non-zero: max(), not addition, avoids double counting.

Desktop Playwright WebKit does not verify physical Safari keyboard behavior.
No physical-device test was performed during this implementation session.


## Reported iPhone Chrome scroll-boundary issue — 2026-09-06

A user tested the production lab on an **iPhone 17 Pro with Chrome** and reported
that the composer was usually aligned, but scrolling far down left a gap below
it and moved it toward the middle of the visible area; scrolling up usually
restored alignment. OS and Chrome versions and numeric geometry were not supplied.
This is a physical issue report, not a completed verification protocol.

The follow-up uses a contained scroll region by default and anchors the composer
to the actual visual bottom, with native keyboard and non-overlapping safe-area
constraints. A deterministic fixture reproduced a 100px layout error when panning
crossed the conservative inference threshold. The matrix now also covers visual
panning beyond the layout bottom, long contained scrolls, and visual width changes.
These tests do not reproduce physical browser rubber-banding or event timing.

**Physical retest: MANUAL PENDING.** On this phone, repeat rapid swipes toward both
ends with the keyboard open, pause, reverse direction, close/reopen the keyboard,
and rotate. Record both docked and page-scroll modes, OS/Chrome versions, build
SHA, `composerAnchorBottom`, and the existing numeric geometry. A page-scroll
fling may still be limited by browser-delayed viewport updates; see
[WebKit 218465](https://bugs.webkit.org/show_bug.cgi?id=218465).


## Historical browser-managed resizing and CSS comparison — 2026-09-06

Both labs now request `interactive-widget=resizes-content` through the website's
initial viewport metadata. This is site/application policy; the library does not
mutate metadata or enable VirtualKeyboard overlay mode. The flag is **requested,
not detected**. A shrinking layout may result in zero keyboard occlusion even
with a real keyboard visible. Do not treat that alone as failed detection.

1. Open `/lab/css` directly. It uses the same composer in normal CSS grid flow;
   no `useViewport()` subscription positions it. Check keyboard opening, closing,
   scroll boundaries, safe-area padding and rotation. Record whether CSS suffices.
2. Open `/lab` directly. Compare the measured fallback with the CSS baseline.
   Check that layout resizing does not cause an extra keyboard offset.
3. On iPhone, document whether the resize request is ignored. The existing
   page-scroll stress-mode gap remains unresolved; no native-policy fix is claimed
   for iOS. Record OS/browser versions and numeric geometry before assigning cause.
4. Try `/examples#result-budget`. Its JavaScript rendering budget changes with
   actual visual height. It renders local items, performs no network requests,
   and uses explicit example constants rather than claiming to measure the card.

Physical iPhone Safari/Chrome and Android Chrome comparison: **MANUAL PENDING**.
The automated matrix covers metadata, CSS layout without JavaScript, visual-only
versus layout resizing, and actual rendered result counts. Desktop tests do not
prove that a mobile browser honors the keyboard policy.
