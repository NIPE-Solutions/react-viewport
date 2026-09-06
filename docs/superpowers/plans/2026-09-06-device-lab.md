# Deployment verification and Device Lab implementation plan

Goal: prove keyboard occlusion with a shared composer, an honest desktop comparison, and a real browser lab.

Architecture: retain Next static export and the existing shared viewport store. A single Composer accepts raw keyboard/safe-area inputs and an awareness flag. Simulation supplies explicit constants; /lab supplies only useViewport() measurements. Layout remains application policy. No runtime or website dependency additions.

Design: preserve Barlow, IBM Plex Mono, paper #F4F7F8, ink #15232D, coordinate blue #2257D6, safe-area cyan #18A6B7, keyboard coral #E2634D. Keep left-aligned type and nested geometry frames. Before/after frames are the homepage proof; the lab is a document-scrolling conversation with a genuinely fixed composer.

- [x] Audit main, Vercel project, Git integration, domains, deployment metadata, headers and deployed copy before editing.
- [x] Add behavioral tests for comparison, lab geometry/scroll/restoration, privacy, accessibility, routing, and build provenance.
- [x] Implement shared composer, explicit simulation, code disclosure, and /lab with optional geometry/overlays and user-initiated diagnostics.
- [x] Reorder homepage, add mobile CTA and decision tree, place code alongside use cases; preserve simulator and browser limits.
- [x] Add build marker and post-deployment verification of both domains; use repository quality gate as deployment build command.
- [x] Extend README, device QA protocol, and browser evidence; record physical tests as pending.
- [x] Run quality gate, all three browser engines, package audit, and visual review at desktop/mobile sizes.
- [ ] Commit and publish through main's Git integration; verify both production aliases and document final evidence.

Deployment finding before changes: on 2026-09-06 both aliases serve dpl_WE5HJaTXhvApGScpeKJnjRWGrUqT, Git SHA 86b3fa7c0ed7c13477f801a23864710108d1288a (current origin/main). Root '.', npm ci, npm run build:website, website/out, production branch main, auto assignment enabled. No current stale deployment reproduced. Do not invent a historical root cause or change working domain configuration.

Verification: generated HTML routes and SHA marker; Playwright Chromium/Firefox/WebKit against static artifact including real shared-store events injected in fixtures (not physical keyboards); accessibility and 320px containment; npm package audit. Physical iPhone/Android results require hardware and remain explicitly pending absent access.
