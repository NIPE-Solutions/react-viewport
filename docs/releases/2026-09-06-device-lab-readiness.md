# Device Lab and deployment verification — 2026-09-06

## Deployment audit

Before edits, both public URLs already served current main
`86b3fa7c0ed7c13477f801a23864710108d1288a`, deployment
`dpl_WE5HJaTXhvApGScpeKJnjRWGrUqT`. No stale production condition was reproduced.
See [deployment configuration and evidence](../DEPLOYMENT.md). This pass adds
build identity, verifies route artifacts, runs the quality gate inside the
Vercel build, and checks both public aliases after main pushes and daily.

## Product and mobile changes

- Homepage leads with “Keep mobile UI above the software keyboard.” and a paired
  simulation. Both panels use one Composer with different geometry input. Covered
  controls are inert until the simulated keyboard closes.
- `/lab` is a document-scrolling application with a genuinely fixed composer and
  actual shared-store geometry. The normal form never sends or stores input.
- Raw keyboard occlusion and safe-area values remain separate; the application
  applies `Math.max(keyboard.height, safeArea.bottom)`. The optional panel and
  outlines expose layout, visual offsets/page coordinates, keyboard, safe area,
  capabilities, orientation and effective inset. No invented source attribution.
- Diagnostic copying is an explicit user action with an allowlisted payload:
  build identity, viewport geometry, capability flags, orientation, effective inset.
  No user agent, typed text, analytics, persistence or network reporting.
- Mobile/coarse-pointer visitors get a real-keyboard CTA; desktop gets simulation.
  Code disclosures use normal buttons with expanded state, copy feedback and
  horizontally scrollable code. Actual source files are read at build time.
- Examples remain before browser theory, CSS-first guidance remains prominent,
  and the original geometry scenarios and platform limitations are retained.

## Verification evidence

The desktop browser matrix passed 54 library scenarios and 93 documentation-site
scenarios across Chromium, Firefox and WebKit. The site suite includes fixed
positioning, keyboard geometry updates, raw safe-area overlap, scroll/restoration,
orientation, diagnostic privacy and clipboard failure, code disclosure, keyboard
focus, 320px containment, metadata, routing and axe accessibility.

The repository quality gate covers 125 unit tests, public type/API checks,
package-consumer tests, docs mutation tests, generated-route verification and
workflow guards. Build-provenance regressions cover no-.git source snapshots,
stale SHAs, wrong root, mismatched HTML, missing assets and incorrect 404 behavior.
Final gate and deployment results are recorded with the final commit in the task
report; a passing earlier run does not establish an untested later change.

Independent review found and resolved two website/pipeline bugs: hosted snapshots
without .git could abort provenance generation, and the simulated covered form
could receive invisible focus. No new core-library defect was reproduced.
The library source and public API are unchanged.

## Physical QA and release recommendation

Physical iPhone Safari and Android Chrome testing is **MANUAL PENDING**. No
physical keyboard pass is claimed. Follow the [exact recording protocol](../REAL_DEVICE_QA.md)
and capture numeric geometry before/during/after focus, scroll and rotation.
Desktop WebKit is not physical iPhone Safari evidence.

Recommendation: suitable for continued alpha documentation and real-device QA.
Do not promote to beta based on desktop results alone. Complete physical Safari
and Chrome keyboard, safe-area, browser chrome, scroll, rotation and restoration
checks first. The lab deliberately exposes whether a failure belongs to browser
measurement or application layout.

## Dependency boundary

No dependencies were added. Package runtime dependencies remain empty and React
stays external. Core ESM remains 12,421 bytes / 3,740 bytes gzip. README additions
increase the package archive; the existing 16,779-byte archive limit remains in
force. Website-only implementation and source disclosures are excluded from the
published npm archive.


### Website artifact measurements

Compared with the built product-hardening tree (whose website/package source
matches pre-pass main), sum of referenced assets, gzip measured per file:

| Route | Previous JS gzip | New JS gzip | Previous HTML gzip | New HTML gzip |
| --- | ---: | ---: | ---: | ---: |
| Homepage | 180,541 B | 183,587 B | 6,251 B | 16,423 B |
| Examples | 180,647 B | 181,039 B | 5,979 B | 9,990 B |
| Concepts | 181,945 B | 182,296 B | 6,890 B | 12,550 B |
| Device Lab | — | 181,524 B | — | 8,377 B |

Shared CSS grows from 7,102 B to 8,457 B gzip. The larger HTML carries real source
for code disclosures and the homepage simulator; source is read at build time,
not fetched from GitHub at runtime. These are reproducible artifact byte counts,
not browser transfer or performance benchmarks. No new npm dependency is involved.


## Follow-up: composer docking during scrolling

The original 93-scenario baseline above predates this follow-up. The current
website matrix passes **102 scenarios** (34 per desktop engine). Two new
regressions failed against the original lab and passed after the change: visual
panning at/beyond the layout bottom and long scroll containment. A third verifies
visual width/offset placement without disabling zoom. Existing page-scroll,
restoration, safe-area overlap, keyboard navigation and accessibility checks pass.

The lab now defaults to a full-screen, independently scrolling content region;
the fixed composer is outside it. An explicit Page-scroll stress test preserves
whole-document browser-chrome QA. The composer uses the visual bottom as its
anchor, additionally constrained by native bottom occlusion and safe area after
subtracting overlap. Raw keyboard values and `max(keyboard.height, safeArea.bottom)`
remain separately inspectable; diagnostics also include the applied anchor and
scroll mode. No polling, scroll cancellation, focus interception, library changes,
or runtime dependencies were added. The same composer still renders the homepage
simulation.

An iPhone 17 Pro/Chrome user reported a scroll-boundary gap in the previous build.
The precise device OS/browser versions and before/during geometry are unavailable;
physical validation of this fix remains pending. See the [recorded issue and
retest protocol](../REAL_DEVICE_QA.md#reported-iphone-chrome-scroll-boundary-issue--2026-09-06).


## Follow-up: browser-first layout and product scope

The website requests `interactive-widget=resizes-content` in its initial viewport
metadata. `/lab/css` is an independent CSS-only positioning baseline using the
same composer in normal grid flow; `/lab` retains the measured visual fallback.
No API capability flag is repurposed as proof of resize-policy support. Zero
occlusion when both viewports shrink is explained as valid browser behavior.

The homepage now leads with usable geometry and conditions the chat simulation
on an unchanged layout being overlaid. `/examples#result-budget` demonstrates a
JavaScript decision: slicing the rendered results according to actual visual
height, with clearly stated application constants. Source disclosures, CSS-first
guidance and the geometry visual identity remain. The package source, API and
runtime dependencies are unchanged.

The current browser matrix contains 117 website scenarios (39 per engine), adding
native-policy metadata, CSS behavior without JavaScript, distinct visual/layout
resizing, no duplicate adjustment and rendered-result count coverage. Physical
comparison remains pending, and iOS stress-mode drift is not declared fixed.
