# Geometry positioning implementation plan

> Execute the user-provided product repositioning specification using the existing isolated worktree. Use subagent-driven-development for the bounded documentation task, with local integration and final independent review.

**Goal:** Visual viewport geometry as React state; CSS owns layout, applications own policy.

**Architecture:** Preserve the package API. Replace composer-first homepage and lab with live shared geometry readouts and small application demonstrations. Use document-coordinate targets against visual.pageLeft/pageTop bounds to avoid mixing client and page coordinate spaces. CSS baseline retains browser-owned layout.

**Tech stack:** Existing Next static export, React, package useViewport, CSS. No new dependencies.

**Spec:** User mission in this session (87 requirements plus core principle).

## Tasks

- [x] Reposition README, reference, browser sources, coordinate guide, physical QA and internal example acceptance notes. Preserve limitations and historical reports. No physical-device pass claims.
- [x] Replace hero with nested live geometry and real API; order homepage decision, JS use cases, live demo, CSS baseline, API and mental model. Promote both labs in navigation and SEO/OG.
- [x] Replace lab docking competition with normal page scrolling, live geometry, ResultBudget, document-coordinate target, explicit keyboard input. Add zoom-aware optional coordinate tolerance and opt-in selection scroll correction examples. Show actual source.
- [x] Test visibility bounds (including offsets, page scroll, scale, edges), lab geometry/budget/diagnostics, CSS baseline, navigation, accessibility and production artifact. Remove obsolete docking comparisons from website tests, preserve independent package tests.
- [ ] Full quality and browser checks; independent review; PR, merge and production verification for both aliases.

## Acceptance rules

No src changes unless a reproduced core bug warrants them. No runtime dependencies. Never fabricate live values, physical QA, or native-policy support. CSS-only padding/layout remains CSS; raw VisualViewport is recommended for isolated reads. App policy remains outside the package. Geometry visibility means rectangle intersection, not occlusion by other DOM content. Zoom changes geometry, not essential UI availability.

## Review and verification

Independent review found no blockers. The two minor findings (scroll correction reacting to deliberate scrolling, obsolete effective-bottom QA field) were corrected and re-reviewed. The website matrix passes 102 checks. Full local quality gate passed; final branch CI and production verification are required before publication is called complete.
