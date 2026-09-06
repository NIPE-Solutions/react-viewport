# Product Clarity and Browser Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make React Viewport immediately understandable, correct keyboard/safe-area composition guidance, and align native VirtualKeyboard handling with the public bottom-occlusion semantics.

**Architecture:** Preserve the public API and raw measurement store. Extract native keyboard geometry into a focused internal helper, treat effective bottom inset as application-level example policy, and restructure the existing Next.js documentation around use cases before concepts. Keep deterministic simulation separate from live `useViewport()` state.

**Tech Stack:** TypeScript 6, React 18.3/19, Next.js 16, CSS, Vitest, Playwright, Axe, Vite, npm 11.

**Spec:** `docs/superpowers/specs/2026-09-06-product-clarity-browser-hardening-design.md`

## Global Constraints

- Keep the package standalone with zero runtime dependencies except React peer dependencies.
- Add no public API and do not rename existing public fields in this alpha pass.
- Preserve raw `safeArea` measurements; layout policy belongs to applications.
- Never assign `navigator.virtualKeyboard.overlaysContent`.
- Use capability detection, not user-agent or device detection.
- Keep keyboard fallback inference conservative and preserve the canonical `Math.max(0, layoutHeight - (visualOffsetTop + visualHeight))` formula.
- Preserve the current NIPE family typography, palette, site shell, and geometry simulator design.
- Remove `/guides` entirely without a redirect.
- Keep simulation explicitly separate from live browser state.
- Physical iPhone Safari and Android Chrome testing remains required before beta.

---

## File Structure

- `src/keyboard.ts`: internal native keyboard rectangle validation and bottom-edge occlusion.
- `src/store.ts`: store orchestration; delegates native rectangle semantics to `src/keyboard.ts`.
- `test/unit/keyboard.test.ts`: native hidden, attached, floating, partial-width, invalid, and non-intersecting geometry.
- `test/unit/geometry.test.ts`, `test/unit/store.test.ts`: canonical fallback and lifecycle regression matrix.
- `website/lib/layout-policy.ts`: documentation-example helper for `Math.max(keyboard, safeArea)`; not exported by the package.
- `test/unit/layout-policy.test.ts`: deterministic current-WebKit and fixed-browser recipes.
- `website/components/ViewportHero.tsx`: concrete composer story using live library state with clearly labelled simulation.
- `website/components/UseCaseExamples.tsx`: chat, modal, and visible-area examples.
- `website/app/page.tsx`: use-case-first homepage composition.
- `website/app/examples/page.tsx`: concrete recipe collection.
- `website/app/concepts/page.tsx`: mental model, keyboard/safe-area guide, simulator, SSR, performance, and anti-patterns.
- `website/components/SiteHeader.tsx`, `website/app/layout.tsx`: navigation, footer, metadata, and trust links.
- `website/content/docs.ts`: canonical copy and compilable code recipes.
- `website/app/guides/page.tsx`: deleted.
- `website/public/og.svg`: project-specific composer/viewport OpenGraph graphic.
- `README.md`, `docs/browser-notes.md`, `docs/REAL_DEVICE_QA.md`: product story, upstream evidence, and manual QA.
- `e2e/website.spec.ts`, `e2e/viewport.spec.ts`, `scripts/verify-docs.mjs`, `test/docs/verify-docs.test.mjs`: route, behavior, copy, and evidence verification.

---

### Task 1: Correct native VirtualKeyboard bottom-occlusion semantics

**Files:**
- Create: `src/keyboard.ts`
- Create: `test/unit/keyboard.test.ts`
- Modify: `src/store.ts`

**Interfaces:**
- Consumes: `LayoutViewport` and `KeyboardState` from `src/types.ts`.
- Produces: `getNativeKeyboardState(layout: LayoutViewport, boundingRect: DOMRectReadOnly): KeyboardState` for internal store use.

- [ ] **Step 1: Write failing native geometry tests**

Create table-driven tests that assert:

```ts
expect(getNativeKeyboardState(layout, rect(0, 0, 0, 0))).toEqual({ open: false, height: 0 })
expect(getNativeKeyboardState(layout, rect(0, 500, 390, 300))).toEqual({ open: true, height: 300 })
expect(getNativeKeyboardState(layout, rect(90, 420, 210, 220))).toEqual({ open: true, height: 0 })
expect(getNativeKeyboardState(layout, rect(120, 650, 150, 150))).toEqual({ open: true, height: 150 })
expect(getNativeKeyboardState(layout, rect(500, 500, 100, 300))).toEqual({ open: false, height: 0 })
```

Also assert negative dimensions, `NaN`, and `Infinity` are closed. The production change that makes the floating test pass is requiring the intersection to reach `layout.height` before assigning a scalar bottom occlusion.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run test/unit/keyboard.test.ts`

Expected: FAIL because `src/keyboard.ts` does not exist.

- [ ] **Step 3: Implement the internal helper**

Implement finite positive-area validation, layout intersection, `open` from any positive intersection, and bottom occlusion only when the intersection's bottom reaches the layout bottom. Use a small coordinate epsilon only if a test documents fractional browser geometry; do not introduce a device threshold.

- [ ] **Step 4: Delegate from the store and remove duplicate logic**

Import `getNativeKeyboardState` into `src/store.ts`, remove its file-local implementation, and leave `supported.virtualKeyboard` as API-object availability.

- [ ] **Step 5: Run native and store tests and verify GREEN**

Run: `npx vitest run test/unit/keyboard.test.ts test/unit/store.test.ts`

Expected: all tests pass; no warning or implicit `overlaysContent` mutation.

- [ ] **Step 6: Commit the native semantics**

```bash
git add src/keyboard.ts src/store.ts test/unit/keyboard.test.ts test/unit/store.test.ts
git commit -m "fix: report native keyboard bottom occlusion"
```

---

### Task 2: Complete the conservative fallback regression matrix

**Files:**
- Modify: `test/unit/geometry.test.ts`
- Modify: `test/unit/store.test.ts`
- Modify: `e2e/viewport.spec.ts`

**Interfaces:**
- Consumes: `getBottomOcclusion`, `inferKeyboard`, and `createViewportStore`.
- Produces: regression evidence only; no new runtime interface.

- [ ] **Step 1: Add failing or mutation-sensitive unit assertions**

Cover these exact outcomes:

```ts
// shifted visual viewport
getBottomOcclusion(
  { width: 390, height: 800 },
  visual({ height: 472, offsetTop: 28 }),
) === 300

// browser chrome, focused but below threshold
inferKeyboard({ layout, visual: visual({ height: 720, offsetTop: 56 }), editableFocused: true,
  hasNativeGeometry: false }) === { open: false, height: 0 }

// zoom and hardware-keyboard-like focus
scaleTwoResult === { open: false, height: 0 }
unchangedVisualResult === { open: false, height: 0 }
```

Ensure the independent 80px floor is mutation-sensitive with a layout whose 15% threshold is below 80, asserting 79 closes and 80 opens.

- [ ] **Step 2: Run focused tests and inspect the expected result**

Run: `npx vitest run test/unit/geometry.test.ts test/unit/store.test.ts`

Expected: existing behavior passes most cases; any newly exposed mismatch fails before production edits. A test that passes must still be reviewed to confirm removing `offsetTop`, focus, scale, or either threshold would make it fail.

- [ ] **Step 3: Make only evidence-driven corrections**

If a regression fails, minimally correct `src/geometry.ts` or `src/store.ts`. Do not alter thresholds without browser evidence and a browser-note entry.

- [ ] **Step 4: Extend deterministic browser fixtures**

Add explicit test names for normal, browser chrome, soft keyboard, shifted visual viewport, zoom, and hardware-keyboard-like focus. Assert public `keyboard.open` and `keyboard.height`, not fixture internals.

- [ ] **Step 5: Run unit and Chromium fixture checks**

Run: `npm run test:unit && npx playwright test e2e/viewport.spec.ts --project=chromium`

Expected: all scenarios pass.

- [ ] **Step 6: Commit fallback evidence**

```bash
git add src/geometry.ts src/store.ts test/unit/geometry.test.ts test/unit/store.test.ts e2e/viewport.spec.ts
git commit -m "test: harden keyboard inference scenarios"
```

---

### Task 3: Establish overlap-aware bottom-inset recipes

**Files:**
- Create: `website/lib/layout-policy.ts`
- Create: `test/unit/layout-policy.test.ts`
- Modify: `website/content/docs.ts`
- Modify: `website/components/ComposerDemo.tsx`
- Modify: `website/app/globals.css`

**Interfaces:**
- Produces: `getEffectiveBottomInset(keyboardHeight: number, safeAreaBottom: number): number` for website examples only.
- Produces: `cssComposer` using CSS `max()` with the existing public CSS variable names.

- [ ] **Step 1: Write failing layout-policy tests**

```ts
expect(getEffectiveBottomInset(0, 34)).toBe(34)
expect(getEffectiveBottomInset(326, 34)).toBe(326)
expect(getEffectiveBottomInset(326, 0)).toBe(326)
expect(getEffectiveBottomInset(-1, Number.NaN)).toBe(0)
```

The production change is a non-negative finite normalization followed by `Math.max`.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run test/unit/layout-policy.test.ts`

Expected: FAIL because the website-local helper does not exist.

- [ ] **Step 3: Implement the minimal website helper**

Keep it outside `src/` so it cannot become package API. Return `Math.max(normalizedKeyboard, normalizedSafeArea)`.

- [ ] **Step 4: Replace additive CSS and copy**

Use:

```css
--bottom-inset: max(
  var(--react-viewport-keyboard-height, 0px),
  var(--react-viewport-safe-area-bottom, 0px)
);
bottom: calc(var(--bottom-inset) + 1rem);
```

Search with `rg -n 'keyboard.*\+|safe-area.*\+|keyboard\.height \+|safeArea\.bottom \+' README.md docs website test e2e` and remove every blind keyboard-plus-safe-area recipe.

- [ ] **Step 5: Verify helper and existing composer behavior**

Run: `npx vitest run test/unit/layout-policy.test.ts && npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "composer"`

Expected: the helper cases pass and composer movement remains correct.

- [ ] **Step 6: Commit layout policy examples**

```bash
git add website/lib/layout-policy.ts test/unit/layout-policy.test.ts website/content/docs.ts website/components/ComposerDemo.tsx website/app/globals.css
git commit -m "fix: compose keyboard and safe area without double counting"
```

---

### Task 4: Build the concrete use-case hero

**Files:**
- Create: `website/components/ViewportHero.tsx`
- Modify: `website/app/page.tsx`
- Modify: `website/app/globals.css`
- Modify: `e2e/website.spec.ts`

**Interfaces:**
- Consumes: public `useViewport()` only.
- Produces: a homepage hero with live visual height, keyboard occlusion, safe bottom, minimal API code, and clearly labelled simulated keyboard state.

- [ ] **Step 1: Write failing hero browser tests**

Assert the homepage exposes:

```ts
await expect(page.getByRole('heading', { name: 'Know what part of the screen is actually usable.' })).toBeVisible()
await expect(page.getByText('Live browser', { exact: true })).toBeVisible()
await expect(page.getByText(/const \{ visual, keyboard, safeArea \} = useViewport\(\)/)).toBeVisible()
await page.getByRole('button', { name: 'Simulate keyboard' }).click()
await expect(page.getByText('Simulated keyboard', { exact: true })).toBeVisible()
```

Also assert the accessible summary identifies layout/visual state and the simulated state never changes the live readout.

- [ ] **Step 2: Verify RED**

Run: `npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "hero"`

Expected: FAIL because the current abstract geometry hero lacks the new story and controls.

- [ ] **Step 3: Implement `ViewportHero`**

Use the actual hook for the live readout. Keep simulation in component-local state, label it explicitly, and use the website-only effective-inset helper for the illustrated composer. Do not call keyboard show/hide APIs or modify browser globals.

- [ ] **Step 4: Recompose the homepage**

Place the hero first, an early CSS-first decision section second, use-case previews third, and the mental model/simulator later. Move the phrase “Viewport geometry you can reason about” to the simulator section.

- [ ] **Step 5: Apply the existing visual system**

Preserve site tokens and typography. Use the composer/occlusion relationship as the one high-emphasis visual, avoid new gradient decoration or repeated generic cards, keep focus visible, and add no non-user-triggered animation.

- [ ] **Step 6: Verify responsive, reduced-motion, and accessibility behavior**

Run: `npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "hero|overflow|reduced-motion|accessibility"`

Expected: passing at 320, 768, and 1440 widths with no serious Axe violations.

- [ ] **Step 7: Commit the product-story hero**

```bash
git add website/components/ViewportHero.tsx website/app/page.tsx website/app/globals.css e2e/website.spec.ts
git commit -m "feat: lead homepage with usable viewport story"
```

---

### Task 5: Add concrete examples and integration evidence

**Files:**
- Create: `website/components/UseCaseExamples.tsx`
- Modify: `website/app/examples/page.tsx`
- Modify: `website/content/docs.ts`
- Modify: `website/app/globals.css`
- Modify: `e2e/website.spec.ts`

**Interfaces:**
- Consumes: `useViewport()`, `useViewportCssVariables()`, and `getEffectiveBottomInset()`.
- Produces: actual chat composer, modal action bar, visible-area, and CSS bridge examples.

- [ ] **Step 1: Write failing example-route tests**

Assert headings and useful outputs for “Chat composer,” “Modal actions,” “Visible area,” and “CSS variables.” With the deterministic fixture, assert:

```text
keyboard=0, safe=34   -> effective inset 34
keyboard=326, safe=34 -> effective inset 326
keyboard=326, safe=0  -> effective inset 326
```

Assert modal actions remain inside the simulated visual region and no output equals `360px` for the stale-safe-area case.

- [ ] **Step 2: Verify RED**

Run: `npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "examples|modal|effective inset"`

Expected: FAIL because the route currently contains only the composer and CSS-first text.

- [ ] **Step 3: Implement examples with actual public state**

Use real hooks and the existing browser fixture. The visible-area example reads `visual?.height ?? null`. The modal and composer use `Math.max(keyboard.height, safeArea.bottom)` or the equivalent CSS variables. Keep modal behavior illustrative; do not add focus trapping, portals, or scroll locking.

- [ ] **Step 4: Add precise recipe copy**

Explain that keyboard occlusion and safe area overlap at the bottom. Include “When CSS is enough” and “What not to do” examples without suggesting JavaScript for safe-area-only footers.

- [ ] **Step 5: Verify integration and accessibility**

Run: `npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "examples|modal|composer|accessibility"`

Expected: all example scenarios and Axe checks pass.

- [ ] **Step 6: Commit examples**

```bash
git add website/components/UseCaseExamples.tsx website/app/examples/page.tsx website/content/docs.ts website/app/globals.css e2e/website.spec.ts
git commit -m "feat: add viewport-aware interface recipes"
```

---

### Task 6: Restructure Concepts and navigation

**Files:**
- Create: `website/app/concepts/page.tsx`
- Modify: `website/components/GeometryDemo.tsx`
- Modify: `website/components/SiteHeader.tsx`
- Modify: `website/app/layout.tsx`
- Modify: `website/app/page.tsx`
- Delete: `website/app/guides/page.tsx`
- Modify: `website/app/sitemap.ts`
- Modify: `e2e/website.spec.ts`

**Interfaces:**
- Consumes: existing `GeometryDemo` scenario model.
- Produces: `/concepts`; removes `/guides` with a 404 and no redirect.

- [ ] **Step 1: Write failing route and navigation tests**

Assert the header order is Overview, Examples, Concepts, API, Browser behavior, Project; `/concepts` renders; `/guides` returns 404; and no rendered navigation or sitemap entry references `/guides`.

- [ ] **Step 2: Verify RED**

Run: `npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "navigation|concepts|guides"`

Expected: FAIL because `/concepts` is absent and `/guides` exists.

- [ ] **Step 3: Build the Concepts page**

Include plain-language definitions, Keyboard and safe area, geometry simulator context, scenario explanations, canonical offset-aware formula, SSR/hydration, shared-store performance, and anti-patterns. Keep the existing deterministic scenario implementation.

- [ ] **Step 4: Update site navigation and remove Guides**

Delete the route, update header/footer/sitemap, and do not add a redirect to Next config.

- [ ] **Step 5: Verify route behavior and simulator semantics**

Run: `npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "navigation|concepts|guides|geometry"`

Expected: Concepts and all simulator scenarios pass; Guides is not found.

- [ ] **Step 6: Commit the information architecture**

```bash
git add website/app/concepts/page.tsx website/components/GeometryDemo.tsx website/components/SiteHeader.tsx website/app/layout.tsx website/app/page.tsx website/app/sitemap.ts e2e/website.spec.ts
git rm website/app/guides/page.tsx
git commit -m "docs: organize site around use cases and concepts"
```

---

### Task 7: Clarify API authority and browser evidence

**Files:**
- Modify: `website/app/api/page.tsx`
- Modify: `website/app/browser-behavior/page.tsx`
- Modify: `website/content/docs.ts`
- Modify: `README.md`
- Modify: `docs/browser-notes.md`
- Modify: `docs/REAL_DEVICE_QA.md`
- Modify: `scripts/verify-docs.mjs`
- Modify: `test/docs/verify-docs.test.mjs`

**Interfaces:**
- Documents existing public types only.
- Produces automated checks for required semantics and upstream evidence.

- [ ] **Step 1: Write failing documentation verification tests**

Require exact concepts or equivalent stable markers for:

```text
Know what part of the screen is actually usable.
Math.max(keyboard.height, safeArea.bottom)
WebKit bug 217754
open: true, height: 0
supported.virtualKeyboard means API availability
physical iPhone Safari and Android Chrome testing pending
```

Also reject additive keyboard/safe-area patterns and claims that every keyboard is detected.

- [ ] **Step 2: Verify RED**

Run: `npm run test:docs`

Expected: FAIL on missing product copy, WebKit evidence, and native floating semantics.

- [ ] **Step 3: Rewrite the README first screen and API descriptions**

Lead with utility and the hook shape. Explain field meaning, coordinate system, readiness, source/fallback, and what each field does not mean. Keep the alpha caveat and early browser-limits link.

- [ ] **Step 4: Add browser notes and QA scenarios**

Record WebKit 217754 with upstream URL, observed stale safe-area behavior, raw-geometry impact, `max()` application guidance, and a removal condition limited to the note—not a runtime workaround. Add iPhone stale-inset reproduction, Android chrome, modal, composer, orientation, scroll, and external-keyboard checks as manual pending.

- [ ] **Step 5: Explain VirtualKeyboard authority precisely**

State that boundingRect is a viewport intersection in client coordinates; capability presence is not proof overlay mode is active; the library never enables overlays mode; and floating geometry can be open with zero bottom occlusion.

- [ ] **Step 6: Verify documentation and search for misleading copy**

Run:

```bash
npm run test:docs
node scripts/verify-docs.mjs
rg -n "physical keyboard height|every.*keyboard|visual viewport shrink.*keyboard|keyboard.*\+.*safe|safe.*\+.*keyboard" README.md docs website
```

Expected: checks pass and search results contain only explicitly marked anti-patterns.

- [ ] **Step 7: Commit documentation evidence**

```bash
git add README.md docs/browser-notes.md docs/REAL_DEVICE_QA.md website/app/api/page.tsx website/app/browser-behavior/page.tsx website/content/docs.ts scripts/verify-docs.mjs test/docs/verify-docs.test.mjs
git commit -m "docs: define keyboard authority and safe area policy"
```

---

### Task 8: Finish trust surfaces, SEO, and OpenGraph

**Files:**
- Modify: `website/app/layout.tsx`
- Modify: `website/content/docs.ts`
- Modify: `website/public/og.svg`
- Modify: `website/app/project/page.tsx`
- Modify: `website/app/robots.ts`
- Modify: `website/app/sitemap.ts`
- Modify: `e2e/website.spec.ts`

**Interfaces:**
- Produces metadata and footer/project links; no runtime package interface.

- [ ] **Step 1: Write failing metadata and trust-link tests**

Assert the title is “React Viewport — Visual viewport, keyboard and safe-area geometry for React,” the description avoids universal keyboard claims, the OG image has a useful composer/geometry alt, and GitHub, Changelog, Security, License, NIPE Open Source, Imprint, and Privacy are discoverable.

- [ ] **Step 2: Verify RED**

Run: `npx playwright test e2e/website.spec.ts --config playwright.website.config.ts --project=chromium -g "metadata|footer|trust"`

Expected: FAIL on the old metadata and incomplete footer links.

- [ ] **Step 3: Update metadata, project links, and OG artwork**

Use the existing palette and draw layout, inner visual viewport, composer, and keyboard occlusion in SVG. Do not add generated raster assets or new dependencies.

- [ ] **Step 4: Verify rendered metadata and route indexes**

Run: `npm run build:website && node scripts/verify-website.mjs`

Expected: build and static verification pass with `/concepts` included and `/guides` absent.

- [ ] **Step 5: Commit trust surfaces**

```bash
git add website/app/layout.tsx website/content/docs.ts website/public/og.svg website/app/project/page.tsx website/app/robots.ts website/app/sitemap.ts e2e/website.spec.ts
git commit -m "docs: finish project metadata and trust links"
```

---

### Task 9: Run the complete release-quality verification

**Files:**
- Modify only files required by verified failures within this task's scope.
- Update: `docs/releases/0.1.0-alpha.0-readiness.md` only if it is explicitly maintained as a living current-branch report; otherwise add a new dated hardening report rather than rewriting historical evidence.

**Interfaces:**
- Consumes all preceding deliverables.
- Produces final evidence and an alpha/beta readiness recommendation.

- [ ] **Step 1: Run the local quality gate**

Run: `npm run check`

Expected: format, lint, TypeScript, unit, API, size, package, docs, build, website, and workflow checks pass.

- [ ] **Step 2: Run all browser engines**

Run: `npm run test:e2e && npm run test:website:e2e`

Expected: deterministic Chromium, Firefox, and WebKit projects pass. Record exact test counts from output.

- [ ] **Step 3: Verify package boundaries**

Run:

```bash
npm run test:api
npm run test:size
npm run test:package
npm pack --dry-run
```

Expected: public API unchanged, zero runtime dependencies, budgets pass, ESM/CJS/types/SSR consumer fixtures pass, and tarball contents are intentional.

- [ ] **Step 4: Inspect the built website visually**

Start the production site with `npm run serve:website`, inspect homepage, examples, concepts, API, browser behavior, project, imprint, and privacy at 320px and desktop widths, and verify focus, readable copy, visual hierarchy, live/simulated separation, and absence of overflow.

- [ ] **Step 5: Re-run checks after any fixes**

Any failure requires a focused regression test before its implementation fix. Repeat `npm run check`, `npm run test:e2e`, and `npm run test:website:e2e` until all are clean.

- [ ] **Step 6: Record readiness honestly**

Classify **ALPHA READY** if automated checks pass but physical iPhone Safari and Android Chrome evidence remains pending. Do not classify beta until the required manual matrix is recorded.

- [ ] **Step 7: Commit verification evidence**

```bash
git add docs/releases
git commit -m "docs: record product hardening verification"
```

Skip this commit only when no tracked evidence file changes; never create an empty commit.
